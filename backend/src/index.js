// src/index.js — NextStagePro.gg
// FIX: Webhook de Stripe montado una sola vez con express.raw() inline.
//      El router general de subscriptions ya NO se monta dos veces.

require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const stripe      = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query }   = require('./config/db');

const authRoutes         = require('./routes/auth');
const playerRoutes       = require('./routes/players');
const teamRoutes         = require('./routes/teams');
const subscriptionRoutes = require('./routes/subscriptions');
const contactRoutes      = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';

// ════════════════════════════════════════════════════════════
//  SEGURIDAD
// ════════════════════════════════════════════════════════════
app.use(helmet());

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { error: 'Demasiadas peticiones. Inténtalo más tarde.' },
  standardHeaders: true,
  legacyHeaders:   false,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      isDevelopment ? 100 : 20,
  message:  { error: 'Demasiados intentos de autenticación.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment || req.path === '/me' || req.path === '/refresh',
});

// ════════════════════════════════════════════════════════════
//  WEBHOOK DE STRIPE — ANTES del parser JSON
//  FIX: montado UNA sola vez aquí, NO dentro de subscriptionRoutes
// ════════════════════════════════════════════════════════════
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature error:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {

        case 'checkout.session.completed': {
          const session  = event.data.object;
          const userId   = session.metadata?.user_id;
          const plan     = session.metadata?.plan;
          const subId    = session.subscription;
          if (!userId || !plan) break;

          const stripeSub = await stripe.subscriptions.retrieve(subId);
          const priceId   = stripeSub.items.data[0]?.price?.id;

          await query(
            `INSERT INTO subscriptions
               (user_id, plan, status, stripe_customer_id, stripe_sub_id, stripe_price_id,
                current_period_start, current_period_end)
             VALUES ($1,$2,'active',$3,$4,$5,$6,$7)
             ON CONFLICT (user_id) DO UPDATE SET
               plan=EXCLUDED.plan, status='active',
               stripe_customer_id=EXCLUDED.stripe_customer_id,
               stripe_sub_id=EXCLUDED.stripe_sub_id,
               stripe_price_id=EXCLUDED.stripe_price_id,
               current_period_start=EXCLUDED.current_period_start,
               current_period_end=EXCLUDED.current_period_end,
               cancelled_at=NULL, updated_at=NOW()`,
            [userId, plan, session.customer, subId, priceId,
             new Date(stripeSub.current_period_start * 1000),
             new Date(stripeSub.current_period_end   * 1000)]
          );
          await query(`UPDATE users SET plan=$1, updated_at=NOW() WHERE id=$2`, [plan, userId]);
          break;
        }

        case 'invoice.paid': {
          const invoice = event.data.object;
          if (!invoice.subscription) break;
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription);
          await query(
            `UPDATE subscriptions SET status='active',
               current_period_start=$1, current_period_end=$2, updated_at=NOW()
             WHERE stripe_sub_id=$3`,
            [new Date(stripeSub.current_period_start * 1000),
             new Date(stripeSub.current_period_end   * 1000),
             invoice.subscription]
          );
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          if (!invoice.subscription) break;
          await query(
            `UPDATE subscriptions SET status='past_due', updated_at=NOW() WHERE stripe_sub_id=$1`,
            [invoice.subscription]
          );
          break;
        }

        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          const { rows } = await query(
            `UPDATE subscriptions SET status='cancelled', cancelled_at=NOW(), updated_at=NOW()
             WHERE stripe_sub_id=$1 RETURNING user_id`,
            [sub.id]
          );
          if (rows.length) {
            await query(`UPDATE users SET plan='free', updated_at=NOW() WHERE id=$1`, [rows[0].user_id]);
          }
          break;
        }

        default: break;
      }
    } catch (err) {
      console.error('Webhook handler error:', err);
      return res.status(500).json({ error: 'Error procesando evento' });
    }

    res.json({ received: true });
  }
);

// ════════════════════════════════════════════════════════════
//  PARSERS (después del webhook)
// ════════════════════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ════════════════════════════════════════════════════════════
//  RUTAS
// ════════════════════════════════════════════════════════════
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/players',       playerRoutes);
app.use('/api/teams',         teamRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/contact',       contactRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:      'ok',
    service:     'NextStagePro API',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Error handler global ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ════════════════════════════════════════════════════════════
//  ARRANQUE
// ════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   NextStagePro API                   ║
  ║   http://localhost:${PORT}              ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}              ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;

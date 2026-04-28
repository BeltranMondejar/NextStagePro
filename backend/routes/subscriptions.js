// src/routes/subscriptions.js
// FIX: El webhook ya NO está aquí — se maneja en index.js con body raw.
//      Este router solo contiene los endpoints autenticados.
// Endpoints:
//   POST /api/subscriptions/checkout  — crea sesión de pago en Stripe
//   POST /api/subscriptions/portal    — abre portal de cliente Stripe
//   GET  /api/subscriptions/me        — estado actual de la suscripción

const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const PLAN_PRICES = {
  player_pro: process.env.STRIPE_PRICE_PLAYER_PRO,
  team_pro:   process.env.STRIPE_PRICE_TEAM_PRO,
};

// POST /api/subscriptions/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLAN_PRICES[plan]) {
      return res.status(400).json({ error: 'Plan inválido. Usa player_pro o team_pro' });
    }

    const { rows } = await query(
      `SELECT u.email, s.stripe_customer_id
       FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    let customerId = rows[0].stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    rows[0].email,
        metadata: { user_id: req.user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      customer:             customerId,
      payment_method_types: ['card'],
      line_items:           [{ price: PLAN_PRICES[plan], quantity: 1 }],
      success_url:          process.env.STRIPE_SUCCESS_URL,
      cancel_url:           process.env.STRIPE_CANCEL_URL,
      metadata:             { user_id: req.user.id, plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

// POST /api/subscriptions/portal
router.post('/portal', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1`,
      [req.user.id]
    );
    if (!rows.length || !rows[0].stripe_customer_id) {
      return res.status(404).json({ error: 'No tienes una suscripción activa' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   rows[0].stripe_customer_id,
      return_url: process.env.FRONTEND_URL + '/subscriptions',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'Error abriendo portal de cliente' });
  }
});

// GET /api/subscriptions/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, u.plan FROM subscriptions s
       JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.json({ plan: 'free', status: null });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

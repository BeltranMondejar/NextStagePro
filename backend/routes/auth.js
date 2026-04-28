// src/routes/auth.js
// Flujo completo de Discord OAuth2:
//   1. GET /api/auth/discord         → redirige a Discord
//   2. GET /api/auth/discord/callback → Discord vuelve aquí con ?code=
//      → intercambia code por token, obtiene usuario de Discord,
//        crea o actualiza user en BD, genera JWT
//      → redirige al frontend con ?token=JWT
//   3. GET /api/auth/me              → devuelve datos del usuario autenticado

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const fetch   = require('node-fetch');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// ── Helpers ─────────────────────────────────────────────────

function generateJWT(user) {
  return jwt.sign(
    {
      id:           user.id,
      plan:         user.plan,
      account_type: user.account_type,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── 1. Iniciar OAuth con Discord ─────────────────────────────
// GET /api/auth/discord
router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID,
    redirect_uri:  process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope:         'identify email',
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// ── 2. Callback de Discord ───────────────────────────────────
// GET /api/auth/discord/callback
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=discord_cancelled`);
  }

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Discord token error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}?error=discord_token`);
    }

    // Obtener datos del usuario de Discord
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const discordUser = await userRes.json();

    if (!discordUser.id) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=discord_user`);
    }

    const email     = discordUser.email;
    const discordId = discordUser.id;

    // Buscar usuario existente por discord_id o email
    let { rows } = await query(
      `SELECT * FROM users WHERE discord_id = $1 OR email = $2 LIMIT 1`,
      [discordId, email]
    );

    let user;

    if (rows.length > 0) {
      // Actualizar discord_id si aún no lo tenía (vino por email)
      await query(
        `UPDATE users SET discord_id = $1, is_verified = TRUE, updated_at = NOW() WHERE id = $2`,
        [discordId, rows[0].id]
      );
      user = { ...rows[0], discord_id: discordId };
    } else {
      // Crear nuevo usuario
      const insert = await query(
        `INSERT INTO users (email, discord_id, plan, account_type, is_verified)
         VALUES ($1, $2, 'free', 'player', TRUE)
         RETURNING *`,
        [email, discordId]
      );
      user = insert.rows[0];

      // Crear perfil de jugador vacío automáticamente
      const discordUsername = discordUser.username || discordUser.global_name || email.split('@')[0];
      await query(
        `INSERT INTO player_profiles (user_id, nickname) VALUES ($1, $2)`,
        [user.id, discordUsername]
      );
    }

    const token = generateJWT(user);

    // Redirigir al frontend con el token en la URL
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

  } catch (err) {
    console.error('Discord OAuth error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?error=server`);
  }
});

// ── 3. Datos del usuario autenticado ────────────────────────
// GET /api/auth/me  (requiere Authorization: Bearer <token>)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         u.id,
         u.email,
         u.discord_id,
         u.plan,
         u.account_type,
         u.is_verified,
         u.created_at,
         CASE
           WHEN u.account_type = 'team' THEN tp.logo_url
           ELSE pp.avatar_url
         END AS header_image_url
       FROM users u
       LEFT JOIN player_profiles pp ON pp.user_id = u.id
       LEFT JOIN team_profiles tp ON tp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── 4. Refrescar token ───────────────────────────────────────
// POST /api/auth/refresh
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, plan, account_type FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const token = generateJWT(rows[0]);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

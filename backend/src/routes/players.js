// src/routes/players.js
const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { uploadProfile, uploadHighlight, cloudinary } = require('../config/cloudinary');

// ══════════════════════════════════════════════════════════════
//  GET /api/players — búsqueda pública con filtros
// ══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { game, role, rank, location, search, plan, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = ['pp.is_visible = TRUE'];
    const params = [];
    let idx = 1;

    if (game)     { conditions.push(`pp.game ILIKE $${idx++}`);         params.push(`%${game}%`); }
    if (role)     { conditions.push(`pp.main_role ILIKE $${idx++}`);    params.push(`%${role}%`); }
    if (rank)     { conditions.push(`pp.current_rank ILIKE $${idx++}`); params.push(`%${rank}%`); }
    if (location) { conditions.push(`pp.location ILIKE $${idx++}`);     params.push(`%${location}%`); }
    if (search) {
      conditions.push(
        `(pp.nickname ILIKE $${idx} OR pp.first_name ILIKE $${idx} OR pp.last_name ILIKE $${idx} OR pp.current_team ILIKE $${idx})`
      );
      params.push(`%${search}%`); idx++;
    }
    // FIX: filtro plan enviado por el frontend
    if (plan === 'pro') {
      conditions.push(`u.plan != 'free'`);
    }

    const where = conditions.join(' AND ');

    const dataQuery = `
      SELECT
        pp.id, pp.nickname, pp.first_name, pp.last_name,
        pp.game, pp.main_role, pp.current_rank, pp.current_team, pp.location,
        pp.avatar_url, pp.profile_views,
        u.plan
      FROM player_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE ${where}
      ORDER BY
        CASE WHEN u.plan != 'free' THEN 0 ELSE 1 END,
        pp.profile_views DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(Number(limit), offset);

    const countQuery = `
      SELECT COUNT(*) FROM player_profiles pp
      JOIN users u ON u.id = pp.user_id
      WHERE ${where}
    `;

    const [data, count] = await Promise.all([
      query(dataQuery, params),
      query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      players: data.rows,
      total:   Number(count.rows[0].count),
      page:    Number(page),
      limit:   Number(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ══════════════════════════════════════════════════════════════
//  RUTAS /me  — todas ANTES de /:id
// ══════════════════════════════════════════════════════════════

// GET /api/players/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: profiles } = await query(
      `SELECT pp.*, u.plan, u.email, u.discord_id
       FROM player_profiles pp
       JOIN users u ON u.id = pp.user_id
       WHERE pp.user_id = $1`,
      [req.user.id]
    );

    if (!profiles.length) {
      // FIX: si no existe perfil, crearlo automáticamente en lugar de 404
      const { rows: newProfile } = await query(
        `INSERT INTO player_profiles (user_id, nickname)
         VALUES ($1, $2) RETURNING *`,
        [req.user.id, req.user.email?.split('@')[0] || 'player']
      );
      return res.json({ ...newProfile[0], experience: [], highlights: [], plan: req.user.plan });
    }

    const profile = profiles[0];

    const [experience, highlights] = await Promise.all([
      query(
        `SELECT * FROM player_experience WHERE player_id = $1 ORDER BY start_date DESC NULLS LAST`,
        [profile.id]
      ),
      query(
        `SELECT * FROM player_highlights WHERE player_id = $1 ORDER BY display_order ASC, created_at ASC`,
        [profile.id]
      ),
    ]);

    res.json({ ...profile, experience: experience.rows, highlights: highlights.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/players/me — FIX: cambiado de PUT a PATCH para ser compatible con el frontend
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const allowed = [
      'first_name', 'last_name', 'nickname', 'birthdate', 'location', 'current_team',
      'bio', 'game', 'main_role', 'current_rank', 'peak_rank',
      'discord_tag', 'twitter_url', 'liquipedia_url', 'vlr_url', 'twitch_url', 'is_visible',
    ];

    // Construir SET dinámico solo con los campos enviados
    const fields = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'No hay campos válidos para actualizar' });

    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    const values     = fields.map(f => req.body[f] === '' ? null : req.body[f]);
    values.push(req.user.id);

    const { rows } = await query(
      `UPDATE player_profiles SET ${setClauses}, updated_at = NOW()
       WHERE user_id = $${values.length} RETURNING *`,
      values
    );

    if (!rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });

    // Devolver con experiencia y highlights para que el frontend no los pierda
    const [experience, highlights] = await Promise.all([
      query(`SELECT * FROM player_experience WHERE player_id = $1 ORDER BY start_date DESC NULLS LAST`, [rows[0].id]),
      query(`SELECT * FROM player_highlights WHERE player_id = $1 ORDER BY display_order`, [rows[0].id]),
    ]);

    res.json({ ...rows[0], experience: experience.rows, highlights: highlights.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Mantener también PUT para compatibilidad
router.put('/me', requireAuth, async (req, res) => {
  req.method = 'PATCH';
  router.handle(req, res, () => {});
});

// POST /api/players/me/avatar
router.post('/me/avatar', requireAuth, uploadProfile.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

    const { rows } = await query(
      `UPDATE player_profiles SET avatar_url = $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING avatar_url`,
      [req.file.path, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ avatar_url: rows[0].avatar_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error subiendo avatar' });
  }
});

// POST /api/players/me/cover
router.post('/me/cover', requireAuth, uploadProfile.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });

    const { rows } = await query(
      `UPDATE player_profiles SET cover_url = $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING cover_url`,
      [req.file.path, req.user.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ cover_url: rows[0].cover_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error subiendo cover' });
  }
});

// ══════════════════════════════════════════════════════════════
//  EXPERIENCIA
// ══════════════════════════════════════════════════════════════

async function getPlayerId(userId) {
  const { rows } = await query(
    `SELECT id FROM player_profiles WHERE user_id = $1`, [userId]
  );
  return rows[0]?.id || null;
}

// GET /api/players/me/experience
router.get('/me/experience', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { rows } = await query(
      `SELECT * FROM player_experience WHERE player_id = $1 ORDER BY start_date DESC NULLS LAST`,
      [playerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/players/me/experience
router.post('/me/experience', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { team_name, role, achievements, start_date, end_date } = req.body;
    if (!team_name) return res.status(400).json({ error: 'team_name es requerido' });

    const { rows } = await query(
      `INSERT INTO player_experience (player_id, team_name, role, achievements, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [playerId, team_name, role || null, achievements || null,
       start_date || null, end_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /api/players/me/experience/:id — FIX: también PATCH además de PUT
router.patch('/me/experience/:id', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { team_name, role, achievements, start_date, end_date } = req.body;
    const { rows } = await query(
      `UPDATE player_experience SET
        team_name    = COALESCE($1, team_name),
        role         = COALESCE($2, role),
        achievements = COALESCE($3, achievements),
        start_date   = COALESCE($4, start_date),
        end_date     = $5
       WHERE id = $6 AND player_id = $7
       RETURNING *`,
      [team_name || null, role || null, achievements || null,
       start_date || null, end_date || null,
       req.params.id, playerId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/players/me/experience/:id (alias de PATCH)
router.put('/me/experience/:id', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { team_name, role, achievements, start_date, end_date } = req.body;
    const { rows } = await query(
      `UPDATE player_experience SET
        team_name    = COALESCE($1, team_name),
        role         = COALESCE($2, role),
        achievements = COALESCE($3, achievements),
        start_date   = COALESCE($4, start_date),
        end_date     = $5
       WHERE id = $6 AND player_id = $7
       RETURNING *`,
      [team_name || null, role || null, achievements || null,
       start_date || null, end_date || null,
       req.params.id, playerId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/players/me/experience/:id
router.delete('/me/experience/:id', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { rowCount } = await query(
      `DELETE FROM player_experience WHERE id = $1 AND player_id = $2`,
      [req.params.id, playerId]
    );

    if (!rowCount) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ══════════════════════════════════════════════════════════════
//  HIGHLIGHTS
// ══════════════════════════════════════════════════════════════

// GET /api/players/me/highlights
router.get('/me/highlights', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { rows } = await query(
      `SELECT * FROM player_highlights WHERE player_id = $1 ORDER BY display_order ASC, created_at ASC`,
      [playerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/players/me/highlights
router.post('/me/highlights', requireAuth, uploadHighlight.single('media'), async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (!req.file)  return res.status(400).json({ error: 'No se recibió archivo' });

    const isVideo   = req.file.mimetype?.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'photo';
    const { title } = req.body;

    // FIX: thumbnail más robusto para vídeos de Cloudinary
    const thumbnailUrl = isVideo
      ? req.file.path
          .replace('/upload/', '/upload/so_1,w_480,h_270,c_fill,f_jpg/')
          .replace(/\.\w+$/, '.jpg')
      : null;

    // FIX: calcular display_order como max actual + 1
    const { rows: orderRow } = await query(
      `SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order
       FROM player_highlights WHERE player_id = $1`,
      [playerId]
    );
    const displayOrder = orderRow[0].next_order;

    const { rows } = await query(
      `INSERT INTO player_highlights
         (player_id, media_url, media_type, title, thumbnail_url, display_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [playerId, req.file.path, mediaType, title || null, thumbnailUrl, displayOrder]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/players/me/highlights/:id
router.delete('/me/highlights/:id', requireAuth, async (req, res) => {
  try {
    const playerId = await getPlayerId(req.user.id);
    if (!playerId) return res.status(404).json({ error: 'Perfil no encontrado' });

    const { rows } = await query(
      `SELECT media_url FROM player_highlights WHERE id = $1 AND player_id = $2`,
      [req.params.id, playerId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Highlight no encontrado' });

    // FIX: extracción de publicId más robusta para Cloudinary
    try {
      const url     = rows[0].media_url;
      const match   = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
      const publicId = match ? match[1] : null;
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (cloudErr) {
      console.warn('Cloudinary delete warning (non-fatal):', cloudErr.message);
    }

    await query(`DELETE FROM player_highlights WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Highlight eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ══════════════════════════════════════════════════════════════
//  GET /api/players/:id — perfil público  ← siempre AL FINAL
// ══════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    // FIX: validar que el id sea un UUID válido para evitar errores de Postgres
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'ID de perfil no válido' });
    }

    const { rows: profiles } = await query(
      `SELECT pp.*, u.plan
       FROM player_profiles pp
       JOIN users u ON u.id = pp.user_id
       WHERE pp.id = $1 AND pp.is_visible = TRUE`,
      [req.params.id]
    );

    if (!profiles.length) {
      return res.status(404).json({ error: 'Perfil no encontrado o no visible' });
    }

    // Incrementar vistas de forma no bloqueante
    query(
      `UPDATE player_profiles SET profile_views = profile_views + 1 WHERE id = $1`,
      [req.params.id]
    ).catch(e => console.warn('View count error:', e.message));

    const profile = profiles[0];

    const [experience, highlights] = await Promise.all([
      query(
        `SELECT * FROM player_experience WHERE player_id = $1 ORDER BY start_date DESC NULLS LAST`,
        [profile.id]
      ),
      query(
        `SELECT * FROM player_highlights WHERE player_id = $1 ORDER BY display_order ASC, created_at ASC`,
        [profile.id]
      ),
    ]);

    // No exponer user_id en el perfil público
    delete profile.user_id;

    res.json({ ...profile, experience: experience.rows, highlights: highlights.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

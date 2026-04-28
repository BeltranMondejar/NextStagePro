// src/routes/teams.js
// Endpoints:
//   GET    /api/teams                        — búsqueda pública
//   GET    /api/teams/me                     — perfil propio       ← ANTES que /:id
//   POST   /api/teams/me                     — crear perfil de equipo
//   PUT    /api/teams/me                     — actualizar perfil propio
//   POST   /api/teams/me/logo               — subir logo (Cloudinary)
//   POST   /api/teams/me/cover              — subir cover (Cloudinary)
//   GET    /api/teams/me/competitions       — historial competitivo
//   POST   /api/teams/me/competitions
//   PUT    /api/teams/me/competitions/:id
//   DELETE /api/teams/me/competitions/:id
//   GET    /api/teams/me/active-competitions
//   POST   /api/teams/me/active-competitions
//   DELETE /api/teams/me/active-competitions/:id
//   GET    /api/teams/me/highlights
//   POST   /api/teams/me/highlights
//   DELETE /api/teams/me/highlights/:id
//   GET    /api/teams/:id                    — perfil público      ← AL FINAL

const express = require('express');
const router  = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { uploadProfile, uploadHighlight, uploadLogo, cloudinary } = require('../config/cloudinary');

// ── Helper: obtener ID del perfil de equipo ──────────────────
async function getTeamId(userId) {
  const { rows } = await query(
    `SELECT id FROM team_profiles WHERE user_id = $1`, [userId]
  );
  return rows[0]?.id || null;
}

async function getTeamPlayers(teamName) {
  if (!teamName) return [];

  const { rows } = await query(
    `SELECT
       pp.id,
       pp.nickname,
       pp.first_name,
       pp.last_name,
       pp.main_role,
       pp.current_rank,
       COALESCE(NULLIF(pp.current_team, ''), owner_team.name) AS current_team,
       pp.avatar_url,
       pp.profile_views,
       u.plan
     FROM player_profiles pp
     JOIN users u ON u.id = pp.user_id
     LEFT JOIN team_profiles owner_team ON owner_team.user_id = pp.user_id
     WHERE pp.is_visible = TRUE
       AND COALESCE(NULLIF(pp.current_team, ''), owner_team.name) = $1
     ORDER BY
       CASE WHEN u.plan != 'free' THEN 0 ELSE 1 END,
       pp.profile_views DESC,
       pp.nickname ASC`,
    [teamName]
  );

  return rows;
}

// ── Búsqueda pública de equipos ──────────────────────────────
// GET /api/teams?game=&location=&search=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { game, location, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = ['tp.is_visible = TRUE'];
    const params = [];
    let idx = 1;

    if (game)     { conditions.push(`tp.game ILIKE $${idx++}`);      params.push(`%${game}%`); }
    if (location) { conditions.push(`tp.location ILIKE $${idx++}`);  params.push(`%${location}%`); }
    if (search)   { conditions.push(`tp.name ILIKE $${idx++}`);      params.push(`%${search}%`); }

    const where = conditions.join(' AND ');

    const dataQuery = `
      SELECT
        tp.id, tp.name, tp.abbreviation, tp.game, tp.location,
        tp.logo_url, tp.profile_views,
        u.plan
      FROM team_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE ${where}
      ORDER BY
        CASE WHEN u.plan != 'free' THEN 0 ELSE 1 END,
        tp.profile_views DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    params.push(Number(limit), offset);

    const countQuery = `
      SELECT COUNT(*) FROM team_profiles tp
      JOIN users u ON u.id = tp.user_id
      WHERE ${where}
    `;

    const [data, count] = await Promise.all([
      query(dataQuery, params),
      query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      teams:  data.rows,
      total:  Number(count.rows[0].count),
      page:   Number(page),
      limit:  Number(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ════════════════════════════════════════════════════════════
//  RUTAS /me  — deben ir TODAS antes de /:id
// ════════════════════════════════════════════════════════════

// GET /api/teams/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows: profiles } = await query(
      `SELECT tp.*, u.plan, u.email
       FROM team_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.user_id = $1`,
      [req.user.id]
    );

    if (!profiles.length) {
      return res.status(404).json({ error: 'Perfil de equipo no encontrado' });
    }

    const profile = profiles[0];

    const [competitions, activeComps, highlights, players] = await Promise.all([
      query(`SELECT * FROM team_competitions WHERE team_id = $1 ORDER BY year DESC`, [profile.id]),
      query(`SELECT * FROM team_active_competitions WHERE team_id = $1`, [profile.id]),
      query(`SELECT * FROM team_highlights WHERE team_id = $1 ORDER BY display_order`, [profile.id]),
      getTeamPlayers(profile.name),
    ]);

    res.json({
      ...profile,
      competitions:        competitions.rows,
      active_competitions: activeComps.rows,
      highlights:          highlights.rows,
      players,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/teams/me  (crear perfil de equipo por primera vez)
router.post('/me', requireAuth, async (req, res) => {
  try {
    const existing = await getTeamId(req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'Ya tienes un perfil de equipo' });
    }

    const { name, abbreviation, email, founded_date, location, bio, game } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });

    await query(
      `UPDATE users SET account_type = 'team', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    const { rows } = await query(
      `INSERT INTO team_profiles (user_id, name, abbreviation, email, founded_date, location, bio, game)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, name, abbreviation, email, founded_date || null, location, bio, game]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/teams/me
// PUT /api/teams/me
router.put('/me', requireAuth, async (req, res) => {
  try {
    const {
      name, abbreviation, email, founded_date, location, bio, game,
      discord_tag, twitter_url, liquipedia_url, vlr_url, twitch_url,
      is_visible // ← AÑADIR ESTO
    } = req.body;

    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil de equipo no encontrado' });

    const { rows } = await query(
      `UPDATE team_profiles SET
        name           = COALESCE($1,  name),
        abbreviation   = COALESCE($2,  abbreviation),
        email          = COALESCE($3,  email),
        founded_date   = COALESCE($4,  founded_date),
        location       = COALESCE($5,  location),
        bio            = COALESCE($6,  bio),
        game           = COALESCE($7,  game),
        discord_tag    = COALESCE($8,  discord_tag),
        twitter_url    = COALESCE($9,  twitter_url),
        liquipedia_url = COALESCE($10, liquipedia_url),
        vlr_url        = COALESCE($11, vlr_url),
        twitch_url     = COALESCE($12, twitch_url),
        is_visible     = COALESCE($13, is_visible),
        updated_at     = NOW()
       WHERE user_id = $14 RETURNING *`,
      [
        name, abbreviation, email, founded_date || null, location, bio, game,
        discord_tag, twitter_url, liquipedia_url, vlr_url, twitch_url,
        is_visible, // ← AÑADIR ESTO
        req.user.id,
      ]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/teams/me
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil de equipo no encontrado' });

    await query(`DELETE FROM team_profiles WHERE id = $1`, [teamId]);
    await query(
      `UPDATE users SET account_type = 'player', updated_at = NOW() WHERE id = $1`,
      [req.user.id]
    );

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/teams/me/logo
router.post('/me/logo', requireAuth, uploadLogo.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
    const { rows } = await query(
      `UPDATE team_profiles SET logo_url = $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING logo_url`,
      [req.file.path, req.user.id]
    );
    res.json({ logo_url: rows[0].logo_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error subiendo logo' });
  }
});

// POST /api/teams/me/cover
router.post('/me/cover', requireAuth, uploadProfile.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
    const { rows } = await query(
      `UPDATE team_profiles SET cover_url = $1, updated_at = NOW()
       WHERE user_id = $2 RETURNING cover_url`,
      [req.file.path, req.user.id]
    );
    res.json({ cover_url: rows[0].cover_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error subiendo cover' });
  }
});

// ════════════════════════════════════════════════════════════
//  COMPETICIONES (historial)
// ════════════════════════════════════════════════════════════

router.get('/me/competitions', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rows } = await query(
      `SELECT * FROM team_competitions WHERE team_id = $1 ORDER BY year DESC`, [teamId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.post('/me/competitions', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { competition_name, placement, year } = req.body;
    if (!competition_name) return res.status(400).json({ error: 'competition_name requerido' });
    const { rows } = await query(
      `INSERT INTO team_competitions (team_id, competition_name, placement, year)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [teamId, competition_name, placement, year || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.put('/me/competitions/:id', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { competition_name, placement, year } = req.body;
    const { rows } = await query(
      `UPDATE team_competitions SET
        competition_name = COALESCE($1, competition_name),
        placement        = COALESCE($2, placement),
        year             = COALESCE($3, year)
       WHERE id = $4 AND team_id = $5 RETURNING *`,
      [competition_name, placement, year || null, req.params.id, teamId]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.delete('/me/competitions/:id', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rowCount } = await query(
      `DELETE FROM team_competitions WHERE id = $1 AND team_id = $2`,
      [req.params.id, teamId]
    );
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

// ════════════════════════════════════════════════════════════
//  COMPETICIONES ACTIVAS
// ════════════════════════════════════════════════════════════

router.get('/me/active-competitions', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rows } = await query(
      `SELECT * FROM team_active_competitions WHERE team_id = $1`, [teamId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.post('/me/active-competitions', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { competition_name, season } = req.body;
    if (!competition_name) return res.status(400).json({ error: 'competition_name requerido' });
    const { rows } = await query(
      `INSERT INTO team_active_competitions (team_id, competition_name, season)
       VALUES ($1, $2, $3) RETURNING *`,
      [teamId, competition_name, season]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.delete('/me/active-competitions/:id', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rowCount } = await query(
      `DELETE FROM team_active_competitions WHERE id = $1 AND team_id = $2`,
      [req.params.id, teamId]
    );
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

// ════════════════════════════════════════════════════════════
//  HIGHLIGHTS DE EQUIPO
// ════════════════════════════════════════════════════════════

router.get('/me/highlights', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rows } = await query(
      `SELECT * FROM team_highlights WHERE team_id = $1 ORDER BY display_order`, [teamId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.post('/me/highlights', requireAuth, uploadHighlight.single('media'), async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const isVideo   = req.file.mimetype?.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'photo';
    const thumbnailUrl = isVideo
      ? req.file.path.replace('/upload/', '/upload/so_1,w_400,h_225,c_fill/').replace(/\.\w+$/, '.jpg')
      : null;

    const { rows } = await query(
      `INSERT INTO team_highlights (team_id, media_url, media_type, title, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [teamId, req.file.path, mediaType, req.body.title || null, thumbnailUrl]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

router.delete('/me/highlights/:id', requireAuth, async (req, res) => {
  try {
    const teamId = await getTeamId(req.user.id);
    if (!teamId) return res.status(404).json({ error: 'Perfil no encontrado' });
    const { rows } = await query(
      `SELECT media_url FROM team_highlights WHERE id = $1 AND team_id = $2`,
      [req.params.id, teamId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Highlight no encontrado' });

    const publicId = rows[0].media_url.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(`nextstagepro/highlights/${publicId}`);

    await query(`DELETE FROM team_highlights WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Highlight eliminado' });
  } catch (err) { res.status(500).json({ error: 'Error del servidor' }); }
});

// ════════════════════════════════════════════════════════════
//  RUTA DINÁMICA — siempre al final
// ════════════════════════════════════════════════════════════

// GET /api/teams/:id  ← debe ser la ÚLTIMA ruta GET de este router
router.get('/:id', async (req, res) => {
  try {
    const { rows: profiles } = await query(
      `SELECT tp.*, u.plan
       FROM team_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.id = $1 AND tp.is_visible = TRUE`,
      [req.params.id]
    );

    if (!profiles.length) return res.status(404).json({ error: 'Perfil no encontrado' });

    await query(
      `UPDATE team_profiles SET profile_views = profile_views + 1 WHERE id = $1`,
      [req.params.id]
    );

    const profile = profiles[0];
    delete profile.user_id;

    const [competitions, activeComps, highlights, players] = await Promise.all([
      query(`SELECT * FROM team_competitions WHERE team_id = $1 ORDER BY year DESC`, [profile.id]),
      query(`SELECT * FROM team_active_competitions WHERE team_id = $1`, [profile.id]),
      query(`SELECT * FROM team_highlights WHERE team_id = $1 ORDER BY display_order`, [profile.id]),
      getTeamPlayers(profile.name),
    ]);

    res.json({
      ...profile,
      competitions:        competitions.rows,
      active_competitions: activeComps.rows,
      highlights:          highlights.rows,
      players,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;

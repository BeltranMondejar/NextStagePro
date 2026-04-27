-- ============================================================
-- NextStagePro.gg — Schema SQL completo
-- Ejecutar en Neon: Settings > SQL Editor
-- ============================================================

-- ── Extensión UUID ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  discord_id   TEXT UNIQUE,
  plan         TEXT NOT NULL DEFAULT 'free'
                 CHECK (plan IN ('free','player_pro','team_pro')),
  account_type TEXT NOT NULL DEFAULT 'player'
                 CHECK (account_type IN ('player','team')),
  is_verified  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLAYER_PROFILES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name     TEXT,
  last_name      TEXT,
  nickname       TEXT NOT NULL DEFAULT '',
  birthdate      DATE,
  location       TEXT,
  current_team   TEXT,
  bio            TEXT,
  game           TEXT,
  main_role      TEXT,
  current_rank   TEXT,
  peak_rank      TEXT,
  discord_tag    TEXT,
  twitter_url    TEXT,
  liquipedia_url TEXT,
  vlr_url        TEXT,
  twitch_url     TEXT,
  avatar_url     TEXT,
  cover_url      TEXT,
  is_visible     BOOLEAN DEFAULT TRUE,
  profile_views  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLAYER_EXPERIENCE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_experience (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  team_name    TEXT NOT NULL,
  role         TEXT,
  achievements TEXT,
  start_date   DATE,
  end_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLAYER_HIGHLIGHTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_highlights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  media_url     TEXT NOT NULL,
  media_type    TEXT NOT NULL CHECK (media_type IN ('photo','video')),
  title         TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM_PROFILES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  abbreviation   TEXT,
  email          TEXT,
  founded_date   DATE,
  location       TEXT,
  bio            TEXT,
  game           TEXT,
  discord_tag    TEXT,
  twitter_url    TEXT,
  liquipedia_url TEXT,
  vlr_url        TEXT,
  twitch_url     TEXT,
  logo_url       TEXT,
  cover_url      TEXT,
  is_visible     BOOLEAN DEFAULT TRUE,
  profile_views  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM_COMPETITIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_competitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  competition_name TEXT NOT NULL,
  placement        TEXT,
  year             INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM_ACTIVE_COMPETITIONS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS team_active_competitions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  competition_name TEXT NOT NULL,
  season           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEAM_HIGHLIGHTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_highlights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  media_url     TEXT NOT NULL,
  media_type    TEXT NOT NULL CHECK (media_type IN ('photo','video')),
  title         TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL CHECK (plan IN ('player_pro','team_pro')),
  status               TEXT NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','cancelled','past_due','expired')),
  stripe_customer_id   TEXT,
  stripe_sub_id        TEXT,
  stripe_price_id      TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACT_MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  discord    TEXT,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ÍNDICES (QoL: mejora velocidad de búsquedas) ─────────────
CREATE INDEX IF NOT EXISTS idx_player_profiles_game       ON player_profiles(game);
CREATE INDEX IF NOT EXISTS idx_player_profiles_main_role  ON player_profiles(main_role);
CREATE INDEX IF NOT EXISTS idx_player_profiles_current_rank ON player_profiles(current_rank);
CREATE INDEX IF NOT EXISTS idx_player_profiles_is_visible ON player_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id    ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_team_profiles_game         ON team_profiles(game);
CREATE INDEX IF NOT EXISTS idx_team_profiles_is_visible   ON team_profiles(is_visible);
CREATE INDEX IF NOT EXISTS idx_users_discord_id           ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id      ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub   ON subscriptions(stripe_sub_id);

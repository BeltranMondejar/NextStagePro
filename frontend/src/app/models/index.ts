// src/app/models/index.ts
// Interfaces que mapean 1:1 con las respuestas del backend

export interface User {
  id: string;
  email: string;
  discord_id: string;
  plan: 'free' | 'player_pro' | 'team_pro';
  account_type: 'player' | 'team';
  is_verified: boolean;
  created_at: string;
}

export interface PlayerExperience {
  id: string;
  player_id: string;
  team_name: string;
  team_logo_url?: string;
  role?: string;
  achievements?: string;
  start_date?: string;
  end_date?: string | null;
  created_at: string;
}

export interface PlayerHighlight {
  id: string;
  player_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  title?: string;
  thumbnail_url?: string;
  display_order: number;
  created_at: string;
}

export interface PlayerProfile {
  id: string;
  user_id?: string;
  email?: string;
  discord_id?: string;
  plan?: 'free' | 'player_pro' | 'team_pro';
  first_name?: string;
  last_name?: string;
  nickname: string;
  birthdate?: string;
  location?: string;
  current_team?: string;
  bio?: string;
  game?: string;
  main_role?: string;
  current_rank?: string;
  peak_rank?: string;
  discord_tag?: string;
  twitter_url?: string;
  liquipedia_url?: string;
  vlr_url?: string;
  twitch_url?: string;
  avatar_url?: string;
  cover_url?: string;
  is_visible: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
  // Relaciones incluidas en GET /me y GET /:id
  experience?: PlayerExperience[];
  highlights?: PlayerHighlight[];
}

export interface PlayerSearchResult {
  id: string;
  nickname: string;
  first_name?: string;
  last_name?: string;
  game?: string;
  main_role?: string;
  current_rank?: string;
  location?: string;
  avatar_url?: string;
  profile_views: number;
  plan: 'free' | 'player_pro' | 'team_pro';
}

export interface PlayerSearchResponse {
  players: PlayerSearchResult[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamCompetition {
  id: string;
  team_id: string;
  competition_name: string;
  competition_logo_url?: string;
  placement?: string;
  year?: number;
  created_at: string;
}

export interface TeamActiveCompetition {
  id: string;
  team_id: string;
  competition_name: string;
  season?: string;
  created_at: string;
}

export interface TeamHighlight {
  id: string;
  team_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  title?: string;
  thumbnail_url?: string;
  display_order: number;
  created_at: string;
}

export interface TeamProfile {
  id: string;
  user_id?: string;
  email?: string;
  plan?: 'free' | 'player_pro' | 'team_pro';
  name: string;
  abbreviation?: string;
  founded_date?: string;
  location?: string;
  bio?: string;
  game?: string;
  discord_tag?: string;
  twitter_url?: string;
  liquipedia_url?: string;
  vlr_url?: string;
  twitch_url?: string;
  logo_url?: string;
  cover_url?: string;
  is_visible: boolean;
  profile_views: number;
  created_at: string;
  updated_at: string;
  competitions?: TeamCompetition[];
  active_competitions?: TeamActiveCompetition[];
  highlights?: TeamHighlight[];
}

export interface Subscription {
  id?: string;
  user_id?: string;
  plan: 'free' | 'player_pro' | 'team_pro';
  status?: 'active' | 'cancelled' | 'past_due' | 'expired' | null;
  current_period_start?: string;
  current_period_end?: string;
  cancelled_at?: string;
}

export interface PlayerSearchFilters {
  game?: string;
  role?: string;
  rank?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  plan?: 'pro' | 'all';   // filtro por plan enviado al backend
}
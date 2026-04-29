// src/app/services/auth.service.ts
// DEMO MODE: permite probar el perfil sin cuenta de Discord real.
// Activa el modo demo con ?demo=1 en la URL o con el botón "Demo" en el header.

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, PlayerProfile } from '../models';

// Perfil demo mockeado — se usa cuando no hay backend ni cuenta Discord
const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'demo@nextstagepro.gg',
  discord_id: 'demo#0000',
  plan: 'player_pro',
  account_type: 'player',
  is_verified: true,
  created_at: new Date().toISOString(),
};

export const DEMO_PROFILE: PlayerProfile = {
  id: 'demo-user-001',
  user_id: 'demo-user-001',
  email: 'demo@nextstagepro.gg',
  discord_id: 'demo#0000',
  plan: 'player_pro',
  nickname: 'DemoPlayer',
  first_name: 'Demo',
  last_name: 'Player',
  bio: 'Este es un perfil de demostración. Puedes editar todos los campos para ver cómo funciona la plataforma.',
  game: 'Valorant',
  main_role: 'IGL',
  current_rank: 'Radiant',
  peak_rank: 'Radiant #47',
  location: 'Madrid, España',
  current_team: 'NextStage Academy',
  discord_tag: 'DemoPlayer#0000',
  twitter_url: 'https://twitter.com',
  twitch_url: 'https://twitch.tv',
  is_visible: true,
  profile_views: 142,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  experience: [
    {
      id: 'exp-1',
      player_id: 'demo-user-001',
      team_name: 'NextStage Academy',
      role: 'IGL',
      achievements: 'VCT Game Changers EMEA 2024',
      start_date: '2023-01-01',
      end_date: null,
      created_at: new Date().toISOString(),
    }
  ],
  highlights: [],
};

const DEMO_KEY = 'nsp_demo_mode';
const DEMO_PROFILE_KEY = 'nsp_demo_profile';
const HEADER_IMAGE_KEY = 'nsp_header_image';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user      = signal<User | null>(null);
  private _loading   = signal<boolean>(false);
  private _demoMode  = signal<boolean>(false);
  private _headerImageUrl = signal<string | null>(null);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly demoMode   = this._demoMode.asReadonly();
  readonly headerImageUrl = this._headerImageUrl.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isPro      = computed(() => {
    const plan = this._user()?.plan;
    return plan === 'player_pro' || plan === 'team_pro';
  });

  constructor() {
    // Activar demo si viene ?demo=1 en la URL
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1') {
      this.enterDemoMode();
      return;
    }
    // Restaurar demo si ya estaba activo
    if (localStorage.getItem(DEMO_KEY) === '1') {
      this.enterDemoMode();
      return;
    }

    const token = localStorage.getItem('nsp_token');
    const cachedHeaderImage = localStorage.getItem(HEADER_IMAGE_KEY);
    if (cachedHeaderImage) {
      this._headerImageUrl.set(cachedHeaderImage);
    }
    if (token) {
      if (this.tokenExpiresWithin(token, 24 * 60 * 60)) {
        this.refreshToken();
      } else {
        this.fetchMe();
      }
    }
  }

  // ── Demo Mode ────────────────────────────────────────────
  enterDemoMode(): void {
    localStorage.setItem(DEMO_KEY, '1');
    this._demoMode.set(true);
    this._user.set(DEMO_USER);
    this.setHeaderImage(this.getDemoProfile().avatar_url || null);
  }

  exitDemoMode(): void {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_PROFILE_KEY);
    this._demoMode.set(false);
    this._user.set(null);
    this.setHeaderImage(null);
    this.router.navigate(['/']);
  }

  setHeaderImage(url: string | null): void {
    if (url) {
      localStorage.setItem(HEADER_IMAGE_KEY, url);
    } else {
      localStorage.removeItem(HEADER_IMAGE_KEY);
    }
    this._headerImageUrl.set(url);
  }

  // Guarda cambios del perfil demo en localStorage para que persistan
  saveDemoProfile(partial: Partial<PlayerProfile>): PlayerProfile {
    const current = this.getDemoProfile();
    const updated = { ...current, ...partial, updated_at: new Date().toISOString() };
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(updated));
    return updated;
  }

  getDemoProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem(DEMO_PROFILE_KEY);
      return saved ? JSON.parse(saved) : { ...DEMO_PROFILE };
    } catch {
      return { ...DEMO_PROFILE };
    }
  }

  // ── Real Auth ────────────────────────────────────────────
  loginWithDiscord(): void {
    window.location.href = `${environment.apiUrl.replace('/api', '')}/api/auth/discord`;
  }

  handleCallback(token: string): void {
    localStorage.setItem('nsp_token', token);
    this.fetchMe();
  }

  fetchMe(): void {
    this._loading.set(true);
    this.http
      .get<User>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap(user => {
          this._user.set(user);
          if (user.header_image_url) {
            this.setHeaderImage(user.header_image_url);
          } else {
            this.setHeaderImage(null);
            this.loadHeaderImageForUser(user);
          }
          this._loading.set(false);
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      )
      .subscribe();
  }

  refreshToken(): void {
    this._loading.set(true);
    this.http
      .post<{ token: string }>(`${environment.apiUrl}/auth/refresh`, {})
      .pipe(
        tap(res => {
          localStorage.setItem('nsp_token', res.token);
          this.fetchMe();
        }),
        catchError(() => {
          this.fetchMe();
          return of(null);
        })
      )
      .subscribe();
  }

  logout(): void {
    if (this._demoMode()) {
      this.exitDemoMode();
      return;
    }
    this.clearSession();
    this.router.navigate(['/']);
  }

  // ── Helpers ──────────────────────────────────────────────
  private tokenExpiresWithin(token: string, seconds: number): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return false;
      return payload.exp - Math.floor(Date.now() / 1000) < seconds;
    } catch {
      return false;
    }
  }

  private clearSession(): void {
    localStorage.removeItem('nsp_token');
    this._user.set(null);
    this._loading.set(false);
    this.setHeaderImage(null);
  }

  private loadHeaderImageForUser(user: User): void {
    const endpoint = user.account_type === 'team'
      ? `${environment.apiUrl}/teams/me`
      : `${environment.apiUrl}/players/me`;

    this.http.get<{ avatar_url?: string; logo_url?: string }>(endpoint).subscribe({
      next: (profile) => {
        this.setHeaderImage(profile.avatar_url || profile.logo_url || null);
      },
      error: () => {
        this.setHeaderImage(null);
      },
    });
  }
}

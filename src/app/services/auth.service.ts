// src/app/services/auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models';

const HEADER_IMAGE_KEY = 'nsp_header_image';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user      = signal<User | null>(null);
  private _loading   = signal<boolean>(false);
  private _headerImageUrl = signal<string | null>(null);

  readonly user       = this._user.asReadonly();
  readonly loading    = this._loading.asReadonly();
  readonly headerImageUrl = this._headerImageUrl.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isPro      = computed(() => {
    const plan = this._user()?.plan;
    return plan === 'player_pro' || plan === 'team_pro';
  });

  constructor() {
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

  setHeaderImage(url: string | null): void {
    if (url) {
      localStorage.setItem(HEADER_IMAGE_KEY, url);
    } else {
      localStorage.removeItem(HEADER_IMAGE_KEY);
    }
    this._headerImageUrl.set(url);
  }

  // ── Auth ────────────────────────────────────────────
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

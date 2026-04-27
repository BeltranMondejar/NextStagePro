// src/app/services/player.service.ts
// Demo-aware: cuando AuthService está en modo demo, todas las operaciones
// trabajan sobre el perfil guardado en localStorage en lugar de llamar al backend.

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  PlayerProfile, PlayerExperience, PlayerHighlight,
  PlayerSearchFilters, PlayerSearchResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get api() { return environment.apiUrl; }

  // ── Helpers demo ─────────────────────────────────────────
  private get isDemo(): boolean { return this.auth.demoMode(); }

  // ── Perfil propio ─────────────────────────────────────────
  getMe(): Observable<PlayerProfile> {
    if (this.isDemo) return of(this.auth.getDemoProfile());
    return this.http.get<PlayerProfile>(`${this.api}/players/me`);
  }

  updateMe(data: Partial<PlayerProfile>): Observable<PlayerProfile> {
    if (this.isDemo) return of(this.auth.saveDemoProfile(data));
    return this.http.patch<PlayerProfile>(`${this.api}/players/me`, data);
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    if (this.isDemo) {
      // En demo: crear URL local temporal
      const url = URL.createObjectURL(file);
      this.auth.saveDemoProfile({ avatar_url: url });
      return of({ avatar_url: url });
    }
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<{ avatar_url: string }>(`${this.api}/players/me/avatar`, fd);
  }

  uploadCover(file: File): Observable<{ cover_url: string }> {
    if (this.isDemo) {
      const url = URL.createObjectURL(file);
      this.auth.saveDemoProfile({ cover_url: url });
      return of({ cover_url: url });
    }
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<{ cover_url: string }>(`${this.api}/players/me/cover`, fd);
  }

  // ── Experiencia ───────────────────────────────────────────
  addExperience(data: Partial<PlayerExperience>): Observable<PlayerExperience> {
    if (this.isDemo) {
      const profile = this.auth.getDemoProfile();
      const newExp: PlayerExperience = {
        id: `exp-demo-${Date.now()}`,
        player_id: profile.id,
        team_name: data.team_name || 'Equipo',
        role: data.role,
        achievements: data.achievements,
        start_date: data.start_date,
        end_date: data.end_date ?? null,
        created_at: new Date().toISOString(),
      };
      const experience = [newExp, ...(profile.experience || [])];
      this.auth.saveDemoProfile({ experience });
      return of(newExp);
    }
    return this.http.post<PlayerExperience>(`${this.api}/players/me/experience`, data);
  }

  updateExperience(id: string, data: Partial<PlayerExperience>): Observable<PlayerExperience> {
    if (this.isDemo) {
      const profile = this.auth.getDemoProfile();
      const experience = (profile.experience || []).map(e =>
        e.id === id ? { ...e, ...data } : e
      );
      this.auth.saveDemoProfile({ experience });
      return of(experience.find(e => e.id === id)!);
    }
    return this.http.patch<PlayerExperience>(`${this.api}/players/me/experience/${id}`, data);
  }

  deleteExperience(id: string): Observable<void> {
    if (this.isDemo) {
      const profile = this.auth.getDemoProfile();
      const experience = (profile.experience || []).filter(e => e.id !== id);
      this.auth.saveDemoProfile({ experience });
      return of(undefined);
    }
    return this.http.delete<void>(`${this.api}/players/me/experience/${id}`);
  }

  // ── Highlights ────────────────────────────────────────────
  addHighlight(file: File): Observable<PlayerHighlight> {
    if (this.isDemo) {
      const profile = this.auth.getDemoProfile();
      const isVideo = file.type.startsWith('video/');
      const url = URL.createObjectURL(file);
      const newH: PlayerHighlight = {
        id: `hl-demo-${Date.now()}`,
        player_id: profile.id,
        media_url: url,
        media_type: isVideo ? 'video' : 'photo',
        title: file.name.replace(/\.[^.]+$/, ''),
        display_order: (profile.highlights || []).length,
        created_at: new Date().toISOString(),
      };
      const highlights = [...(profile.highlights || []), newH];
      this.auth.saveDemoProfile({ highlights });
      return of(newH);
    }
    const fd = new FormData();
    fd.append('media', file);
    return this.http.post<PlayerHighlight>(`${this.api}/players/me/highlights`, fd);
  }

  deleteHighlight(id: string): Observable<void> {
    if (this.isDemo) {
      const profile = this.auth.getDemoProfile();
      const highlights = (profile.highlights || []).filter(h => h.id !== id);
      this.auth.saveDemoProfile({ highlights });
      return of(undefined);
    }
    return this.http.delete<void>(`${this.api}/players/me/highlights/${id}`);
  }

  // ── Búsqueda pública ──────────────────────────────────────
  search(filters: PlayerSearchFilters = {}): Observable<PlayerSearchResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PlayerSearchResponse>(`${this.api}/players`, { params });
  }

  getById(id: string): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.api}/players/${id}`);
  }
}
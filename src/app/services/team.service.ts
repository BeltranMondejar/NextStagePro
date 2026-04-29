// src/app/services/team.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  TeamProfile,
  TeamCompetition,
  TeamActiveCompetition,
  TeamHighlight,
} from '../models';

export interface TeamSearchResponse {
  teams: TeamProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface TeamSearchFilters {
  game?: string;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/teams`;

  search(filters: TeamSearchFilters = {}): Observable<TeamSearchResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<TeamSearchResponse>(this.base, { params });
  }

  getById(id: string): Observable<TeamProfile> {
    return this.http.get<TeamProfile>(`${this.base}/${id}`);
  }

  getMe(): Observable<TeamProfile> {
    return this.http.get<TeamProfile>(`${this.base}/me`);
  }

  createMe(data: Partial<TeamProfile>): Observable<TeamProfile> {
    return this.http.post<TeamProfile>(`${this.base}/me`, data);
  }

  updateMe(data: Partial<TeamProfile>): Observable<TeamProfile> {
    return this.http.put<TeamProfile>(`${this.base}/me`, data);
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${this.base}/me`);
  }

  uploadLogo(file: File): Observable<{ logo_url: string }> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<{ logo_url: string }>(`${this.base}/me/logo`, fd);
  }

  uploadCover(file: File): Observable<{ cover_url: string }> {
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<{ cover_url: string }>(`${this.base}/me/cover`, fd);
  }

  // ── Competiciones ────────────────────────────────────────
  addCompetition(data: Partial<TeamCompetition>): Observable<TeamCompetition> {
    return this.http.post<TeamCompetition>(`${this.base}/me/competitions`, data);
  }

  updateCompetition(id: string, data: Partial<TeamCompetition>): Observable<TeamCompetition> {
    return this.http.put<TeamCompetition>(`${this.base}/me/competitions/${id}`, data);
  }

  deleteCompetition(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/competitions/${id}`);
  }

  addActiveCompetition(data: Partial<TeamActiveCompetition>): Observable<TeamActiveCompetition> {
    return this.http.post<TeamActiveCompetition>(`${this.base}/me/active-competitions`, data);
  }

  deleteActiveCompetition(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/active-competitions/${id}`);
  }

  // ── Highlights ───────────────────────────────────────────
  addHighlight(file: File, title?: string): Observable<TeamHighlight> {
    const fd = new FormData();
    fd.append('media', file);
    if (title) fd.append('title', title);
    return this.http.post<TeamHighlight>(`${this.base}/me/highlights`, fd);
  }

  deleteHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/highlights/${id}`);
  }
}

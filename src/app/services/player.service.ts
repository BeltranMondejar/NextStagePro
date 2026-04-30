import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PlayerProfile, PlayerExperience, PlayerHighlight,
  PlayerSearchFilters, PlayerSearchResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);

  private get api() { return environment.apiUrl; }

  getMe(): Observable<PlayerProfile> {
    return this.http.get<PlayerProfile>(`${this.api}/players/me`);
  }

  updateMe(data: Partial<PlayerProfile>): Observable<PlayerProfile> {
    return this.http.patch<PlayerProfile>(`${this.api}/players/me`, data);
  }

  uploadAvatar(file: File): Observable<{ avatar_url: string }> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<{ avatar_url: string }>(`${this.api}/players/me/avatar`, fd);
  }

  uploadCover(file: File): Observable<{ cover_url: string }> {
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<{ cover_url: string }>(`${this.api}/players/me/cover`, fd);
  }

  addExperience(data: Partial<PlayerExperience>): Observable<PlayerExperience> {
    return this.http.post<PlayerExperience>(`${this.api}/players/me/experience`, data);
  }

  updateExperience(id: string, data: Partial<PlayerExperience>): Observable<PlayerExperience> {
    return this.http.patch<PlayerExperience>(`${this.api}/players/me/experience/${id}`, data);
  }

  deleteExperience(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/players/me/experience/${id}`);
  }

  addHighlight(file: File): Observable<PlayerHighlight> {
    const fd = new FormData();
    fd.append('media', file);
    return this.http.post<PlayerHighlight>(`${this.api}/players/me/highlights`, fd);
  }

  deleteHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/players/me/highlights/${id}`);
  }

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
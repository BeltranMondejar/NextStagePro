// src/app/services/contact.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  discord?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);

  send(payload: ContactPayload): Observable<{ message: string; id: string }> {
    return this.http.post<{ message: string; id: string }>(
      `${environment.apiUrl}/contact`,
      payload
    );
  }
}

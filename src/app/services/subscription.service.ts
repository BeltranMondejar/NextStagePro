import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Subscription } from '../models';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/subscriptions`;

  getMe(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/me`);
  }

  // Crea sesión de Stripe y redirige automáticamente a la página de pago
  checkout(plan: 'player_pro' | 'team_pro'): void {
    this.http
      .post<{ url: string }>(`${this.base}/checkout`, { plan })
      .subscribe(res => {
        window.location.href = res.url;
      });
  }

  // Abre el portal de cliente de Stripe
  openPortal(): void {
    this.http
      .post<{ url: string }>(`${this.base}/portal`, {})
      .subscribe(res => {
        window.location.href = res.url;
      });
  }
}

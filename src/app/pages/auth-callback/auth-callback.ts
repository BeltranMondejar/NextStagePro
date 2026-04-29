import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-wrapper">
      <div class="callback-card">
        <img src="logos/Logo_NSPro.gg_Oficial_SF.png" alt="NextStagePro" class="logo" />
        <p *ngIf="!error">Iniciando sesión con Discord…</p>
        <p *ngIf="error" class="error">{{ error }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .callback-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--bg, #0a0a0f);
      }
      .callback-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: #fff;
        font-family: Inter, sans-serif;
      }
      .logo {
        width: 80px;
      }
      .error {
        color: #ff4d4d;
      }
    `,
  ],
})
export class AuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  error: string | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const errorCode = this.route.snapshot.queryParamMap.get('error');

    if (errorCode) {
      this.error = this.mapError(errorCode);
      setTimeout(() => this.router.navigate(['/']), 3000);
      return;
    }

    if (!token) {
      this.router.navigate(['/']);
      return;
    }

    this.auth.handleCallback(token);
    // Redirigir al perfil tras cargar el usuario
    setTimeout(() => this.router.navigate(['/profile']), 500);
  }

  private mapError(code: string): string {
    const map: Record<string, string> = {
      discord_cancelled: 'Cancelaste el login con Discord.',
      discord_token: 'Error obteniendo token de Discord.',
      discord_user: 'No se pudo obtener tu usuario de Discord.',
      server: 'Error del servidor. Inténtalo de nuevo.',
    };
    return map[code] ?? 'Error desconocido.';
  }
}

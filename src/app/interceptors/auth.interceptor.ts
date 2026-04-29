import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export const toastBus = new EventTarget();

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
  toastBus.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
}

// Mensajes por código de error
function friendlyError(err: HttpErrorResponse): string {
  if (!navigator.onLine) return 'Sin conexión a internet.';
  switch (err.status) {
    case 0:   return 'No se puede conectar al servidor. ¿Está el backend arrancado?';
    case 400: return err.error?.error || 'Datos incorrectos en la petición.';
    case 401: return 'Sesión expirada. Por favor, inicia sesión de nuevo.';
    case 403: return 'No tienes permiso para realizar esta acción.';
    case 404: return err.error?.error || 'Recurso no encontrado.';
    case 429: return 'Demasiadas peticiones. Espera un momento.';
    case 500: return 'Error interno del servidor. Inténtalo más tarde.';
    default:  return err.error?.error || `Error inesperado (${err.status}).`;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Solo interceptar peticiones a nuestra API
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = localStorage.getItem('nsp_token');
  const cloned = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = friendlyError(err);

      if (err.status === 401) {
        localStorage.removeItem('nsp_token');
        router.navigate(['/'], { queryParams: { login: 'required' } });
      }

      // Emitir toast para errores distintos de 401
      if (err.status !== 401) {
        showToast(message, 'error');
      }

      return throwError(() => err);
    })
  );
};

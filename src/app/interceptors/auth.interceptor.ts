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
    case 0:   return 'Unable to connect to the server. Is the backend running?';
    case 400: return err.error?.error || 'Invalid data in the request.';
    case 401: return 'Session expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return err.error?.error || 'Resource not found.';
    case 429: return 'Too many requests. Please wait a moment.';
    case 500: return 'Internal server error. Please try again later.';
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

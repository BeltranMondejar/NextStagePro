import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Permitir acceso si está logueado
  if (auth.isLoggedIn()) return true;

  router.navigate(['/'], { queryParams: { login: 'required' } });
  return false;
};

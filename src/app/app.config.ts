import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Carga en background los fragmentos tras el primer render
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Configura HttpClient con nuestro interceptor de autenticación
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
  ],
};

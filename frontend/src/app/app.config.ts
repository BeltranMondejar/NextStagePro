import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withPreloading: carga en background los chunks lazy tras el primer render
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // withFetch: usa Fetch API en lugar de XHR → no bloquea el bfcache
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
  ],
};

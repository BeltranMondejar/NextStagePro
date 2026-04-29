import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then((m) => m.AboutComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'team-profile',
    loadComponent: () =>
      import('./pages/team-profile/team-profile').then((m) => m.TeamProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./pages/search-players/search-players').then((m) => m.PlayersComponent),
  },
  {
    path: 'players/:id',
    loadComponent: () =>
      import('./pages/player-public/player-public').then((m) => m.PlayerPublicComponent),
  },
  {
    path: 'teams/:id',
    loadComponent: () =>
      import('./pages/team-public/team-public').then((m) => m.TeamPublicComponent),
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('./pages/subscriptions/subscriptions').then((m) => m.SubscriptionsComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.ContactComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback').then((m) => m.AuthCallbackComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
  },
];

import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AboutComponent } from './pages/about/about';
import { ProfileComponent } from './pages/profile/profile';
import { PlayersComponent } from './pages/search-players/search-players';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions';
import { ContactComponent } from './pages/contact/contact';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback';
import { PlayerPublicComponent } from './pages/player-public/player-public';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  // Ruta protegida: solo accesible si el usuario está autenticado
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  // Búsqueda pública de jugadores
  { path: 'players', component: PlayersComponent },
  // Perfil público de un jugador por ID
  { path: 'players/:id', component: PlayerPublicComponent },
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'contact', component: ContactComponent },
  // Callback OAuth: el backend redirige aquí con ?token=JWT
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', component: HomeComponent },
];

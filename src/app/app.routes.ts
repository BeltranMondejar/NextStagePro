import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { AboutComponent } from './pages/about/about';
import { ProfileComponent } from './pages/profile/profile';
import { PlayersComponent } from './pages/search-players/search-players';
import { SubscriptionsComponent } from './pages/subscriptions/subscriptions';
import { ContactComponent } from './pages/contact/contact';

export const routes: Routes = [
  { path: '', component: HomeComponent },      // Ruta principal
  { path: 'about', component: AboutComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'subscriptions', component: SubscriptionsComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', component: HomeComponent }     // Ruta desconocida
];

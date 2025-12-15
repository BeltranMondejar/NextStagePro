import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faCircleInfo, faUser, faSearch, faSackDollar, faEnvelope, faBell } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {

  // Iconos FontAwesome
  faHome = faHome;
  faCircleInfo = faCircleInfo;
  faUser = faUser;
  faSearch = faSearch;
  faSackDollar = faSackDollar;
  faEnvelope = faEnvelope;
  faBell = faBell;
  faDiscord = faDiscord;

  // Simula login. Luego lo reemplazamos con un AuthService real.
  isLogged = false;

  user = {
    name: 'Alex Chen',
    avatar: 'https://i.pravatar.cc/300' // avatar temporal
  };

  loginWithDiscord() {
    // Lógica OAuth — aquí redirigirías a Discord
    this.isLogged = true;
  }

  logout() {
    this.isLogged = false;
  }
}

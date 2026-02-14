import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faCircleInfo, faUser, faSearch, faEnvelope, faBell, faBars, faTimes} from '@fortawesome/free-solid-svg-icons';
import { faDiscord,faSketch } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {

  // Iconos FontAwesome
  faHome = faHome;
  faCircleInfo = faCircleInfo;
  faUser = faUser;
  faSearch = faSearch;
  faSketch = faSketch;
  faEnvelope = faEnvelope;
  faBell = faBell;
  faDiscord = faDiscord;
  faBars = faBars;
  faTimes = faTimes;

  //Variables
  isLogged = false;
  menuOpen: boolean = false;
  
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

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}

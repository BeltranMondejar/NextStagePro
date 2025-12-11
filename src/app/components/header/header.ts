import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {

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

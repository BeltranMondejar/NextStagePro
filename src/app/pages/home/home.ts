import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'] 

})
export class HomeComponent {
  // Ejemplo de datos dinámicos
  title = 'NextStagePro';
  subtitle = 'Your gateway to esports recruitment and player discovery.';
}

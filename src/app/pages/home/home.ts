import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']

})
export class HomeComponent {
  teams = ['G2 ESPORTS','KOI','TEAM HERETICS','FNATIC','MAD LIONS','GIANTS'];
  
  players = [
    { name: 'Marcus "Nova"', role: 'Valorant - IGL | Radiant' },
    { name: 'Sara "Ghost"', role: 'LoL - Midlane | Grandmaster' },
    { name: 'Viktor K.', role: 'CS2 - AWPer | Faceit 10' }
  ];
}

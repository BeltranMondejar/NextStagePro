import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  private auth = inject(AuthService);
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);

  readonly isLogged = this.auth.isLoggedIn;
  playersCount = 0;
  teamsCount = 0;

  ngOnInit(): void {
    forkJoin({
      players: this.playerService.search({ page: 1, limit: 1 }),
      teams: this.teamService.search({ page: 1, limit: 1 }),
    }).subscribe({
      next: ({ players, teams }) => {
        this.playersCount = players.total;
        this.teamsCount = teams.total;
      },
    });
  }

  formatCount(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value);
  }

  loginWithDiscord(): void { this.auth.loginWithDiscord(); }
}

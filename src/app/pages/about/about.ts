import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})
export class AboutComponent implements OnInit {
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);

  playersCount = 0;
  teamsCount = 0;

  stats = [
    { value: '2026', label: 'Fundación' },
    { value: '600+', label: 'Contratos' },
    { value: '50+', label: 'Staff' },
    { value: '180+', label: 'Partners' },
    { value: '08+', label: 'Años Exp.' },
  ];

  values = [
    {
      title: 'Integridad',
      description: 'Datos reales para una red de confianza.',
    },
    {
      title: 'Innovación',
      description: 'IA para el scouting profesional.',
    },
    {
      title: 'Comunidad',
      description: 'Crecimiento compartido en los eSports.',
    },
  ];

  team = [
    {
      name: 'Ikta Sollork',
      role: 'Founder / CEO',
    },
  ];

  collabs = [
    { icon: 'V', name: 'Vortex', description: 'Network partners' },
    { icon: 'P', name: 'Pixel', description: 'Design partners' },
    { icon: 'A', name: 'Athon', description: 'Stream partners' },
    { icon: 'F', name: 'Fronxe', description: 'Hardware partners' },
  ];

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
}

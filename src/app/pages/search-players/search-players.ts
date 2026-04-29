import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { PlayerSearchFilters, PlayerSearchResult, TeamProfile } from '../../models';
import { PlayerService } from '../../services/player.service';
import { TeamService, TeamSearchFilters } from '../../services/team.service';

@Component({
  selector: 'app-search-players',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-players.html',
  styleUrls: ['./search-players.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  activeTab: 'players' | 'teams' = 'players';

  typeFilter: 'all' | 'pro' = 'all';
  dropdownOpen = false;
  openSelect: 'game' | 'role' | 'rank' | null = null;
  searchText = '';

  games = ['Valorant', 'League of Legends', 'CS2', 'Rocket League'];
  roles = [
    'IGL',
    'Duelist',
    'Controller',
    'Sentinel',
    'Initiator',
    'Mid Laner',
    'Top',
    'Jungle',
    'Support',
    'ADC',
    'AWPer',
  ];
  ranks = ['Radiant', 'Immortal', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];

  selectedGame = '';
  selectedRole = '';
  selectedRank = '';

  players: PlayerSearchResult[] = [];
  skeletonItems = Array(12).fill(0);
  total = 0;
  page = 1;
  limit = 20;
  loading = false;
  error = '';

  teams: TeamProfile[] = [];
  teamsTotal = 0;
  teamsPage = 1;
  teamsLimit = 20;
  teamsLoading = false;
  teamsError = '';

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(350)).subscribe(() => {
      this.page = 1;
      this.teamsPage = 1;
      if (this.activeTab === 'players') this.loadPlayers();
      else this.loadTeams();
    });
    this.loadPlayers();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  switchTab(tab: 'players' | 'teams'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.page = 1;
    this.teamsPage = 1;
    if (tab === 'players' && this.players.length === 0) this.loadPlayers();
    if (tab === 'teams' && this.teams.length === 0) this.loadTeams();
  }

  loadPlayers(): void {
    this.loading = true;
    this.error = '';
    const filters: PlayerSearchFilters = {
      search: this.searchText || undefined,
      game: this.selectedGame || undefined,
      role: this.selectedRole || undefined,
      rank: this.selectedRank || undefined,
      plan: this.typeFilter === 'pro' ? 'pro' : undefined,
      page: this.page,
      limit: this.limit,
    };
    this.playerService.search(filters).subscribe({
      next: (res) => {
        this.players = res.players;
        this.total = res.total;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Error cargando jugadores.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadTeams(): void {
    this.teamsLoading = true;
    this.teamsError = '';
    const filters: TeamSearchFilters = {
      search: this.searchText || undefined,
      game: this.selectedGame || undefined,
      page: this.teamsPage,
      limit: this.teamsLimit,
    };
    this.teamService.search(filters).subscribe({
      next: (res) => {
        this.teams = res.teams;
        this.teamsTotal = res.total;
        this.teamsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.teamsError = 'Error cargando equipos.';
        this.teamsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleSelect(name: 'game' | 'role' | 'rank', event: Event): void {
    event.stopPropagation();
    this.openSelect = this.openSelect === name ? null : name;
  }

  selectOption(field: 'game' | 'role' | 'rank', value: string, event: Event): void {
    event.stopPropagation();
    if (field === 'game') this.selectedGame = value;
    if (field === 'role') this.selectedRole = value;
    if (field === 'rank') this.selectedRank = value;
    this.openSelect = null;
    this.page = 1;
    this.teamsPage = 1;
    if (this.activeTab === 'players') this.loadPlayers();
    else this.loadTeams();
  }

  setTypeFilter(filter: 'all' | 'pro'): void {
    if (this.typeFilter === filter) return;
    this.typeFilter = filter;
    this.page = 1;
    this.teamsPage = 1;
    if (this.activeTab === 'players') this.loadPlayers();
    else this.loadTeams();
  }

  onSearchChange(): void {
    this.search$.next();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (!this.dropdownOpen) this.openSelect = null;
  }

  closeDropdown(): void {
    setTimeout(() => {
      this.dropdownOpen = false;
      this.openSelect = null;
    }, 150);
  }

  closeFull(): void {
    this.dropdownOpen = false;
    this.openSelect = null;
  }

  resetFilters(): void {
    this.selectedGame = '';
    this.selectedRole = '';
    this.selectedRank = '';
    this.openSelect = null;
    this.page = 1;
    this.teamsPage = 1;
    if (this.activeTab === 'players') this.loadPlayers();
    else this.loadTeams();
  }

  resetAll(): void {
    this.resetFilters();
    this.typeFilter = 'all';
    this.searchText = '';
    if (this.activeTab === 'players') this.loadPlayers();
    else this.loadTeams();
  }

  get hasActiveFilters(): boolean {
    return !!(this.selectedGame || this.selectedRole || this.selectedRank);
  }

  get activeFilterLabel(): string {
    return [this.selectedGame, this.selectedRole, this.selectedRank].filter((v) => !!v).join(' - ');
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }
  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, this.page - 2);
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.loadPlayers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get teamsTotalPages(): number {
    return Math.ceil(this.teamsTotal / this.teamsLimit);
  }
  get teamsPageNumbers(): number[] {
    const total = this.teamsTotalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, this.teamsPage - 2);
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  goToTeamsPage(page: number): void {
    if (page < 1 || page > this.teamsTotalPages) return;
    this.teamsPage = page;
    this.loadTeams();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  trackByPlayer(_: number, p: PlayerSearchResult): string {
    return p.id;
  }
  trackByTeam(_: number, t: TeamProfile): string {
    return t.id;
  }

  getTeamLogoUrl(team: TeamProfile): string {
    if (team.logo_url) return team.logo_url;
    const name = encodeURIComponent(team.name || 'T');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=80`;
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { PlayerService } from '../../services/player.service';
import { PlayerSearchResult, PlayerSearchFilters } from '../../models';

@Component({
  selector: 'app-search-players',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-players.html',
  styleUrls: ['./search-players.scss'],
})
export class PlayersComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private sub?: Subscription;

  typeFilter: 'all' | 'pro' = 'all';
  dropdownOpen = false;
  openSelect: 'game' | 'role' | 'rank' | null = null;
  searchText   = '';

  games = ['Valorant', 'League of Legends', 'CS2', 'Rocket League'];
  roles = ['IGL', 'Duelist', 'Controller', 'Sentinel', 'Initiator',
           'Mid Laner', 'Top', 'Jungle', 'Support', 'ADC', 'AWPer'];
  ranks = ['Radiant', 'Immortal', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];

  selectedGame = '';
  selectedRole = '';
  selectedRank = '';

  players:      PlayerSearchResult[] = [];
  skeletonItems = Array(12).fill(0);
  total   = 0;
  page    = 1;
  limit   = 20;
  loading = false;
  error   = '';

  private search$ = new Subject<void>();

  ngOnInit(): void {
    this.sub = this.search$.pipe(debounceTime(350)).subscribe(() => {
      this.page = 1;
      this.loadPlayers();
    });
    this.loadPlayers();
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  loadPlayers(): void {
    this.loading = true;
    this.error   = '';

    const filters: PlayerSearchFilters = {
      search: this.searchText   || undefined,
      game:   this.selectedGame || undefined,
      role:   this.selectedRole || undefined,
      rank:   this.selectedRank || undefined,
      plan:   this.typeFilter === 'pro' ? 'pro' : undefined,
      page:   this.page,
      limit:  this.limit,
    };

    this.playerService.search(filters).subscribe({
      next: res => {
        this.players = res.players;
        this.total   = res.total;
        this.loading = false;
      },
      error: () => {
        this.error   = 'Error cargando jugadores. El backend puede no estar arrancado.';
        this.loading = false;
      },
    });
  }

  // ── Custom select ─────────────────────────────────────────
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
    this.loadPlayers();
  }

  // ── Filters ───────────────────────────────────────────────
  setTypeFilter(filter: 'all' | 'pro'): void {
    if (this.typeFilter === filter) return;
    this.typeFilter = filter;
    this.page = 1;
    this.loadPlayers();
  }

  onSearchChange(): void { this.search$.next(); }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    if (!this.dropdownOpen) this.openSelect = null;
  }

  closeDropdown(): void {
    setTimeout(() => { this.dropdownOpen = false; this.openSelect = null; }, 150);
  }

  // Cierra dropdown Y custom select (llamado desde template)
  closeFull(): void {
    this.dropdownOpen = false;
    this.openSelect   = null;
  }

  resetFilters(): void {
    this.selectedGame = '';
    this.selectedRole = '';
    this.selectedRank = '';
    this.openSelect   = null;
    this.page = 1;
    this.loadPlayers();
  }

  resetAll(): void {
    this.resetFilters();
    this.typeFilter = 'all';
    this.searchText = '';
    this.loadPlayers();
  }

  // ── Getters (usados en template) ──────────────────────────
  get hasActiveFilters(): boolean {
    return !!(this.selectedGame || this.selectedRole || this.selectedRank);
  }

  // Sustituye .filter(Boolean) que no es accesible en templates Angular
  get activeFilterLabel(): string {
    return [this.selectedGame, this.selectedRole, this.selectedRank]
      .filter(v => !!v)
      .join(' - ');
  }

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, this.page - 2);
    const end   = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  // ── Pagination ────────────────────────────────────────────
  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadPlayers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

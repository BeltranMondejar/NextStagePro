import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';
import { AuthService } from '../../services/auth.service';
import { PlayerProfile, PlayerExperience, TeamProfile } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);
  private cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);

  profile: PlayerProfile | null = null;
  loading = true;
  saving = false;
  error = '';
  saveMsg = '';

  editingBio = false;
  editingBasic = false;
  editingGame = false;
  editingExpIdx: number | null = null;
  addingExp = false;

  draftProfile: Partial<PlayerProfile> = {};
  draftExp: Partial<PlayerExperience> = {};

  currentTeamProfile: TeamProfile | null = null;

  get isDemoMode(): boolean {
    return this.auth.demoMode();
  }

  ngOnInit(): void {
    this.playerService.getMe().subscribe({
      next: (p) => {
        this.profile = p;
        this.auth.setHeaderImage(p.avatar_url || null);
        this.loading = false;
        this.cdr.markForCheck();
        this.loadCurrentTeam();
      },
      error: () => {
        this.error = 'No se pudo cargar el perfil.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadCurrentTeam(): void {
    this.teamService.getMe().subscribe({
      next: (t) => {
        this.currentTeamProfile = t;
        this.cdr.markForCheck();
      },
      error: () => {
        this.currentTeamProfile = null;
      },
    });
  }

  startEdit(section: 'bio' | 'basic' | 'game'): void {
    this.draftProfile = { ...this.profile };
    if (section === 'bio') this.editingBio = true;
    if (section === 'basic') this.editingBasic = true;
    if (section === 'game') this.editingGame = true;
  }

  cancelEdit(section: 'bio' | 'basic' | 'game'): void {
    if (section === 'bio') this.editingBio = false;
    if (section === 'basic') this.editingBasic = false;
    if (section === 'game') this.editingGame = false;
  }

  saveSection(section: 'bio' | 'basic' | 'game'): void {
    if (this.saving) return;
    this.saving = true;
    this.saveMsg = '';

    this.playerService.updateMe(this.draftProfile).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.cancelEdit(section);
        this.saving = false;
        this.saveMsg = '¡Guardado!';
        setTimeout(() => {
          this.saveMsg = '';
          this.cdr.markForCheck();
        }, 2500);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.saveMsg = 'Error guardando. Inténtalo de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.playerService.uploadAvatar(file).subscribe((res) => {
      if (this.profile) this.profile.avatar_url = res.avatar_url;
      this.auth.setHeaderImage(res.avatar_url);
      this.cdr.markForCheck();
    });
  }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.playerService.uploadCover(file).subscribe((res) => {
      if (this.profile) this.profile.cover_url = res.cover_url;
      this.cdr.markForCheck();
    });
  }

  startAddExp(): void {
    this.draftExp = { end_date: undefined };
    this.addingExp = true;
  }

  cancelExp(): void {
    this.addingExp = false;
    this.editingExpIdx = null;
    this.draftExp = {};
  }

  saveExp(): void {
    if (!this.draftExp.team_name) return;
    this.playerService.addExperience(this.draftExp).subscribe((exp) => {
      this.profile?.experience?.unshift(exp);
      this.cancelExp();
      this.cdr.markForCheck();
    });
  }

  startEditExp(i: number): void {
    this.editingExpIdx = i;
    this.draftExp = { ...this.profile!.experience![i] };
  }

  updateExp(i: number): void {
    const id = this.profile!.experience![i].id;
    this.playerService.updateExperience(id, this.draftExp).subscribe((updated) => {
      this.profile!.experience![i] = updated;
      this.cancelExp();
      this.cdr.markForCheck();
    });
  }

  deleteExp(i: number): void {
    if (!confirm('Eliminar esta experiencia?')) return;
    const id = this.profile!.experience![i].id;
    this.playerService.deleteExperience(id).subscribe(() => {
      this.profile!.experience!.splice(i, 1);
      this.cdr.markForCheck();
    });
  }

  onHighlightAdd(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.playerService.addHighlight(file).subscribe((h) => {
      this.profile?.highlights?.push(h);
      this.cdr.markForCheck();
    });
  }

  deleteHighlight(i: number): void {
    if (!confirm('Eliminar este highlight?')) return;
    const id = this.profile!.highlights![i].id;
    this.playerService.deleteHighlight(id).subscribe(() => {
      this.profile!.highlights!.splice(i, 1);
      this.cdr.markForCheck();
    });
  }

  toggleVisibility(): void {
    if (!this.profile) return;
    const newVal = !this.profile.is_visible;
    this.playerService.updateMe({ is_visible: newVal }).subscribe((updated) => {
      if (this.profile) this.profile.is_visible = updated.is_visible;
      this.cdr.markForCheck();
    });
  }

  getAvatarUrl(): string {
    const nickname = this.profile?.nickname || this.profile?.first_name || 'Player';
    return (
      this.profile?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=3b82f6&color=fff&size=150`
    );
  }

  getCoverImage(): string | null {
    return this.profile?.cover_url || this.profile?.avatar_url || null;
  }

  /** URL del logo del equipo actual (si el jugador tiene equipo vinculado) */
  getCurrentTeamLogoUrl(): string | null {
    // Primero intentar la exp con synthetic_current_team
    const syntheticExp = this.profile?.experience?.find((e) => e.synthetic_current_team);
    if (syntheticExp?.team_logo_url) return syntheticExp.team_logo_url;
    // Luego el perfil de equipo propio
    if (this.currentTeamProfile?.logo_url) return this.currentTeamProfile.logo_url;
    return null;
  }

  getCurrentTeamName(): string {
    return this.profile?.current_team || '';
  }

  trackByExp(_: number, e: PlayerExperience): string {
    return e.id;
  }
}

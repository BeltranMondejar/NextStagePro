import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TeamService } from '../../services/team.service';
import { AuthService } from '../../services/auth.service';
import {
  TeamProfile,
  TeamCompetition,
  TeamActiveCompetition,
  TeamHighlight,
  TeamMember,
} from '../../models';

@Component({
  selector: 'app-team-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './team-profile.html',
  styleUrls: ['./team-profile.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamProfileComponent implements OnInit {
  private teamService = inject(TeamService);
  readonly auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  profile: TeamProfile | null = null;
  loading = true;
  saving = false;
  error = '';
  saveMsg = '';

  // Estados de edición
  editingBio = false;
  editingBasic = false;
  editingGame = false;

  // Competiciones
  addingComp = false;
  editingCompIdx: number | null = null;
  addingActiveComp = false;

  draftProfile: Partial<TeamProfile> = {};
  draftComp: Partial<TeamCompetition> = {};
  draftActiveComp: Partial<TeamActiveCompetition> = {};

  ngOnInit(): void {
    this.teamService.getMe().subscribe({
      next: (p) => {
        this.profile = p;
        this.auth.setHeaderImage(p.logo_url || null);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 404) {
          this.profile = null;
          this.loading = false;
          this.error = 'NO_PROFILE';
        } else {
          this.error = 'Error loading team profile.';
          this.loading = false;
        }
        this.cdr.markForCheck();
      },
    });
  }

  createProfile(): void {
    if (!this.draftProfile['name']) return;
    this.saving = true;
    this.saveMsg = '';
    this.teamService.createMe(this.draftProfile).subscribe({
      next: (p) => {
        this.profile = p;
        this.error = '';
        this.saving = false;
        this.draftProfile = {};
        this.auth.fetchMe();
        this.cdr.markForCheck();
      },
      error: () => {
        this.saveMsg = 'Error creating the profile.';
        this.saving = false;
        this.cdr.markForCheck();
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

    this.teamService.updateMe(this.draftProfile).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.cancelEdit(section);
        this.saving = false;
        this.saveMsg = 'Saved!';
        setTimeout(() => {
          this.saveMsg = '';
          this.cdr.markForCheck();
        }, 2500);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.saveMsg = 'Error saving. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.uploadLogo(file).subscribe((res) => {
      if (this.profile) this.profile.logo_url = res.logo_url;
      this.auth.fetchMe();
      this.cdr.markForCheck();
    });
  }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.uploadCover(file).subscribe((res) => {
      if (this.profile) this.profile.cover_url = res.cover_url;
      this.cdr.markForCheck();
    });
  }

  startAddComp(): void {
    this.draftComp = {};
    this.addingComp = true;
  }

  cancelComp(): void {
    this.addingComp = false;
    this.editingCompIdx = null;
    this.draftComp = {};
  }

  saveComp(): void {
    if (!this.draftComp.competition_name) return;
    this.teamService.addCompetition(this.draftComp).subscribe((comp) => {
      if (!this.profile!.competitions) this.profile!.competitions = [];
      this.profile!.competitions!.unshift(comp);
      this.cancelComp();
      this.cdr.markForCheck();
    });
  }

  startEditComp(i: number): void {
    this.editingCompIdx = i;
    this.draftComp = { ...this.profile!.competitions![i] };
  }

  updateComp(i: number): void {
    const id = this.profile!.competitions![i].id;
    this.teamService.updateCompetition(id, this.draftComp).subscribe((updated) => {
      this.profile!.competitions![i] = updated;
      this.cancelComp();
      this.cdr.markForCheck();
    });
  }

  deleteComp(i: number): void {
    if (!confirm('¿Delete this competition?')) return;
    const id = this.profile!.competitions![i].id;
    this.teamService.deleteCompetition(id).subscribe(() => {
      this.profile!.competitions!.splice(i, 1);
      this.cdr.markForCheck();
    });
  }

  startAddActiveComp(): void {
    this.draftActiveComp = {};
    this.addingActiveComp = true;
  }

  cancelActiveComp(): void {
    this.addingActiveComp = false;
    this.draftActiveComp = {};
  }

  saveActiveComp(): void {
    if (!this.draftActiveComp.competition_name) return;
    this.teamService.addActiveCompetition(this.draftActiveComp).subscribe((ac) => {
      if (!this.profile!.active_competitions) this.profile!.active_competitions = [];
      this.profile!.active_competitions!.push(ac);
      this.cancelActiveComp();
      this.cdr.markForCheck();
    });
  }

  deleteActiveComp(i: number): void {
    if (!confirm('¿Delete this active competition?')) return;
    const id = this.profile!.active_competitions![i].id;
    this.teamService.deleteActiveCompetition(id).subscribe(() => {
      this.profile!.active_competitions!.splice(i, 1);
      this.cdr.markForCheck();
    });
  }

  onHighlightAdd(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.addHighlight(file).subscribe((h) => {
      if (!this.profile!.highlights) this.profile!.highlights = [];
      this.profile!.highlights!.push(h);
      this.cdr.markForCheck();
    });
  }

  deleteHighlight(i: number): void {
    if (!confirm('¿Eliminar este highlight?')) return;
    const id = this.profile!.highlights![i].id;
    this.teamService.deleteHighlight(id).subscribe(() => {
      this.profile!.highlights!.splice(i, 1);
      this.cdr.markForCheck();
    });
  }

  toggleVisibility(): void {
    if (!this.profile || this.saving) return;

    this.saving = true;
    const newVal = !this.profile.is_visible;

    this.profile.is_visible = newVal;
    this.cdr.markForCheck();

    this.teamService.updateMe({ is_visible: newVal } as any).subscribe({
      next: () => {
        this.saving = false;
        this.saveMsg = newVal ? 'Profile visible' : 'Profile hidden';
        setTimeout(() => {
          this.saveMsg = '';
          this.cdr.markForCheck();
        }, 2000);
        this.cdr.markForCheck();
      },
      error: () => {
        this.profile!.is_visible = !newVal;
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }
  deleteTeamProfile(): void {
    if (!this.profile || this.saving) return;

    const teamName = this.profile.name.trim();
    const confirmed = confirm(
      `You are about to delete the team "${teamName}". This action will also delete competitions and highlights.`,
    );
    if (!confirmed) return;

    const typedName = prompt(
      `Second confirmation: type exactly "${teamName}" to delete the team.`,
    );
    if (typedName !== teamName) {
      this.saveMsg = 'The confirmation does not match. The team was not deleted.';
      setTimeout(() => (this.saveMsg = ''), 3000);
      return;
    }

    this.saving = true;
    this.saveMsg = '';
    this.teamService.deleteMe().subscribe({
      next: () => {
        this.profile = null;
        this.error = 'NO_PROFILE';
        this.draftProfile = {};
        this.saving = false;
        this.auth.setHeaderImage(null);
        this.auth.fetchMe();
        this.saveMsg = 'Team deleted.';
        setTimeout(() => {
          this.saveMsg = '';
          this.cdr.markForCheck();
        }, 3000);
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.saveMsg = 'Error deleting the team. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  get isPro(): boolean {
    return this.auth.isPro();
  }

  private cloudinaryTransform(url: string, transform: string): string {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  getLogoUrl(): string {
    if (this.profile?.logo_url) {
      return this.cloudinaryTransform(this.profile.logo_url, 'w_150,h_150,c_fill,f_auto,q_auto');
    }
    const name = encodeURIComponent(this.profile?.name || 'Team');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=150`;
  }

  getPlayerAvatarUrl(player: TeamMember): string {
    if (player.avatar_url) {
      return this.cloudinaryTransform(player.avatar_url, 'w_52,h_52,c_fill,f_auto,q_auto');
    }
    const nickname = encodeURIComponent(player.nickname || 'Player');
    return `https://ui-avatars.com/api/?name=${nickname}&background=3b82f6&color=fff&size=52`;
  }

  trackByComp(_: number, c: TeamCompetition): string {
    return c.id;
  }
  trackByPlayer(_: number, p: TeamMember): string {
    return p.id;
  }
  trackByHighlight(_: number, h: TeamHighlight): string {
    return h.id;
  }
  trackByActiveComp(_: number, ac: TeamActiveCompetition): string {
    return ac.id;
  }
}

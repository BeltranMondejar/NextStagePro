import { Component, OnInit, inject } from '@angular/core';
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
})
export class TeamProfileComponent implements OnInit {
  private teamService = inject(TeamService);
  readonly auth = inject(AuthService);

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
      },
      error: (err) => {
        if (err.status === 404) {
          // No tiene perfil de equipo aún — mostrar formulario de creación
          this.profile = null;
          this.loading = false;
          this.error = 'NO_PROFILE';
        } else {
          this.error = 'Error al cargar el perfil de equipo.';
          this.loading = false;
        }
      },
    });
  }

  // ── Creación inicial ─────────────────────────────────────
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
      },
      error: () => {
        this.saveMsg = 'Error creando el perfil.';
        this.saving = false;
      },
    });
  }

  // ── Edición de secciones ──────────────────────────────────
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
        this.profile = {
          ...updated,
          competitions: this.profile?.competitions,
          active_competitions: this.profile?.active_competitions,
          highlights: this.profile?.highlights,
        };
        this.cancelEdit(section);
        this.saving = false;
        this.saveMsg = '¡Guardado!';
        setTimeout(() => (this.saveMsg = ''), 2500);
      },
      error: () => {
        this.saving = false;
        this.saveMsg = 'Error guardando. Inténtalo de nuevo.';
      },
    });
  }

  // ── Imágenes ─────────────────────────────────────────────
  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.uploadLogo(file).subscribe((res) => {
      if (this.profile) this.profile.logo_url = res.logo_url;
      this.auth.fetchMe();
    });
  }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.uploadCover(file).subscribe((res) => {
      if (this.profile) this.profile.cover_url = res.cover_url;
    });
  }

  // ── Competiciones históricas ──────────────────────────────
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
    });
  }

  deleteComp(i: number): void {
    if (!confirm('¿Eliminar esta competición?')) return;
    const id = this.profile!.competitions![i].id;
    this.teamService.deleteCompetition(id).subscribe(() => {
      this.profile!.competitions!.splice(i, 1);
    });
  }

  // ── Competiciones activas ─────────────────────────────────
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
    });
  }

  deleteActiveComp(i: number): void {
    if (!confirm('¿Eliminar esta competición activa?')) return;
    const id = this.profile!.active_competitions![i].id;
    this.teamService.deleteActiveCompetition(id).subscribe(() => {
      this.profile!.active_competitions!.splice(i, 1);
    });
  }

  // ── Highlights ────────────────────────────────────────────
  onHighlightAdd(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.teamService.addHighlight(file).subscribe((h) => {
      if (!this.profile!.highlights) this.profile!.highlights = [];
      this.profile!.highlights!.push(h);
    });
  }

  deleteHighlight(i: number): void {
    if (!confirm('¿Eliminar este highlight?')) return;
    const id = this.profile!.highlights![i].id;
    this.teamService.deleteHighlight(id).subscribe(() => {
      this.profile!.highlights!.splice(i, 1);
    });
  }

  // ── Visibilidad ───────────────────────────────────────────
  toggleVisibility(): void {
    if (!this.profile) return;
    const newVal = !this.profile.is_visible;
    this.teamService.updateMe({ is_visible: newVal }).subscribe((updated) => {
      if (this.profile) this.profile.is_visible = updated.is_visible;
    });
  }

  deleteTeamProfile(): void {
    if (!this.profile || this.saving) return;

    const teamName = this.profile.name.trim();
    const confirmed = confirm(`Vas a eliminar el equipo "${teamName}". Esta acción borrará también competiciones e highlights.`);
    if (!confirmed) return;

    const typedName = prompt(`Segunda confirmación: escribe exactamente "${teamName}" para eliminar el equipo.`);
    if (typedName !== teamName) {
      this.saveMsg = 'La confirmación no coincide. No se eliminó el equipo.';
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
        this.saveMsg = 'Equipo eliminado.';
        setTimeout(() => (this.saveMsg = ''), 3000);
      },
      error: () => {
        this.saving = false;
        this.saveMsg = 'Error eliminando el equipo. Inténtalo de nuevo.';
      },
    });
  }

  get isPro(): boolean {
    return this.auth.isPro();
  }

   getLogoUrl(): string {
    if (this.profile?.logo_url) {
      return this.profile.logo_url;
    }

    const name = encodeURIComponent(this.profile?.name || 'Team');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=150`;
  }

  getPlayerAvatarUrl(player: TeamMember): string {
    if (player.avatar_url) {
      return player.avatar_url;
    }

    const nickname = encodeURIComponent(player.nickname || 'Player');
    return `https://ui-avatars.com/api/?name=${nickname}&background=3b82f6&color=fff&size=128`;
  }

}

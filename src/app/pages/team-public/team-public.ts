import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TeamService } from '../../services/team.service';
import { TeamProfile } from '../../models';

@Component({
  selector: 'app-team-public',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './team-public.html',
  styleUrls: ['./team-public.scss'],
})
export class TeamPublicComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private teamService = inject(TeamService);
  private meta = inject(Meta);
  private titleSvc = inject(Title);

  team: TeamProfile | null = null;
  loading = true;
  error = '';

  skeletonItems = Array(3).fill(0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID not valid';
      this.loading = false;
      return;
    }

    this.teamService.getById(id).subscribe({
      next: (t) => {
        this.team = t;
        this.loading = false;
        this.setMetaTags(t);
      },
      error: () => {
        this.error = 'Team profile not found or not visible.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.titleSvc.setTitle('NextStagePro');
  }

  private setMetaTags(t: TeamProfile): void {
    const description = t.bio
      ? t.bio.slice(0, 155) + (t.bio.length > 155 ? '…' : '')
      : `${t.game || 'Esports'} · ${t.location || ''} — NextStagePro.gg`.trim();
    const image = t.logo_url || 'https://nextstagepro.gg/logos/Logo_NSPro.gg_Oficial.png';

    this.titleSvc.setTitle(`${t.name} — NextStagePro.gg`);
    this.meta.updateTag({ property: 'og:title', content: `${t.name} — NextStagePro.gg` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: 'profile' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
  }

  getLogoUrl(): string {
    if (this.team?.logo_url) return this.team.logo_url;
    const name = encodeURIComponent(this.team?.name || 'T');
    return `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff&size=150`;
  }

  getPlayerAvatarUrl(player: { avatar_url?: string; nickname?: string; id: string }): string {
    if (player.avatar_url) return player.avatar_url;
    const nick = encodeURIComponent(player.nickname || 'P');
    return `https://ui-avatars.com/api/?name=${nick}&background=3b82f6&color=fff&size=80`;
  }
}

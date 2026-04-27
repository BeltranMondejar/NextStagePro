// src/app/pages/player-public/player-public.ts
// QoL:
//   - Template en archivo separado (player-public.html)
//   - Loading skeleton en lugar de texto "Cargando..."
//   - Open Graph meta tags dinámicos para preview al compartir en Discord/Twitter

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PlayerService } from '../../services/player.service';
import { PlayerProfile } from '../../models';

@Component({
  selector: 'app-player-public',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './player-public.html',
  styleUrls: ['./player-public.scss'],
})
export class PlayerPublicComponent implements OnInit, OnDestroy {
  private route         = inject(ActivatedRoute);
  private playerService = inject(PlayerService);
  private meta          = inject(Meta);
  private titleService  = inject(Title);

  player:  PlayerProfile | null = null;
  loading  = true;
  error    = '';

  // Array para los skeleton cards de highlights
  skeletonHighlights = Array(3).fill(0);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error = 'ID no válido'; this.loading = false; return; }

    this.playerService.getById(id).subscribe({
      next: p => {
        this.player  = p;
        this.loading = false;
        this.setMetaTags(p);
      },
      error: () => {
        this.error   = 'Perfil no encontrado o no visible.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    // Limpiar meta tags al salir de la página
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('name="twitter:card"');
    this.titleService.setTitle('NextStagePro');
  }

  // QoL: Open Graph / Twitter Card dinámicos para compartir en Discord, Twitter, etc.
  private setMetaTags(p: PlayerProfile): void {
    const name        = [p.first_name, `"${p.nickname}"`, p.last_name].filter(Boolean).join(' ');
    const description = p.bio
      ? p.bio.slice(0, 155) + (p.bio.length > 155 ? '…' : '')
      : `${p.game || 'Esports'} · ${p.main_role || ''} · ${p.current_rank || ''} — NextStagePro.gg`.trim();
    const image       = p.avatar_url || 'https://nextstagepro.gg/logos/Logo_NSPro.gg_Oficial.png';
    const url         = window.location.href;

    this.titleService.setTitle(`${name} — NextStagePro.gg`);

    const tags: Array<{ property: string; content: string } | { name: string; content: string }> = [
      { property: 'og:title',        content: `${name} — NextStagePro.gg` },
      { property: 'og:description',  content: description },
      { property: 'og:image',        content: image },
      { property: 'og:url',          content: url },
      { property: 'og:type',         content: 'profile' },
      { name: 'twitter:card',        content: 'summary_large_image' },
      { name: 'twitter:title',       content: `${name} — NextStagePro.gg` },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image',       content: image },
    ];

    tags.forEach(tag => {
      if ('property' in tag) {
        this.meta.updateTag({ property: tag.property, content: tag.content });
      } else {
        this.meta.updateTag({ name: tag.name, content: tag.content });
      }
    });
  }
}
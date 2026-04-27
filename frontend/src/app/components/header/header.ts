import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome, faCircleInfo, faUser, faSearch,
  faEnvelope, faBars, faTimes, faFlask,
} from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faSketch } from '@fortawesome/free-brands-svg-icons';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { PlayerService } from '../../services/player.service';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private playerService = inject(PlayerService);
  private teamService = inject(TeamService);

  faHome       = faHome;
  faCircleInfo = faCircleInfo;
  faUser       = faUser;
  faSearch     = faSearch;
  faSketch     = faSketch;
  faEnvelope   = faEnvelope;
  faDiscord    = faDiscord;
  faBars       = faBars;
  faTimes      = faTimes;
  faFlask      = faFlask;

  menuOpen     = false;
  userMenuOpen = false;

  readonly isLogged  = this.auth.isLoggedIn;
  readonly user      = this.auth.user;
  readonly demoMode  = this.auth.demoMode;
  readonly headerImageUrl = this.auth.headerImageUrl;

  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) {
        this.auth.setHeaderImage(null);
        return;
      }

      if (this.headerImageUrl()) {
        return;
      }

      if (user.account_type === 'team') {
        this.teamService.getMe().subscribe({
          next: (profile) => {
            this.auth.setHeaderImage(profile.logo_url || null);
          },
          error: () => {
            this.auth.setHeaderImage(null);
          },
        });
        return;
      }

      this.playerService.getMe().subscribe({
        next: (profile) => {
          this.auth.setHeaderImage(profile.avatar_url || null);
        },
        error: () => {
          this.auth.setHeaderImage(null);
        },
      });
    });
  }

  getHeaderAvatar(): string {
    return this.headerImageUrl() || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.user()?.email || 'User')}&background=3b82f6&color=fff&size=128`;
  }

  loginWithDiscord(): void { this.auth.loginWithDiscord(); }
  enterDemo(): void {
    this.auth.enterDemoMode();
    this.menuOpen     = false;
    this.userMenuOpen = false;
    this.router.navigate(['/profile']);
  }
  exitDemo(): void { this.auth.exitDemoMode(); }

  logout(): void {
    this.menuOpen     = false;
    this.userMenuOpen = false;
    this.auth.logout();
  }

  toggleMenu(): void     { this.menuOpen = !this.menuOpen; }
  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; }
}

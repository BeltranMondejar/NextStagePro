import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faUserPlus,
  faUsers,
  faCircleCheck,
  faCircleXmark,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ActivatedRoute } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from '../../models';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.scss'],
})
export class SubscriptionsComponent implements OnInit {
  private subService = inject(SubscriptionService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  faUser = faUser;
  faUserPlus = faUserPlus;
  faUsers = faUsers;
  faCircleCheck = faCircleCheck;
  faCircleXmark = faCircleXmark;
  faTimes = faTimes;

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly currentUser = this.auth.user;
  readonly demoMode = this.auth.demoMode;

  subscription: Subscription | null = null;
  successMessage = '';
  cancelledMessage = '';

  // Modal demo
  showDemoModal = false;
  demoSelectedPlan = '';

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('success') === 'true') {
      this.successMessage = '¡Suscripción activada correctamente! 🎉';
    }
    if (this.route.snapshot.queryParamMap.get('cancelled') === 'true') {
      this.cancelledMessage = 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.';
    }

    // En demo no llamamos al backend
    if (this.auth.isLoggedIn() && !this.auth.demoMode()) {
      this.subService.getMe().subscribe((sub) => (this.subscription = sub));
    }
  }

  choosePlan(plan: 'player_pro' | 'team_pro'): void {
    // Sin sesión, redirigir a Discord
    if (!this.auth.isLoggedIn()) {
      this.auth.loginWithDiscord();
      return;
    }

    // Usuario real con suscripción activa a portal de Stripe
    if (this.subscription?.status === 'active') {
      this.subService.openPortal();
      return;
    }

    this.subService.checkout(plan);
  }

  closeDemoModal(): void {
    this.showDemoModal = false;
  }

  loginAndCheckout(): void {
    this.auth.exitDemoMode();
    this.auth.loginWithDiscord();
  }

  manageSubscription(): void {
    this.subService.openPortal();
  }

  isCurrentPlan(plan: string): boolean {
    return this.currentUser()?.plan === plan;
  }
}

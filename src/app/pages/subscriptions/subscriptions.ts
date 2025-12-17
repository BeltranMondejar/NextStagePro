import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faUserPlus, faUsers, faCircleCheck, faCircleXmark} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.scss'] 
})
export class SubscriptionsComponent {
  faUser = faUser;
  faUserPlus = faUserPlus;
  faUsers = faUsers;
  faCircleCheck = faCircleCheck;
  faCircleXmark = faCircleXmark;
}
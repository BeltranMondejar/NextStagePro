import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-players',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-players.html',
  styleUrls: ['./search-players.scss']
})
export class PlayersComponent {

  typeFilter: 'members' | 'mentors' = 'members';

  dropdownOpen = false;

  searchText = '';

  cohorts: string[] = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Semi-Pro',
    'Professional'
  ];

  selectedCohorts: string[] = [];

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleCohort(cohort: string): void {
    if (this.selectedCohorts.includes(cohort)) {
      this.selectedCohorts = this.selectedCohorts.filter(c => c !== cohort);
    } else {
      this.selectedCohorts.push(cohort);
    }
  }
}

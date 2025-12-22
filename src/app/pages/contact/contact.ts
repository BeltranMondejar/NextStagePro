import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPhone, faEnvelope, faCopy} from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    ReactiveFormsModule
  ],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
})
export class ContactComponent {
  contactForm!: FormGroup;
  
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faCopy = faCopy;
  faDiscord = faDiscord;

  copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      discord: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  submit() {
    if (this.contactForm.valid) {
      console.log(this.contactForm.value);
    }
  }
}

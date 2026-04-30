import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPhone, faEnvelope, faCopy } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss'],
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private contact = inject(ContactService);

  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faCopy = faCopy;
  faDiscord = faDiscord;

  sending = false;
  success = false;
  error = '';

  contactForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    discord: [''],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }

  submit(): void {
    if (this.contactForm.invalid || this.sending) return;

    this.sending = true;
    this.error = '';
    this.success = false;

    const v = this.contactForm.value;

    this.contact.send({
      first_name: v.firstName,
      last_name: v.lastName,
      email: v.email,
      discord: v.discord || '',
      message: v.message,
    }).subscribe({
      next: () => {
        this.success = true;
        this.sending = false;
        this.contactForm.reset();
      },
      error: (err) => {
        console.error('EMAILJS ERROR:', err);
        this.error = 'Error enviando el mensaje';
        this.sending = false;
      }
    });
  }
}
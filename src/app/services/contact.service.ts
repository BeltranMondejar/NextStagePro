import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { from, Observable } from 'rxjs';

export interface ContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  discord?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {

  private serviceID = 'service_u36r4rf';
  private templateID = 'template_9fpx3be';
  private publicKey = 'XcnaPbpfLWa2fQy-H';

  constructor() {
    emailjs.init(this.publicKey);
  }

  send(payload: ContactPayload): Observable<any> {
    return from(
      emailjs.send(
        this.serviceID,
        this.templateID,
        {
          from_name: `${payload.first_name} ${payload.last_name}`,
          reply_to: payload.email,
          to_email: 'nextstageprogg.info@gmail.com',
          discord: payload.discord || '',
          message: payload.message,
        }
      )
    );
  }
}
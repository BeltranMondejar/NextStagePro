import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toastBus } from '../../interceptors/auth.interceptor';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        class="toast"
        *ngFor="let t of toasts"
        [class.toast-error]="t.type === 'error'"
        [class.toast-success]="t.type === 'success'"
        [class.toast-info]="t.type === 'info'"
        (click)="dismiss(t.id)"
      >
        <span class="toast-icon">
          {{ t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️' }}
        </span>
        <span class="toast-msg">{{ t.message }}</span>
        <button class="toast-close" (click)="dismiss(t.id)">✕</button>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
      }
      .toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 18px;
        border-radius: 14px;
        border: 1px solid #1e293b;
        backdrop-filter: blur(14px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        animation: slideIn 0.25s ease;
        font-size: 0.9rem;
        color: #fff;
      }
      .toast-error {
        background: rgba(239, 68, 68, 0.18);
        border-color: rgba(239, 68, 68, 0.35);
      }
      .toast-success {
        background: rgba(34, 197, 94, 0.18);
        border-color: rgba(34, 197, 94, 0.35);
      }
      .toast-info {
        background: rgba(59, 130, 246, 0.18);
        border-color: rgba(59, 130, 246, 0.35);
      }
      .toast-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .toast-msg {
        flex: 1;
        line-height: 1.4;
      }
      .toast-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 0.9rem;
        padding: 0;
        flex-shrink: 0;
      }
      .toast-close:hover {
        color: #fff;
      }
      @keyframes slideIn {
        from {
          transform: translateX(110%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @media (max-width: 480px) {
        .toast-container {
          right: 12px;
          left: 12px;
          max-width: 100%;
        }
      }
    `,
  ],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private counter = 0;
  private listener!: EventListenerOrEventListenerObject;

  ngOnInit(): void {
    this.listener = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      this.addToast(message, type);
    };
    toastBus.addEventListener('toast', this.listener);
  }

  ngOnDestroy(): void {
    toastBus.removeEventListener('toast', this.listener);
  }

  addToast(message: string, type: 'error' | 'success' | 'info' = 'error'): void {
    const id = ++this.counter;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  message: string;
  type: ToastType;
  id: number;
  duration: number;
}
@Injectable({
  providedIn: 'root'
})

export class ToastService {

  toasts: ToastItem[] = [];
  private counter = 0;

  show(message: string, type: ToastType = 'success', duration: number = 4000) {
    const toast: ToastItem = {
      id: ++this.counter,
      message,
      type,
      duration
    };

    this.toasts.push(toast);

    setTimeout(() => {
      this.remove(toast.id);
    }, duration);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  clearAll() {
    this.toasts = [];
  }
}

import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UsermanagementService } from './usermanagement.service';
import { ToastService } from './toast.service';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

/**
 * Logs the user out after 30 minutes with no mouse/keyboard/scroll/touch activity.
 * Listeners run app-wide but only act while a session is active, so public pages are unaffected.
 */
@Injectable({
  providedIn: 'root'
})
export class IdleTimeoutService {

  private lastActivity = Date.now();
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private started = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private router: Router,
    private umService: UsermanagementService,
    private toastService: ToastService
  ) {}

  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.started) {
      return;
    }
    this.started = true;
    this.lastActivity = Date.now();

    // Activity listeners fire frequently (mousemove) - keep them outside Angular's zone so they
    // don't trigger change detection on every event.
    this.ngZone.runOutsideAngular(() => {
      ACTIVITY_EVENTS.forEach(eventName => {
        document.addEventListener(eventName, this.onActivity, { passive: true });
      });
      this.checkIntervalId = setInterval(() => this.checkIdle(), CHECK_INTERVAL_MS);
    });
  }

  private onActivity = (): void => {
    this.lastActivity = Date.now();
  };

  private checkIdle(): void {
    if (!this.umService.isAuthenticated()) {
      return;
    }
    if (Date.now() - this.lastActivity >= IDLE_TIMEOUT_MS) {
      this.ngZone.run(() => this.handleIdleTimeout());
    }
  }

  private handleIdleTimeout(): void {
    // Unlike the 401 interceptor's clearSession() (used because that token may already be stale/
    // superseded), this token is still the legitimate active session - use logout() so the server
    // actually invalidates it (activeToken cleared), not just the local copy.
    this.umService.logout();
    this.lastActivity = Date.now();
    this.toastService.show('You have been logged out due to 30 minutes of inactivity.', 'info', 6000);
    this.router.navigate(['/login']);
  }
}

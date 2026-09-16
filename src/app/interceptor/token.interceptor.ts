import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { UsermanagementService } from '../service/usermanagement.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError, EMPTY } from 'rxjs';
import { ToastService } from '../service/toast.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const umService = inject(UsermanagementService);
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = umService.getToken();

  const isPublicAuthEndpoint = req.url.includes('/auth/login')
    || req.url.includes('/auth/register')
    || req.url.includes('/auth/captcha')
    || req.url.includes('/auth/publickey')
    || req.url.includes('/auth/send-otp')
    || req.url.includes('/auth/resend-otp')
    || req.url.includes('/auth/verify-otp')
    || req.url.includes('/auth/forgot-password/');
  if (isPublicAuthEndpoint) {
    // Skip adding the Authorization header - no JWT exists yet at this stage of login
    return next(req);
  }

  console.log("Inside Auth TokenInterceptor >>>> Intercept");
  //console.log("Token: ", token);
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.log("Inside Auth TokenInterceptor 401 >>>> Intercept Login");
        if (error.headers.get('X-Auth-Reason') === 'SESSION_SUPERSEDED') {
          toastService.show('You have been logged out because your account was signed in elsewhere.', 'warning', 6000);
        }
        umService.clearSession();
        router.navigate(['/login']);
        // Every request on this page is about to be irrelevant once the redirect above lands -
        // don't let a 401 reach each component's own error handler too. Before this, a session
        // expiring mid-page (or a stale token surviving a refresh) meant every component with an
        // in-flight call at that moment - dashboard data, notifications, sidebar permissions,
        // the calendar banner, etc. - independently showed its own "Failed to load X" toast, all
        // firing in the same instant the redirect happened. The redirect to /login is already
        // self-explanatory; those extra toasts were pure noise from the same one root cause.
        return EMPTY;
      }
      // Preserve the original HttpErrorResponse (status + parsed body) - callers across the app
      // read error.status/error.error to show the server's actual message; wrapping it in a
      // plain Error here discarded both, so every such handler silently saw "status unknown"
      // with no body on any non-401 failure (400/403/404/409/423/429/500/...).
      return throwError(() => error);
    })
  );
};

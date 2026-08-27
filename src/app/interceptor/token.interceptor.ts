import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { UsermanagementService } from '../service/usermanagement.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
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
    || req.url.includes('/auth/verify-otp');
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
      }
      return throwError(() => new Error(error.message));
    })
  );
};

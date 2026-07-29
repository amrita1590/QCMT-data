import { Component, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Login } from '../interface/Login';
import { Router } from '@angular/router';

const OTP_RESEND_SECONDS = 30;

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnDestroy {
    status = false;
    loginErrorMessage = 'Invalid Email or Password';
    login: Login[] = [];
    loginDetailsForm: FormGroup;

    captchaNum1 = 0;
    captchaNum2 = 0;
    captchaOperator = '+';
    captchaAnswer = 0;
    captchaInput = '';
    captchaError = false;
    captchaExpired = false;
    captchaTimer = 60;
    private captchaInterval: any = null;

    // OTP verification step - shown in place of the form after password validation succeeds
    // while authentication.otp.enabled=true on the backend; untouched when OTP is disabled.
    otpStep = false;
    sessionId = '';
    deliveryType = '';
    maskedEmail: string | null = null;
    maskedMobile: string | null = null;
    otpInput = '';
    otpError = '';
    attemptsRemaining: number | null = null;
    verifying = false;
    sendingOtp = false;
    resendTimer = 0;
    resendExpired = true;
    private resendInterval: any = null;

    constructor(private fb: FormBuilder, private umService: UsermanagementService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
      this.loginDetailsForm = this.fb.group({
        username:new FormControl('', [Validators.required]),
        password:new FormControl('', [Validators.required])
      });
      this.generateCaptcha();
    }

    generateCaptcha() {
      this.captchaNum1 = Math.floor(Math.random() * 20) + 1;
      this.captchaNum2 = Math.floor(Math.random() * 15) + 1;
      const ops = ['+', '-'];
      this.captchaOperator = ops[Math.floor(Math.random() * ops.length)];
      if (this.captchaOperator === '+') this.captchaAnswer = this.captchaNum1 + this.captchaNum2;
      else if (this.captchaOperator === '-') {
        if (this.captchaNum1 < this.captchaNum2) [this.captchaNum1, this.captchaNum2] = [this.captchaNum2, this.captchaNum1];
        this.captchaAnswer = this.captchaNum1 - this.captchaNum2;
      } else this.captchaAnswer = this.captchaNum1 * this.captchaNum2;
      this.captchaInput = '';
      this.captchaError = false;
      this.captchaExpired = false;
      this.startCaptchaTimer();
    }

    private startCaptchaTimer() {
      if (this.captchaInterval) clearInterval(this.captchaInterval);
      this.captchaTimer = 60;
      if (!isPlatformBrowser(this.platformId)) return;
      this.captchaInterval = setInterval(() => {
        this.captchaTimer--;
        if (this.captchaTimer <= 0) {
          clearInterval(this.captchaInterval);
          this.captchaExpired = true;
          this.captchaInput = '';
        }
      }, 1000);
    }

    ngOnDestroy() {
      if (this.captchaInterval) clearInterval(this.captchaInterval);
      if (this.resendInterval) clearInterval(this.resendInterval);
    }

    onLogin(login:Login) {
        if (Number(this.captchaInput) !== this.captchaAnswer) {
          this.captchaError = true;
          this.generateCaptcha();
          return;
        }
        this.captchaError = false;
        if (this.loginDetailsForm.valid) {
          this.umService.userLogin(login).subscribe({
            next: (response) => {
              if (this.umService.isOtpRequiredResponse(response)) {
                this.beginOtpStep(JSON.parse(response));
                return;
              }
              this.navigateAfterAuthSuccess(response);
            },
            error: (error) => {
              console.error('Login failed:', error);
              this.loginErrorMessage = this.resolveLoginErrorMessage(error);
              this.status = true;
              setTimeout(() => {
                this.status = false; // Hide the div after 10 seconds
              }, 10000); // 10000 milliseconds = 10 seconds
            }
          });
          this.clearFields();
        }
    }

    /**
     * /login returns 401 for bad credentials, but 502 specifically means the OTP couldn't be
     * sent on any configured channel (credentials were fine) - these need different messages
     * so the user isn't told their password is wrong when the real problem is OTP delivery.
     */
    private resolveLoginErrorMessage(error: any): string {
      if (error?.status === 502) {
        return typeof error.error === 'string' && error.error
          ? error.error
          : 'Unable to send OTP at this time. Please try again shortly.';
      }
      return 'Invalid Email or Password';
    }

    private navigateAfterAuthSuccess(response: string) {
      if (response.includes("updatepassword")) {
        this.router.navigate(['/updatepassword']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }

    private beginOtpStep(challenge: { sessionId: string; deliveryType: string; maskedEmail: string | null; maskedMobile: string | null }) {
      this.otpStep = true;
      this.sessionId = challenge.sessionId;
      this.deliveryType = challenge.deliveryType;
      this.maskedEmail = challenge.maskedEmail;
      this.maskedMobile = challenge.maskedMobile;
      this.otpInput = '';
      this.otpError = '';
      this.attemptsRemaining = null;
      this.startResendTimer(OTP_RESEND_SECONDS);
    }

    onVerifyOtp() {
      if (!this.otpInput || this.verifying) {
        return;
      }
      this.verifying = true;
      this.otpError = '';
      this.umService.verifyOtp(this.sessionId, this.otpInput).subscribe({
        next: (response) => {
          this.verifying = false;
          this.navigateAfterAuthSuccess(response);
        },
        error: (error) => {
          this.verifying = false;
          const parsed = this.parseOtpError(error);
          this.otpError = parsed.message;
          this.attemptsRemaining = parsed.attemptsRemaining;
          this.otpInput = '';
        }
      });
    }

    onResendOtp() {
      if (!this.resendExpired || this.sendingOtp) {
        return;
      }
      this.sendingOtp = true;
      this.umService.resendOtp(this.sessionId).subscribe({
        next: (response) => {
          this.sendingOtp = false;
          this.sessionId = response.sessionId;
          this.otpInput = '';
          this.otpError = '';
          this.attemptsRemaining = null;
          this.startResendTimer(response.resendIntervalSeconds || OTP_RESEND_SECONDS);
        },
        error: (error) => {
          this.sendingOtp = false;
          const parsed = this.parseOtpError(error);
          this.otpError = parsed.message;
        }
      });
    }

    backToLogin() {
      this.otpStep = false;
      if (this.resendInterval) clearInterval(this.resendInterval);
    }

    private parseOtpError(error: any): { message: string; attemptsRemaining: number | null } {
      const raw = error?.error;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.message) {
            const match = /(\d+) attempt\(s\) remaining/.exec(parsed.message);
            return { message: parsed.message, attemptsRemaining: match ? Number(match[1]) : null };
          }
        } catch {
          // Not JSON - fall through to the generic message below.
        }
      }
      return { message: 'Something went wrong. Please try again.', attemptsRemaining: null };
    }

    private startResendTimer(seconds: number) {
      if (this.resendInterval) clearInterval(this.resendInterval);
      this.resendTimer = seconds;
      this.resendExpired = false;
      if (!isPlatformBrowser(this.platformId)) return;
      this.resendInterval = setInterval(() => {
        this.resendTimer--;
        if (this.resendTimer <= 0) {
          clearInterval(this.resendInterval);
          this.resendExpired = true;
        }
      }, 1000);
    }

    ngOnInit() {
     
    }

    clearFields(): void {
      this.loginDetailsForm.reset(); // This will reset all fields to their initial values    }
    }

    get password() {
      return this.loginDetailsForm.get('password')?.value;
    }
    get username() {
      return this.loginDetailsForm.get('username')?.value;
    }
}

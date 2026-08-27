import { Component, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Login } from '../interface/Login';
import { Router } from '@angular/router';
import * as forge from 'node-forge';

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

    captchaId = '';
    captchaNum1 = 0;
    captchaNum2 = 0;
    captchaOperator = '+';
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
      // SSR-safe: the backend isn't reachable during build-time prerendering, so fetching a
      // captcha challenge here must stay browser-only like every other HTTP/localStorage call.
      if (isPlatformBrowser(this.platformId)) {
        this.generateCaptcha();
        this.fetchPublicKey();
      }
    }

    private publicKey: forge.pki.rsa.PublicKey | null = null;

    /**
     * RSA public key used to encrypt the password before it ever leaves the browser - protects
     * the password specifically even without TLS in place yet (see CLAUDE.md). This is not a
     * substitute for TLS: other request/response data is still unprotected in transit.
     *
     * Uses node-forge rather than the native window.crypto.subtle: SubtleCrypto is only
     * available in a "secure context" (HTTPS, or the special localhost/127.0.0.1 exception) -
     * it silently doesn't exist on a plain-HTTP IP address like the deployed environment here,
     * which is exactly why this worked on localhost during development but failed in
     * production ("Unable to secure your credentials right now"). node-forge does the same
     * RSA-OAEP/SHA-256 math in pure JS, with no such restriction - matches the OAEPParameterSpec
     * on the backend exactly (SHA-256 for both the main digest and MGF1).
     */
    private fetchPublicKey() {
      this.umService.getLoginPublicKey().subscribe({
        next: (response) => {
          try {
            const der = forge.util.decode64(response.publicKey);
            const asn1 = forge.asn1.fromDer(der);
            this.publicKey = forge.pki.publicKeyFromAsn1(asn1) as forge.pki.rsa.PublicKey;
          } catch (e) {
            console.error('Failed to parse login public key:', e);
          }
        },
        error: (error) => {
          console.error('Failed to load login public key:', error);
        }
      });
    }

    private encryptPassword(password: string): string {
      if (!this.publicKey) {
        throw new Error('Encryption key not ready');
      }
      const encrypted = this.publicKey.encrypt(forge.util.encodeUtf8(password), 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
      });
      return forge.util.encode64(encrypted);
    }

    /**
     * The challenge (and its answer) is issued by the backend now - /login verifies the
     * submitted answer server-side, so a script calling the API directly can't skip it the
     * way it could when the answer only ever existed in this component.
     */
    generateCaptcha() {
      this.umService.getCaptcha().subscribe({
        next: (challenge) => {
          this.captchaId = challenge.captchaId;
          this.captchaNum1 = challenge.num1;
          this.captchaNum2 = challenge.num2;
          this.captchaOperator = challenge.operator;
          this.captchaInput = '';
          this.captchaError = false;
          this.captchaExpired = false;
          this.startCaptchaTimer();
        },
        error: (error) => {
          console.error('Failed to load captcha:', error);
        }
      });
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
        // The correct answer is no longer known client-side - /login verifies it server-side.
        // This is just the same "did you fill it in" guard the disabled submit button already enforces.
        if (!this.captchaInput || this.captchaExpired) {
          this.captchaError = true;
          return;
        }
        this.captchaError = false;
        if (this.loginDetailsForm.valid) {
          let encryptedPassword: string;
          try {
            encryptedPassword = this.encryptPassword(login.password);
          } catch (e) {
            console.error('Failed to encrypt password:', e);
            this.loginErrorMessage = 'Unable to secure your credentials right now. Please refresh and try again.';
            this.status = true;
            setTimeout(() => { this.status = false; }, 10000);
            return;
          }
          this.umService.userLogin({ ...login, password: encryptedPassword }, this.captchaId, this.captchaInput).subscribe({
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
              if (error?.status === 400) {
                // Captcha was wrong/expired - a fresh challenge is required for the next attempt.
                this.generateCaptcha();
              }
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
     * /login distinguishes failure reasons by status code: 401 bad credentials, 502 OTP delivery
     * failure (credentials were fine), 400 bad/expired captcha, 423 account locked (repeated
     * failed attempts), 429 too many attempts from this network. Conflating any of these would
     * misleadingly tell the user their password is wrong when it isn't.
     */
    private resolveLoginErrorMessage(error: any): string {
      const serverMessage = typeof error?.error === 'string' && error.error ? error.error : null;
      if (error?.status === 502) {
        return serverMessage ?? 'Unable to send OTP at this time. Please try again shortly.';
      }
      if (error?.status === 400) {
        return serverMessage ?? 'Invalid or expired CAPTCHA. Please try again.';
      }
      if (error?.status === 423) {
        return serverMessage ?? 'Account is temporarily locked due to multiple failed login attempts. Please try again later.';
      }
      if (error?.status === 429) {
        return serverMessage ?? 'Too many login attempts. Please try again later.';
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

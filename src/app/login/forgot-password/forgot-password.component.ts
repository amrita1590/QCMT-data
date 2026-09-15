import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import * as forge from 'node-forge';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  step = 1;
  cisfNo = '';
  maskedMobile = '';
  mobileNumber = '';
  otp = '';
  password = '';
  confirmPassword = '';
  busy = false;
  error = '';
  notice = '';
  remaining = 0;
  showPassword = false;
  private sessionId = '';
  private resetToken = '';
  private timer?: ReturnType<typeof setInterval>;
  private readonly base = '/v1/qcmt/auth/forgot-password';
  constructor(private http: HttpClient) {}

  private async run(action: () => Promise<void>) {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.notice = '';
    try { await action(); }
    catch (error: any) { this.error = error?.error?.message || 'Unable to complete this request. Please try again.'; }
    finally { this.busy = false; }
  }

  lookup() {
    if (!/^[0-9]{1,20}$/.test(this.cisfNo.trim())) { this.error = 'Enter a valid CISF number.'; return; }
    void this.run(async () => {
      const response = await firstValueFrom(this.http.post<{ sessionId: string; maskedMobile: string }>(`${this.base}/lookup`, { cisfNo: this.cisfNo.trim() }));
      this.sessionId = response.sessionId; this.maskedMobile = response.maskedMobile; this.step = 2;
    });
  }

  sendOtp() {
    if (this.remaining > 0) return;
    if (!/^[0-9]{10}$/.test(this.mobileNumber)) { this.error = 'Enter your registered 10-digit mobile number.'; return; }
    void this.run(async () => {
      const response = await firstValueFrom(this.http.post<{ resendAfterSeconds: number }>(`${this.base}/send-otp`, { sessionId: this.sessionId, mobileNumber: this.mobileNumber }));
      this.otp = ''; this.step = 3;
      this.notice = 'OTP generated. Check the authentication server console.';
      this.startTimer(response.resendAfterSeconds);
    });
  }

  verifyOtp() {
    if (!/^\d{6}$/.test(this.otp)) { this.error = 'Enter the 6-digit OTP.'; return; }
    void this.run(async () => {
      const response = await firstValueFrom(this.http.post<{ resetToken: string }>(`${this.base}/verify-otp`, { sessionId: this.sessionId, otp: this.otp }));
      this.resetToken = response.resetToken; this.otp = ''; this.step = 4;
      clearInterval(this.timer);
    });
  }

  resetPassword() {
    if (this.password !== this.confirmPassword) { this.error = 'Passwords do not match.'; return; }
    if (this.password.length < 8 || forge.util.encodeUtf8(this.password).length > 72 || !/[A-Z]/.test(this.password) || !/[a-z]/.test(this.password) || !/[0-9]/.test(this.password) || !/[^A-Za-z0-9\s]/.test(this.password)) {
      this.error = 'Use 8–72 characters with uppercase, lowercase, a number and a special character.'; return;
    }
    void this.run(async () => {
      const response = await firstValueFrom(this.http.get<{ publicKey: string }>('/v1/qcmt/auth/publickey'));
      const key = forge.pki.publicKeyFromAsn1(forge.asn1.fromDer(forge.util.decode64(response.publicKey))) as forge.pki.rsa.PublicKey;
      const encrypt = (value: string) => forge.util.encode64(key.encrypt(forge.util.encodeUtf8(value), 'RSA-OAEP', { md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }));
      await firstValueFrom(this.http.post(`${this.base}/reset`, { sessionId: this.sessionId, resetToken: this.resetToken, password: encrypt(this.password), confirmPassword: encrypt(this.confirmPassword) }));
      this.password = ''; this.confirmPassword = ''; this.resetToken = ''; this.sessionId = ''; this.step = 5;
    });
  }

  startOver() {
    clearInterval(this.timer);
    this.step = 1; this.error = ''; this.notice = ''; this.remaining = 0;
    this.mobileNumber = '';
    this.sessionId = ''; this.resetToken = ''; this.otp = ''; this.password = ''; this.confirmPassword = '';
  }

  private startTimer(seconds: number) {
    clearInterval(this.timer);
    const deadline = Date.now() + seconds * 1000;
    this.remaining = seconds;
    this.timer = setInterval(() => {
      this.remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (!this.remaining) clearInterval(this.timer);
    }, 250);
  }
  ngOnDestroy() { clearInterval(this.timer); }
}

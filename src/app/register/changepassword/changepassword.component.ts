import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { ChangePassword} from '../../interface/ChangePassword';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SettingsComponent } from '../../settings/settings.component';

@Component({
  selector: 'app-changepassword',
  imports: [NgClass, ReactiveFormsModule, CommonModule],
  templateUrl: './changepassword.component.html',
  styleUrl: './changepassword.component.css'
})
export class ChangepasswordComponent {
  
  changePasswordForm: FormGroup;
  submitted = false;
  password: string = '';
  strength: number = 0;
  strengthLabel: string = '';
  strengthClass: string = 'bg-danger';
  changePasswordData!: ChangePassword;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  settingsComponent: SettingsComponent;

  constructor(private fb: FormBuilder, private umService: UsermanagementService, private modalService: NgbModal, settingsComponent: SettingsComponent) {
    this.settingsComponent = settingsComponent;
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$\\-_!%*?&])[A-Za-z\\d@$\\-_!%*?&]{8,}$')
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  checkStrength() {
    const pwd = this.changePasswordForm.get('newPassword')?.value;
    let score = 0;

    if (!pwd) {
      this.strength = 0;
      this.strengthLabel = '';
      this.strengthClass = 'bg-danger';
      return;
    }

    // ✅ Rules
    if (pwd.length >= 8) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[$\-_\!\%\*\?&]/.test(pwd)) score += 20;

    this.strength = score;

    if (score <= 40) {
      this.strengthLabel = 'Weak';
      this.strengthClass = 'bg-danger';
    } else if (score <= 80) {
      this.strengthLabel = 'Medium';
      this.strengthClass = 'bg-warning';
    } else {
      this.strengthLabel = 'Strong';
      this.strengthClass = 'bg-success';
    }
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get f() { return this.changePasswordForm.controls; }

  get passwordValue(): string { return this.f['newPassword'].value || ''; }
  get hasMinLength(): boolean { return this.passwordValue.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.passwordValue); }
  get hasLowercase(): boolean { return /[a-z]/.test(this.passwordValue); }
  get hasNumber(): boolean { return /[0-9]/.test(this.passwordValue); }
  get hasSpecial(): boolean { return /[$\-_!%*?&]/.test(this.passwordValue); }

  resetForm() {
    this.changePasswordForm.reset();
    this.strength = 0;
    this.strengthLabel = '';
    this.strengthClass = 'bg-danger';
    this.submitted = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  onSubmit() {
    this.submitted = true;
    if (this.changePasswordForm.invalid) return;

    if (this.changePasswordForm.get('newPassword')?.value !== this.changePasswordForm.get('confirmPassword')?.value) {
      this.settingsComponent.showToastMessage('Passwords do not match', 'error');
      return;
    }

    if (this.changePasswordForm.get('currentPassword')?.value === this.changePasswordForm.get('newPassword')?.value) {
      this.settingsComponent.showToastMessage('New password must be different from current password', 'error');
      return;
    }

    this.changePasswordData = {
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value
    };

    this.umService.updatePasswordDetails(this.changePasswordData).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.settingsComponent.showToastMessage(res.message, 'success');
          this.changePasswordForm.reset();
          this.settingsComponent.closeModel("changePasswordModal");
        } else {
          this.settingsComponent.showToastMessage(res.message, 'error');
        }
      },
      error: (err) => {
        console.error('Error occurred while changing password', err);
        if (err.error?.message) {
          this.settingsComponent.showToastMessage(err.error.message, 'error');
        } else {
          this.settingsComponent.showToastMessage('Something went wrong', 'error');
        }
      }
    });
  }
}

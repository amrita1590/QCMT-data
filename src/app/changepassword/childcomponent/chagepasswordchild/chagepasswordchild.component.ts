import { CommonModule, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangePassword } from '../../../interface/ChangePassword';
import { UsermanagementService } from '../../../service/usermanagement.service';
import { ToastService } from '../../../service/toast.service';
 
@Component({
  selector: 'app-chagepasswordchild',
  imports: [NgClass, ReactiveFormsModule, CommonModule],
  templateUrl: './chagepasswordchild.component.html',
  styleUrl: './chagepasswordchild.component.css'
})
export class ChagepasswordchildComponent {
  
  
  changePasswordForm: FormGroup;
  submitted = false;
  password: string = '';
  strength: number = 0;
  strengthLabel: string = '';
  strengthClass: string = 'bg-danger';
  changePasswordData!: ChangePassword;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private umService: UsermanagementService, private toast: ToastService) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$\\-_!%*?&])[A-Za-z\\d@$\\-_!%*?&]{8,}$')
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

  onSubmit() {
    this.submitted = true;
    if (this.changePasswordForm.invalid) return;

    if (this.changePasswordForm.get('newPassword')?.value !== this.changePasswordForm.get('confirmPassword')?.value) {
      this.toast.show('Passwords do not match', 'error');
      return;
    }

    if (this.changePasswordForm.get('currentPassword')?.value === this.changePasswordForm.get('newPassword')?.value) {
      this.toast.show('New password must be different from current password', 'error');
      return;
    }

    this.changePasswordData = {
      currentPassword: this.changePasswordForm.get('currentPassword')?.value,
      newPassword: this.changePasswordForm.get('newPassword')?.value
    };

    this.isSubmitting = true;

    this.umService.updatePasswordDetails(this.changePasswordData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Password change messageresponse:', res.message);
         console.log('Password change status response:', res.status);
        if (res.status === 'success') {
          console.log('Password change status inside status:', res.status);
          this.toast.show('Password updated successfully', 'success');
          this.resetForm();
        } else {
            console.log('Password change status inside else:', res.status);
          this.toast.show(res.message, 'error');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error occurred while changing password', err);
        if (err.error?.message) {
          this.toast.show(err.error.message, 'error');
        } else {
          this.toast.show('Something went wrong', 'error');
        }
      }
    });
  }

  resetForm(): void {
    this.changePasswordForm.reset();
    this.submitted = false;
    this.strength = 0;
    this.strengthLabel = '';
    this.strengthClass = 'bg-danger';
  }


}

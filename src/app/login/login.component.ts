import { Component, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Login } from '../interface/Login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnDestroy {
    status = false;
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
              if(response.includes("updatepassword")) {
                this.router.navigate(['/updatepassword']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            },
            error: (error) => {
              console.error('Login failed:', error);
              // Handle login error (e.g., show an error message)
              this.status = true;
              setTimeout(() => {
                this.status = false; // Hide the div after 10 seconds
              }, 10000); // 10000 milliseconds = 10 seconds
            }
          });
          this.clearFields();   
        }  
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

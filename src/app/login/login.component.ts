import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Login } from '../interface/Login';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
    status = false;
    login: Login[] = [];
    loginDetailsForm: FormGroup;
    
    constructor(private fb: FormBuilder, private umService: UsermanagementService, private router: Router) {
      this.loginDetailsForm = this.fb.group({
        username:new FormControl('', [Validators.required]),
        password:new FormControl('', [Validators.required])
      });
    }


    onLogin(login:Login) {
        // Logic to handle login
        console.log(login);
        if (this.loginDetailsForm.valid) {
          this.umService.userLogin(login).subscribe({
            next: (response) => {
              console.log('Login successful:', response);
              if(response.includes("updatepassword")) {
                this.router.navigate(['/updatepassword']); // Navigate to the second component
              } else {              
                this.router.navigate(['/dashboard']); // Navigate to the second component
                // Handle successful login (e.g., redirect to another page)
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

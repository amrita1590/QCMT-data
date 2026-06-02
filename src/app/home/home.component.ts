import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  
  loginStatus: boolean = false;
  
  constructor(private umService: UsermanagementService, private router: Router) {
      const isLoggedIn: boolean = this.umService.isAuthenticated();
      this.loginStatus = isLoggedIn;
      console.log('Login Status:::', this.loginStatus);
  }
}

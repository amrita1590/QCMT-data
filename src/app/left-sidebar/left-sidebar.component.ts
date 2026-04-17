import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UsermanagementService } from '../service/usermanagement.service';
import { Router } from '@angular/router';
import { User } from '../interface/User';
import { UserDashboard } from '../interface/UserDashboard';
import { Permissions } from '../interface/Permissions';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.css',
})
export class LeftSidebarComponent {
  
  usernameData = '';

  userDetails: User | null = null;
  permissions: Permissions[] = [];

  isLeftSidebarCollapsed = input.required<boolean>();
  changeIsLeftSidebarCollapsed = output<boolean>();
 
  constructor(private umService: UsermanagementService, private router: Router) {
      this.umService.username$.subscribe(username => {
        this.usernameData = typeof username === 'string' ? username : String(username);
      });
  }

  ngOnInit(): void {
    this.umService.getUserDetails().subscribe({
        next: (res: any) => {
          // res.body is a string!
          const parsed = JSON.parse(res.body);
          this.userDetails = parsed.userDetailsBean;
          this.permissions = parsed.permissionMasterEntity.sort((seq1: Permissions, seq2: Permissions) => seq1.sequence - seq2.sequence);
          if (this.userDetails) {
            console.log('Username:::::::', this.userDetails.username);
            this.umService.updateGlobalVar(this.userDetails.username, String(this.userDetails.id));
          }
          console.log('User Details:', this.userDetails);
          console.log('Permissions:', this.permissions);
      },
      error: (err) => console.error(err)
    });
  }
  toggleCollapse(): void {
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed());
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }

  logout() {
    // Perform logout logic here
    this.umService.logout(); // Example service
    this.router.navigate(['/login']);
  }
  
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { RbacService } from '../../service/rbac.service';
import { Role } from '../../interface/Role';
import { Permissions } from '../../interface/Permissions';

@Component({
  selector: 'app-permission-assignment',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './permission-assignment.component.html',
  styleUrl: './permission-assignment.component.css'
})
export class PermissionAssignmentComponent {
    roles: Role[] = [];
    permissions: Permissions[] = [];
    selectedRole: string = '';
    roleId: String = '';
   
    availablePermissions: Permissions[] = [];
    assignedPermissions: Permissions[] = [];

    selectedAvailable: Permissions | null = null;
    selectedAssigned: Permissions | null = null;

    errorMsg: string | null = null;
    errorStatus: boolean = false;
    successMsg: string | null = null;
    successStatus: boolean = false;
    btnName: String = "Add";

    constructor(private umService: UsermanagementService, private rbacService: RbacService) {
      
    }
    ngOnInit() {
      this.rbacService.getRoleDetails().subscribe({
        next: (data) => {
          this.roles = data;
        },
        error: (err) => {
          console.error('Failed to fetch roles', err);
        }
      });

      this.rbacService.getPermissionDetails().subscribe({
        next: (data) => {
          this.permissions = data;
          this.availablePermissions = data;
        },
        error: (err) => {
          console.error('Failed to fetch permissions', err);
        }
      });
    }

    getAssignedPermission(roleId: String) {
      this.rbacService.getAssignedPermission(roleId).subscribe({
        next: (data) => {
          this.assignedPermissions = data;

          // Clear availablePermissions before rebuilding
          this.availablePermissions = [];

          // Extract assigned permission IDs into a Set for fast lookup
          const assignedIds = new Set(this.assignedPermissions.map(p => p.id));

          // Filter available permissions by checking if they're NOT assigned
          for (let permission of this.permissions) {
            if (!assignedIds.has(permission.id)) {
              this.availablePermissions.push(permission);
            }
          }
        },
        error: (err) => {
          console.error('Failed to fetch assigned permission', err);
        }
      });
    }

    saveAssignedPermission() {
        if(this.roleId === '')  {
             this.errorMsg = "Please select role before submit.";
            this.errorStatus = true;
            setTimeout(() => {
               this.errorStatus = false; // Hide the div after 10 seconds
            }, 10000); // 10000 milliseconds = 10 seconds
            return
        }
        if (this.assignedPermissions.length>0) {
          console.log("Inside >>>> saveAssignedPermission");
          const role = this.roles.find(role => Number(role.id) === Number(this.roleId));
          if (role) {
            role.permissions = this.assignedPermissions;
          }
          this.rbacService.saveAssignedPermission(role).subscribe({
            next: (data) => {
              this.successMsg = "Permission Assigned successfully.";
              this.successStatus = true;
              setTimeout(() => {
                this.successStatus = false; // Hide the div after 10 seconds
              }, 10000); // 10000 milliseconds = 10 seconds
            },
            error: (error) => {
              console.error('Error occurred while submitting form', error);
              this.errorMsg = "Failed to add assign permission. Please try again.";
              this.errorStatus = true;
              setTimeout(() => {
                this.errorStatus = false; // Hide the div after 10 seconds
              }, 10000); // 10000 milliseconds = 10 seconds
            }
          });
      } else {
          this.errorMsg = "Atleast one permission should be assigned.";
            this.errorStatus = true;
            setTimeout(() => {
               this.errorStatus = false; // Hide the div after 10 seconds
            }, 10000); // 10000 milliseconds = 10 seconds
      }
    }

    onRoleChange(event: Event) {
      const selectElement = event.target as HTMLSelectElement;
      const selectedValue = selectElement.value;
      console.log('Selected Parent Value:', selectedValue);
      if (selectedValue !== '') {
          // Get all permission as per role id
          this.roleId = selectedValue;
          this.getAssignedPermission(this.roleId);

      } 
    }

    selectAvailable(permission: Permissions) {
      this.selectedAvailable = permission;
      this.selectedAssigned = null; // Deselect other
    }

    selectAssigned(permission: Permissions) {
      this.selectedAssigned = permission;
      this.selectedAvailable = null; // Deselect other
    }

    assignPermission() {
      if (this.selectedAvailable) {
        this.assignedPermissions.push(this.selectedAvailable);
        this.availablePermissions = this.availablePermissions.filter(p => p !== this.selectedAvailable);
        this.selectedAvailable = null;
      }
    }

    removePermission() {
      if (this.selectedAssigned) {
        this.availablePermissions.push(this.selectedAssigned);
        this.assignedPermissions = this.assignedPermissions.filter(p => p !== this.selectedAssigned);
        this.selectedAssigned = null;
      }
    }
}

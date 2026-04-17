import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { User } from '../../interface/User';
import { RbacService } from '../../service/rbac.service';
import { Role } from '../../interface/Role';

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.css'
})
export class RoleComponent {
        errorMsg: string | null = null;
        errorStatus: boolean = false;
        successMsg: string | null = null;
        successStatus: boolean = false;
        roleDetailsForm: FormGroup;
        roles: Role[] = [];
        btnName: String = "Add";

        constructor(private fb: FormBuilder, private umService: UsermanagementService, private rbacService: RbacService) {
          this.roleDetailsForm = this.fb.group({
            id : new FormControl(''),
            roleName:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(15)]),
            remarks:new FormControl(''),
          });
        }

        ngOnInit() {
          this.rbacService.currentRoleData.subscribe(data => {
            if (data) {
              this.roleDetailsForm.patchValue(data); // Assuming you use Reactive Forms
              this.btnName = "Update";
            }
          });
        }

        roleReset() {
          this.roleDetailsForm.reset();
        }

        addRole(role : Role) {
            if (this.roleDetailsForm.valid) {
              console.log("Inside >>>> form is valid");
              this.rbacService.saveRoleDetails(role).subscribe({
                next: (data) => {
                  this.successMsg = "Role added successfully.";
                  this.successStatus = true;
                  setTimeout(() => {
                    this.successStatus = false; // Hide the div after 10 seconds
                  }, 10000); // 10000 milliseconds = 10 seconds
                  this.rbacService.triggerRefresh();
                  this.roleReset();
                  this.rbacService.clearRoleData();
                  this.btnName = "Add";
                },
                error: (error) => {
                  console.error('Error occurred while submitting form', error);
                  this.errorMsg = "Failed to add role. Please try again.";
                  this.errorStatus = true;
                  setTimeout(() => {
                    this.errorStatus = false; // Hide the div after 10 seconds
                  }, 10000); // 10000 milliseconds = 10 seconds
                }
              });
            }   
        }       
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsermanagementService } from '../../service/usermanagement.service';
import { RbacService } from '../../service/rbac.service';
import { Permissions } from '../../interface/Permissions';


@Component({
  selector: 'app-permission',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css'
})
export class PermissionComponent {
  permissionForm: FormGroup;
  parentStatus: boolean = false;
  permissionDetails: Permissions[] = [];
  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;
  btnName: String = "Add";

  constructor(private fb: FormBuilder, private umService: UsermanagementService, private rbacService: RbacService) {
      this.permissionForm = this.fb.group({
      id: [''],
      permissionLabel: ['', Validators.required],
      permissionRoutelink: ['', Validators.required],
      isParent: ['', Validators.required],
      permissionIcon: [''],
      parentPermissionId: [''],      
      remark: [''],
      sequence: ['']
    });
  }

  ngOnInit() {
    this.rbacService.currentPermissionData.subscribe(data => {
      if (data) {
        this.permissionForm.patchValue(data);
        if(data.isParent == 'yes') {
          this.parentStatus = true;
          this.permissionForm.get('parentPermissionId')?.setValidators([Validators.required]);
          this.permissionForm.get('parentPermissionId')?.updateValueAndValidity();
        }
        this.btnName = "Update";
      }
    });
    this.rbacService.getPermissionDetails().subscribe({
      next: (data) => {
        this.permissionDetails = data;
      },
      error: (err) => {
        console.error('Failed to fetch classes', err);
      }
    });
  }

  onParentChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    console.log('Selected Parent Value:', selectedValue);
    if (selectedValue === 'yes') {
      // If "Yes" is selected, add validators to the child permissions
      this.parentStatus = true;
      this.permissionForm.get('parentPermissionId')?.setValidators([Validators.required]);
    } else {
      // If "No" is selected, clear validators from the child permissions
      this.parentStatus = false;
      this.permissionForm.get('parentPermissionId')?.clearValidators();
    }
    // Update the form control status
    this.permissionForm.get('parentPermissionId')?.updateValueAndValidity();
  }

  savePermission(permissionDetails: Permissions) {
    if (this.permissionForm.valid) {
        console.log("Inside >>>> form is valid");
        this.rbacService.savePermissionDetails(permissionDetails).subscribe({
          next: (data) => {
            this.successMsg = "Permission added successfully.";
            this.successStatus = true;
            setTimeout(() => {
              this.successStatus = false; // Hide the div after 10 seconds
            }, 10000); // 10000 milliseconds = 10 seconds
            this.rbacService.triggerPermissionRefresh();
            this.resetForm();
            this.btnName = "Add";
          },
          error: (error) => {
            console.error('Error occurred while submitting form', error);
            this.errorMsg = "Failed to add permission. Please try again.";
            this.errorStatus = true;
            setTimeout(() => {
              this.errorStatus = false; // Hide the div after 10 seconds
            }, 10000); // 10000 milliseconds = 10 seconds
          }
        });
    }
  }

  resetForm() {
    this.permissionForm.reset();
    this.parentStatus = false;
  }
  
}

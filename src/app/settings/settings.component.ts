import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, NgClass } from '@angular/common';
import { ChangepasswordComponent } from '../register/changepassword/changepassword.component';
import { UserprofileComponent } from '../login/userprofile/userprofile.component';
import { RoleComponent } from '../RBAC/role/role.component';
import { PermissionComponent } from "../RBAC/permission/permission.component";
import { RoledetailsComponent } from "../RBAC/role/roledetails/roledetails.component";
import { PermissiondetailsComponent } from "../RBAC/permission/permissiondetails/permissiondetails.component";
import { PermissionAssignmentComponent } from "../RBAC/permission-assignment/permission-assignment.component";
import { UserdetailsComponent } from "../login/userdetails/userdetails.component";


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, CommonModule, ChangepasswordComponent, UserprofileComponent, RoleComponent, PermissionComponent, RoledetailsComponent, PermissiondetailsComponent, PermissionAssignmentComponent, UserdetailsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;

  private modalRef: NgbModalRef | null = null;
  constructor(private modalService: NgbModal) {      
  
  }
  openChangePassword(content: any) {
    this.modalRef = this.modalService.open(content);
  }

  openUpdateProfile(content: any) {
    this.modalRef = this.modalService.open(content);
  }

  openModel(content: any) {
    this.modalRef = this.modalService.open(content);
  }

  openDetailsModel(content: any) {
    this.modalRef = this.modalService.open(content, { size : 'lg' });
  }

  closeModel(content: any) {
    content.modalRef?.close();
  }

  showToastMessage(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;

    // Show toast
    this.showToastFlag = true;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showToastFlag = false;
    }, 3000);
  }
}

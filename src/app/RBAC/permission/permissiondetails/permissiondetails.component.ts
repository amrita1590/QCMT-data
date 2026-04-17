import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permissions } from '../../../interface/Permissions';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RbacService } from '../../../service/rbac.service';
import { PermissionComponent } from "../permission.component";

@Component({
  selector: 'app-permissiondetails',
  imports: [NgFor, CommonModule, FormsModule, PermissionComponent],
  templateUrl: './permissiondetails.component.html',
  styleUrl: './permissiondetails.component.css'
})
export class PermissiondetailsComponent {
  permissions: Permissions[] = [];
  permissionName: string = "";
  permissionId: number = 0;

  private modalRef: NgbModalRef | null = null;

  constructor(private rbacService: RbacService, private modalService: NgbModal) {        
   
  }
  
  ngOnInit(): void {
    this.rbacService.refreshPermissionList$.subscribe(() => {
      this.getPermissionDetails(); // Your method to reload the list
    });
  
    this.getPermissionDetails(); // Initial load
  }

  openModal(content: any, permissionId: number, permissionName: string) {
    this.permissionName = permissionName;
    this.permissionId = permissionId;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  closeModel(content: any) {
    this.rbacService.clearPermissionData();
    this.modalService.dismissAll();
  }

  confirmDelete(permissionId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', permissionId);
      this.deletePermissionDetails(permissionId);
      this.modalRef?.close();
  }

  getPermissionDetails() {
    this.rbacService.getPermissionDetails().subscribe({
      next: (data) => {
        this.permissions = data;
        console.log('Permissions :', this.permissions);
      },
      error: (err) => {
        console.error('Failed to fetch permissions', err);
      }
    });
  }

  deletePermissionDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.rbacService.deletePermissionDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.getPermissionDetails();
      },
      error: (err) => {
        console.error('Unable to delete data ::', err);
      }
    });
  }

  editPermissionDetails(id:number, content: any) {
    console.log(":::::::::::::::::"+id);
    this.rbacService.editPermissionDetails(id).subscribe({
      next: (data) => {
        this.rbacService.setPermissionData(data);
        console.log('Permission:', data);
        this.modalService.dismissAll();
        this.modalRef = this.modalService.open(content);
      },
      error: (err) => {
        console.error('Failed to fetch Roles', err);
      }
    });
  }

  data = Array.from({ length: 100 }, (_, i) => ({
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`
  }));

  searchText = '';
  page = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  get filteredData() {
    const search = this.searchText.toLowerCase();
    return this.permissions.filter(permissions =>
      permissions.permissionLabel.toLowerCase().includes(search) || permissions.permissionRoutelink.toLowerCase().includes(search)
    );
  }
  

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const pagesToShow = 5;
    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + pagesToShow - 1);

    // Adjust start if fewer pages on the right
    if (end - start < pagesToShow - 1) {
      start = Math.max(1, end - pagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number) {
    this.page = p;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }
}

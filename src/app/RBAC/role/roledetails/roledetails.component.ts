import { Component } from '@angular/core';
import { Role } from '../../../interface/Role';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RbacService } from '../../../service/rbac.service';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleComponent } from '../role.component';

@Component({
  selector: 'app-roledetails',
  imports: [NgFor, CommonModule, FormsModule, RoleComponent],
  templateUrl: './roledetails.component.html',
  styleUrl: './roledetails.component.css'
})
export class RoledetailsComponent {
  roles: Role[] = [];
  roleName: string = "";
  roleId: number = 0;

  private modalRef: NgbModalRef | null = null;


  constructor(private rbacService: RbacService, private modalService: NgbModal) {        
   
  }
  
  ngOnInit(): void {
    this.rbacService.refreshList$.subscribe(() => {
      this.getRoleDetails(); // Your method to reload the list
    });
  
    this.getRoleDetails(); // Initial load
  }

  openModal(content: any, roleId: number, roleName: string) {
    this.roleName = roleName;
    this.roleId = roleId;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  closeModel(content: any) {
    this.rbacService.clearRoleData();
    this.modalService.dismissAll();
  }

  confirmDelete(roleId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', roleId);
      this.deleteRoleDetails(roleId);
      this.modalRef?.close();
  }

  getRoleDetails() {
    this.rbacService.getRoleDetails().subscribe({
      next: (data) => {
        this.roles = data;
        console.log('Roles:', this.roles);
      },
      error: (err) => {
        console.error('Failed to fetch roles', err);
      }
    });
  }

  deleteRoleDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.rbacService.deleteRoleDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.rbacService.triggerRefresh();
      },
      error: (err) => {
        console.error('Unable to delete data ::', err);
      }
    });
  }

  editRoleDetails(id:number, content: any) {
    console.log(":::::::::::::::::"+id);
    this.rbacService.editRoleDetails(id).subscribe({
      next: (data) => {
        this.rbacService.setRoleData(data);
        console.log('Roles:', data);
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
    return this.roles.filter(role =>
      role.roleName.toLowerCase().includes(search) || role.roleName.toLowerCase().includes(search)
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

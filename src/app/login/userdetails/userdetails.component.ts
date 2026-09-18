import { Component } from '@angular/core';
import { UsermanagementService } from '../../service/usermanagement.service';
import { User } from '../../interface/User';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role } from '../../interface/Role';
import { RbacService } from '../../service/rbac.service';
import { UserRoles } from '../../interface/UserRoles';
import { UnitDetails } from '../../interface/UnitDetails';
import { UnitService } from '../../service/unit.service';
import { UserRoleDetails } from '../../interface/UserRoleDetails';


@Component({
  selector: 'app-userdetails',
  imports: [NgFor, CommonModule, FormsModule, NgbModule],
  templateUrl: './userdetails.component.html',
  styleUrl: './userdetails.component.css'
})
export class UserdetailsComponent {
    
  userId: number | undefined | null = null;
  userDetailsList: User[] = [];  
  private modalRef: NgbModalRef | null = null;
  status = false;
  statusMsg = "";
  userData: User | null = null;

  selectedRole: number = 0;
  availableRoles: Role[] = [];
  selectedUnit: number = 0;
  selectedUnitname: string = '';
  availableUnits: UnitDetails[] = [];

  roles: Role[] = [];
  userRoles: UserRoles[] = [];

  /** userId -> assigned role names, built from /audituserlist (already joins user_roles/role_master_entity
   * server-side - avoids adding roles to the plain /userdetaillist response just for this list). */
  userRoleNamesById = new Map<number, string[]>();

  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;
  
  constructor(private umService: UsermanagementService, private rbacService: RbacService, private modalService: NgbModal, private unitService: UnitService) {
      
  }

  ngOnInit() {
    //Fetch user profile from backend if needed
    this.umService.getUserDetailList().subscribe(userData => {
      console.log("User Profiles Data:", userData);
      this.userDetailsList = userData;
    });

    this.rbacService.getRoleDetails().subscribe(roles => {
      this.availableRoles = roles;
    });   

    this.unitService.getUnitDetails().subscribe(units => {
      this.availableUnits = units;

       console.log(" Units Dataa:", this.availableUnits);

    });

    this.umService.getUserAuditDetailList().subscribe((data: UserRoleDetails[]) => {
      this.userRoleNamesById = new Map<number, string[]>();
      data.forEach(u => {
        const existing = this.userRoleNamesById.get(u.id) || [];
        existing.push(u.rolename);
        this.userRoleNamesById.set(u.id, existing);
      });
    });
  }

  /** Only users with at least one role appear in /audituserlist (inner join) - everyone else
   * falls back to "No role assigned" here. */
  getUserRoleNames(userId: number | undefined): string {
    if (!userId) return 'No role assigned';
    const names = this.userRoleNamesById.get(userId);
    return names && names.length > 0 ? names.join(', ') : 'No role assigned';
  }

  openModal(content: any, userId: number | undefined) {
    this.userId = userId;
    this.selectedRole = 0;
    this.selectedUnit = 0;
    this.selectedUnitname = '';
    this.errorStatus = false;
    this.successStatus = false;
    this.umService.getUser(this.userId!).subscribe(userData => {
      console.log("User Data for ID", this.userId, ":", userData);
      this.userData = userData;
      this.userRoles = userData.userRolesList || [];
      const assignedUnit = this.availableUnits.find(unit => Number(unit.id) === Number(userData.unitid));
      if (assignedUnit) {
        this.selectedUnit = assignedUnit.id;
        this.selectedUnitname = assignedUnit.unitName;
      }
      console.log("User Roles:", this.userRoles);
    });
    this.modalRef = this.modalService.open(content, {
      size: 'lg',
      centered: true,
      scrollable: true,
      backdrop: 'static',
      windowClass: 'user-management-modal'
    });
  }

  openDeleteModel(content: any, userId: number | undefined) {
    this.userId = userId;
    this.modalRef = this.modalService.open(content, { centered: true, backdrop: 'static', windowClass: 'confirm-delete-modal' });
  }
  assignUnit() {
    if (this.selectedUnit === 0) {
     
      return;
    }else{
      const unitToAdd = this.availableUnits.find(u => Number(u.id) === Number(this.selectedUnit));
      if (unitToAdd) {
        const alreadyAssigned = this.userData?.unitid === unitToAdd.id;
        if (alreadyAssigned) {
          this.errorMsg = 'Unit already assigned to the user.';
          this.errorStatus = true;
          setTimeout(() => {
            this.errorStatus = false;
          }, 3000);
          return;
        }else{
          this.userData!.unitid = this.selectedUnit;
          this.umService.updateUserProfileDetails(this.userData!).subscribe({
            next: (response: any) => {
              console.log('Unit assigned successfully:', response);
              this.successMsg = 'Unit assigned successfully.'; // backend message
              this.successStatus = true;
              this.selectedUnitname = unitToAdd.unitName;
              // Keep the underlying list row in sync - it's a separate array from userData
              // (the modal's own copy), so without this the table kept showing the old unit
              // until the whole list was re-fetched (e.g. page reload).
              const listEntry = this.userDetailsList.find(u => u.id === this.userId);
              if (listEntry) {
                listEntry.unitid = this.selectedUnit;
              }
            },
            error: (error) => {
              console.error('Error assigning unit:', error);
              this.errorMsg = 'Error assigning unit.';
              this.errorStatus = true;
            }
          });
          setTimeout(() => {
            this.successStatus = false;
          }, 3000);
        }
      }

    }
  }
  
  assignRole() {
    if (this.selectedRole === 0) {
      this.errorMsg = 'Please select a role to assign.';
      this.errorStatus = true;
      setTimeout(() => {
        this.errorStatus = false;
      }, 3000);
      return;
    }

    const roleToAdd = this.availableRoles.find(r => Number(r.id) === Number(this.selectedRole));
    if (roleToAdd) {
      const alreadyAssigned = this.userRoles.some(ur => ur.id === roleToAdd.id);
      if (alreadyAssigned) {
        this.errorMsg = 'Role already assigned to the user.';
        this.errorStatus = true;
        setTimeout(() => {
          this.errorStatus = false;
        }, 3000);
        return;
      }
    }

    const newUserRole: UserRoles = {
      id: roleToAdd!.id,
      roleName: roleToAdd!.roleName,
      remarks: '',
      userId: this.userId!,
      roleId: roleToAdd!.id,
      status: 'ASSIGN_ROLE'
    };
    this.umService.userManagement(newUserRole).subscribe({
      next: (response: string) => {
        console.log('Role assigned successfully:', response);
        this.successMsg = response; // backend message
        this.successStatus = true;
        this.userRoles.push(newUserRole);
        // Keep the list's Role column in sync with this modal's own change.
        const names = this.userRoleNamesById.get(this.userId!) || [];
        names.push(roleToAdd!.roleName);
        this.userRoleNamesById.set(this.userId!, names);
      },
      error: (error) => {
        console.error('Error assigning role:', error);
        this.errorMsg = 'Error assigning role.';
        this.errorStatus = true;
      }
    });
    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
  }

  deleteRole(id: number) {
    this.umService.userManagement({ id: id, userId: this.userId!, roleId: id, roleName: '', remarks: '', status: 'DELETE_ROLE' }).subscribe({
      next: (response: string) => {
        console.log('Role deleted successfully:', response);
        this.successMsg = 'Role deleted successfully.';
        this.successStatus = true;
        const removedRole = this.userRoles.find(r => r.roleId === id);
        this.userRoles = this.userRoles.filter(r => r.roleId !== id);
        // Keep the list's Role column in sync with this modal's own change.
        if (removedRole) {
          const names = (this.userRoleNamesById.get(this.userId!) || []).filter(n => n !== removedRole.roleName);
          this.userRoleNamesById.set(this.userId!, names);
        }
      },
      error: (error) => {
        console.error('Error deleting role:', error);
        this.errorMsg = 'Error deleting role.';
        this.errorStatus = true;
      }
    });

    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
  }

  activate() {
    this.umService.userManagement({ id: this.userId!, userId: this.userId!, roleId: 0, roleName: '', remarks: '', status: 'ACTIVATE' }).subscribe({
      next: (response: string) => {
        console.log('Account activated successfully:', response);
        this.successMsg = 'Account activated successfully.';
        this.successStatus = true;
        this.userData!.status = 'ACTIVE';
      },
      error: (error) => {
        console.error('Error activating account:', error);
        this.errorMsg = 'Error activating account.';
        this.errorStatus = true;
      }
    });

    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
  }

  inactivate() {
    this.umService.userManagement({ id: this.userId!, userId: this.userId!, roleId: 0, roleName: '', remarks: '', status: 'INACTIVATE' }).subscribe({
      next: (response: string) => {
        console.log('Account inactivated successfully:', response);
        this.successMsg = 'Account inactivated successfully.';
        this.successStatus = true;
        this.userData!.status = 'INACTIVE';
      },
      error: (error) => {
        console.error('Error activating account:', error);
        this.errorMsg = 'Error activating account.';
        this.errorStatus = true;
      }
    });

    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
  }


  delete() {
    this.umService.userManagement({ id: this.userId!, userId: this.userId!, roleId: 0, roleName: '', remarks: '', status: 'DELETE' }).subscribe({
      next: (response: string) => {
        console.log('Account deleted successfully:', response);
        this.successMsg = 'Account deleted successfully.';
        this.successStatus = true;
        this.userData!.status = 'DELETED';
        this.modalRef?.close();
        this.userDetailsList = this.userDetailsList.filter(u => u.id !== this.userId);
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.errorMsg = 'Error deleting account.';
        this.errorStatus = true;
      }
    });

    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
  }

  unlock() {
    this.umService.userManagement({ id: this.userId!, userId: this.userId!, roleId: 0, roleName: '', remarks: '', status: 'ACTIVATE' }).subscribe({
      next: (response: string) => {
        console.log('Account unlocked successfully:', response);
        this.successMsg = 'Account unlocked successfully.';
        this.successStatus = true;
      },
      error: (error) => {
        console.error('Error unlocking account:', error);
        this.errorMsg = 'Error unlocking account.';
        this.errorStatus = true;
      }
    });

    setTimeout(() => {
      this.successStatus = false;
    }, 3000);
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
    return this.userDetailsList.filter(user =>
      (user.mstr_name || '').toLowerCase().includes(search) || (user.email || '').toLowerCase().includes(search)
    );
  }

  /** /userdetaillist only returns unitid (no populated unitmaster.unitName), so resolve the
   * display name client-side against availableUnits - same lookup openModal() already does. */
  getUnitName(unitid: number | undefined): string {
    if (!unitid) return 'Not assigned';
    const unit = this.availableUnits.find(u => Number(u.id) === Number(unitid));
    return unit?.unitName || 'Not assigned';
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

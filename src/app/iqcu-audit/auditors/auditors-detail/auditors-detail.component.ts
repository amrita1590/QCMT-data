import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuditorDetails } from '../../../interface/auditor-details';
import { AuditorsService } from '../../../service/auditors.service';
import { UnitDetails } from '../../../interface/UnitDetails';
import { UnitService } from '../../../service/unit.service';

@Component({
  selector: 'app-auditors-detail',
  imports: [NgFor, CommonModule, FormsModule],
  templateUrl: './auditors-detail.component.html',
  styleUrl: './auditors-detail.component.css'
})
export class AuditorsDetailComponent {
 
auditors: AuditorDetails[] = [];
  name: string = "";
  rank: String = "";
  officerId: number = 0;
  unit: String = "";
  email: String = "";
  mobileno: String = "";    
  userId: number = 0;
  unitmaster: UnitDetails | null = null;
  totalAuditors:number = 0;
private modalRef: NgbModalRef | null = null;


  constructor(private auditorsService: AuditorsService, private modalService: NgbModal) {        
   
  }
ngOnInit(): void {
    this.auditorsService.refreshList$.subscribe(() => {
      this.getAuditorDetails(); // Your method to reload the list
    });
  
    this.getAuditorDetails(); // Initial load



  }

  openModal(content: any, userId: number, unit: string, name: string,rank:string, officerId:number, email:string, mobileno:string, unitDetails: UnitDetails) {
    this.unit = unit;
    this.name = name;
    this.rank = rank;
    this.officerId = officerId;
    this.email = email;
    this.mobileno = mobileno;   
    this.userId = userId;
this.unitmaster = unitDetails;
    this.modalRef = this.modalService.open(content, { centered: true });
  }
confirmDelete(userId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', userId);
      this.deleteAuditorDetails(userId);
      this.modalRef?.close();
  }

  getAuditorDetails() {
    this.auditorsService.getAuditorDetails().subscribe({
      next: (data) => {
        this.auditors = data;
        this.totalAuditors = this.auditors.length;
        console.log('Auditors:', this.auditors);
      },
      error: (err) => {
        console.error('Failed to fetch auditors', err);
      }
    });
  }

  deleteAuditorDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.auditorsService.deleteAuditorDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.auditorsService.triggerRefresh();
      },
      error: (err) => {
        console.error('Unable to delete data ::', err);
      }
    });
  }

  editAuditorDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.auditorsService.editAuditorDetails(id).subscribe({
      next: (data) => {
        this.auditorsService.setAuditorData(data);
        this.totalAuditors = this.auditors.length;
        console.log('Auditors:', data);
      },
      error: (err) => {
        console.error('Failed to fetch Auditors', err);
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
    return this.auditors.filter(user =>
      user.unitmaster?.unitName.toLowerCase().includes(search) || user.name.toLowerCase().includes(search)
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

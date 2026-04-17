import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Needed for two-way binding
import { NgFor } from '@angular/common';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UnitDetails } from '../../../interface/UnitDetails';
import { UnitService } from '../../../service/unit.service';
declare var bootstrap: any;

@Component({
  selector: 'app-unitdetails',
  imports: [NgFor, CommonModule, FormsModule],
  templateUrl: './unitdetails.component.html',
  styleUrl: './unitdetails.component.css'
})
export class UnitdetailsComponent {
  units: UnitDetails[] = [];
  unitName: string = "";
  casoId: number = 0;
  addDetails: String = "";
  userId: number = 0;

  private modalRef: NgbModalRef | null = null;


  constructor(private unitService: UnitService, private modalService: NgbModal) {        
   
  }
  
  ngOnInit(): void {
    this.unitService.refreshList$.subscribe(() => {
      this.getUnitDetails(); // Your method to reload the list
    });
  
    this.getUnitDetails(); // Initial load
  }

  openModal(content: any, userId: number, unitName: string, addDetails: string) {
    this.unitName = unitName;
    this.addDetails = addDetails;
    this.userId = userId;

    this.modalRef = this.modalService.open(content, { centered: true });
  }

  confirmDelete(userId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', userId);
      this.deleteUnitDetails(userId);
      this.modalRef?.close();
  }

  getUnitDetails() {
    this.unitService.getUnitDetails().subscribe({
      next: (data) => {
        this.units = data;
        console.log('Units:', this.units);
      },
      error: (err) => {
        console.error('Failed to fetch units', err);
      }
    });
  }

  deleteUnitDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.unitService.deleteUnitDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.unitService.triggerRefresh();
      },
      error: (err) => {
        console.error('Unable to delete data ::', err);
      }
    });
  }

  editUnitDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.unitService.editUnitDetails(id).subscribe({
      next: (data) => {
        this.unitService.setUnitData(data);
        console.log('Units:', data);
      },
      error: (err) => {
        console.error('Failed to fetch units', err);
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
    return this.units.filter(user =>
      user.unitName.toLowerCase().includes(search) || user.addDetails.toLowerCase().includes(search)
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

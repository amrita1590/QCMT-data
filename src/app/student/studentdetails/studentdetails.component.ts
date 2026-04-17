import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Needed for two-way binding
import { NgFor } from '@angular/common';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../service/student.service';
import { StudentDetails } from '../../interface/StudentDetails';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-studentdetails',
  imports: [CommonModule, FormsModule],
  templateUrl: './studentdetails.component.html',
  styleUrl: './studentdetails.component.css'
})
export class StudentdetailsComponent {
  teachers: StudentDetails[] = [];
  firstName: string = "";
  lastName: String = "";
  userId: number = 0;

  private modalRef: NgbModalRef | null = null;


  constructor(private studentService: StudentService, private modalService: NgbModal) {        
   
  }
  
  ngOnInit(): void {
    this.studentService.refreshList$.subscribe(() => {
      this.getStudentDetails(); // Your method to reload the list
    });
  
    this.getStudentDetails(); // Initial load
  }

  openModal(content: any, userId: number, firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.userId = userId;

    this.modalRef = this.modalService.open(content, { centered: true });
  }

  confirmDelete(userId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', userId);
      this.deleteStudentDetails(userId);
      this.modalRef?.close();
  }

  getStudentDetails() {
    this.studentService.getStudentDetails().subscribe({
      next: (data) => {
        this.teachers = data;
        console.log('Teachers:', this.teachers);
      },
      error: (err) => {
        console.error('Failed to fetch Teachers', err);
      }
    });
  }

  deleteStudentDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.studentService.deleteStudentDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.studentService.triggerRefresh();
      },
      error: (err) => {
        console.error('Unable to delete data ::', err);
      }
    });
  }

  editStudentDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.studentService.editStudentDetails(id).subscribe({
      next: (data) => {
        this.studentService.setStudentData(data);
        console.log('Students :', data);
      },
      error: (err) => {
        console.error('Failed to fetch students', err);
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
    return this.teachers.filter(user =>
      user.firstName.toLowerCase().includes(search) || user.lastName.toLowerCase().includes(search)
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

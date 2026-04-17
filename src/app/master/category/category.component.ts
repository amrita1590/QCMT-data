import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { CategoryDetails } from '../../interface/CategoryDetails';
import { CategoryService } from '../../service/category.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-category',
  imports: [ReactiveFormsModule, NgClass, CommonModule, FormsModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent {
  
  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;
      
  searchTerm = '';
  categoryDetailsForm: FormGroup;
  categoryDetails: CategoryDetails[] = [];
  btnName = "Submit";
  statusMsg = "";
  categoryName: string = "";
  addDetails: string = "";
  auditType:string = '';
  userId: number = 0;
  categories: CategoryDetails[] = [];

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;

  private modalRef: NgbModalRef | null = null;

  constructor(private fb: FormBuilder, private categoryService: CategoryService, private modalService: NgbModal, private toast: ToastService) {        
      this.categoryDetailsForm = this.fb.group({
        id : new FormControl(''),
        auditType:new FormControl('', [Validators.required]),        
        categoryName:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]),
        addDetails:new FormControl(''),
        status:new FormControl(true)
      });
  }

  ngOnInit(): void {
      this.categoryService.currentCategoryData.subscribe(data => {
        if (data) {
          this.categoryDetailsForm.patchValue(data); // Assuming you use Reactive Forms
          this.btnName = "Update";
        }
      });
      this.categoryService.refreshList$.subscribe(() => {
        this.getCategoryDetails(); // Your method to reload the list
      });
      this.getCategoryDetails(); // Initial load
  }

  getCategoryDetails() {
    this.categoryService.getCategoryDetails().subscribe({
      next: (data) => {
        this.categories = data.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
        console.log('Categories:', this.categories);
      },
      error: (err) => {
         this.toast.show('Failed to fetch categories'+ err, 'error');
        console.error('Failed to fetch categories', err);
      }
    });
  }

  get totalCategories() {
    return this.categories.length;
  }

  get activeCategories() {
    return this.categories.filter(c => c.status).length;
  }

  get inactiveCategories() {
    return this.categories.filter(c => !c.status).length;
  }

  toggleStatus(category: CategoryDetails) {
    category.status = !category.status;
    this.categoryService.saveCategoryDetails(category).subscribe({
        next: (data) => {
           this.toast.show('Category status changed successfully.', 'success');
          this.categoryService.triggerRefresh();
          },
          error: (error) => {
            console.error('Error occurred while change status', error);
             this.toast.show('Failed to change status', 'error');
          }
      });
  }

  openModal(content: any, userId: number, categoryName: string, addDetails: string, auditType: string) {
    this.categoryName = categoryName;
    this.addDetails = addDetails;
    this.auditType = auditType;

    this.userId = userId;

    this.modalRef = this.modalService.open(content, { centered: true });
  }

  createModal(content: any) {
    console.log(":::::::::::::::");
    this.categoryReset();
    this.categoryService.clearCategoryData();
    
    this.btnName = "Create";
    this.modalRef = this.modalService.open(content);
  }

  confirmDelete(userId: number, modalId: string) {
      // 1. perform your deletion logic
      console.log('Deleting record with id', userId);
      this.deleteCategoryDetails(userId);
      this.modalRef?.close();
  }

  getCateDetails() {
    this.categoryService.getCategoryDetails().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Categories:', this.categories);
      },
      error: (err) => {
        console.error('Failed to fetch categories', err);
      }
    });
  }

  addCategory(category : CategoryDetails) {
    if (this.categoryDetailsForm.valid) {
      console.log("Inside >>>> form is valid");
      category.status = true;
      this.categoryService.saveCategoryDetails(category).subscribe({
        next: (data) => {
          if (this.btnName === "Update") {
             this.toast.show('Category updated successfully.', 'success');
          } else {
               this.toast.show('Category added successfully.', 'success');
          }
          this.categoryService.triggerRefresh();
          this.categoryReset();
          this.categoryService.clearCategoryData();
          this.btnName = "Create";
          this.modalRef?.close();
        },
        error: (error) => {
          console.error('Error occurred while submitting form', error);
           this.toast.show('Failed to add category. Please try again.', 'error');
        }
      });
    }   
  }   
  
  categoryReset() {
    this.categoryDetailsForm.reset();
  }

  deleteCategoryDetails(id:number) {
    console.log(":::::::::::::::::"+id);
    this.categoryService.deleteCategoryDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.categoryService.triggerRefresh();
         this.toast.show('Category Deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Unable to delete category ::', err);
      }
    });
  }

  editCategoryDetails(content: any,id:number) {
    console.log(":::::::::::::::::"+id);
    const category = this.categories.find(c => c.id === id);
    if (category) {
      this.categoryDetailsForm.patchValue(category);
      this.btnName = "Update";
    }
    this.modalRef = this.modalService.open(content);
  }

  searchText = '';
  page = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  get filteredData() {
    const search = this.searchText.toLowerCase();
    return this.categories.filter(user =>
      user.categoryName.toLowerCase().includes(search)
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

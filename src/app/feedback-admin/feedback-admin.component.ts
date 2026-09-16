import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FeedbackService } from '../service/feedback.service';
import { UnitService } from '../service/unit.service';
import { UsermanagementService } from '../service/usermanagement.service';
import { ToastService } from '../service/toast.service';
import { Feedback } from '../interface/Feedback';
import { UnitDetails } from '../interface/UnitDetails';
import { User } from '../interface/User';
import { UserRoleDetails } from '../interface/UserRoleDetails';

@Component({
  selector: 'app-feedback-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback-admin.component.html',
  styleUrl: './feedback-admin.component.css'
})
export class FeedbackAdminComponent implements OnInit {

  feedbackList: Feedback[] = [];
  isLoading = false;

  units: UnitDetails[] = [];

  filterType = '';
  filterStatus = '';
  filterUnit = '';
  filterFromDate = '';
  filterToDate = '';
  dateError = '';

  loggedUser: User | null = null;
  adminList: UserRoleDetails[] = [];

  // Backend already returns submissions sorted latest-first (findAllByOrderBySubmittedAtDesc).
  page = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50];

  private modalRef: NgbModalRef | null = null;
  selectedFeedback: Feedback | null = null;
  updateStatus = '';
  updateRemarks = '';
  isUpdating = false;

  constructor(
    private feedbackService: FeedbackService,
    private unitService: UnitService,
    private umService: UsermanagementService,
    private toast: ToastService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadFeedbackList();

    this.unitService.getUnitDetails().subscribe({
      next: (data) => {
        this.units = data.sort((a, b) => a.unitName?.toLowerCase().localeCompare(b.unitName?.toLowerCase()));
      }
    });

    this.umService.getUserAuditDetailList().subscribe({
      next: data => { this.adminList = data.filter(u => u.rolename === 'ADMIN'); }
    });
    this.umService.getLoggedUserDetailList().subscribe({
      next: users => { if (users.length > 0) this.loggedUser = users[0]; }
    });
  }

  get isAdmin(): boolean {
    return this.adminList.some(u => Number(u.id) === Number(this.loggedUser?.id));
  }

  validateDateRange(): void {
    this.dateError = '';
    if (this.filterFromDate && this.filterToDate && this.filterFromDate > this.filterToDate) {
      this.dateError = 'From Date cannot be after To Date.';
    }
  }

  loadFeedbackList(): void {
    this.validateDateRange();
    if (this.dateError) return;

    this.isLoading = true;
    this.feedbackService.getFeedbackList({
      feedbackType: this.filterType,
      status: this.filterStatus,
      unitSection: this.filterUnit,
      fromDate: this.filterFromDate,
      toDate: this.filterToDate
    }).subscribe({
      next: (data) => {
        this.feedbackList = data;
        this.page = 1;
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : `Failed to load feedback submissions (status ${err?.status ?? 'unknown'}).`, 'error');
        this.isLoading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.feedbackList.length / this.pageSize) || 1;
  }

  get visiblePages(): number[] {
    const pagesToShow = 5;
    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + pagesToShow - 1);

    if (end - start < pagesToShow - 1) {
      start = Math.max(1, end - pagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number): void {
    this.page = p;
  }

  prevPage(): void {
    if (this.page > 1) this.page--;
  }

  nextPage(): void {
    if (this.page < this.totalPages) this.page++;
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStatus = '';
    this.filterUnit = '';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.dateError = '';
    this.loadFeedbackList();
  }

  openUpdateModal(feedback: Feedback, content: any): void {
    this.selectedFeedback = feedback;
    this.updateStatus = feedback.status;
    this.updateRemarks = feedback.remarks || '';
    this.modalRef = this.modalService.open(content, { size: 'lg', centered: true, backdrop: 'static' });
  }

  saveStatusUpdate(): void {
    if (!this.selectedFeedback || this.isUpdating) return;
    this.isUpdating = true;
    this.feedbackService.updateFeedbackStatus(this.selectedFeedback.id, {
      status: this.updateStatus as any,
      remarks: this.updateRemarks
    }).subscribe({
      next: () => {
        this.toast.show('Feedback status updated successfully.', 'success');
        this.isUpdating = false;
        this.modalRef?.dismiss();
        this.loadFeedbackList();
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : 'Failed to update feedback.', 'error');
        this.isUpdating = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED': return 'status-submitted';
      case 'UNDER_REVIEW': return 'status-under-review';
      case 'ACTION_TAKEN': return 'status-action-taken';
      case 'CLOSED': return 'status-closed';
      default: return '';
    }
  }

  formatStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }
}

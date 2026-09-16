import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../service/feedback.service';
import { ToastService } from '../service/toast.service';
import { Feedback } from '../interface/Feedback';

const SUBJECT_MAX_LENGTH = 150;
const DESCRIPTION_MAX_LENGTH = 2000;

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {

  subjectMaxLength = SUBJECT_MAX_LENGTH;
  descriptionMaxLength = DESCRIPTION_MAX_LENGTH;

  feedbackForm: FormGroup;
  isSubmitting = false;

  myFeedbackList: Feedback[] = [];
  isLoadingList = false;

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private toast: ToastService
  ) {
    this.feedbackForm = this.fb.group({
      feedbackType: ['', Validators.required],
      subject: ['', [Validators.required, Validators.maxLength(SUBJECT_MAX_LENGTH)]],
      description: ['', [Validators.required, Validators.maxLength(DESCRIPTION_MAX_LENGTH)]]
    });
  }

  ngOnInit(): void {
    this.loadMyFeedback();
  }

  invalid(field: string): boolean {
    const control = this.feedbackForm.get(field);
    return !!(control?.invalid && control.touched);
  }

  get subject() { return this.feedbackForm.get('subject'); }
  get description() { return this.feedbackForm.get('description'); }

  loadMyFeedback(): void {
    this.isLoadingList = true;
    this.feedbackService.getMyFeedbackList().subscribe({
      next: (data) => {
        this.myFeedbackList = data;
        this.isLoadingList = false;
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : `Failed to load your submissions (status ${err?.status ?? 'unknown'}).`, 'error');
        this.isLoadingList = false;
      }
    });
  }

  submitFeedback(): void {
    this.feedbackForm.markAllAsTouched();
    if (this.feedbackForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.feedbackService.submitFeedback(this.feedbackForm.value).subscribe({
      next: (message) => {
        this.toast.show(
          typeof message === 'string' && message
            ? message
            : 'Your suggestion/feedback has been submitted successfully. Thank you for helping us improve e-SamikSha.',
          'success',
          6000
        );
        this.isSubmitting = false;
        this.resetForm();
        this.loadMyFeedback();
      },
      error: (err) => {
        this.toast.show(typeof err?.error === 'string' ? err.error : 'Failed to submit feedback.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.feedbackForm.reset({ feedbackType: '', subject: '', description: '' });
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

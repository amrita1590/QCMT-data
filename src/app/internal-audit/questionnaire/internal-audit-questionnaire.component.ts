import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-questionnaire',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './internal-audit-questionnaire.component.html'
})
export class InternalAuditQuestionnaireComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input({ required: true }) questionnaireForm!: FormGroup;
  @Output() saveQuestionnaire = new EventEmitter<void>();

  constructor(private fb: FormBuilder) {}

  get questions(): FormArray {
    return this.questionnaireForm.get('questions') as FormArray;
  }

  addQuestion(): void {
    this.questions.push(this.fb.group({
      category: ['', Validators.required],
      question: ['', Validators.required],
      benchmark: [''],
      status: ['Active']
    }));
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }
}

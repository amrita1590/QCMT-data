import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-unit-response',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './internal-audit-unit-response.component.html'
})
export class InternalAuditUnitResponseComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input({ required: true }) responseForm!: FormGroup;
  @Output() submitResponse = new EventEmitter<void>();

  get responses(): FormArray {
    return this.responseForm.get('responses') as FormArray;
  }
}

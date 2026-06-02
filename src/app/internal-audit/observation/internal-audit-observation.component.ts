import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-observation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './internal-audit-observation.component.html',
  styleUrls: ['./internal-audit-observation.component.css']
})
export class InternalAuditObservationComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input({ required: true }) observationForm!: FormGroup;
  @Output() saveObservations = new EventEmitter<void>();

  readonly observationTypes = ['Critical', 'Moderate', 'Non-Critical'];
  readonly observationStatuses = ['Pending', 'Compliant', 'Non-Compliant', 'Dropped'];

  constructor(private fb: FormBuilder) {}

  get observations(): FormArray {
    return this.observationForm.get('observations') as FormArray;
  }

  addObservation(): void {
    this.observations.push(this.createObservationRow(this.observations.length + 1));
  }

  removeObservation(index: number): void {
    if (this.observations.length > 1) {
      this.observations.removeAt(index);
      this.observations.controls.forEach((control, rowIndex) => control.patchValue({ slNo: rowIndex + 1 }));
    }
  }

  private createObservationRow(slNo: number): FormGroup {
    return this.fb.group({
      slNo: [slNo, Validators.required],
      observation: ['', Validators.required],
      remarks: [''],
      type: ['Moderate', Validators.required],
      status: ['Pending', Validators.required]
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InternalAuditObservation, InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './internal-audit-compliance.component.html'
})
export class InternalAuditComplianceComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input() selectedObservation?: InternalAuditObservation;
  @Input() selectedObservationId: number | null = null;
  @Input({ required: true }) complianceForm!: FormGroup;
  @Output() observationSelected = new EventEmitter<number>();
  @Output() submitCompliance = new EventEmitter<void>();
}

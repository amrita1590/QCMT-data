import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InternalAuditUnit } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-schedule',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './internal-audit-schedule.component.html'
})
export class InternalAuditScheduleComponent {
  @Input({ required: true }) auditForm!: FormGroup;
  @Input({ required: true }) units: InternalAuditUnit[] = [];
  @Output() saveAudit = new EventEmitter<void>();
}

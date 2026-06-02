import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './internal-audit-report.component.html'
})
export class InternalAuditReportComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input({ required: true }) reportForm!: FormGroup;
  @Output() reportFilesSelected = new EventEmitter<Event>();
  @Output() submitReport = new EventEmitter<void>();
}

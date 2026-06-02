import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { InternalAuditSchedule } from '../internal-audit.model';

@Component({
  selector: 'app-internal-audit-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './internal-audit-summary.component.html'
})
export class InternalAuditSummaryComponent {
  @Input() audit?: InternalAuditSchedule;
  @Input({ required: true }) statusBadge!: Record<string, string>;
}

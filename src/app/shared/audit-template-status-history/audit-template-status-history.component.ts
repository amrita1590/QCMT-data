import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { AuditTemplateStatusHistory } from '../../interface/AuditTemplateStatusHistory';
import { AuditscheduleserviceService } from '../../service/auditscheduleservice.service';

@Component({
  selector: 'app-audit-template-status-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-template-status-history.component.html',
  styleUrl: './audit-template-status-history.component.css'
})
export class AuditTemplateStatusHistoryComponent implements OnChanges {
  @Input() auditId: number | null | undefined;
  expanded = false;
  loading = false;
  error = false;
  events: AuditTemplateStatusHistory[] = [];

  constructor(private audits: AuditscheduleserviceService) {}

  /** Rank + Name + Unit, space-separated - rank/unit are a write-time snapshot only present on
   * entries recorded after this feature shipped, so older entries fall back to just the name. */
  changedByLabel(event: AuditTemplateStatusHistory): string {
    const parts = [event.changedByRank, event.changedByName, event.changedByUnit]
      .map(p => (p || '').trim())
      .filter(p => p.length > 0);
    return parts.length > 0 ? parts.join(' ') : (event.changedByName || 'System');
  }

  ngOnChanges(): void {
    this.events = [];
    this.error = false;
    this.expanded = false;
    if (!this.auditId) return;
    this.loading = true;
    this.audits.getAuditTemplateStatusHistory(this.auditId).subscribe({
      next: events => { this.events = events; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }
}

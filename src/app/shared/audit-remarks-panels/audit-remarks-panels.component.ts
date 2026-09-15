import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AuditorRemarktoCASO } from '../../interface/AuditorRemarktoCASO';

@Component({
  selector: 'app-audit-remarks-panels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-remarks-panels.component.html',
  styleUrl: './audit-remarks-panels.component.css'
})
export class AuditRemarksPanelsComponent {
  @Input() remarks: AuditorRemarktoCASO[] = [];

  expanded: Record<'ZONE' | 'SECTOR' | 'AUDITOR', boolean> = {
    ZONE: true,
    SECTOR: true,
    AUDITOR: true
  };

  get zoneRemarks(): AuditorRemarktoCASO[] {
    return this.remarks.filter(remark => remark.remarkSource === 'ZONE');
  }

  get sectorRemarks(): AuditorRemarktoCASO[] {
    return this.remarks.filter(remark => remark.remarkSource === 'SECTOR');
  }

  get auditorRemarks(): AuditorRemarktoCASO[] {
    return this.remarks.filter(remark => remark.remarkSource !== 'ZONE' && remark.remarkSource !== 'SECTOR');
  }

  toggle(source: 'ZONE' | 'SECTOR' | 'AUDITOR'): void {
    this.expanded[source] = !this.expanded[source];
  }
}

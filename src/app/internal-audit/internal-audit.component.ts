import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InternalAuditRecord, InternalAuditFile } from '../interface/InternalAuditRecord';
import { UnitDetails } from '../interface/UnitDetails';
import { User } from '../interface/User';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { InternalAuditService } from '../service/internal-audit.service';
import { UnitService } from '../service/unit.service';
import { UsermanagementService } from '../service/usermanagement.service';
import { ToastService } from '../service/toast.service';

@Component({
  selector: 'app-internal-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './internal-audit.component.html',
  styleUrl: './internal-audit.component.css'
})
export class InternalAuditComponent implements OnInit {

  audits: InternalAuditRecord[] = [];
  units: UnitDetails[] = [];
  auditorList: UserRoleDetails[] = [];
  allUserList: UserRoleDetails[] = [];
  loggedUser: User | null = null;

  // ── role detection ───────────────────────────────────────────────────────────
  get isAuditor(): boolean {
    return this.auditorList.some(u => Number(u.id) === Number(this.loggedUser?.id));
  }

  get isIgDig(): boolean {
    const unit = this.units.find(u => Number(u.id) === Number(this.loggedUser?.unitid));
    return unit?.unitType === 'Zone' || unit?.unitType === 'Sector';
  }

  // ── filtered lists ───────────────────────────────────────────────────────────
  get auditorInboxAudits(): InternalAuditRecord[] {
    return this.audits.filter(
      a => a.status === 'Auditor Bucket' && Number(a.auditorId) === Number(this.loggedUser?.id)
    );
  }

  get igDigInboxAudits(): InternalAuditRecord[] {
    return this.audits.filter(
      a => a.status === 'IG/DIG Bucket' && Number(a.igUserId) === Number(this.loggedUser?.id)
    );
  }

  // ── display helpers ──────────────────────────────────────────────────────────
  formatMonth(ym: string): string {
    if (!ym) return '—';
    const [yr, mo] = ym.split('-');
    return new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  // ── auditor: submit report ───────────────────────────────────────────────────
  actionAudit: InternalAuditRecord | null = null;
  reportFiles: File[] = [];
  reportRemarks = '';
  isSubmittingReport = false;

  openSubmitReportModal(audit: InternalAuditRecord, content: any) {
    this.actionAudit    = audit;
    this.reportFiles    = [];
    this.reportRemarks  = '';
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  onReportFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    Array.from(input.files ?? []).forEach(f => {
      const ext = f.name.toLowerCase();
      if (!ext.endsWith('.pdf') && !ext.endsWith('.doc') && !ext.endsWith('.docx')) return;
      if (!this.reportFiles.some(e => e.name === f.name)) this.reportFiles.push(f);
    });
    input.value = '';
  }
  removeReportFile(i: number) { this.reportFiles.splice(i, 1); }

  viewFile(file: InternalAuditFile) {
    if (!file.filePath) { this.toast.show('File path not available.', 'error'); return; }
    this.internalAuditService.getInternalAuditFile(file.filePath).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        if (file.name.toLowerCase().endsWith('.pdf')) {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url; a.download = file.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      },
      error: () => this.toast.show('Failed to open file.', 'error')
    });
  }

  submitAuditorReport() {
    if (!this.actionAudit?.id) return;
    if (this.reportFiles.length === 0) {
      this.toast.show('Please attach at least one report file.', 'error'); return;
    }
    this.isSubmittingReport = true;
    const fd = new FormData();
    fd.append('auditId',    String(this.actionAudit.id));
    fd.append('uploadedBy', this.loggedUser?.mstr_name ?? 'Auditor');
    this.reportFiles.forEach(f => fd.append('files', f, f.name));
    this.internalAuditService.submitAuditReport(this.actionAudit.id, fd).subscribe({
      next: () => {
        this.isSubmittingReport = false;
        this.modalService.dismissAll();
        this.loadAudits();
        this.toast.show('Report submitted. Audit moved to CASO Bucket.', 'success');
      },
      error: (err: any) => {
        this.isSubmittingReport = false;
        this.toast.show('Error: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

  // ── IG/DIG: request compliance ───────────────────────────────────────────────
  complianceRemarks = '';
  isRequestingCompliance = false;

  openRequestComplianceModal(audit: InternalAuditRecord, content: any) {
    this.actionAudit       = audit;
    this.complianceRemarks = '';
    this.modalService.open(content, { size: 'md', backdrop: 'static' });
  }

  requestCompliance() {
    if (!this.actionAudit?.id) return;
    this.isRequestingCompliance = true;
    this.internalAuditService.requestCompliance(this.actionAudit.id, this.complianceRemarks).subscribe({
      next: () => {
        this.isRequestingCompliance = false;
        this.modalService.dismissAll();
        this.loadAudits();
        this.toast.show('Compliance requested. Audit moved to CASO Bucket.', 'success');
      },
      error: (err: any) => {
        this.isRequestingCompliance = false;
        this.toast.show('Error: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

  // ── summary modal ────────────────────────────────────────────────────────────
  selectedSummary: InternalAuditRecord | null = null;

  openSummaryModal(audit: InternalAuditRecord, content: any) {
    this.selectedSummary = audit;
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  // ── lifecycle ────────────────────────────────────────────────────────────────
  constructor(
    private internalAuditService: InternalAuditService,
    private unitService: UnitService,
    private umService: UsermanagementService,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadAudits();
    this.unitService.getUnitDetails().subscribe({ next: d => this.units = d });
    this.umService.getUserAuditDetailList().subscribe({
      next: data => {
        this.auditorList = data.filter(u => u.rolename === 'Auditor');
        this.allUserList = data;
      }
    });
    this.umService.getLoggedUserDetailList().subscribe({
      next: users => { if (users.length > 0) this.loggedUser = users[0]; }
    });
  }

  loadAudits() {
    this.internalAuditService.getInternalAudits().subscribe({
      next: data => this.audits = data.sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
      error: () => this.toast.show('Failed to load audits.', 'error')
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BcasAuditRecord } from '../interface/BcasAuditRecord';
import { IcaoAuditRecord } from '../interface/IcaoAuditRecord';
import { InternalAuditSchedule } from '../internal-audit/internal-audit.model';
import { BcasAuditService } from '../service/bcas-audit.service';
import { IcaoService } from '../service/icao.service';
import { InternalAuditService } from '../service/internal-audit.service';
import { ToastService } from '../service/toast.service';

type TabType = 'BCAS' | 'Internal' | 'ICAO' | 'All';

export interface ObsCompliance {
  observationId?: number;
  complianceStatus: 'Compliant' | 'Dropped' | '';
  complianceRemark: string;
}

export interface UnifiedResult {
  auditType: 'BCAS' | 'ICAO' | 'Internal';
  displayName: string;
  unit: string;
  date: string;
  status: string;
  original: BcasAuditRecord | IcaoAuditRecord | InternalAuditSchedule;
}

@Component({
  selector: 'app-otherauditapshqrsdesk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otherauditapshqrsdesk.component.html',
  styleUrl: './otherauditapshqrsdesk.component.css'
})
export class OtherauditapshqrsdeskComponent implements OnInit {

  activeTab: TabType = 'BCAS';

  bcasAudits:     BcasAuditRecord[]       = [];
  internalAudits: InternalAuditSchedule[] = [];
  icaoAudits:     IcaoAuditRecord[]       = [];

  readonly currentYear = new Date().getFullYear();

  bcasSearch     = '';
  internalSearch = '';
  icaoSearch     = '';

  // Search All filters
  allSearch    = '';
  allFromDate  = '';
  allToDate    = '';
  allAuditType: '' | 'BCAS' | 'ICAO' | 'Internal' = '';
  allUnit      = '';

  // Search results — populated only when Search button is clicked
  searchResults: UnifiedResult[] = [];
  hasSearched   = false;

  bcasPage     = 1;
  internalPage = 1;
  icaoPage     = 1;
  allPage      = 1;
  pageSize     = 10;
  pageSizeOptions = [5, 10, 20, 50];

  isLoading    = false;
  isSubmitting = false;

  selectedBcas:     BcasAuditRecord | null       = null;
  selectedInternal: InternalAuditSchedule | null = null;
  selectedIcao:     IcaoAuditRecord | null       = null;

  obsCompliances: ObsCompliance[] = [];

  // ── Compliance save/send state ────────────────────────────────
  @ViewChild('sendToCasoModal') sendToCasoTpl!: TemplateRef<any>;
  isSavingCompliance  = false;
  sendToCasoLetterNo   = '';
  sendToCasoLetterDate = '';
  sendToCasoFiles: File[] = [];
  sendToCasoConfirmed  = false;
  isSendingToCaso      = false;

  // ── File viewer state ─────────────────────────────────────────
  viewingFile:    { fileName: string; filePath: string } | null = null;
  viewingFileUrl: SafeResourceUrl | null = null;
  private currentBlobUrl: string | null = null;

  constructor(
    private bcasService:     BcasAuditService,
    private icaoService:     IcaoService,
    private internalService: InternalAuditService,
    private modalService:    NgbModal,
    private toast:           ToastService,
    private sanitizer:       DomSanitizer
  ) {}

  ngOnInit() { this.loadAll(); }

  setTab(tab: TabType) { this.activeTab = tab; }

  loadAll() {
    this.isLoading = true;
    this._done = 0;
    this.bcasService.getBcasAudits().subscribe({
      next:  data => { this.bcasAudits = data; this.checkDone(); },
      error: ()   => { this.toast.show('Failed to load BCAS audits.', 'error'); this.checkDone(); }
    });
    this.icaoService.getIcaoAudits().subscribe({
      next:  data => { this.icaoAudits = data; this.checkDone(); },
      error: ()   => { this.toast.show('Failed to load ICAO audits.', 'error'); this.checkDone(); }
    });
    this.internalService.getInternalAudits().subscribe({
      next:  data => { this.internalAudits = data; this.checkDone(); },
      error: ()   => { this.toast.show('Failed to load Internal audits.', 'error'); this.checkDone(); }
    });
  }

  private _done = 0;
  private checkDone() { if (++this._done >= 3) this.isLoading = false; }

  // ── Year filter helper ────────────────────────────────────────
  private isCurrentYear(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).getFullYear() === this.currentYear;
  }

  // ── Year-filtered base arrays (used by totals + filtered getters)
  get yearBcas()     { return this.bcasAudits.filter(a => this.isCurrentYear(a.createdAt)); }
  get yearIcao()     { return this.icaoAudits.filter(a => this.isCurrentYear(a.createdAt)); }
  get yearInternal() { return this.internalAudits.filter(a => this.isCurrentYear(a.auditFromDate)); }

  // ── Totals (current year only) ────────────────────────────────
  get bcasTotal()    { return this.yearBcas.length; }
  get internalTotal(){ return this.yearInternal.length; }
  get icaoTotal()    { return this.yearIcao.length; }
  get grandTotal()   { return this.bcasTotal + this.internalTotal + this.icaoTotal; }

  // ── Filtered lists (year-scoped + tab search) ─────────────────
  get filteredBcas() {
    const q = this.bcasSearch.toLowerCase().trim();
    if (!q) return this.yearBcas;
    return this.yearBcas.filter(a =>
      a.auditName?.toLowerCase().includes(q) ||
      a.unitName?.toLowerCase().includes(q)  ||
      a.casoName?.toLowerCase().includes(q)  ||
      a.createdBy?.toLowerCase().includes(q) ||
      a.auditMonth?.includes(q)
    );
  }

  get filteredInternal() {
    const q = this.internalSearch.toLowerCase().trim();
    if (!q) return this.yearInternal;
    return this.yearInternal.filter(a =>
      a.auditRefNo?.toLowerCase().includes(q)     ||
      a.unit.unitName?.toLowerCase().includes(q)  ||
      a.auditorName?.toLowerCase().includes(q)    ||
      a.auditFromDate?.includes(q)
    );
  }

  get filteredIcao() {
    const q = this.icaoSearch.toLowerCase().trim();
    if (!q) return this.yearIcao;
    return this.yearIcao.filter(a =>
      a.auditName?.toLowerCase().includes(q) ||
      a.unitName?.toLowerCase().includes(q)  ||
      a.casoName?.toLowerCase().includes(q)  ||
      a.createdBy?.toLowerCase().includes(q) ||
      a.auditMonth?.includes(q)
    );
  }

  clearAllFilters() {
    this.allSearch     = '';
    this.allFromDate   = '';
    this.allToDate     = '';
    this.allAuditType  = '';
    this.allUnit       = '';
    this.allPage       = 1;
    this.searchResults = [];
    this.hasSearched   = false;
  }

  // ── Run search — called by Search button ──────────────────────
  runSearch() {
    if (!this.allFromDate || !this.allToDate) {
      this.toast.show('Please select From Date and To Date before searching.', 'error');
      return;
    }

    const from = new Date(this.allFromDate + 'T00:00:00').getTime();
    const to   = new Date(this.allToDate   + 'T23:59:59').getTime();
    const type = this.allAuditType;
    const q    = this.allSearch.toLowerCase().trim();
    const u    = this.allUnit.toLowerCase().trim();

    const inRange = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr).getTime();
      return d >= from && d <= to;
    };

    const results: UnifiedResult[] = [];

    if (!type || type === 'BCAS') {
      this.bcasAudits.filter(a => inRange(a.createdAt)).forEach(a =>
        results.push({ auditType: 'BCAS', displayName: a.auditName, unit: a.unitName,
                       date: a.createdAt ?? '', status: a.status, original: a }));
    }
    if (!type || type === 'ICAO') {
      this.icaoAudits.filter(a => inRange(a.createdAt)).forEach(a =>
        results.push({ auditType: 'ICAO', displayName: a.auditName, unit: a.unitName,
                       date: a.createdAt ?? '', status: a.status, original: a }));
    }
    if (!type || type === 'Internal') {
      this.internalAudits.filter(a => inRange(a.auditFromDate)).forEach(a =>
        results.push({ auditType: 'Internal', displayName: a.auditRefNo, unit: a.unit.unitName,
                       date: a.auditFromDate, status: a.status, original: a }));
    }

    results.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());

    this.searchResults = results.filter(r => {
      const matchQ = !q ||
        r.displayName?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)      ||
        r.auditType.toLowerCase().includes(q);
      const matchU = !u || r.unit?.toLowerCase().includes(u);
      return matchQ && matchU;
    });

    this.hasSearched = true;
    this.allPage     = 1;
  }

  // ── Paged slices ──────────────────────────────────────────────
  pagedBcas()     { const s = (this.bcasPage - 1)     * this.pageSize; return this.filteredBcas.slice(s, s + this.pageSize); }
  pagedInternal() { const s = (this.internalPage - 1) * this.pageSize; return this.filteredInternal.slice(s, s + this.pageSize); }
  pagedIcao()     { const s = (this.icaoPage - 1)     * this.pageSize; return this.filteredIcao.slice(s, s + this.pageSize); }
  pagedAll()      { const s = (this.allPage - 1)      * this.pageSize; return this.searchResults.slice(s, s + this.pageSize); }

  bcasTotalPages()    { return Math.max(1, Math.ceil(this.filteredBcas.length     / this.pageSize)); }
  internalTotalPages(){ return Math.max(1, Math.ceil(this.filteredInternal.length / this.pageSize)); }
  icaoTotalPages()    { return Math.max(1, Math.ceil(this.filteredIcao.length     / this.pageSize)); }
  allTotalPages()     { return Math.max(1, Math.ceil(this.searchResults.length    / this.pageSize)); }

  visiblePageNums(currentPage: number, totalPages: number): number[] {
    const show = 5, half = Math.floor(show / 2);
    let start = Math.max(1, currentPage - half);
    let end   = Math.min(totalPages, start + show - 1);
    if (end - start < show - 1) start = Math.max(1, end - show + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  endItem(page: number, total: number): number {
    return Math.min(page * this.pageSize, total);
  }

  // ── View modals ───────────────────────────────────────────────
  viewBcas(audit: BcasAuditRecord, tpl: any) {
    this.selectedBcas = audit;
    this.obsCompliances = (audit.observations ?? []).map(o => ({
      observationId: o.id,
      complianceStatus: (o.currentStatus === 'Compliant' || o.currentStatus === 'Dropped')
                          ? (o.currentStatus as 'Compliant' | 'Dropped')
                          : '' as '',
      complianceRemark: o.complianceRemark ?? ''
    }));
    this.modalService.open(tpl, { size: 'xl', scrollable: true, backdrop: 'static' });
  }

  viewInternal(audit: InternalAuditSchedule, tpl: any) {
    this.selectedInternal = audit;
    this.modalService.open(tpl, { size: 'lg', scrollable: true, backdrop: 'static' });
  }

  viewIcao(audit: IcaoAuditRecord, tpl: any) {
    this.selectedIcao = audit;
    this.modalService.open(tpl, { size: 'lg', scrollable: true, backdrop: 'static' });
  }

  // Opens the correct modal from the "All" tab
  openFromAll(
    r: UnifiedResult,
    bcasTpl: any, internalTpl: any, icaoTpl: any
  ) {
    if (r.auditType === 'BCAS')     this.viewBcas(r.original as BcasAuditRecord, bcasTpl);
    if (r.auditType === 'ICAO')     this.viewIcao(r.original as IcaoAuditRecord, icaoTpl);
    if (r.auditType === 'Internal') this.viewInternal(r.original as InternalAuditSchedule, internalTpl);
  }

  setComplianceStatus(idx: number, status: 'Compliant' | 'Dropped') {
    this.obsCompliances[idx].complianceStatus =
      this.obsCompliances[idx].complianceStatus === status ? '' : status;
  }

  clearComplianceStatus(idx: number) {
    this.obsCompliances[idx].complianceStatus = '';
  }

  // Number of observations APS has marked in this round
  get markedCount(): number {
    return this.obsCompliances.filter(c => c.complianceStatus !== '').length;
  }

  saveComplianceDraft() {
    if (!this.selectedBcas?.id) return;

    const missing = this.obsCompliances
      .map((c, i) => ({ c, i }))
      .filter(x => x.c.complianceStatus === '' && x.c.complianceRemark.trim() === '');

    if (missing.length > 0) {
      const nums = missing.map(x => `#${x.i + 1}`).join(', ');
      this.toast.show(
        `Fill remark or mark Compliant/Dropped for observation(s) ${nums} before saving.`,
        'error'
      );
      return;
    }

    this.isSavingCompliance = true;
    this.bcasService.saveComplianceDraft(this.selectedBcas.id, this.obsCompliances).subscribe({
      next: () => {
        this.toast.show('Compliance remarks saved. You can continue editing or Send to CASO.', 'success');
        this.isSavingCompliance = false;
        // Reload so saved values are reflected
        this.loadAll();
      },
      error: (err: any) => {
        this.isSavingCompliance = false;
        const msg = typeof err?.error === 'string' ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show('Failed to save: ' + msg, 'error');
      }
    });
  }

  openSendToCasoModal(bcasModal: any) {
    const missing = this.obsCompliances
      .map((c, i) => ({ c, i }))
      .filter(x => x.c.complianceStatus === '' && x.c.complianceRemark.trim() === '');

    if (missing.length > 0) {
      const nums = missing.map(x => `#${x.i + 1}`).join(', ');
      this.toast.show(
        `Please fill a compliance remark for observation(s) ${nums} before sending.`,
        'error'
      );
      return;
    }

    this.sendToCasoLetterNo   = '';
    this.sendToCasoLetterDate = '';
    this.sendToCasoFiles      = [];
    this.sendToCasoConfirmed  = false;
    bcasModal.dismiss();
    setTimeout(() => {
      this.modalService.open(this.sendToCasoTpl, { size: 'md', backdrop: 'static' });
    }, 200);
  }

  onSendToCasoFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    this.sendToCasoFiles = input.files ? Array.from(input.files) : [];
  }

  submitSendToCaso(modal: any) {
    if (!this.selectedBcas?.id) return;
    if (!this.sendToCasoConfirmed) {
      this.toast.show('Please tick the confirmation box before submitting.', 'error'); return;
    }
    if (!this.sendToCasoLetterNo.trim()) {
      this.toast.show('Please enter the Letter Number.', 'error'); return;
    }
    if (!this.sendToCasoLetterDate) {
      this.toast.show('Please enter the Letter Date.', 'error'); return;
    }

    const fd = new FormData();
    fd.append('letterNo',       this.sendToCasoLetterNo.trim());
    fd.append('letterDate',     this.sendToCasoLetterDate);
    fd.append('complianceData', JSON.stringify(this.obsCompliances));
    this.sendToCasoFiles.forEach(f => fd.append('files', f));

    this.isSendingToCaso = true;
    this.bcasService.sendToCaso(this.selectedBcas.id, fd).subscribe({
      next: (msg: string) => {
        this.toast.show(msg || 'Compliance review sent to CASO.', 'success');
        this.isSendingToCaso = false;
        modal.dismiss();
        this.loadAll();
      },
      error: (err: any) => {
        this.isSendingToCaso = false;
        const msg = typeof err?.error === 'string' ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show('Failed to send: ' + msg, 'error');
      }
    });
  }

  // ── Status helpers ────────────────────────────────────────────
  bcasBadge(status: string): string {
    switch (status) {
      case 'PQ_STAGE':          return 'badge-pq';
      case 'AUDIT_STAGE':       return 'badge-audit';
      case 'OBSERVATION_DRAFT': return 'badge-obs-draft';
      case 'OBSERVATION_STAGE': return 'badge-obs';
      case 'APS_RESPONDED':     return 'badge-aps';
      case 'COMPLETED':         return 'badge-done';
      default:                  return 'badge-secondary';
    }
  }

  bcasLabel(status: string): string {
    switch (status) {
      case 'PQ_STAGE':          return 'PQ Stage';
      case 'AUDIT_STAGE':       return 'Audit Stage';
      case 'OBSERVATION_DRAFT': return 'Obs. Draft';
      case 'OBSERVATION_STAGE': return 'Pending APS Response';
      case 'APS_RESPONDED':     return 'APS Response Sent';
      case 'COMPLETED':         return 'Completed';
      default:                  return status;
    }
  }

  internalBadge(status: string): string {
    switch (status) {
      case 'Planned':          return 'badge-pq';
      case 'In Progress':      return 'badge-audit';
      case 'Observation APS':  return 'badge-obs';
      case 'Observation CASO': return 'badge-obs-draft';
      case 'Action Required':  return 'badge-warn';
      case 'Completed':        return 'badge-done';
      default:                 return 'badge-secondary';
    }
  }

  icaoBadge(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-done';
      case 'Planned':   return 'badge-pq';
      default:          return 'badge-audit';
    }
  }

  auditTypeBadge(type: string): string {
    switch (type) {
      case 'BCAS':     return 'type-badge-bcas';
      case 'ICAO':     return 'type-badge-icao';
      case 'Internal': return 'type-badge-internal';
      default:         return '';
    }
  }

  statusBadge(r: UnifiedResult): string {
    if (r.auditType === 'BCAS')     return this.bcasBadge(r.status);
    if (r.auditType === 'Internal') return this.internalBadge(r.status);
    return this.icaoBadge(r.status);
  }

  statusLabel(r: UnifiedResult): string {
    if (r.auditType === 'BCAS') return this.bcasLabel(r.status);
    return r.status;
  }

  formatMonth(ym: string): string {
    if (!ym) return '—';
    const [yr, mo] = ym.split('-');
    return new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── File viewer ───────────────────────────────────────────────
  getFileType(fileName?: string): 'pdf' | 'image' | 'other' {
    if (!fileName) return 'other';
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    return 'other';
  }

  openFileViewer(
    fileName: string,
    filePath: string,
    source: 'bcas' | 'icao' | 'internal',
    tpl: any
  ) {
    this.viewingFile    = { fileName, filePath };
    this.viewingFileUrl = null;
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.modalService.open(tpl, { size: 'xl', backdrop: 'static', keyboard: false });

    const fetch$ =
      source === 'bcas'     ? this.bcasService.getBcasFile(filePath) :
      source === 'icao'     ? this.icaoService.getIcaoFile(filePath) :
                              this.internalService.getInternalAuditFile(filePath);

    fetch$.subscribe({
      next: (blob: Blob) => {
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
      },
      error: () => this.toast.show('Failed to load file.', 'error')
    });
  }

  closeFileViewer(modal: any) {
    modal.dismiss();
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.viewingFileUrl = null;
    this.viewingFile    = null;
  }
}

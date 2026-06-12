import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup,
  FormsModule, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnitDetails } from '../../interface/UnitDetails';
import { UserRoleDetails } from '../../interface/UserRoleDetails';
import { User } from '../../interface/User';
import { BcasAuditRecord, BcasAuditFile } from '../../interface/BcasAuditRecord';
import { UnitService } from '../../service/unit.service';
import { UsermanagementService } from '../../service/usermanagement.service';
import { BcasAuditService } from '../../service/bcas-audit.service';
import { ToastService } from '../../service/toast.service';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const from = group.get('fromDate')?.value;
  const to   = group.get('toDate')?.value;
  if (from && to && new Date(from) > new Date(to)) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-bcas-bcas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bcas-bcas.component.html',
  styleUrl: './bcas-bcas.component.css'
})
export class BcasBcasComponent implements OnInit {

  audits: BcasAuditRecord[] = [];
  units: UnitDetails[] = [];
  casoList: UserRoleDetails[] = [];
  loggedUser: User | null = null;

  // CASO auto-fill state
  casoName = '';
  casoRank = '';
  casoNo   = '';
  casoId   = 0;

  // Stage 1 create form
  createForm: FormGroup;
  selectedPqFiles: File[] = [];

  // Stage 2 update form
  updateForm: FormGroup;
  selectedFinalReport: File | null = null;
  selectedAudit: BcasAuditRecord | null = null;

  // Stage 3 observations
  observationRows: { observationText: string; remarksType: string; complianceStatus: string; currentStatus: string; supportingDoc: File | null }[] = [];
  isViewObsMode = false;
  obsLetterNo = '';
  obsLetterDate = '';

  // File viewer
  viewingFile: BcasAuditFile | null = null;
  viewingFileUrl: SafeResourceUrl | null = null;
  private currentBlobUrl: string | null = null;

  // Pagination & search
  searchText      = '';
  page            = 1;
  pageSize        = 10;
  pageSizeOptions = [5, 10, 20, 50];

  isSubmitting    = false;

  private profileLoaded = false;
  private unitsLoaded   = false;

  // ── Stats ──────────────────────────────────────────────────────
  get totalAudits()      { return this.audits.length; }
  get pqStageCount()     { return this.audits.filter(a => a.status === 'PQ_STAGE').length; }
  get auditStageCount()  { return this.audits.filter(a => a.status === 'AUDIT_STAGE').length; }
  get observationCount() { return this.audits.filter(a => a.status === 'OBSERVATION_STAGE').length; }
  get completedCount()   { return this.audits.filter(a => a.status === 'COMPLETED').length; }

  // ── Pagination ─────────────────────────────────────────────────
  get filteredAudits() {
    const q = this.searchText.toLowerCase().trim();
    if (!q) return this.audits;
    return this.audits.filter(a =>
      a.auditName?.toLowerCase().includes(q) ||
      a.unitName?.toLowerCase().includes(q)  ||
      a.casoName?.toLowerCase().includes(q)  ||
      a.createdBy?.toLowerCase().includes(q)
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAudits.length / this.pageSize));
  }

  get visiblePages(): number[] {
    const show = 5, half = Math.floor(show / 2);
    let start = Math.max(1, this.page - half);
    let end   = Math.min(this.totalPages, start + show - 1);
    if (end - start < show - 1) start = Math.max(1, end - show + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number) { this.page = p; }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.totalPages) this.page++; }

  constructor(
    private fb: FormBuilder,
    private unitService: UnitService,
    private umService: UsermanagementService,
    private bcasService: BcasAuditService,
    private modalService: NgbModal,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {
    this.createForm = this.fb.group({
      name:       new FormControl({ value: '', disabled: true }),
      unitId:     new FormControl('', [Validators.required]),
      auditMonth: new FormControl('', [Validators.required]),
      gist:       new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)])
    });

    this.updateForm = this.fb.group({
      fromDate:   new FormControl('', [Validators.required]),
      toDate:     new FormControl('', [Validators.required]),
      letterNo:   new FormControl('', [Validators.required]),
      letterDate: new FormControl('', [Validators.required])
    }, { validators: dateRangeValidator });
  }

  ngOnInit() {
    this.loadAudits();
    this.loadUnits();
    this.loadCasoList();
    this.loadUserProfile();
    this.createForm.valueChanges.subscribe(() => this.generateName());
  }

  // ── Data loaders ───────────────────────────────────────────────

  loadAudits() {
    this.bcasService.getBcasAudits().subscribe({
      next: data => { this.audits = data; },
      error: () => this.toast.show('Failed to load BCAS audits.', 'error')
    });
  }

  private loadUserProfile() {
    this.umService.getUserProfileDetails().subscribe({
      next: (user: User) => {
        this.loggedUser = user;
        this.profileLoaded = true;
        this.tryAutoFillUnit();
      },
      error: () => this.toast.show('Failed to load user profile.', 'error')
    });
  }

  private loadUnits() {
    this.unitService.getUnitDetails().subscribe({
      next: data => {
        this.units = data.sort((a, b) => a.unitName.localeCompare(b.unitName));
        this.unitsLoaded = true;
        this.tryAutoFillUnit();
      },
      error: () => this.toast.show('Failed to load units.', 'error')
    });
  }

  private loadCasoList() {
    this.umService.getUserAuditDetailList().subscribe({
      next: data => {
        this.casoList = data.filter(u => u.rolename === 'CASO');
        this.tryAutoFillUnit();
      },
      error: () => this.toast.show('Failed to load CASO list.', 'error')
    });
  }

  private tryAutoFillUnit() {
    if (this.profileLoaded && this.unitsLoaded && this.loggedUser?.unitid != null) {
      this.applyUnitFromProfile();
    }
  }

  private applyUnitFromProfile() {
    const uid = Number(this.loggedUser!.unitid);
    if (!uid) return;
    this.createForm.patchValue({ unitId: uid }, { emitEvent: false });
    this.onUnitChange();
    this.generateName();
  }

  // ── Form helpers ───────────────────────────────────────────────

  private generateName() {
    const unitId     = this.createForm.get('unitId')?.value;
    const auditMonth = this.createForm.get('auditMonth')?.value;
    if (unitId && auditMonth) {
      const unit = this.units.find(u => Number(u.id) === Number(unitId));
      const [yr, mo] = auditMonth.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      this.createForm.patchValue(
        { name: `${unit?.unitName ?? ''} - BCAS - ${label}` },
        { emitEvent: false }
      );
    }
  }

  onUnitChange() {
    const unitId = Number(this.createForm.get('unitId')?.value);
    const unit   = this.units.find(u => u.id === unitId);
    if (!unit) return;
    this.casoName = unit.casoName ?? '';
    this.casoId   = unit.casoId  ?? 0;
    const casoUser = this.casoList.find(u => Number(u.id) === Number(unit.casoId));
    this.casoRank  = casoUser?.rank   ?? '';
    this.casoNo    = casoUser?.cisfno ?? '';
  }

  onPqFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const newFiles = input.files ? Array.from(input.files) : [];
    newFiles.forEach(f => {
      if (!f.name.toLowerCase().endsWith('.pdf')) return;
      const dup = this.selectedPqFiles.some(e => e.name === f.name && e.size === f.size);
      if (!dup) this.selectedPqFiles.push(f);
    });
    input.value = '';
  }

  removePqFile(index: number) { this.selectedPqFiles.splice(index, 1); }

  onFinalReportSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      this.toast.show('Only PDF files are allowed.', 'error');
      input.value = '';
      return;
    }
    this.selectedFinalReport = file ?? null;
  }

  // ── Modals ─────────────────────────────────────────────────────

  openCreateModal(content: any) {
    this.resetCreateForm();
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openUpdateModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit = audit;
    this.updateForm.reset();
    this.updateForm.patchValue({
      fromDate:   audit.fromDate   || '',
      toDate:     audit.toDate     || '',
      letterNo:   audit.letterNo   || '',
      letterDate: audit.letterDate || ''
    });
    this.selectedFinalReport = null;
    this.modalService.open(content, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  openObservationModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit  = audit;
    this.isViewObsMode  = audit.status === 'OBSERVATION_STAGE' || audit.status === 'COMPLETED';
    if (!this.isViewObsMode) {
      this.observationRows = [this.newObsRow()];
      this.obsLetterNo     = '';
      this.obsLetterDate   = '';
    }
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openAddObservationModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit   = audit;
    this.isViewObsMode   = false;
    this.observationRows = [this.newObsRow()];
    this.obsLetterNo     = '';
    this.obsLetterDate   = '';
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  private newObsRow() {
    return { observationText: '', remarksType: 'Non Critical', complianceStatus: 'Compliant', currentStatus: '', supportingDoc: null as File | null };
  }

  formatStatusClass(status: string): string {
    if (!status) return '';
    return status.replace(/\s+/g, '').replace(/[()\-]/g, '');
  }

  openSummaryModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit = audit;
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false, scrollable: true });
  }

  private resetCreateForm() {
    this.createForm.reset();
    this.selectedPqFiles = [];
    this.casoName = '';
    this.casoRank = '';
    this.casoNo   = '';
    this.casoId   = 0;
    if (this.loggedUser?.unitid != null) this.applyUnitFromProfile();
  }

  // ── Observation row management ─────────────────────────────────

  addObservationRow() {
    this.observationRows.push(this.newObsRow());
  }

  removeObservationRow(index: number) { this.observationRows.splice(index, 1); }

  // ── Save Stage 1 ───────────────────────────────────────────────

  savePqStage() {
    if (this.isSubmitting) return;
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }

    const unit = this.units.find(u => Number(u.id) === Number(this.createForm.value.unitId));
    const fd   = new FormData();
    fd.append('auditName',   this.createForm.getRawValue().name);
    fd.append('unitId',      String(this.createForm.value.unitId));
    fd.append('unitName',    unit?.unitName ?? '');
    fd.append('auditMonth',  this.createForm.value.auditMonth);
    fd.append('gist',        this.createForm.value.gist);
    fd.append('createdBy',   this.loggedUser?.mstr_name ?? '');
    fd.append('createdById', String(this.loggedUser?.id ?? 0));
    fd.append('casoId',      String(this.casoId));
    fd.append('casoName',    this.casoName);
    fd.append('casoRank',    this.casoRank);
    fd.append('casoNo',      this.casoNo);
    this.selectedPqFiles.forEach(f => fd.append('files', f, f.name));

    this.isSubmitting = true;
    this.bcasService.saveBcasAudit(fd).subscribe({
      next: () => {
        this.toast.show('BCAS audit created successfully.', 'success');
        this.resetCreateForm();
        this.loadAudits();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: err => {
        this.toast.show('Error saving BCAS audit: ' + err, 'error');
        this.isSubmitting = false;
      }
    });
  }

  // ── Save Stage 2 ───────────────────────────────────────────────

  saveAuditStage() {
    if (this.isSubmitting || !this.selectedAudit) return;
    this.updateForm.markAllAsTouched();
    if (this.updateForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    if (this.updateForm.hasError('dateRange')) {
      this.toast.show('From date must be on or before To date.', 'error');
      return;
    }

    const fd = new FormData();
    fd.append('auditId',    String(this.selectedAudit.id));
    fd.append('fromDate',   this.updateForm.value.fromDate);
    fd.append('toDate',     this.updateForm.value.toDate);
    fd.append('letterNo',   this.updateForm.value.letterNo   || '');
    fd.append('letterDate', this.updateForm.value.letterDate || '');
    if (this.selectedFinalReport) {
      fd.append('finalReport', this.selectedFinalReport, this.selectedFinalReport.name);
    }

    this.isSubmitting = true;
    this.bcasService.updateBcasAudit(fd).subscribe({
      next: () => {
        this.toast.show('Audit progressed to Audit Stage.', 'success');
        this.loadAudits();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: err => {
        this.toast.show('Error updating audit: ' + err, 'error');
        this.isSubmitting = false;
      }
    });
  }

  // ── Save Stage 3 ───────────────────────────────────────────────

  onObsDocSelected(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.observationRows[index].supportingDoc = input.files[0];
    }
  }

  saveObservations() {
    if (this.isSubmitting || !this.selectedAudit) return;
    const allFilled = this.observationRows.every(r => r.observationText.trim().length > 0);
    if (!allFilled || this.observationRows.length === 0) {
      this.toast.show('Please enter observation text for each row.', 'error');
      return;
    }

    const obsPayload = this.observationRows.map(r => ({
      observationText: r.observationText,
      remarksType:     r.remarksType,
      complianceStatus: r.complianceStatus,
      currentStatus:   r.currentStatus
    }));

    const fd = new FormData();
    fd.append('obsLetterNo',   this.obsLetterNo   || '');
    fd.append('obsLetterDate', this.obsLetterDate || '');
    fd.append('observations',  JSON.stringify(obsPayload));
    this.observationRows.forEach((r, i) => {
      if (r.supportingDoc) fd.append(`file_${i}`, r.supportingDoc, r.supportingDoc.name);
    });

    this.isSubmitting = true;
    this.bcasService.saveBcasObservations(this.selectedAudit.id!, fd).subscribe({
      next: () => {
        this.toast.show('Observations submitted to APS HQRs.', 'success');
        this.loadAudits();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: err => {
        this.toast.show('Error submitting observations: ' + err, 'error');
        this.isSubmitting = false;
      }
    });
  }

  // ── File viewer ────────────────────────────────────────────────

  getFileType(fileName?: string): 'pdf' | 'image' | 'other' {
    if (!fileName) return 'other';
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'image';
    return 'other';
  }

  openFileViewer(file: BcasAuditFile, content: any) {
    this.viewingFile    = file;
    this.viewingFileUrl = null;
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.modalService.open(content, { size: 'xl', backdrop: 'static' });
    this.bcasService.getBcasFile(file.filePath).subscribe({
      next: (blob: Blob) => {
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
      },
      error: () => this.toast.show('Failed to load file.', 'error')
    });
  }

  openFinalReportViewer(filePath: string, content: any) {
    const fileName = filePath.split('\\').pop() ?? 'Final Report';
    this.viewingFile    = { fileName, filePath };
    this.viewingFileUrl = null;
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.modalService.open(content, { size: 'xl', backdrop: 'static' });
    this.bcasService.getBcasFile(filePath).subscribe({
      next: (blob: Blob) => {
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentBlobUrl);
      },
      error: () => this.toast.show('Failed to load final report.', 'error')
    });
  }

  closeFileViewer(modal: any) {
    modal.dismiss();
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.viewingFileUrl = null;
    this.viewingFile    = null;
  }

  // ── Status helpers ─────────────────────────────────────────────

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PQ_STAGE':          return 'badge-pq';
      case 'AUDIT_STAGE':       return 'badge-audit';
      case 'OBSERVATION_STAGE': return 'badge-obs';
      case 'COMPLETED':         return 'badge-done';
      default:                  return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PQ_STAGE':          return 'PQ Stage';
      case 'AUDIT_STAGE':       return 'Audit Stage';
      case 'OBSERVATION_STAGE': return 'Observation';
      case 'COMPLETED':         return 'Completed';
      default:                  return status;
    }
  }
}

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
import { BcasAuditRecord, BcasAuditFile, BcasObsMessage, type CasoReplyDraft } from '../../interface/BcasAuditRecord';
import { APP_CONSTANTS } from '../../constants/app.constants';
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

  isSubmitting      = false;
  formSaved         = false;
  isDraftLoading    = false;
  showCreateConfirm = false;
  showAuditConfirm  = false;
  obsFormSaved       = false;
  showObsConfirm     = false;
  obsSubmitAttempted = false;
  draftId: number | null = null;
  draftFiles: BcasAuditFile[] = [];
  draftSavedAt: string | null = null;

  // ── APS reply state ────────────────────────────────────────────
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  apsReplyAudit: BcasAuditRecord | null = null;
  casoReplies: {
    observationId?: number;
    obsText: string;
    replyMessage: string;
    replyStatus: string;
    messages: BcasObsMessage[];
    isOpen: boolean;
    replyFile: File | null;
  }[] = [];
  casoReplyLetterNo   = '';
  casoReplyLetterDate = '';
  isSubmittingReply    = false;
  isSavingDraft        = false;
  casoReplyDraftSavedAt: string | null = null;

  get selectedUnitName(): string {
    return this.units.find(u => Number(u.id) === Number(this.createForm.getRawValue().unitId))?.unitName
      ?? this.loggedUser?.unitmaster?.unitName
      ?? '—';
  }

  private profileLoaded = false;
  private unitsLoaded   = false;

  // ── Stats ──────────────────────────────────────────────────────
  get totalAudits()        { return this.audits.length; }
  get pqStageCount()       { return this.audits.filter(a => a.status === 'PQ_STAGE').length; }
  get auditStageCount()    { return this.audits.filter(a => a.status === 'AUDIT_STAGE').length; }
  get observationCount()   { return this.audits.filter(a => a.status === 'OBSERVATION_STAGE').length; }
  get apsRespondedCount()  { return this.audits.filter(a => a.status === 'APS_RESPONDED').length; }
  get completedCount()     { return this.audits.filter(a => a.status === 'COMPLETED').length; }

  // ── Pagination ─────────────────────────────────────────────────
  get filteredAudits() {
    let result = this.audits;

    // Restrict to logged-in user's unit
    if (this.loggedUser?.unitid != null) {
      result = result.filter(a => Number(a.unitId) === Number(this.loggedUser!.unitid));
    }

    const q = this.searchText.toLowerCase().trim();
    if (!q) return result;
    return result.filter(a =>
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
      unitId:     new FormControl({ value: '', disabled: true }),
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
    // Use master endpoint — it includes unitid (auth /userprofile does not)
    this.umService.getLoggedUserDetailList().subscribe({
      next: (users: User[]) => {
        if (users.length > 0) this.loggedUser = users[0];
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
    const unitId     = this.createForm.getRawValue().unitId;
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
    const unitId = Number(this.createForm.getRawValue().unitId);
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
    this.loadExistingDraft();
  }

  private loadExistingDraft(): void {
    this.isDraftLoading = true;
    this.bcasService.getBcasDraft().subscribe({
      next: (draft) => {
        this.isDraftLoading = false;
        if (!draft) return;
        this.draftId      = draft.id ?? null;
        this.draftSavedAt = draft.createdAt ?? null;
        this.draftFiles   = draft.files ?? [];
        this.createForm.patchValue(
          { unitId: draft.unitId, auditMonth: draft.auditMonth, gist: draft.gist },
          { emitEvent: true }
        );
        this.onUnitChange();
        this.generateName();
        this.formSaved = true;
      },
      error: () => { this.isDraftLoading = false; }
    });
  }

  openUpdateModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit    = audit;
    this.showAuditConfirm = false;
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

  requestAuditConfirm(): void {
    this.updateForm.markAllAsTouched();
    if (this.updateForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    if (this.updateForm.hasError('dateRange')) {
      this.toast.show('From date must be on or before To date.', 'error');
      return;
    }
    this.showAuditConfirm = true;
  }

  openObservationModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit  = audit;
    this.isViewObsMode  = audit.status === 'OBSERVATION_STAGE' || audit.status === 'COMPLETED';
    this.obsFormSaved        = false;
    this.showObsConfirm      = false;
    this.obsSubmitAttempted  = false;
    if (!this.isViewObsMode) {
      this.observationRows = [this.newObsRow()];
      this.obsLetterNo     = '';
      this.obsLetterDate   = '';
      this.loadObsDraft(audit.id!);
    }
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openAddObservationModal(audit: BcasAuditRecord, content: any) {
    this.selectedAudit   = audit;
    this.isViewObsMode   = false;
    this.obsFormSaved        = false;
    this.showObsConfirm      = false;
    this.obsSubmitAttempted  = false;
    this.observationRows = [this.newObsRow()];
    this.obsLetterNo     = '';
    this.obsLetterDate   = '';
    this.loadObsDraft(audit.id!);
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  private loadObsDraft(auditId: number): void {
    this.bcasService.getObsDraft(auditId).subscribe({
      next: (draft) => {
        if (!draft) return;
        this.obsLetterNo   = draft.obsLetterNo   ?? '';
        this.obsLetterDate = draft.obsLetterDate ?? '';
        if (draft.observations?.length) {
          this.observationRows = draft.observations.map(o => ({
            observationText:  o.observationText,
            remarksType:      o.remarksType,
            complianceStatus: o.complianceStatus,
            currentStatus:    o.currentStatus ?? '',
            supportingDoc:    null as File | null
          }));
        }
      }
    });
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

  saveDraft(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    if (this.selectedPqFiles.length === 0 && this.draftFiles.length === 0) {
      this.toast.show('Please upload at least one PQ Question & Answer file (PDF).', 'error');
      return;
    }

    const raw  = this.createForm.getRawValue();
    const unit = this.units.find(u => Number(u.id) === Number(raw.unitId));
    const fd = new FormData();
    fd.append('auditName',   raw.name);
    fd.append('unitId',      String(raw.unitId));
    fd.append('unitName',    unit?.unitName ?? '');
    fd.append('auditMonth',  raw.auditMonth);
    fd.append('gist',        raw.gist);
    fd.append('createdBy',   this.loggedUser?.mstr_name ?? '');
    fd.append('createdById', String(this.loggedUser?.id ?? 0));
    fd.append('casoId',      String(this.casoId));
    fd.append('casoName',    this.casoName);
    fd.append('casoRank',    this.casoRank);
    fd.append('casoNo',      this.casoNo);
    this.selectedPqFiles.forEach(f => fd.append('files', f, f.name));

    const handleResponse = (record: BcasAuditRecord) => {
      this.isSubmitting = false;
      this.draftId      = record.id ?? null;
      this.draftSavedAt = record.createdAt ?? null;
      this.draftFiles   = record.files ?? [];
      this.selectedPqFiles = [];
      this.formSaved = true;
      this.toast.show('Draft saved to database.', 'success');
    };
    const handleError = (err: any) => {
      this.isSubmitting = false;
      const msg = typeof err?.error === 'string' ? err.error : (err?.message ?? 'Unknown error');
      this.toast.show('Failed to save draft: ' + msg, 'error');
    };

    this.isSubmitting = true;
    if (this.draftId) {
      fd.append('draftId', String(this.draftId));
      this.bcasService.updateBcasDraft(fd).subscribe({ next: handleResponse, error: handleError });
    } else {
      this.bcasService.saveBcasDraft(fd).subscribe({ next: handleResponse, error: handleError });
    }
  }

  editDraft(): void {
    this.formSaved = false;
  }

  private resetCreateForm() {
    this.formSaved         = false;
    this.showCreateConfirm = false;
    this.draftId           = null;
    this.draftFiles        = [];
    this.draftSavedAt      = null;
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
    this.isSubmitting = true;

    const onSuccess = () => {
      this.toast.show('BCAS audit created successfully.', 'success');
      this.resetCreateForm();
      this.loadAudits();
      this.modalService.dismissAll();
      this.isSubmitting = false;
    };
    const onError = (err: any) => {
      this.toast.show('Error creating audit: ' + err, 'error');
      this.isSubmitting = false;
    };

    if (this.draftId) {
      // Draft already persisted — just promote it to PQ_STAGE
      this.bcasService.promoteBcasDraft(this.draftId).subscribe({ next: onSuccess, error: onError });
    } else {
      // No draft on server (edge case) — create directly
      const raw2 = this.createForm.getRawValue();
      const unit = this.units.find(u => Number(u.id) === Number(raw2.unitId));
      const fd   = new FormData();
      fd.append('auditName',   raw2.name);
      fd.append('unitId',      String(raw2.unitId));
      fd.append('unitName',    unit?.unitName ?? '');
      fd.append('auditMonth',  raw2.auditMonth);
      fd.append('gist',        raw2.gist);
      fd.append('createdBy',   this.loggedUser?.mstr_name ?? '');
      fd.append('createdById', String(this.loggedUser?.id ?? 0));
      fd.append('casoId',      String(this.casoId));
      fd.append('casoName',    this.casoName);
      fd.append('casoRank',    this.casoRank);
      fd.append('casoNo',      this.casoNo);
      this.selectedPqFiles.forEach(f => fd.append('files', f, f.name));
      this.bcasService.saveBcasAudit(fd).subscribe({ next: onSuccess, error: onError });
    }
  }

  // ── Save Stage 2 ───────────────────────────────────────────────

  saveAuditStage() {
    if (this.isSubmitting || !this.selectedAudit) return;
    this.showAuditConfirm = false;

    this.updateForm.markAllAsTouched();
    if (this.updateForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    if (!this.selectedFinalReport && !this.selectedAudit.finalReportPath) {
      this.toast.show('Please upload the Final Audit Report PDF.', 'error');
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

  saveObsDraft(): void {
    if (!this.obsLetterNo.trim()) {
      this.toast.show('Please enter the letter number.', 'error');
      return;
    }
    if (!this.obsLetterDate) {
      this.toast.show('Please enter the letter date.', 'error');
      return;
    }
    if (this.observationRows.length === 0) {
      this.toast.show('Please add at least one observation.', 'error');
      return;
    }
    const allFilled = this.observationRows.every(r => r.observationText.trim().length > 0);
    if (!allFilled) {
      this.toast.show('Please enter observation text for each row.', 'error');
      return;
    }
    const allStatusFilled = this.observationRows.every(r => r.currentStatus.trim().length > 0);
    if (!allStatusFilled) {
      this.obsSubmitAttempted = true;
      this.toast.show('Please enter current compliance status for each observation.', 'error');
      return;
    }

    if (!this.selectedAudit?.id) { this.obsFormSaved = true; return; }

    const obsPayload = this.observationRows.map(r => ({
      observationText:  r.observationText,
      remarksType:      r.remarksType,
      complianceStatus: r.complianceStatus,
      currentStatus:    r.currentStatus
    }));

    const fd = new FormData();
    fd.append('obsLetterNo',   this.obsLetterNo);
    fd.append('obsLetterDate', this.obsLetterDate);
    fd.append('observations',  JSON.stringify(obsPayload));

    this.isSubmitting = true;
    this.bcasService.saveObsDraft(this.selectedAudit.id, fd).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.obsFormSaved = true;
        this.loadAudits();
        this.toast.show('Draft saved.', 'success');
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = typeof err?.error === 'string' ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show('Failed to save draft: ' + msg, 'error');
      }
    });
  }

  saveObservations() {
    if (this.isSubmitting || !this.selectedAudit) return;
    this.showObsConfirm = false;

    const allTextFilled   = this.observationRows.every(r => r.observationText.trim().length > 0);
    const allStatusFilled = this.observationRows.every(r => r.currentStatus.trim().length > 0);
    if (!allTextFilled) {
      this.toast.show('Please enter observation text for each row.', 'error');
      return;
    }
    if (!allStatusFilled) {
      this.obsSubmitAttempted = true;
      this.toast.show('Please enter current compliance status for each observation.', 'error');
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
        this.obsFormSaved   = false;
        this.showObsConfirm = false;
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
      case 'PQ_STAGE':           return 'badge-pq';
      case 'AUDIT_STAGE':        return 'badge-audit';
      case 'OBSERVATION_DRAFT':  return 'badge-obs-draft';
      case 'OBSERVATION_STAGE':  return 'badge-obs';
      case 'APS_RESPONDED':      return 'badge-aps';
      case 'COMPLETED':          return 'badge-done';
      default:                   return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PQ_STAGE':           return 'PQ Stage';
      case 'AUDIT_STAGE':        return 'Audit Stage';
      case 'OBSERVATION_DRAFT':  return 'Obs. Draft';
      case 'OBSERVATION_STAGE':  return 'Observation';
      case 'APS_RESPONDED':      return 'APS Responded';
      case 'COMPLETED':          return 'Completed';
      default:                   return status;
    }
  }

  /** Returns which party needs to act next, or null when complete. */
  getActionBucket(status: string): { label: string; css: string } | null {
    switch (status) {
      case 'PQ_STAGE':
      case 'AUDIT_STAGE':
      case 'OBSERVATION_DRAFT':  return { label: 'CASO Bucket',     css: 'bucket-caso' };
      case 'OBSERVATION_STAGE':
      case 'APS_RESPONDED':      return { label: 'APS HQrs Bucket', css: 'bucket-aps' };
      case 'COMPLETED':          return { label: 'Completed',        css: 'bucket-done' };
      default:                   return null;
    }
  }

  // ── Open APS response modal (airport CASO views thread and replies) ──────
  openApsResponseModal(audit: BcasAuditRecord, content: any) {
    this.apsReplyAudit         = audit;
    this.casoReplyLetterNo     = '';
    this.casoReplyLetterDate   = '';
    this.casoReplyDraftSavedAt = null;
    this.casoReplies = (audit.observations ?? []).map(o => ({
      observationId: o.id,
      obsText:       o.observationText,
      replyMessage:  '',
      replyStatus:   o.complianceStatus || '',
      messages:      o.messages ?? [],
      isOpen:        o.currentStatus !== 'Compliant' && o.currentStatus !== 'Dropped',
      replyFile:     null
    }));

    // Load any saved draft and pre-populate
    if (audit.id) {
      this.bcasService.getCasoReplyDraft(audit.id).subscribe({
        next: (draft: CasoReplyDraft | null) => {
          if (!draft) return;
          this.casoReplyLetterNo   = draft.letterNo   ?? '';
          this.casoReplyLetterDate = draft.letterDate ?? '';
          draft.obsReplies?.forEach(dr => {
            const r = this.casoReplies.find(c => c.observationId === dr.observationId);
            if (r && r.isOpen) {
              r.replyMessage = dr.replyMessage ?? '';
              r.replyStatus  = dr.replyStatus  ?? r.replyStatus;
            }
          });
          this.casoReplyDraftSavedAt = 'Draft restored';
        }
      });
    }

    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false, scrollable: true });
  }

  saveReplyDraft() {
    if (!this.apsReplyAudit?.id) return;
    const draft = {
      letterNo:   this.casoReplyLetterNo.trim(),
      letterDate: this.casoReplyLetterDate,
      obsReplies: this.casoReplies.filter(r => r.isOpen).map(r => ({
        observationId: r.observationId,
        replyMessage:  r.replyMessage,
        replyStatus:   r.replyStatus
      }))
    };
    this.isSavingDraft = true;
    this.bcasService.saveCasoReplyDraft(this.apsReplyAudit.id, draft).subscribe({
      next: () => {
        this.isSavingDraft        = false;
        this.casoReplyDraftSavedAt = 'Saved at ' + new Date().toLocaleTimeString();
        this.toast.show('Draft saved. You can continue later.', 'success');
      },
      error: (err: any) => {
        this.isSavingDraft = false;
        const msg = typeof err?.error === 'string' ? err.error : 'Failed to save draft';
        this.toast.show(msg, 'error');
      }
    });
  }

  get hasOpenReplies(): boolean {
    return this.casoReplies.some(r => r.isOpen);
  }

  onObsFileSelected(event: Event, idx: number) {
    const input = event.target as HTMLInputElement;
    this.casoReplies[idx].replyFile = input.files?.[0] ?? null;
  }

  buildBcasFileUrl(filePath: string): string {
    return this.baseUrl + 'v1/qcmt/master/bcasfile?fullPath=' + encodeURIComponent(filePath);
  }

  submitCasoReply(modal: any) {
    if (!this.apsReplyAudit?.id) return;

    if (!this.casoReplyLetterNo.trim()) {
      this.toast.show('Please enter the reply letter number.', 'error'); return;
    }
    if (!this.casoReplyLetterDate) {
      this.toast.show('Please enter the reply letter date.', 'error'); return;
    }

    const openReplies = this.casoReplies.filter(r => r.isOpen);
    const missing = openReplies.filter(r => !r.replyMessage.trim());
    if (missing.length > 0) {
      this.toast.show('Please enter a reply for all pending observations.', 'error'); return;
    }

    const repliesPayload = openReplies.map(r => ({
      observationId: r.observationId,
      replyMessage:  r.replyMessage,
      replyStatus:   r.replyStatus
    }));

    const fd = new FormData();
    fd.append('letterNo',   this.casoReplyLetterNo.trim());
    fd.append('letterDate', this.casoReplyLetterDate);
    fd.append('replies',    JSON.stringify(repliesPayload));
    openReplies.forEach(r => {
      if (r.replyFile && r.observationId) {
        fd.append(`file_${r.observationId}`, r.replyFile, r.replyFile.name);
      }
    });

    this.isSubmittingReply = true;
    this.bcasService.submitCasoReply(this.apsReplyAudit.id, fd).subscribe({
      next: (msg: string) => {
        this.toast.show(msg || 'Reply submitted to APS HQRs.', 'success');
        this.isSubmittingReply    = false;
        this.casoReplyDraftSavedAt = null;
        modal.dismiss();
        this.loadAudits();
      },
      error: (err: any) => {
        this.isSubmittingReply = false;
        const errMsg = typeof err?.error === 'string' ? err.error : (err?.message ?? 'Unknown error');
        this.toast.show('Failed to submit reply: ' + errMsg, 'error');
      }
    });
  }
}

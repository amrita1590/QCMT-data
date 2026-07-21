import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InternalAuditRecord, InternalAuditFile } from '../../interface/InternalAuditRecord';
import { UnitDetails } from '../../interface/UnitDetails';
import { User } from '../../interface/User';
import { UserRoleDetails } from '../../interface/UserRoleDetails';
import { InternalAuditService } from '../../service/internal-audit.service';
import { UnitService } from '../../service/unit.service';
import { UsermanagementService } from '../../service/usermanagement.service';
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-bcas-internal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bcas-internal.component.html',
  styleUrl: './bcas-internal.component.css'
})
export class BcasInternalComponent implements OnInit {

  internalAudits: InternalAuditRecord[] = [];
  internalForm: FormGroup;
  units: UnitDetails[] = [];
  savedAuditId: number | null = null;
  auditorList: UserRoleDetails[] = [];
  casoList: UserRoleDetails[] = [];
  allUserList: UserRoleDetails[] = [];
  loggedUser: User | null = null;

  casoName = '';
  casoRank = '';
  casoNo   = '';
  casoId   = 0;

  private profileLoaded = false;
  private unitsLoaded   = false;
  selectedFiles: File[]      = [];
  savedFiles: InternalAuditFile[] = [];
  deletingFileId: number | null = null;
  isDeletingFile  = false;
  isSubmitting    = false;
  isDiscarding    = false;
  formSaved       = false;
  showSendConfirm = false;

  // Summary modal
  selectedSummary: InternalAuditRecord | null = null;

  // ── computed getters ────────────────────────────────────────────────────────

  /** The logged-in user's single draft (null if none). */
  get draftAudit(): InternalAuditRecord | null {
    return this.internalAudits.find(
      a => a.status === 'Draft' &&
           Number(a.unitId) === Number(this.loggedUser?.unitid)
    ) ?? null;
  }

  /** Non-draft records shown in the main table. */
  get tableAudits(): InternalAuditRecord[] {
    return this.internalAudits.filter(a => a.status !== 'Draft');
  }

  get totalAuditorBucket()  { return this.tableAudits.filter(a => a.status === 'Auditor Bucket').length; }
  get totalCasoBucket()     { return this.tableAudits.filter(a => a.status === 'CASO Bucket' || a.status === 'Compliance Pending').length; }
  get totalIgDigBucket()    { return this.tableAudits.filter(a => a.status === 'IG/DIG Bucket').length; }
  get totalCompleted()      { return this.tableAudits.filter(a => a.status === 'Completed').length; }

  get igDigUserList(): UserRoleDetails[] {
    return this.allUserList.filter(u => {
      const unit = this.units.find(un => Number(un.id) === Number(u.unitid));
      return unit?.unitType === 'Zone' || unit?.unitType === 'Sector';
    });
  }

  // ── display helpers ─────────────────────────────────────────────────────────

  displayUser(no: string, rank: string, name: string): string {
    const parts = [no, rank, name].filter(p => p && p.trim());
    return parts.join(' · ');
  }

  formatMonth(ym: string): string {
    if (!ym) return '—';
    const [yr, mo] = ym.split('-');
    return new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  // ── constructor ─────────────────────────────────────────────────────────────

  constructor(
    private fb: FormBuilder,
    private internalAuditService: InternalAuditService,
    private unitService: UnitService,
    private umService: UsermanagementService,
    private modalService: NgbModal,
    private toast: ToastService
  ) {
    this.internalForm = this.fb.group({
      name:             new FormControl({ value: '', disabled: true }),
      unitId:           new FormControl({ value: '', disabled: true }),
      auditMonth:       new FormControl('', [Validators.required]),
      auditorId:        new FormControl('', [Validators.required]),
      igUserId:         new FormControl('', [Validators.required]),
      auditDescription: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(400)])
    });
  }

  ngOnInit() {
    this.loadAudits();
    this.loadUnits();
    this.loadUserLists();
    this.loadUserProfile();
    this.internalForm.get('auditMonth')?.valueChanges.subscribe(() => this.generateName());
  }

  // ── data loading ─────────────────────────────────────────────────────────────

  loadAudits() {
    this.internalAuditService.getInternalAudits().subscribe({
      next: data => {
        this.internalAudits = data.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        if (this.savedAuditId) {
          const found = this.internalAudits.find(a => a.id === this.savedAuditId);
          this.savedFiles = found?.reportFiles ?? [];
        }
      },
      error: () => this.toast.show('Failed to load Internal Audits.', 'error')
    });
  }

  private loadUserProfile() {
    this.umService.getLoggedUserDetailList().subscribe({
      next: users => {
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

  private loadUserLists() {
    this.umService.getUserAuditDetailList().subscribe({
      next: data => {
        const unique = data.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);
        this.allUserList = unique.sort((a, b) => a.name.localeCompare(b.name));
        this.auditorList = data.filter(u => u.rolename === 'Auditor').sort((a, b) => a.name.localeCompare(b.name));
        this.casoList    = data.filter(u => u.rolename === 'CASO');
        this.tryAutoFillUnit();
      },
      error: () => this.toast.show('Failed to load users.', 'error')
    });
  }

  // ── unit auto-fill ───────────────────────────────────────────────────────────

  private tryAutoFillUnit() {
    if (this.profileLoaded && this.unitsLoaded && this.loggedUser?.unitid != null) {
      this.applyUnitFromProfile();
    }
  }

  private applyUnitFromProfile() {
    const uid = Number(this.loggedUser!.unitid);
    if (!uid) return;
    this.internalForm.patchValue({ unitId: uid }, { emitEvent: false });
    this.onUnitChange();
    this.generateName();
  }

  onUnitChange() {
    const unitId = Number(this.internalForm.getRawValue().unitId);
    const unit   = this.units.find(u => Number(u.id) === unitId);
    if (!unit) return;
    this.casoName = unit.casoName ?? '';
    this.casoId   = unit.casoId  ?? 0;
    const casoUser  = this.casoList.find(u => Number(u.id) === Number(unit.casoId));
    this.casoRank   = casoUser?.rank   ?? '';
    this.casoNo     = casoUser?.cisfno ?? '';
  }

  private generateName() {
    const unitId     = this.internalForm.getRawValue().unitId;
    const auditMonth = this.internalForm.get('auditMonth')?.value;
    if (unitId && auditMonth) {
      const unit = this.units.find(u => Number(u.id) === Number(unitId));
      const [yr, mo] = auditMonth.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      this.internalForm.patchValue(
        { name: `${unit?.unitName ?? ''} - Internal Audit - ${label}` },
        { emitEvent: false }
      );
    }
  }

  // ── modal openers ────────────────────────────────────────────────────────────

  openCreateModal(content: any) {
    this.resetForm();
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  /** Re-open the existing draft for editing. */
  resumeDraft(content: any) {
    const d = this.draftAudit;
    if (!d) return;
    this.savedAuditId   = d.id ?? null;
    this.savedFiles     = d.reportFiles ?? [];
    this.deletingFileId = null;
    this.isDeletingFile = false;
    this.selectedFiles  = [];
    this.formSaved      = true;
    this.showSendConfirm = false;

    this.casoId   = d.casoId;
    this.casoName = d.casoName;
    this.casoRank = d.casoRank;
    this.casoNo   = d.casoNo;

    this.internalForm.patchValue({
      name:             d.auditName,
      unitId:           d.unitId,
      auditMonth:       d.auditMonth,
      auditorId:        String(d.auditorId),
      igUserId:         String(d.igUserId),
      auditDescription: d.gist
    }, { emitEvent: false });

    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openSummaryModal(audit: InternalAuditRecord, content: any) {
    this.selectedSummary = audit;
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }

  // ── draft discard ────────────────────────────────────────────────────────────

  // ── status display helpers ───────────────────────────────────────────────────
  statusBucket(s: string): string {
    if (s === 'Auditor Bucket') return 'Auditor Bucket';
    if (s === 'CASO Bucket' || s === 'Compliance Pending') return 'CASO Bucket';
    if (s === 'IG/DIG Bucket') return 'IG/DIG Bucket';
    return '';
  }
  statusStage(s: string): string {
    switch (s) {
      case 'Auditor Bucket':     return 'Planned';
      case 'CASO Bucket':        return 'Report Submitted';
      case 'IG/DIG Bucket':      return 'Observation Review';
      case 'Compliance Pending': return 'Compliance Pending';
      case 'Completed':          return 'Completed';
      case 'Draft':              return 'Draft';
      default:                   return s;
    }
  }
  statusBucketClass(s: string): string {
    if (s === 'Auditor Bucket') return 'chip-auditor';
    if (s === 'CASO Bucket' || s === 'Compliance Pending') return 'chip-caso';
    if (s === 'IG/DIG Bucket') return 'chip-igdig';
    return '';
  }
  statusStageClass(s: string): string {
    if (s === 'Compliance Pending') return 'stage-urgent';
    if (s === 'Completed') return 'stage-done';
    return 'stage-normal';
  }

  // ── CASO: create observations → send to IG/DIG ──────────────────────────────
  actionAudit: InternalAuditRecord | null = null;
  observations: { observation: string; type: string; remarks: string }[] = [];
  isSubmittingObs = false;

  openObservationsModal(audit: InternalAuditRecord, content: any) {
    this.actionAudit   = audit;
    this.observations  = [{ observation: '', type: 'Moderate', remarks: '' }];
    this.modalService.open(content, { size: 'xl', backdrop: 'static' });
  }
  addObservation()    { this.observations.push({ observation: '', type: 'Moderate', remarks: '' }); }
  removeObservation(i: number) { if (this.observations.length > 1) this.observations.splice(i, 1); }

  sendObservationsToIgDig() {
    if (!this.actionAudit?.id) return;
    if (this.observations.some(o => !o.observation.trim())) {
      this.toast.show('All observation fields are required.', 'error'); return;
    }
    this.isSubmittingObs = true;
    const payload = {
      auditId: this.actionAudit.id,
      observations: this.observations.map((o, i) => ({
        slNo: i + 1, observation: o.observation, type: o.type,
        remarks: o.remarks, status: 'Pending', complianceDetails: ''
      }))
    };
    this.internalAuditService.saveObservations(this.actionAudit.id, payload.observations).subscribe({
      next: () => {
        this.isSubmittingObs = false;
        this.modalService.dismissAll();
        this.loadAudits();
        this.toast.show('Observation list sent to IG/DIG.', 'success');
      },
      error: (err: any) => {
        this.isSubmittingObs = false;
        this.toast.show('Error: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

  // ── CASO: submit final compliance doc ────────────────────────────────────────
  complianceFiles: File[]  = [];
  complianceRemarks = '';
  isSubmittingCompliance = false;

  openComplianceModal(audit: InternalAuditRecord, content: any) {
    this.actionAudit        = audit;
    this.complianceFiles    = [];
    this.complianceRemarks  = '';
    this.modalService.open(content, { size: 'lg', backdrop: 'static' });
  }
  onComplianceFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    Array.from(input.files ?? []).forEach(f => {
      if (!this.complianceFiles.some(e => e.name === f.name)) this.complianceFiles.push(f);
    });
    input.value = '';
  }
  removeComplianceFile(i: number) { this.complianceFiles.splice(i, 1); }

  submitFinalCompliance() {
    if (!this.actionAudit?.id) return;
    this.isSubmittingCompliance = true;
    const fd = new FormData();
    fd.append('auditId',    String(this.actionAudit.id));
    fd.append('remarks',    this.complianceRemarks);
    fd.append('uploadedBy', this.loggedUser?.mstr_name ?? '');
    this.complianceFiles.forEach(f => fd.append('files', f, f.name));
    this.internalAuditService.submitFinalCompliance(fd).subscribe({
      next: () => {
        this.isSubmittingCompliance = false;
        this.modalService.dismissAll();
        this.loadAudits();
        this.toast.show('Compliance submitted. Audit marked Completed.', 'success');
      },
      error: (err: any) => {
        this.isSubmittingCompliance = false;
        this.toast.show('Error: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

  showDiscardConfirm = false;

  requestDiscardDraft() {
    this.showDiscardConfirm = true;
  }

  cancelDiscardDraft() {
    this.showDiscardConfirm = false;
  }

  discardDraft() {
    const d = this.draftAudit;
    if (!d) {
      this.toast.show('No draft found.', 'error');
      return;
    }
    if (!d.id) {
      this.toast.show('Draft has no ID — please rebuild and restart the backend, then refresh.', 'error');
      return;
    }
    this.showDiscardConfirm = false;
    this.isDiscarding = true;
    this.internalAuditService.deleteInternalAudit(d.id).subscribe({
      next: () => {
        this.loadAudits();
        this.isDiscarding = false;
        this.toast.show('Draft discarded.', 'info');
      },
      error: (err: any) => {
        this.isDiscarding = false;
        const msg = err?.error || err?.message || 'Unknown error';
        this.toast.show('Failed to discard draft: ' + msg, 'error');
      }
    });
  }

  // ── form helpers ─────────────────────────────────────────────────────────────

  resetForm() {
    this.internalForm.reset();
    this.internalForm.get('unitId')?.disable();
    this.internalForm.get('name')?.disable();
    this.selectedFiles   = [];
    this.savedFiles      = [];
    this.savedAuditId    = null;
    this.deletingFileId  = null;
    this.isDeletingFile  = false;
    this.formSaved       = false;
    this.showSendConfirm = false;
    this.casoName = '';  this.casoRank = '';  this.casoNo = '';  this.casoId = 0;
    if (this.loggedUser?.unitid != null) this.applyUnitFromProfile();
  }

  editForm() {
    this.formSaved       = false;
    this.showSendConfirm = false;
  }

  // ── file management ──────────────────────────────────────────────────────────

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    Array.from(input.files ?? []).forEach(f => {
      const ext = f.name.toLowerCase();
      if (!ext.endsWith('.pdf') && !ext.endsWith('.doc') && !ext.endsWith('.docx')) return;
      if (!this.selectedFiles.some(e => e.name === f.name && e.size === f.size))
        this.selectedFiles.push(f);
    });
    input.value = '';
  }

  removeFile(index: number) { this.selectedFiles.splice(index, 1); }

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

  confirmDeleteFile(fileId: number | undefined) {
    if (!fileId) { this.toast.show('File ID not available — rebuild & restart backend.', 'error'); return; }
    this.deletingFileId = fileId;
  }

  cancelDeleteFile() { this.deletingFileId = null; }

  deleteSavedFile() {
    const fileId = this.deletingFileId;
    if (!fileId) return;
    this.isDeletingFile = true;
    this.internalAuditService.deleteInternalAuditFile(fileId).subscribe({
      next: () => {
        this.savedFiles     = this.savedFiles.filter(f => f.id !== fileId);
        this.deletingFileId = null;
        this.isDeletingFile = false;
        this.toast.show('File removed.', 'success');
      },
      error: () => {
        this.deletingFileId = null;
        this.isDeletingFile = false;
        this.toast.show('Failed to remove file.', 'error');
      }
    });
  }

  // ── save / send ──────────────────────────────────────────────────────────────

  private buildFormData(status: string): FormData {
    const raw     = this.internalForm.getRawValue();
    const unit    = this.units.find(u => Number(u.id) === Number(raw.unitId));
    const auditor = this.auditorList.find(a => Number(a.id) === Number(raw.auditorId));
    const igUser  = this.allUserList.find(u => Number(u.id) === Number(raw.igUserId));

    const fd = new FormData();
    if (this.savedAuditId) fd.append('id', String(this.savedAuditId));
    fd.append('auditName',    raw.name ?? '');
    fd.append('auditMonth',   raw.auditMonth ?? '');
    fd.append('gist',         raw.auditDescription ?? '');
    fd.append('status',       status);
    fd.append('unitId',       String(raw.unitId));
    fd.append('unitName',     unit?.unitName ?? '');
    fd.append('casoId',       String(this.casoId));
    fd.append('casoName',     this.casoName);
    fd.append('casoRank',     this.casoRank);
    fd.append('casoNo',       this.casoNo);
    fd.append('auditorId',    String(raw.auditorId));
    fd.append('auditorName',  auditor?.name   ?? '');
    fd.append('auditorRank',  auditor?.rank   ?? '');
    fd.append('auditorNo',    auditor?.cisfno ?? '');
    fd.append('igUserId',     String(raw.igUserId));
    fd.append('igUserName',   igUser?.name   ?? '');
    fd.append('igUserRank',   igUser?.rank   ?? '');
    fd.append('igUserNo',     igUser?.cisfno ?? '');
    fd.append('createdBy',    this.loggedUser?.mstr_name ?? '');
    fd.append('createdById',  String(this.loggedUser?.id ?? 0));
    this.selectedFiles.forEach(f => fd.append('files', f, f.name));
    return fd;
  }

  saveAudit() {
    if (this.isSubmitting) return;
    if (this.internalForm.invalid) {
      this.internalForm.markAllAsTouched();
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    this.isSubmitting = true;
    this.internalAuditService.saveInternalAudit(this.buildFormData('Draft')).subscribe({
      next: (response: string) => {
        this.savedAuditId = Number(response) || null;
        this.formSaved    = true;
        this.selectedFiles = [];
        this.isSubmitting  = false;
        this.loadAudits();
        this.toast.show('Draft saved successfully.', 'success');
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toast.show('Error saving draft: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

  requestSendToAuditor() { this.showSendConfirm = true; }

  sendToAuditor() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.internalAuditService.saveInternalAudit(this.buildFormData('Auditor Bucket')).subscribe({
      next: () => {
        this.toast.show('Internal Audit sent to Auditor.', 'success');
        this.modalService.dismissAll();
        this.resetForm();
        this.loadAudits();
        this.isSubmitting = false;
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toast.show('Error: ' + (err?.error ?? err?.message), 'error');
      }
    });
  }

}

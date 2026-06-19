import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup,
  FormsModule, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnitDetails } from '../interface/UnitDetails';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { User } from '../interface/User';
import { IcaoAuditRecord, IcaoAuditFile } from '../interface/IcaoAuditRecord';
import { UnitService } from '../service/unit.service';
import { UsermanagementService } from '../service/usermanagement.service';
import { IcaoService } from '../service/icao.service';
import { ToastService } from '../service/toast.service';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const from = group.get('fromDate')?.value;
  const to   = group.get('toDate')?.value;
  if (from && to && new Date(from) > new Date(to)) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-icao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './icao.component.html',
  styleUrl: './icao.component.css'
})
export class IcaoComponent implements OnInit {

  audits: IcaoAuditRecord[] = [];
  units: UnitDetails[] = [];
  casoList: UserRoleDetails[] = [];
  loggedUser: User | null = null;

  casoName = '';
  casoRank = '';
  casoNo   = '';
  casoId   = 0;

  auditForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;
  selectedAudit: IcaoAuditRecord | null = null;

  searchText      = '';
  page            = 1;
  pageSize        = 10;
  pageSizeOptions = [5, 10, 20, 50];

  viewingFile: IcaoAuditFile | null = null;
  viewingFileUrl: SafeResourceUrl | null = null;
  private currentBlobUrl: string | null = null;

  private profileLoaded = false;
  private unitsLoaded   = false;

  // ── Stats ──────────────────────────────────────────────────────
  get totalAudits()     { return this.audits.length; }
  get thisMonthAudits() {
    const now = new Date();
    const ym  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.audits.filter(a => a.auditMonth === ym).length;
  }
  get auditsWithFiles() { return this.audits.filter(a => a.files && a.files.length > 0).length; }

  // ── Pagination ─────────────────────────────────────────────────
  get selectedUnitName(): string {
    return this.units.find(u => Number(u.id) === Number(this.auditForm.getRawValue().unitId))?.unitName
      ?? this.loggedUser?.unitmaster?.unitName ?? '—';
  }

  get filteredAudits() {
    let result = this.audits;
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
    private icaoService: IcaoService,
    private modalService: NgbModal,
    private toast: ToastService,
    private sanitizer: DomSanitizer
  ) {
    this.auditForm = this.fb.group({
      name:       new FormControl({ value: '', disabled: true }),
      unitId:     new FormControl({ value: '', disabled: true }),
      auditMonth: new FormControl('', [Validators.required]),
      fromDate:   new FormControl('', [Validators.required]),
      toDate:     new FormControl('', [Validators.required]),
      gist:       new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(500)])
    }, { validators: dateRangeValidator });
  }

  ngOnInit() {
    this.loadAudits();
    this.loadUnits();
    this.loadCasoList();
    this.loadUserProfile();
    this.auditForm.valueChanges.subscribe(() => this.generateName());
  }

  // ── Data loaders ───────────────────────────────────────────────

  loadAudits() {
    this.icaoService.getIcaoAudits().subscribe({
      next: data => { this.audits = data; },
      error: () => this.toast.show('Failed to load ICAO audits.', 'error')
    });
  }

  private loadUserProfile() {
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
    this.auditForm.patchValue({ unitId: uid }, { emitEvent: false });
    this.onUnitChange();
    this.generateName();
  }

  // ── Form helpers ───────────────────────────────────────────────

  private generateName() {
    const unitId     = this.auditForm.getRawValue().unitId;
    const auditMonth = this.auditForm.get('auditMonth')?.value;
    if (unitId && auditMonth) {
      const unit = this.units.find(u => Number(u.id) === Number(unitId));
      const [yr, mo] = auditMonth.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      this.auditForm.patchValue(
        { name: `${unit?.unitName ?? ''} - ICAO - ${label}` },
        { emitEvent: false }
      );
    }
  }

  onUnitChange() {
    const unitId = Number(this.auditForm.getRawValue().unitId);
    const unit   = this.units.find(u => u.id === unitId);
    if (!unit) return;
    this.casoName = unit.casoName ?? '';
    this.casoId   = unit.casoId  ?? 0;
    const casoUser = this.casoList.find(u => Number(u.id) === Number(unit.casoId));
    this.casoRank  = casoUser?.rank   ?? '';
    this.casoNo    = casoUser?.cisfno ?? '';
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const newFiles = input.files ? Array.from(input.files) : [];
    newFiles.forEach(f => {
      const dup = this.selectedFiles.some(e => e.name === f.name && e.size === f.size);
      if (!dup) this.selectedFiles.push(f);
    });
    input.value = '';
  }

  removeFile(index: number) { this.selectedFiles.splice(index, 1); }

  // ── Modal ──────────────────────────────────────────────────────

  viewAudit(audit: IcaoAuditRecord, content: any) {
    this.selectedAudit = audit;
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  openCreateModal(content: any) {
    this.resetForm();
    this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  private resetForm() {
    this.auditForm.reset();
    this.auditForm.get('unitId')?.disable();
    this.selectedFiles = [];
    this.casoName = '';
    this.casoRank = '';
    this.casoNo   = '';
    this.casoId   = 0;
    if (this.loggedUser?.unitid != null) this.applyUnitFromProfile();
  }

  // ── Save ───────────────────────────────────────────────────────

  saveAudit() {
    if (this.isSubmitting) return;
    this.auditForm.markAllAsTouched();
    if (this.auditForm.invalid) {
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    if (this.auditForm.hasError('dateRange')) {
      this.toast.show('From date must be on or before To date.', 'error');
      return;
    }

    const raw  = this.auditForm.getRawValue();
    const unit = this.units.find(u => Number(u.id) === Number(raw.unitId));
    const fd   = new FormData();
    fd.append('auditName',   raw.name);
    fd.append('unitId',      String(raw.unitId));
    fd.append('unitName',    unit?.unitName ?? '');
    fd.append('auditMonth',  raw.auditMonth);
    fd.append('fromDate',    raw.fromDate);
    fd.append('toDate',      raw.toDate);
    fd.append('gist',        raw.gist);
    fd.append('createdBy',   this.loggedUser?.mstr_name ?? '');
    fd.append('createdById', String(this.loggedUser?.id ?? 0));
    fd.append('casoId',      String(this.casoId));
    fd.append('casoName',    this.casoName);
    fd.append('casoRank',    this.casoRank);
    fd.append('casoNo',      this.casoNo);
    this.selectedFiles.forEach(f => fd.append('files', f, f.name));

    this.isSubmitting = true;
    this.icaoService.saveIcaoAudit(fd).subscribe({
      next: () => {
        this.toast.show('ICAO audit saved successfully.', 'success');
        this.resetForm();
        this.loadAudits();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: err => {
        this.toast.show('Error saving ICAO audit: ' + err, 'error');
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

  openFileViewer(file: IcaoAuditFile, content: any) {
    this.viewingFile    = file;
    this.viewingFileUrl = null;
    if (this.currentBlobUrl) { URL.revokeObjectURL(this.currentBlobUrl); this.currentBlobUrl = null; }
    this.modalService.open(content, { size: 'xl', backdrop: 'static' });
    this.icaoService.getIcaoFile(file.filePath).subscribe({
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

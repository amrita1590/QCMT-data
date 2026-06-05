import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuditScheduleTemplate } from '../../interface/AuditScheduleTemplate';
import { UnitDetails } from '../../interface/UnitDetails';
import { UserRoleDetails } from '../../interface/UserRoleDetails';
import { AuditscheduleserviceService } from '../../service/auditscheduleservice.service';
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

  internalAudits: AuditScheduleTemplate[] = [];
  internalForm: FormGroup;
  units: UnitDetails[] = [];
  auditorList: UserRoleDetails[] = [];
  casoName = '';
  casoId = 0;
  selectedPqFile: File | null = null;
  selectedPqFileName = '';
  isSubmitting = false;
  btnName = 'Create';
  private modalRef: NgbModalRef | null = null;
  templateId = 0;

  get totalInProgress() {
    return this.internalAudits.filter(t =>
      t.auditStatus === 'In Progress' || t.auditStatus === 'Observation APS' || t.auditStatus === 'Observation CASO'
    ).length;
  }
  get totalCompleted() {
    return this.internalAudits.filter(t => t.auditStatus === 'Completed').length;
  }
  get totalActionRequired() {
    return this.internalAudits.filter(t => t.auditStatus === 'Action Required').length;
  }

  constructor(
    private fb: FormBuilder,
    private auditService: AuditscheduleserviceService,
    private unitService: UnitService,
    private umService: UsermanagementService,
    private modalService: NgbModal,
    private toast: ToastService
  ) {
    this.internalForm = this.fb.group({
      id: new FormControl(''),
      name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]),
      unitId: new FormControl('', [Validators.required]),
      auditMonth: new FormControl('', [Validators.required]),
      auditScheduleFromDate: new FormControl('', [Validators.required]),
      auditScheduleToDate: new FormControl('', [Validators.required]),
      pqFile: new FormControl(''),
      auditorId: new FormControl('', [Validators.required]),
      auditDescription: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(400)])
    });
  }

  ngOnInit() {
    this.loadAudits();
    this.loadUnits();
    this.loadAuditors();
    this.internalForm.valueChanges.subscribe(() => this.generateName());
  }

  private generateName() {
    const unitId = this.internalForm.get('unitId')?.value;
    const auditMonth = this.internalForm.get('auditMonth')?.value;
    if (unitId && auditMonth) {
      const unit = this.units.find(u => Number(u.id) === Number(unitId));
      const [yr, mo] = auditMonth.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      this.internalForm.patchValue(
        { name: `${unit?.unitName ?? ''} - Internal - ${label}` },
        { emitEvent: false }
      );
    }
  }

  loadAudits() {
    this.auditService.getAuditDetails().subscribe({
      next: data => {
        this.internalAudits = data
          .filter(t => t.auditType === 'Internal')
          .sort((a, b) => a.name.localeCompare(b.name));
      },
      error: () => this.toast.show('Failed to load Internal audits', 'error')
    });
  }

  private loadUnits() {
    this.unitService.getUnitDetails().subscribe({
      next: data => this.units = data.sort((a, b) => a.unitName.localeCompare(b.unitName)),
      error: () => this.toast.show('Failed to load units', 'error')
    });
  }

  private loadAuditors() {
    this.umService.getUserAuditDetailList().subscribe({
      next: data => {
        this.auditorList = data
          .filter(u => u.rolename === 'Auditor')
          .sort((a, b) => a.name.localeCompare(b.name));
      },
      error: () => this.toast.show('Failed to load auditors', 'error')
    });
  }

  onUnitChange() {
    const unit = this.units.find(u => u.id === Number(this.internalForm.value.unitId));
    this.casoName = unit?.casoName ?? '';
    this.casoId = unit?.casoId ?? 0;
  }

  onPqFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedPqFile = file;
    this.selectedPqFileName = file ? file.name : '';
  }

  openCreateModal(content: any) {
    this.resetForm();
    this.btnName = 'Create';
    this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openDeleteModal(id: number, content: any) {
    this.templateId = id;
    this.modalRef = this.modalService.open(content, { backdrop: 'static' });
  }

  resetForm() {
    this.internalForm.reset();
    this.selectedPqFile = null;
    this.selectedPqFileName = '';
    this.casoName = '';
    this.casoId = 0;
  }

  saveAudit() {
    if (this.isSubmitting) return;
    if (this.internalForm.invalid) {
      this.internalForm.markAllAsTouched();
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    const from = this.internalForm.value.auditScheduleFromDate;
    const to = this.internalForm.value.auditScheduleToDate;
    if (new Date(from) > new Date(to)) {
      this.toast.show('From Date cannot be later than To Date.', 'error');
      return;
    }
    const unit = this.units.find(u => Number(u.id) === Number(this.internalForm.value.unitId));
    const auditor = this.auditorList.find(a => Number(a.id) === Number(this.internalForm.value.auditorId));
    const payload: AuditScheduleTemplate = {
      id: this.internalForm.value.id || 0,
      name: this.internalForm.value.name,
      unitId: Number(this.internalForm.value.unitId),
      unitName: unit?.unitName ?? '',
      auditMonth: this.internalForm.value.auditMonth,
      auditType: 'Internal',
      auditorId: Number(this.internalForm.value.auditorId),
      auditorName: auditor ? `${auditor.name}, ${auditor.rank}` : '',
      casoName: this.casoName,
      casoId: this.casoId,
      auditStatus: 'Planned',
      auditScheduleList: [],
      status: 'SAVED',
      createdBy: '',
      createdById: 0,
      createdAt: new Date().toISOString(),
      auditScheduleFromDate: from,
      auditScheduleToDate: to,
      auditDescription: this.internalForm.value.auditDescription
    };
    this.isSubmitting = true;
    this.auditService.saveAuditDetails(payload).subscribe({
      next: () => {
        this.toast.show('Internal audit saved successfully.', 'success');
        this.resetForm();
        this.loadAudits();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: err => {
        this.toast.show('Error saving Internal audit: ' + err, 'error');
        this.isSubmitting = false;
      }
    });
  }

  confirmDelete() {
    this.auditService.deleteAuditDetails(this.templateId).subscribe({
      next: () => {
        this.toast.show('Internal audit deleted successfully.', 'success');
        this.internalAudits = this.internalAudits.filter(a => a.id !== this.templateId);
        this.modalService.dismissAll();
      },
      error: () => this.toast.show('Failed to delete audit.', 'error')
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuditScheduleTemplate } from '../../interface/AuditScheduleTemplate';
import { AuditorResponse } from '../../interface/AuditorResponse';
import { UnitDetails } from '../../interface/UnitDetails';
import { AuditscheduleserviceService } from '../../service/auditscheduleservice.service';
import { UnitService } from '../../service/unit.service';
import { ToastService } from '../../service/toast.service';
import { APP_CONSTANTS } from '../../constants/app.constants';

@Component({
  selector: 'app-bcas-icao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bcas-icao.component.html',
  styleUrl: './bcas-icao.component.css'
})
export class BcasIcaoComponent implements OnInit {

  icaoAudits: AuditScheduleTemplate[] = [];
  icaoForm: FormGroup;
  units: UnitDetails[] = [];
  casoName = '';
  casoId = 0;
  selectedFiles: File[] = [];
  isSubmitting = false;
  private modalRef: NgbModalRef | null = null;

  selectedAuditFiles: AuditorResponse | null = null;
  loadingFiles = false;
  fileBaseUrl = APP_CONSTANTS.FILES.BASE_URL;

  get totalAudits() { return this.icaoAudits.length; }

  constructor(
    private fb: FormBuilder,
    private auditService: AuditscheduleserviceService,
    private unitService: UnitService,
    private modalService: NgbModal,
    private toast: ToastService
  ) {
    this.icaoForm = this.fb.group({
      id: new FormControl(''),
      name: new FormControl(''),
      unitId: new FormControl('', [Validators.required]),
      auditMonth: new FormControl('', [Validators.required]),
      auditScheduleFromDate: new FormControl('', [Validators.required]),
      auditScheduleToDate: new FormControl('', [Validators.required]),
      auditDescription: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(500)])
    });
  }

  ngOnInit() {
    this.loadAudits();
    this.loadUnits();
    this.icaoForm.valueChanges.subscribe(() => this.generateName());
  }

  private generateName() {
    const unitId = this.icaoForm.get('unitId')?.value;
    const auditMonth = this.icaoForm.get('auditMonth')?.value;
    if (unitId && auditMonth) {
      const unit = this.units.find(u => Number(u.id) === Number(unitId));
      const [yr, mo] = auditMonth.split('-');
      const label = new Date(+yr, +mo - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      this.icaoForm.patchValue({ name: `${unit?.unitName ?? ''} - ICAO - ${label}` }, { emitEvent: false });
    }
  }

  loadAudits() {
    this.auditService.getAuditDetails().subscribe({
      next: data => {
        this.icaoAudits = data
          .filter(t => t.auditType === 'ICAO')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      error: () => this.toast.show('Failed to load ICAO audits', 'error')
    });
  }

  private loadUnits() {
    this.unitService.getUnitDetails().subscribe({
      next: data => this.units = data.sort((a, b) => a.unitName.localeCompare(b.unitName)),
      error: () => this.toast.show('Failed to load units', 'error')
    });
  }

  onUnitChange() {
    const unit = this.units.find(u => u.id === Number(this.icaoForm.value.unitId));
    this.casoName = unit?.casoName ?? '';
    this.casoId = unit?.casoId ?? 0;
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  openCreateModal(content: any) {
    this.resetForm();
    this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  openFilesModal(audit: AuditScheduleTemplate, content: any) {
    this.selectedAuditFiles = null;
    this.loadingFiles = true;
    this.modalService.open(content, { size: 'lg' });
    this.auditService.getAuditorResponseDetails(audit.id).subscribe({
      next: data => {
        this.selectedAuditFiles = data;
        this.loadingFiles = false;
      },
      error: () => {
        this.loadingFiles = false;
        this.selectedAuditFiles = null;
      }
    });
  }

  resetForm() {
    this.icaoForm.reset();
    this.selectedFiles = [];
    this.casoName = '';
    this.casoId = 0;
  }

  saveAudit() {
    if (this.isSubmitting) return;
    if (this.icaoForm.invalid) {
      this.icaoForm.markAllAsTouched();
      this.toast.show('Please fill all required fields.', 'error');
      return;
    }
    const from = this.icaoForm.value.auditScheduleFromDate;
    const to = this.icaoForm.value.auditScheduleToDate;
    if (new Date(from) > new Date(to)) {
      this.toast.show('From Date cannot be later than To Date.', 'error');
      return;
    }
    const unit = this.units.find(u => Number(u.id) === Number(this.icaoForm.value.unitId));
    const payload: AuditScheduleTemplate = {
      id: 0,
      name: this.icaoForm.value.name,
      unitId: Number(this.icaoForm.value.unitId),
      unitName: unit?.unitName ?? '',
      auditMonth: this.icaoForm.value.auditMonth,
      auditType: 'ICAO',
      auditorId: 0,
      auditorName: '',
      casoName: this.casoName,
      casoId: this.casoId,
      auditStatus: 'Completed',
      auditScheduleList: [],
      status: 'SAVED',
      createdBy: '',
      createdById: 0,
      createdAt: new Date().toISOString(),
      auditScheduleFromDate: from,
      auditScheduleToDate: to,
      auditDescription: this.icaoForm.value.auditDescription
    };
    this.isSubmitting = true;
    this.auditService.saveAuditDetails(payload).subscribe({
      next: () => {
        if (this.selectedFiles.length > 0) {
          this.uploadFilesAfterSave();
        } else {
          this.finishSave();
        }
      },
      error: err => {
        this.toast.show('Error saving ICAO audit: ' + err, 'error');
        this.isSubmitting = false;
      }
    });
  }

  private uploadFilesAfterSave() {
    this.auditService.getAuditDetails().subscribe({
      next: data => {
        const newest = data
          .filter(t => t.auditType === 'ICAO')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (newest) {
          const formData = new FormData();
          formData.append('auditTemplateId', newest.id.toString());
          this.selectedFiles.forEach(f => formData.append('files', f, f.name));
          this.auditService.uploadIcaoFiles(formData).subscribe({
            next: () => this.finishSave(),
            error: () => {
              this.toast.show('Audit saved but file upload failed. Upload files from the list.', 'error');
              this.finishSave();
            }
          });
        } else {
          this.finishSave();
        }
      },
      error: () => this.finishSave()
    });
  }

  private finishSave() {
    this.toast.show('ICAO audit saved successfully.', 'success');
    this.resetForm();
    this.loadAudits();
    this.modalService.dismissAll();
    this.isSubmitting = false;
  }
}

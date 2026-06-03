import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../service/category.service';
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { RefreshService } from '../service/refresh.service';
import { ToastService } from '../service/toast.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UsermanagementService } from '../service/usermanagement.service';
import { UnitService } from '../service/unit.service';
import { UnitDetails } from '../interface/UnitDetails';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { QuestionTemplate } from '../interface/QuestionTemplate';

@Component({
  selector: 'app-bcas',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './bcas.component.html',
  styleUrl: './bcas.component.css'
})
export class BcasComponent {

 templates: AuditScheduleTemplate[] = [];
 bcasSchedules: AuditScheduleTemplate[] = [];
auditTemplateForm: FormGroup;
observationTemplateForm: FormGroup;
private modalRef: NgbModalRef | null = null;
toastMessage: string = '';
btnName:string='';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;
  tempStatus: string = "SAVED";
  
  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;
  units: UnitDetails[] = [];
    auditStatus: string = 'Planned';

    auditorList: UserRoleDetails[] = [];
    casoList: UserRoleDetails[] = [];
      searchTerm: string = '';
  templateName: string = '';
  templateId: number = 0;
  letterNo: string = '';
  letterDate: string = '';
  
  questionId: number = 0;
  selectedPqFile: File | null = null;
  selectedPqFileName = '';
  isSubmitting = false;
  casoName = '';
  casoId = 0;

audittemplateReset() {
    this.auditTemplateForm.reset({
      id: '',
      name: '',
      unitId: '',
      auditMonth: '',
      auditScheduleFromDate: '',
      auditScheduleToDate: '',
      pqFile: '',
      auditorId: '',
      auditDescription: '',
      auditType: 'BCAS',
      status: '',
      auditStatus: ''
    });
    this.selectedPqFile = null;
    this.selectedPqFileName = '';
    this.tempStatus = "SAVED";
    this.btnName = "Create";
}
constructor(private fb: FormBuilder, private auditService: AuditscheduleserviceService, private unitDetails: UnitService, private umService: UsermanagementService, private modalService: NgbModal, private toast: ToastService, private refreshService: RefreshService) {        
this.auditTemplateForm = this.fb.group({
        id : new FormControl(''),
        unitId:new FormControl('', [Validators.required]),
        name:new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]),
        // Date of the audit (can be set by user or system)
        //auditDate :new FormControl(''),
         auditMonth :new FormControl('', [Validators.required]),
        auditScheduleFromDate:new FormControl('', [Validators.required]),
        auditScheduleToDate:new FormControl('', [Validators.required]),
        pqFile:new FormControl(''),
        auditType:new FormControl('BCAS', [Validators.required]),
        status:new FormControl(''),
        auditStatus:new FormControl(''),
        auditorId: new FormControl('', [Validators.required]),
        auditDescription: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(400)])
        
      });
      this.observationTemplateForm = this.fb.group({
        id : new FormControl(''),
        letterNo:new FormControl('', [Validators.required]),
        letterDate :new FormControl('', [Validators.required])
      });
  }  
  ngOnInit() {  
   
    this.getAuditDetails(); // Initial load
    this.getUnitDetails(); // Initial load  
    this.getAuditorDetails(); // Initial load  
    this.auditTemplateForm.valueChanges.subscribe(() => {
      this.generateAuditName();
    });

  }
  generateAuditName() {
    const unitId = this.auditTemplateForm.get('unitId')?.value;
    const auditMonth = this.auditTemplateForm.get('auditMonth')?.value;

    if (unitId && auditMonth) {
      const selectedUnit = this.units.find(u => Number(u.id) === Number(unitId));
      const unitName = selectedUnit ? selectedUnit.unitName : '';
      const [year, month] = auditMonth.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1);
      const formattedDate = dateObj.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      this.auditTemplateForm.patchValue({
        name: `${unitName} - BCAS - ${formattedDate}`
      }, { emitEvent: false });
    }
  }

  getAuditDetails() {
    this.auditService.getAuditDetails().subscribe({
      next: (data) => {
        this.templates = data.sort((a, b) => a.name.localeCompare(b.name));
        this.bcasSchedules = this.templates.filter(template => template.auditType === 'BCAS');
      },
      error: (err) => {
        this.toast.show('Failed to fetch BCAS audit schedules' + err, 'error');
        console.error('Failed to fetch BCAS audit schedules', err);
      }
    });
  }

  getUnitDetails() {
    this.unitDetails.getUnitDetails().subscribe({
      next: (data) => {
        this.units = data.sort((a, b) => a.unitName.localeCompare(b.unitName));
        console.log('Units:', this.units);
      },
      error: (err) => {
         this.toast.show('Failed to fetch units'+ err, 'error');
        console.error('Failed to fetch units', err);
      }
    });
  }
  
  getAuditorDetails() {
    this.umService.getUserAuditDetailList().subscribe({
      next: (data) => {
        console.log(":::::::::::::::"+data);
        this.auditorList = data.filter(user => user.rolename === 'Auditor');        
        this.auditorList = this.auditorList.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Auditors:', this.auditorList);
         this.casoList = data.filter(user => user.rolename === 'CASO');
         console.log('CASOs:', this.casoList);
      },
      error: (err) => {
         this.toast.show('Failed to fetch auditors'+ err, 'error');
        console.error('Failed to fetch auditors', err);
      }
    });
  }
  onUnitChange() {
    const selectedId = Number(this.auditTemplateForm.value.unitId);
    const unitDetails = this.units.find(u => u.id === selectedId);
    this.casoName = unitDetails ? unitDetails.casoName : '';
    this.casoId = unitDetails ? (unitDetails.casoId ?? 0) : 0;
  }

  onPqFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedPqFile = file;
    this.selectedPqFileName = file ? file.name : '';
  }

  addAuditTemplate() {
    if (this.isSubmitting) {
      return;
    }

    if (this.auditTemplateForm.invalid) {
      this.auditTemplateForm.markAllAsTouched();
      this.toast.show('Please fill all required BCAS audit schedule fields.', 'error');
      return;
    }

    const fromDate = this.auditTemplateForm.value.auditScheduleFromDate;
    const toDate = this.auditTemplateForm.value.auditScheduleToDate;
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      this.toast.show('Audit From Date cannot be later than To Date.', 'error');
      return;
    }

    const selectedAuditor = this.auditorList.find(a => Number(a.id) === Number(this.auditTemplateForm.value.auditorId));
    const selectedUnit = this.units.find(u => Number(u.id) === Number(this.auditTemplateForm.value.unitId));

    const auditScheduleTemplate: AuditScheduleTemplate = {
      id: this.auditTemplateForm.value.id || 0,
      unitId: Number(this.auditTemplateForm.value.unitId),
      unitName: selectedUnit ? selectedUnit.unitName : '',
      name: this.auditTemplateForm.value.name,
      auditMonth: this.auditTemplateForm.value.auditMonth,
      auditType: 'BCAS',
      auditorId: Number(this.auditTemplateForm.value.auditorId),
      auditorName: selectedAuditor ? `${selectedAuditor.name}, ${selectedAuditor.rank}` : '',
      casoName: this.casoName,
      casoId: this.casoId,
      auditStatus: this.auditStatus,
      auditScheduleList: [],
      status: this.tempStatus,
      createdBy: '',
      createdById: 0,
      createdAt: new Date().toISOString(),
      auditScheduleFromDate: this.auditTemplateForm.value.auditScheduleFromDate,
      auditScheduleToDate: this.auditTemplateForm.value.auditScheduleToDate,
      auditDescription: this.auditTemplateForm.value.auditDescription
    };

    this.isSubmitting = true;
    this.auditService.saveAuditDetails(auditScheduleTemplate).subscribe({
      next: () => {
        this.toast.show('BCAS audit schedule saved successfully.', 'success');
        this.audittemplateReset();
        this.getAuditDetails();
        this.modalService.dismissAll();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMsg = 'Error saving BCAS audit schedule: ' + err;
        this.errorStatus = true;
        this.isSubmitting = false;
        setTimeout(() => {
          this.errorStatus = false;
        }, 10000);
      }
    });
  }

    get totalInProgress() {
    return this.bcasSchedules.filter(t => t.auditStatus === "In Progress" || t.auditStatus === "Observation APS" || t.auditStatus === "Observation CASO").length;
  }

  get totalCompleted() {
    return this.bcasSchedules.filter(t => t.auditStatus === "Completed").length;
  }

  get totalActionRequired() {
    return this.bcasSchedules.filter(t => t.auditStatus === "Action Required").length;
  }

  get compliancePercentage() {
    
    return 0;
  }
  createModal(content: any) {
    console.log(":::::::::::::::");
    this.audittemplateReset();
    this.btnName = "Create";
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

    deleteTemplate(id: number, modalId: string) {
      console.log('Deleting Template', id);
      this.deleteAuditTemplate(id);
      this.templates = this.templates.filter(x => x.id !== id);
      this.modalRef?.close();
  }
  deleteAuditTemplate(id:number) {
    console.log(":::::::::::::::::"+id);
    this.auditService.deleteAuditDetails(id).subscribe({
      next: (data) => {
        console.log('Response ::', data);
        this.toast.show('Audit Template deleted successfully.', 'success')
      
        setTimeout(() => {
          this.successStatus = false;
        }, 10000); // 10000 milliseconds = 10 seconds
      },
      error: (err) => {
        console.error('Unable to delete audit template ::', err);
        this.errorMsg = "Unable to delete audit template :", err;
        this.errorStatus = true;
        setTimeout(() => {
          this.errorStatus = false;
        }, 10000); // 10000 milliseconds = 10 seconds
      }
    });
  }
}

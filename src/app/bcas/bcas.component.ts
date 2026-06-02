import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  imports: [NgIf,NgFor],
  templateUrl: './bcas.component.html',
  styleUrl: './bcas.component.css'
})
export class BcasComponent {

 templates: AuditScheduleTemplate[] = [];
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
audittemplateReset() {
    this.auditTemplateForm.reset();
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
        auditType:new FormControl('', [Validators.required]),
        status:new FormControl(''),
        auditStatus:new FormControl(''),
        auditorId: new FormControl('', [Validators.required]),
        
      });
      this.observationTemplateForm = this.fb.group({
        id : new FormControl(''),
        letterNo:new FormControl('', [Validators.required]),
        letterDate :new FormControl('', [Validators.required])
      });
  }  
  ngOnInit() {  
   
    this.getUnitDetails(); // Initial load  
    this.getAuditorDetails(); // Initial load  
 

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
    get totalInProgress() {
    return this.templates.filter(t => t.auditStatus === "In Progress" || t.auditStatus === "Observation APS" || t.auditStatus === "Observation CASO").length;
  }

  get totalCompleted() {
    return this.templates.filter(t => t.auditStatus === "Completed").length;
  }

  get totalActionRequired() {
    return this.templates.filter(t => t.auditStatus === "Action Required").length;
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
  addAuditTemplate(questionTemplate: QuestionTemplate) {

  }
  
}

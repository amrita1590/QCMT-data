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
}

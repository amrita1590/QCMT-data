import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuestionTemplate } from '../interface/QuestionTemplate';
import { CategoryService } from '../service/category.service';
import { CategoryDetails } from '../interface/CategoryDetails';
import { QuestionsService } from '../service/questions.service';
import { AuditSchedule } from '../interface/AuditSchedule';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { UnitService } from '../service/unit.service';
import { UnitDetails } from '../interface/UnitDetails';
import { UsermanagementService } from '../service/usermanagement.service';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { User } from '../interface/User';
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { AuditTemplateGen } from '../interface/AuditTemplateGen';
import { ToastService } from '../service/toast.service';
import { AuditObservationComponent } from '../interface/AuditObservationComponent';
import { AuditObservation } from '../interface/AuditObservation';
import { AuditObservationChatComponentComponent } from "../audit-observation-chat-component/audit-observation-chat-component.component";
import { RefreshService } from '../service/refresh.service';
import { AuditObservationComponentMessage } from '../interface/AuditObservationComponentMessage';
import { HttpEventType } from '@angular/common/http';
import { AuditBoardScheduleTemplate } from '../interface/AuditBoardScheduleTemplate';
import { AuditBoardTemplateGen } from '../interface/AuditBoardTemplateGen';
import { audit, forkJoin } from 'rxjs';
import { AuditorQuestions } from '../interface/auditor-questions';
import { AuditorResponseFilesTemp } from '../interface/AuditorResponseFilesTemp';
import { APP_CONSTANTS } from '../constants/app.constants';
import { NotificationBean } from '../interface/NotificationBean';

@Component({
  selector: 'app-auditschedule',
  imports: [ReactiveFormsModule, NgClass, CommonModule, FormsModule, AuditObservationChatComponentComponent],
  templateUrl: './auditschedule.component.html',
  styleUrl: './auditschedule.component.css'
})
export class AuditscheduleComponent {
  
  constants = APP_CONSTANTS;
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  casoResponseFilesTemp: AuditorResponseFilesTemp[] = [];
  searchTerm: string = '';
  templateName: string = '';
  templateId: number = 0;
  letterNo: string = '';
  letterDate: string = '';
  
  questionId: number = 0;
  questionIndex: number = 0;

  observationId: number = 0;
  observationIndex: number = 0;

  casoName: string = '';
  casoId: number = 0;
  
  auditTemplateForm: FormGroup;
  observationTemplateForm: FormGroup;

  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;

  btnName = "Create";
  status: boolean = false;
  typeStatus: string = "Non-Basic";

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  showToastFlag: boolean = false;
  tempStatus: string = "SAVED";

  private modalRef: NgbModalRef | null = null;

  auditComponent: AuditSchedule[] = [];

  auditObservationComponent: AuditObservationComponent[] = [];
  auditObservation: AuditObservation | null = null;

  auditObservationComponentBean: AuditObservationComponent | null = null;

  categories: CategoryDetails[] = [];
  units: UnitDetails[] = [];
  auditStatus: string = 'Planned';


  templates: AuditScheduleTemplate[] = [];
  auditScheduleTemplate: AuditScheduleTemplate | null = null;
  questionTemplates: QuestionTemplate[] = [];
  auditorList: UserRoleDetails[] = [];
  casoList: UserRoleDetails[] = [];
  auditTemplateGen: AuditTemplateGen | null = null;

  notificationBean: NotificationBean | null = null;
  isSubmitting:boolean = false;

  auditObservationComponentMessage: AuditObservationComponentMessage = {
      id: 0,
      auditObservationComponentId: 0,
      letterNo: '',
      letterDate: '',
      attachmentStatus: '',
      filePath: '',
      fileName: '',
      complianceMessage: '',
      status: '',
      createdBy: '',
      entryDate: '',
      entryTime: ''
  };

  rows: { index:number, categoryId: null | string | number, templateId: null | string | number, templateOptions: QuestionTemplate[] }[] = [];

  searchText = '';
  page = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  selectedTab: 'active' | 'dropped' = 'active';
  filterCriticality = '';
  // Assume API filled this
  allObservations: any[] = [];
  chatObservationStatus: string = '';

  constructor(private fb: FormBuilder, private categoryService: CategoryService, private auditService: AuditscheduleserviceService, private questionsService: QuestionsService, private unitDetails: UnitService, private umService: UsermanagementService, private modalService: NgbModal, private toast: ToastService, private refreshService: RefreshService) {        
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
        auditDescription: new FormControl('', [Validators.required])
      });
      this.observationTemplateForm = this.fb.group({
        id : new FormControl(''),
        letterNo:new FormControl('', [Validators.required]),
        letterDate :new FormControl('', [Validators.required])
      });
  }  
  
  auditorQuestions!: AuditorQuestions;
  selectedTemplateId!: number;
  ngOnInit() {  
    this.questionsService.currentQuestionData.subscribe(data => {
        if (data) {
          this.auditTemplateForm.patchValue(data); // Assuming you use Reactive Forms
          this.btnName = "Update";
        }
    });
    this.auditComponent = [
      {
        id: 0, index: 1, category: 0, categoryName: '', template: 0, templateName: '', information: '', createdBy: '', entryDate: '', status: '' },
      { id: 0, index: 2, category: 0, categoryName: '', template: 0, templateName: '', information: '', createdBy: '', entryDate: '', status: '' }
    ]; 
    this.auditObservationComponent = [
      {
        id: 0, index: 1, auditObservationId: 0, templateId: 0, templateName: '', createdBy: '', entryDate: '', complianceStatus: '', remarks: '', typeCriticality: '', observation: '', letterNo: '', letterDate: '', entryTime: '', status: '', auditObservationComponentMessageList: [] },
      { id: 0, index: 2, auditObservationId: 0, templateId: 0, templateName: '', createdBy: '', entryDate: '', complianceStatus: '', remarks: '', typeCriticality: '', observation: '', letterNo: '', letterDate: '', entryTime: '', status: '', auditObservationComponentMessageList: [] }
    ];
    this.getAuditDetails(); // Initial load
    this.getQuestionsDetails(); // Initial load 
    this.getCategoryDetails(); // Initial load 
    this.getUnitDetails(); // Initial load  
    this.getAuditorDetails(); // Initial load  
    this.auditTemplateForm.valueChanges.subscribe(value => {
      this.generateAuditName();
    });


  }
generateAuditName() {

  const unitId = this.auditTemplateForm.get('unitId')?.value;
  const auditMonth = this.auditTemplateForm.get('auditMonth')?.value;
  const auditType = this.auditTemplateForm.get('auditType')?.value;

  if (unitId && auditMonth && auditType) {

    const selectedUnit = this.units.find(u => u.id == unitId);
    const unitName = selectedUnit ? selectedUnit.unitName : '';

    // auditMonth will be like "2026-02"
    const [year, month] = auditMonth.split('-');

    const dateObj = new Date(Number(year), Number(month) - 1);

    const formattedDate = dateObj.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const auditName = `${unitName} - ${auditType} - ${formattedDate}`;
console.log("Generated Audit Name:", auditName);
    this.auditTemplateForm.patchValue({
      name: auditName
    }, { emitEvent: false });

  }
}
  getAuditDetails() {
    this.auditService.getAuditDetails().subscribe({
      next: (data) => {
        this.templates = data.sort((a, b) => a.name.localeCompare(b.name));
        console.log('Templates:', this.templates);
      },
      error: (err) => {
         this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }
  
  getQuestionsDetails() {
    this.questionsService.getQuestionDetails().subscribe({
      next: (data) => {
       // this.questionTemplates = data.sort((a, b) => a.name.localeCompare(b.name));
       this.questionTemplates = data.sort((a, b) => a.id - b.id);
        console.log('Templates:', this.questionTemplates);
      },
      error: (err) => {
         this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }

  getCategoryDetails() {
    this.categoryService.getCategoryDetails().subscribe({
      next: (data) => {
        this.categories = data.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
        console.log('Categories:', this.categories);
      },
      error: (err) => {
         this.toast.show('Failed to fetch categories'+ err, 'error');
        console.error('Failed to fetch categories', err);
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
      console.log("Unit changed for unitId:", this.auditTemplateForm.value.unitId);
      console.log("Unit Details ::::", this.units);

      const selectedId = Number(this.auditTemplateForm.value.unitId);
      const unitDetails = this.units.find(u => u.id === selectedId);
       if(this.casoList&&this.casoList.length>0) {    
    for (const caso of this.casoList) {
      if (caso.id === unitDetails?.casoId) {
        this.casoName = caso.name+' , '+caso.rank;
        break;
      }
    }}else{

      this.casoName = unitDetails ? (unitDetails.casoName) : '';
    }
      //this.casoName = unitDetails ? (unitDetails.casoName) : '';
      this.casoId = unitDetails ? (unitDetails.casoId ?? 0) : 0;

      console.log("CASO Name::::" + this.casoName);
      console.log("CASO ID Name::::" + this.casoId);
  }

 onCategoryChange(rowIndex: number) {
    console.log("Category changed for row:", rowIndex);

    const selectedCategory = this.auditComponent[rowIndex]?.category;
    console.log("Selected Category:", selectedCategory);

    if (!selectedCategory) {
      console.warn("No category selected — clearing template options");
      this.rows[rowIndex].templateOptions = [];
      this.rows[rowIndex].templateId = null;
      return;
    }

    console.log("All Templates:", this.questionTemplates);

    // Filter by matching category
    const filtered = this.questionTemplates.filter(t => {
      return String(t.category).trim() === String(selectedCategory).trim();
    });

    console.log("Filtered Templates:", filtered);

    this.rows[rowIndex].templateOptions = filtered;

    // Reset previously selected template
    this.rows[rowIndex].templateId = null;
  }

  // Button Actions
  addObservationTemplate(auditObservation: AuditObservation) {
      
      if (!this.observationTemplateForm.value.letterNo) {
        this.toast.show("Please Enter Observation Letter Number.", 'error');
        return;
      }
      if (!this.observationTemplateForm.value.letterDate) {
        this.toast.show("Please Enter Observation Letter Date.", 'error');
        return;
      }
      if (this.auditObservationComponent.some(fc => !fc.observation || fc.observation === null || !fc.complianceStatus || fc.complianceStatus === null || !fc.typeCriticality || fc.typeCriticality === null)) {
        this.toast.show("Please fill all observation fields.", 'error');
        return;
      }
      this.auditObservationComponent.map(component => {
        component.status = 'APSHQrs';
        return component;
      });
      // Prepare the observation data
      this.auditObservation = {
        id: this.observationTemplateForm.value.id,
        letterDate: this.observationTemplateForm.value.letterDate,
        letterNo: this.observationTemplateForm.value.letterNo,
        auditTemplateId: this.templateId,
        auditTemplateName: '',
        createdBy: '',
        status: 'APSHQrs',
        observationStatus: 'submitted',
        creationDate: new Date().toISOString(),
        auditObservationComponent: this.auditObservationComponent
      };
      console.log("Audit Observation Data:", this.auditObservation);
      console.log(this.auditScheduleTemplate);

      this.auditService.saveAuditObservationDetails(this.auditObservation).subscribe(response => {
        console.log("Audit Observation Details saved successfully!", response);
        this.toast.show('Audit Observation Details added successfully!', 'success');
        this.auditScheduleTemplate = this.templates.find(t => t.id === this.templateId) || null;
        console.log('Notification started for observation::::',this.auditScheduleTemplate);
        if(this.auditScheduleTemplate) {
          const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.CASO_OBSERVATION_REQUIRED, this.auditScheduleTemplate);
            this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName,this.auditScheduleTemplate.auditorId,this.auditScheduleTemplate.casoId).subscribe({
              next: (data) => {
                console.log('Notification sent successfully', data);
              }
            });
        }
        this.auditObservationReset();
        this.getAuditDetails(); // Refresh the list
        
        this.modalService.dismissAll();
      }, error => {
        this.toast.show("Error saving audit observation details: " + error, 'error');
      });    
  }

  saveObservationTemplate(auditObservation: AuditObservation) {
      
      if (!this.observationTemplateForm.value.letterNo) {
        this.toast.show("Please Enter Observation Letter Number.", 'error');
        return;
      }
      if (!this.observationTemplateForm.value.letterDate) {
        this.toast.show("Please Enter Observation Letter Date.", 'error');
        return;
      }
      if (this.auditObservationComponent.some(fc => !fc.observation || fc.observation === null || !fc.complianceStatus || fc.complianceStatus === null || !fc.typeCriticality || fc.typeCriticality === null)) {
        this.toast.show("Please fill all observation fields.", 'error');
        return;
      }
      // Prepare the observation data
      this.auditObservation = {
        id: this.observationTemplateForm.value.id,
        letterDate: this.observationTemplateForm.value.letterDate,
        letterNo: this.observationTemplateForm.value.letterNo,
        auditTemplateId: this.templateId,
        auditTemplateName: '',
        createdBy: '',
        status: 'APSHQrs',
        observationStatus: 'saved',
        creationDate: new Date().toISOString(),
        auditObservationComponent: this.auditObservationComponent
      };
      console.log("Audit Observation Data:", this.auditObservation);
      console.log(this.auditScheduleTemplate);

      this.auditService.saveAuditObservationDetails(this.auditObservation).subscribe(response => {
        console.log("Audit Observation Details saved successfully!", response);
        this.toast.show('Audit Observation Details added successfully!', 'success');
        this.auditScheduleTemplate = this.templates.find(t => t.id === this.templateId) || null;
       /*  if(this.auditScheduleTemplate) {
        const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.CASO_OBSERVATION_REQUIRED, this.auditScheduleTemplate);
        this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName,this.auditScheduleTemplate.auditorId,this.auditScheduleTemplate.casoId).subscribe({
          next: (data) => {
                console.log('Notification sent successfully', data);
              }
            });
        } */
        this.auditObservationReset();
        this.getAuditDetails(); // Refresh the list
        
        this.modalService.dismissAll();
      }, error => {
        this.toast.show("Error saving audit observation details: " + error, 'error');
      });    
  }

  addAuditTemplate(questionTemplate: QuestionTemplate) {
    
    if(this.isSubmitting){
      return;
    }
    if (!this.auditTemplateForm.value.name) {
      this.toast.show("Please Enter Audit Name.", 'error');
      return;
    }
    if (!this.auditTemplateForm.value.unitId) {
      this.toast.show("Please select a unit name.", 'error');
      return;
    }
    if (!this.auditTemplateForm.value.auditorId) {
      this.toast.show("Please select an auditor.", 'error');
      return;
    }
    /*if (!this.auditTemplateForm.value.auditDate) {
      this.toast.show("Please select an audit date.", 'error');
      return;
    }*/
   if (!this.auditTemplateForm.value.auditMonth) {
      this.toast.show("Please select an audit Month.", 'error');
      return;
    }
    if (!this.auditTemplateForm.value.auditType) {
      this.toast.show("Please select an audit type.", 'error');
      return;
    }
    if (!this.auditTemplateForm.value.auditDescription) {
      this.toast.show("Please enter short audit descrition.", 'error');
      return;
    }
    const desc = this.auditTemplateForm.value.auditDescription;
    if (!desc || desc.length < 50 || desc.length > 400) {
      this.toast.show("Audit short description must be between 50 and 400 characters.", 'error');
      return;
    }
    if (this.auditComponent.length === 0) {
      this.toast.show("Please add at least one question before submitting the audit.", "error");
      return;
    }
    if (this.auditComponent.some(fc => !fc.template || fc.template === null || !fc.category || fc.category === 0)) {
      this.toast.show("Please fill in all template fields. Category and Template cannot be left blank—either provide the required data or remove the entry.", 'error');
      return;
    }

    console.log("Audit form value" ,this.auditTemplateForm.value);
    console.log(this.auditComponent);
     console.log(this.auditorList+"list  auditorList id: "+this.auditTemplateForm.value.auditorId);
    let auditorName = '';

if (this.auditorList && this.auditorList.length > 0) {

  for (const auditor of this.auditorList) {

    if (Number(auditor.id) === Number(this.auditTemplateForm.value.auditorId)) {

      auditorName = auditor.name + ', ' + auditor.rank;

      break;
    }
  }
}

 console.log(" - "+this.auditTemplateForm.value.auditorName);
    this.auditScheduleTemplate = {
      id: this.auditTemplateForm.value.id,
      unitId: this.auditTemplateForm.value.unitId,
      unitName: this.auditTemplateForm.value.unitName,
      name: this.auditTemplateForm.value.name,
      auditMonth: this.auditTemplateForm.value.auditMonth,
      auditType: this.auditTemplateForm.value.auditType,
      auditorId: this.auditTemplateForm.value.auditorId,
      auditorName: auditorName,
      casoName: this.casoName,
      casoId: this.casoId,
      auditStatus: this.auditStatus,
      auditScheduleList: this.auditComponent,
      status: this.tempStatus,
      createdBy: '', // Add current user if available
      createdById: 0, // Add current user ID if available
      createdAt: new Date().toISOString(),
      
      auditScheduleFromDate: '',
	    auditScheduleToDate: '',
      auditDescription: this.auditTemplateForm.value.auditDescription
    };
    
    console.log(this.auditScheduleTemplate);
    
    if(this.auditScheduleTemplate) {
      this.isSubmitting = true;
      console.log("Audit month"+this.auditScheduleTemplate.auditMonth);
      this.auditService.saveAuditDetails(this.auditScheduleTemplate).subscribe(response => {
        console.log("Audit Schedule Template saved successfully!", response);
        this.toast.show('Audit Schedule Template added successfully!', 'success');       
        if (this.auditScheduleTemplate) {
            const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.NEW_AUDIT_CREATED, this.auditScheduleTemplate);
            this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.auditorName,this.auditTemplateForm.value.auditorId,this.auditScheduleTemplate.casoId).subscribe({
              next: (data) => {
                console.log('Notification sent successfully', data);
              }
          });
        }
        this.audittemplateReset();
        this.getAuditDetails(); // Refresh the list
        this.modalService.dismissAll();
        this.isSubmitting = false;
      }, error => {
        this.errorMsg = "Error saving audit schedule template:", error;
        this.errorStatus = true;
         this.isSubmitting = false;
        setTimeout(() => {
          this.errorStatus = false;
        }, 10000); // 10000 milliseconds = 10 seconds
      });  
    }   
  }

  viewTemplate(content: any, id: number) {
      const template = this.templates.find(t => t.id === id);
      if (!template) return;
      this.auditTemplateGen = {
          id: 0,
          auditScheduleTemplate: template,
          questionTemplateList: []  
      };
      // Populate template names in auditScheduleList
      template.auditScheduleList.forEach(schedule => {
          this.questionsService.getQuestionDetails().subscribe(questions => {
            
          const matchedTemplate = questions.find(q => q.id === schedule.template);
          if (matchedTemplate) {
            this.auditTemplateGen?.questionTemplateList.push(matchedTemplate);
          }
        });
      });
      this.auditScheduleTemplate = template;
      this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }

  editTemplate(content: any, id: number) {
    const template = this.templates.find(t => t.id === id);

    
    if (!template) return;
    console.log("Editing month  ususiwie ID:", template);
    this.auditScheduleTemplate = template;
    if(this.auditScheduleTemplate.auditStatus !== 'Planned') {
      this.toast.show('Action denied: This audit cannot be edited as it has already moved to the Auditor/CASO bucket.', 'error')
      return;
    }
    
    this.auditTemplateForm  = template ? this.fb.group({
      id : new FormControl(template.id),
      unitId:new FormControl(template.unitId, [Validators.required]),
      unitName: new FormControl(template.unitName),
      name: new FormControl(template.name, [Validators.required]),
      auditMonth: new FormControl(template.auditMonth, [Validators.required]),
      //auditDate: new FormControl(template.auditDate),
      auditType: new FormControl(template.auditType, [Validators.required]),
      auditorId: new FormControl(template.auditorId),
      auditorName: new FormControl(template.auditorName),
      casoName: new FormControl(template.casoName),
      casoId: new FormControl(template.casoId),
      status:new FormControl(template.status),
      auditStatus:new FormControl(template.auditStatus),
      auditDescription: new FormControl(template.auditDescription),
    }) : this.auditTemplateForm;
     this.listenForNameChanges();
    this.casoName = template.casoName;
    this.casoId = template.casoId;

    this.auditComponent = template.auditScheduleList || [];
    this.rows = [];
    this.auditComponent = this.auditComponent.map((schedule, index) => ({ ...schedule, index: index + 1 }));
    console.log("Editing Template:", this.auditComponent);
    console.log("Editing Template Form12:", this.rows);
    template.auditScheduleList.forEach((schedule, index) => {
      this.rows.push({ index: index+1, categoryId: schedule.category, templateId: schedule.template, templateOptions: [] });
      this.onCategoryChange(index);
    });
    
    console.log("Editing Template Form21:", this.rows);

    this.btnName = "Update";
    this.tempStatus = "EDITED";

    // OPEN MODAL FIRST
    this.modalRef = this.modalService.open(content, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    // THEN PATCH THE FORM
    this.auditTemplateForm.patchValue({
      id: template.id,
      unitName: template.unitName, // ensures category selection works
      name: template.name,
      auditType: template.auditType,
      status: template.status,
      auditMonth:template.auditMonth,
      auditDescription: template.auditDescription
    });
  }
listenForNameChanges() {

  this.auditTemplateForm.get('unitId')?.valueChanges.subscribe(() => {
    this.generateAuditName();
  });

  this.auditTemplateForm.get('auditMonth')?.valueChanges.subscribe(() => {
    this.generateAuditName();
  });

  this.auditTemplateForm.get('auditType')?.valueChanges.subscribe(() => {
    this.generateAuditName();
  });

}
  openModal(content: any, templateId: number, templateName: string) {
    this.templateName = templateName;
    this.templateId = templateId;

    this.modalRef = this.modalService.open(content, { centered: true });
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
        this.getAuditDetails();
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
 
  createModal(content: any) {
    console.log(":::::::::::::::");
    this.audittemplateReset();
    this.btnName = "Create";
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  createObservation(content: any, id: number) {
    console.log(":::::::::::::::");    
    this.getAuditObservationComponent(id);
    this.templateId = id;    
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  audittemplateReset() {
    this.auditTemplateForm.reset();
    this.tempStatus = "SAVED";
    this.btnName = "Create";
    this.auditComponent = [
      { id: 0, index: 1, category: 0, categoryName: '', template: 0, templateName: '', information: '', createdBy: '', entryDate: '', status: '' },
      { id: 0, index: 2, category: 0, categoryName: '', template: 0, templateName: '', information: '', createdBy: '', entryDate: '', status: '' }
    ]; 
    this.rows = [
    { index: 1,categoryId: null, templateId: null, templateOptions: [] },
    { index: 2,categoryId: null, templateId: null, templateOptions: [] }];
  }

  auditObservationReset() {
    this.observationTemplateForm.reset();
    this.tempStatus = "SAVED";
    this.btnName = "Create";
    this.auditObservationComponent = [
     {
        id: 0, index: 1, auditObservationId: 0, templateId: 0, templateName: '', createdBy: '', entryDate: '', complianceStatus: '', remarks: '', typeCriticality: '', observation: '', letterNo: '', letterDate: '', entryTime: '', status: '', auditObservationComponentMessageList: [] },
      { id: 0, index: 2, auditObservationId: 0, templateId: 0, templateName: '', createdBy: '', entryDate: '', complianceStatus: '', remarks: '', typeCriticality: '', observation: '', letterNo: '', letterDate: '', entryTime: '', status: '', auditObservationComponentMessageList: [] }
    ]; 
  }

  addAudit() {
    const newComponent: AuditSchedule = {
      id: 0,
      index: this.auditComponent.length + 1,
      information: '',
      createdBy: '',
      entryDate: '',
      status: '',
      category: 0,
      categoryName: '',
      templateName: '',
      template: 0
    };
    this.rows.push({ index: newComponent.index, categoryId: null, templateId: null, templateOptions: [] });
    this.auditComponent.push(newComponent);
  }

  addObservation() {
    const newComponent: AuditObservationComponent = {
      id: 0,
      index: this.auditObservationComponent.length + 1,
      auditObservationId: 0,
      templateId: 0,
      templateName: '',
      createdBy: '',
      entryDate: '',
      complianceStatus: '',
      remarks: '',
      typeCriticality: '',
      observation: '',
      letterNo: '',
      letterDate: '',
      entryTime: '',
      status: '',
      auditObservationComponentMessageList: []
    };
    this.auditObservationComponent.push(newComponent);
  }

  removeAudit(content: any, id: number, index: number) {
    this.questionId = id;
    this.questionIndex = index;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  removeObservation(content: any, id: number, index: number) {
    this.observationId = id;
    this.observationIndex = index;
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  deleteAudit(id: number, index: number, content: any) {
      console.log("ID :::::::::::::::::"+id);
      if(id !== 0) {
        this.auditService.deleteAudit(id).subscribe({
          next: (data) => {
            console.log('Response ::', data);
             this.toast.show('Audit deleted successfully.', 'success')
            this.auditComponent = this.auditComponent.filter(component => component.id !== id);
            this.rows = this.rows.filter(row => row.index !== index);
          },
          error: (err) => {
            console.error('Unable to delete category ::', err);
            this.errorMsg = "Unable to delete category :", err;
            this.errorStatus = true;
            setTimeout(() => {
              this.errorStatus = false;
            }, 10000); // 10000 milliseconds = 10 seconds
          }
        });
      } else {
        console.log("Audit not saved yet, removing locally.");
        this.auditComponent = this.auditComponent.filter(component => component.index !== index);
        this.rows = this.rows.filter(row => row.index !== index);
      }
     
      this.modalRef?.close();
  }

  deleteObservation(id: number, index: number, content: any) {
      if(id !== 0) {
        this.auditService.deleteObservation(id).subscribe({
          next: (data) => {
            console.log('Response ::', data);
             this.toast.show('Observation deleted successfully.', 'success')
             this.auditObservationComponent = this.auditObservationComponent.filter(component => component.index !== index);
             this.rows = this.rows.filter(row => row.index !== index);
          },
          error: (err) => {
            console.error('Unable to delete observation ::', err);
            this.toast.show('Failed to delete observation.'+err, 'error');
          }
        });
    } else {
        this.auditObservationComponent = this.auditObservationComponent.filter(component => component.index !== index);
        this.rows = this.rows.filter(row => row.index !== index);
        console.log("ID :::::::::::::::::"+id);
        console.log("Observation not saved yet, removing locally.");
    }
    this.modalRef?.close();
  }


  toggleStatus(status: boolean) {
      status = !status;
      this.typeStatus = status ? "Basic" : "Non-Basic";
      this.status = status;
      return status;
  }

  get filteredData() {
    const search = this.searchText.toLowerCase();
    return this.templates
      .filter(template =>
        template.name.toLowerCase().includes(search)
      )
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get visiblePages(): number[] {
    const pagesToShow = 5;
    const half = Math.floor(pagesToShow / 2);
    let start = Math.max(1, this.page - half);
    let end = Math.min(this.totalPages, start + pagesToShow - 1);

    // Adjust start if fewer pages on the right
    if (end - start < pagesToShow - 1) {
      start = Math.max(1, end - pagesToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(p: number) {
    this.page = p;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  get totalPlanned() {
    return this.templates.filter(t => t.auditStatus === "Planned").length;
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

  updateAuditStatus(row: number) {
    console.log("Updating audit status for row:", row);
    this.auditScheduleTemplate = this.templates.find(t => t.id === row) || null;
    if (!this.auditScheduleTemplate) return;
    this.auditService.saveAuditDetails(this.auditScheduleTemplate).subscribe(response => {
        console.log("Audit Schedule Template updated successfully!", response);
        this.toast.show('Audit Schedule Template updated successfully!', 'success');

        if (this.auditScheduleTemplate?.auditStatus === 'Action Required') {
          const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.APS_TO_AUDITOR, this.auditScheduleTemplate);
          this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.auditorName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
            next: (data) => {
              console.log('Notification sent successfully', data);
            }
          });
        } else if(this.auditScheduleTemplate?.auditStatus === 'Completed') {
          const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.AUDIT_COMPLETED, this.auditScheduleTemplate);
          this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
            next: (data) => {
              console.log('Notification sent successfully', data);
            }
          });
        } else if(this.auditScheduleTemplate?.auditStatus === 'Observation CASO') {
          const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.CASO_OBSERVATION_REQUIRED, this.auditScheduleTemplate);
          this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
            next: (data) => {
              console.log('Notification sent successfully', data);
            }
          });
        } else if(this.auditScheduleTemplate?.auditStatus === 'In Progress') {
          const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.PRE_QUESTIONNAIRE, this.auditScheduleTemplate);
          this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
            next: (data) => {
              console.log('Notification sent successfully', data);
            }
          });
        }         
        
    }, error => {
        this.errorMsg = "Error saving audit schedule template:", error;
         this.toast.show('Error updating Audit Schedule Template!'+error, 'error');
    });
  }

  printPDF() {

      const printContents = document.getElementById('printSection')!.innerHTML;

      const generatedBy = this.auditTemplateGen?.auditScheduleTemplate.createdBy ?? "Unknown User";           
      const generatedFrom = "QCMT App";        
      const generatedDate = new Date().toLocaleString();
    
      const popupWin = window.open('', '_blank', 'width=850,height=1100');

      popupWin!.document.open();
      popupWin!.document.write(`
        
        <html>
          <head>
            <title>Print</title>

            <style>

              /* ------------------------- */
              /* PAGE SETTINGS             */
              /* ------------------------- */
              @page {
                  size: A4 portrait;
                  margin: 15mm;

                  /* Page number on every page */
                  @bottom-center {
                      content: "Page " counter(page);
                      font-size: 12px;
                  }
              }

              body {
                  font-family: Arial, sans-serif;
                  background: #fff !important;
                  width: 190mm;
                  margin: 0 auto;
              }

              /* ------------------------- */
              /* TABLE FIXES               */
              /* ------------------------- */
              table {
                  width: 100%;
                  border-collapse: collapse;
                  table-layout: fixed;   
              }

              th, td {
                  border: 1px solid #000;
                  padding: 6px;
                  vertical-align: top;
                  word-wrap: break-word;
                  overflow-wrap: break-word;

                  /* Reduce row splitting */
                  page-break-inside: avoid;
                  break-inside: avoid;
              }

              th {
                  background: #f0f0f0;
                  text-align: center;
              }

              .title-print {
                  text-align: center;
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 10px;
              }

              /* --------------------------------------------- */
              /* PAGE NUMBER FALLBACK (for browsers not using 
                  @bottom-center)
              /* --------------------------------------------- */
              .page-number {
                  display: none;
                  text-align: center;
                  font-size: 12px;
                  margin-top: 10px;
              }

              @media print {
                  .page-number {
                      display: block;
                      page-break-after: always;
                  }
              }

              /* --------------------------------------------- */
              /* FOOTER ONLY ON LAST PAGE                      */
              /* --------------------------------------------- */
              .footer {
                  margin-top: 40px;
                  padding-top: 8px;
                  border-top: 1px solid #000;
                  font-size: 12px;
                  text-align: center;
                  page-break-after: avoid;
              }

            </style>
          </head>

          <body>

              ${printContents}

              <!-- FOOTER: Only prints once at the END -->
              <div class="footer">
                  <div>PDF Generated Date: <b>${generatedDate}</b></div>
                  <div>Created By: <b>${generatedBy}</b></div>
                  <div>Generated From: <b>${generatedFrom}</b></div>
              </div>

              <!-- fallback page numbers -->
              <div class="page-number"></div>

          </body>
        </html>
      `);

      popupWin!.document.close();

      setTimeout(() => {
          popupWin!.print();
          popupWin!.close();
      }, 500);
  }

  getAuditObservationComponent(id: number) {
    this.auditObservationReset();    
     this.auditService.getAuditObservationDetails(id).subscribe({
      next: (data) => {
        this.auditObservation = data;
        if(this.auditObservation?.observationStatus === 'saved') {
            this.btnName = "Update";
            this.observationTemplateForm.patchValue({
              id: this.auditObservation.id,
              letterNo: this.auditObservation.letterNo,
              letterDate: this.auditObservation.letterDate
            });
            this.auditObservationComponent = [];
            this.auditObservation.auditObservationComponent.forEach(component => {
              component.index = this.auditObservationComponent.length + 1;
              this.auditObservationComponent.push(component);
            });
        } else {
            this.btnName = "Create";
        }    
        console.log('Audit Observation Details:', this.auditObservation);
      },
      error: (err) => {
        this.toast.show('Failed to fetch audit observation details'+ err, 'error');
        console.error('Failed to fetch audit observation details', err);
      }
    });
  }

  complianceStatusForm(content: any, auditObservationComponent: any) {
    console.log(":::::::::::::::"+auditObservationComponent.id);
    this.modalRef = this.modalService.open(content, { size : 'md' ,   backdrop: 'static', keyboard: false});
  }

  submitObservationMessage(auditObservationComponent: any) {
    if (!this.auditObservationComponent) {
        this.toast.show("No observation component found to submit", "error");
        return;
    } else {
      if(this.auditObservationComponentMessage.complianceMessage.trim() === '' || this.auditObservationComponentMessage.complianceMessage === null || this.auditObservationComponentMessage.complianceMessage === undefined) {
        this.toast.show("Please enter the compliance message before submit", "error");
        return;
      }
      console.log("Observation Message ::", this.auditObservationComponent);
      const formData = new FormData();
      // JSON part
      formData.append("auditObservationComponentMessageBean",
        new Blob([JSON.stringify({
          auditObservationComponentId: auditObservationComponent.id,
          templateId: auditObservationComponent.templateId,
          letterNo: this.auditObservationComponentMessage.letterNo,
          letterDate: this.auditObservationComponentMessage.letterDate,
          attachmentStatus: "No Attachment",
          complianceMessage: this.auditObservationComponentMessage.complianceMessage,
          status: "APSHQrs",
          createdBy: "Current User",
          entryDate: new Date().toISOString().split('T')[0],
          entryTime: new Date().toISOString().split('T')[1].split('.')[0]
        })], { type: 'application/json' })
      );

      console.log("Observation Message File ::", formData);
      this.auditService.submitAuditObservationMessageAPS(formData).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.Response) {
            this.toast.show("Compliance message submitted successfully", "success");
            this.getAuditObservationComponent(this.templateId);
            this.resetObservationMessageForm();
            this.refreshService.triggerRefresh();
            this.auditService.getAuditObservationDetails(this.templateId).subscribe(res => {
                this.auditObservation = res;
                this.auditObservationComponentBean = this.auditObservation?.auditObservationComponent.find(o => o.id === auditObservationComponent.id) ?? null;
                this.auditObservation.auditObservationComponent = this.auditObservation.auditObservationComponent.sort((a, b) => a.id - b.id);
            });
            this.modalRef?.close();
          }
        },
        error: (err) => {
          this.toast.show("Error uploading data! "+err, "error");
          console.error(err);
          return;
        }
      });
    }
  }

  submitObservationToCASO() {
    if(this.letterNo.trim() === '' || this.letterNo === null || this.letterNo === undefined) {
      this.toast.show("Please enter the letter number before submit", "error");
      return;
    }
    if((this.letterDate.trim() === '' || this.letterDate === null || this.letterDate === undefined) ) {
      this.toast.show("Please enter the letter date before submit", "error");
      return;
    }
    this.auditService.getAuditObservationDetails(this.templateId).subscribe({
      next: (data) => {
        this.auditObservation = data;
        this.auditObservation.auditObservationComponent = this.auditObservation.auditObservationComponent.sort((a, b) => a.id - b.id);
        const submitStatus = this.auditObservation.auditObservationComponent.some(
          component => component.status === 'CASO' && component.complianceStatus !== 'Dropped' && component.complianceStatus !== 'Compliant'
        );
        if (submitStatus) {
          this.toast.show('Complete all observation components before submitting to CASO', 'error');
          return;
        }
        const formData = new FormData();
        formData.append("auditObservationComponentMessageBean",
          new Blob([JSON.stringify({            
            templateId: this.templateId,
            letterNo: this.letterNo,
            letterDate: this.letterDate,
            status: "APSHQrs",
          })], { type: 'application/json' })
        );
        console.log("Observation Message File ::", formData);
        this.auditService.submitLetterNoDateAPS(formData).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.Response) {
              this.updateAudit(this.templateId, 'Observation CASO');
              this.toast.show('Observation submitted to CASO successfully', 'success');
              this.modalService.dismissAll();
              this.auditScheduleTemplate = this.templates.find(t => t.id === this.templateId) || null;
              if(this.auditScheduleTemplate) {
                const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.APS_COMPLIANCE_RESPONSE_CASO_OBSERVATION_REQUIRED, this.auditScheduleTemplate);
                this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName,this.auditScheduleTemplate.auditorId,this.auditScheduleTemplate.casoId).subscribe({
                  next: (data) => {
                    console.log('Notification sent successfully', data);
                  }
                });
              }
            }
          },
          error: (err) => {
            this.toast.show("Error uploading data! "+err, "error");
            console.error(err);
            return;
          }
        });
      },
      error: (err) => {
        this.toast.show('Failed to fetch audit observation details'+ err, 'error');
        console.error('Failed to fetch audit observation details', err);
      }
    });
  }

  submitObservationPopupToCASO(content: any, id: number | undefined) {
    if (!id) {
      this.toast.show('Invalid audit template id', 'error');
      return;
    }
    this.templateId = id;
    this.modalRef = this.modalService.open(content, { backdrop: 'static', keyboard: false});
  }

  droppedObservation(id: number | undefined) {
    if (!id) {
      this.toast.show('Invalid audit template id', 'error');
      return;
    }
    this.updateAudit(id, 'Completed');  
    this.toast.show('Audit Observations dropped successfully', 'success');
    
    this.modalService.dismissAll();
    this.auditScheduleTemplate = this.templates.find(t => t.id === id) || null;
    if(this.auditScheduleTemplate) {
      const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.AUDIT_COMPLETED, this.auditScheduleTemplate);
      this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName,this.auditScheduleTemplate.auditorId,this.auditScheduleTemplate.casoId).subscribe({
        next: (data) => {
          console.log('Notification sent successfully', data);
        }
      });
    }
  }

  updateStatus(status: string, id: number | undefined) {
    if (!id) {
      this.toast.show('Invalid audit observation component id', 'error');
      return;
    }
    if (!status || status.trim().length === 0) {
      this.toast.show('Please select status from dropdown to change the status!', 'error');
      return;
    }
    this.auditService.updateAuditObservationComponentStatus(id, status).subscribe({
      next: () => {
        this.toast.show(`Compliance Status updated to ${status}`, 'success');
        this.auditService.getAuditObservationDetails(this.templateId).subscribe(res => {
            this.auditObservation = res;
            this.auditObservation.auditObservationComponent = this.auditObservation.auditObservationComponent.sort((a, b) => a.id - b.id);
        });
        this.modalRef?.close(); 
      },
      error: (err) => {
        this.toast.show(`Error updating status to ${status}: ${err}`, 'error');
        console.error(err);
      }
    });
  } 

  viewObservation(content: any, id: number) {
    console.log(":::::::::::::::"+id);    
    this.chatObservationStatus = '';
    this.auditObservationComponentBean = this.auditObservation?.auditObservationComponent.find(o => o.id === id) ?? null;
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  resetObservationMessageForm() {
    this.auditObservationComponentMessage = {
      id: 0,
      auditObservationComponentId: 0,
      letterNo: '',
      letterDate: '',
      attachmentStatus: '',
      filePath: '',
      fileName: '',
      complianceMessage: '',
      status: '',
      createdBy: '',
      entryDate: '',
      entryTime: ''
    };
  }

  get activeList() {
    return this.auditObservation?.auditObservationComponent.filter(o => o.complianceStatus !== 'Dropped' && o.complianceStatus !== 'Compliant');
  }

  get droppedList() {
    return this.auditObservation?.auditObservationComponent.filter(o => o.complianceStatus === 'Dropped' || o.complianceStatus === 'Compliant');
  }

  get filteredList() {
    let list = this.selectedTab === 'active' ? this.activeList : this.droppedList;
    if (this.filterCriticality) {
      list = list?.filter(o => o.typeCriticality === this.filterCriticality);
    }
    if (this.searchText) {
      list = list?.filter(o =>
        o.observation?.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
    return list;
  }

  // ========================
  // STATUS UPDATE
  // ========================
  updateAudit(row: number, status: string) {
    console.log("Updating audit status for row:", row);    
    this.auditScheduleTemplate = this.templates.find(t => t.id === row) || null;
    if (!this.auditScheduleTemplate) return;
    this.auditScheduleTemplate.auditStatus = status;
    this.auditService.saveAuditDetails(this.auditScheduleTemplate).subscribe({
      next: () => {
        console.log('Audit status updated successfully');
      },
      error: (error) => {
        this.errorMsg = "Error saving audit schedule template: " + error;
      }
    });
  }

  auditBoardScheduleTemplate: AuditBoardScheduleTemplate | null = null;
  auditBoardTemplateGen: AuditBoardTemplateGen = {
      id: 0,
      auditBoardScheduleTemplate: null as any,
      questionTemplateList: [],
      auditiorResponse: null as any
  };
loadQuestions() {
  this.auditService
    .getQuestionsByTemplateId(this.selectedTemplateId)
    .subscribe((data: AuditorQuestions) => {
      console.log("response Questions:", data);
      this.auditorQuestions = data;
      console.log("Loaded Questions:", this.auditorQuestions);
    })
}
  viewAuditorResponse(content: any, id: number) {
      this.selectedTemplateId = id;
      this.loadQuestions();
      this.auditService.getAuditBoardDetails(id).subscribe({
        next: (data) => {
          this.auditBoardScheduleTemplate = data;
          if (!this.auditBoardScheduleTemplate) return;

          this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
          // Initialize object
          this.auditBoardTemplateGen = {
            id: 0,
            auditBoardScheduleTemplate: this.auditBoardScheduleTemplate,
            questionTemplateList: [],
            auditiorResponse: null as any
          };
          // Extract all template IDs to fetch
          const scheduleList = this.auditBoardScheduleTemplate.auditBoardScheduleList || [];
          const templateIds = scheduleList.map(s => s.template);
  
          console.log("Inside Show Audit scheduleList ::"+scheduleList);
          // Create parallel HTTP calls
          const requests = templateIds.map(() =>
            this.questionsService.getAuditBoardQuestionDetails()
          );
  
          this.auditService.getAuditorResponseDetails(this.auditBoardScheduleTemplate?.auditTemplateId).subscribe({
            next: (data) => {
              this.auditBoardTemplateGen.auditiorResponse = data;
              console.log("Auditor Response Details ::", data);
            },
            error: (err) => {
              this.toast.show("Failed to fetch auditor response details"+ err, "error");
              console.error("Failed to fetch auditor response details", err);
            }
          });
          
          // Run all HTTP calls together
          forkJoin(requests).subscribe({
            next: (responses: any[]) => {
  
              // Map responses to template IDs (match each schedule)
              responses.forEach((questions, index) => {
                const templateId = templateIds[index];
                const matchedTemplate = questions.find((q: any) => q.id === templateId);
                if (matchedTemplate) {
                  this.auditBoardTemplateGen.questionTemplateList.push(matchedTemplate);
                }             
              });
              this.auditService.setAuditReviewData(this.auditBoardTemplateGen);
              // Open modal
              this.modalRef = this.modalService.open(content, {
                size: "xl",
                backdrop: "static",
                keyboard: false
              });
            },
  
            error: (err) => {
              this.toast.show("Failed to load template questions", "error");
              console.error(err);
            }
          });
  
        },
        error: (err) => {
          this.toast.show("Failed to fetch templates"+ err, "error");
          console.error(err);
        }
      });    
      this.getAuditObservationComponent(id);      
    }

    viewBoardTemplate(content: any, id: number) {
      this.modalRef = this.modalService.open(content, {
        size: "xl",
        backdrop: "static",
        keyboard: false
      }); 
    }

    viewObservationMessageHistory(content: any) {
      this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
    }

    prepareDownloadUrls() {
      this.auditBoardTemplateGen.auditiorResponse.auditorResponseFiles =
        this.auditBoardTemplateGen.auditiorResponse.auditorResponseFiles.map(f => ({
          ...f,
          downloadUrl: this.buildDownloadUrl(f.filePath, f.documentName)
        }));
    }

    buildDownloadUrl(path: string, documentName: string) {
      const normalizedPath = path.replace(/[\\\/]+$/, '').replace(/\\/g, '/');
      const fullPath = `${normalizedPath}/${documentName}`;
      //console.log("Building download URL for:", fullPath);
      return this.baseUrl + 'v1/qcmt/master/auditfile?fullPath=' + encodeURIComponent(fullPath);
    }

    
  getCASOFileDetailsDetails(id: number) {
    this.questionsService.getCASOFileDetails(id).subscribe({
      next: (data) => {
        this.casoResponseFilesTemp = data;
      },
      error: (err) => {
        this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }

  formatStatusClass(status: string): string {
    if (!status) return '';

    return status
      .replace(/\s+/g, '')     // remove spaces
      .replace(/[()\-]/g, ''); // remove brackets & hyphens
  }  

  printObservationHistory() {
    const printContents = document.getElementById('print-section')?.innerHTML;

    const popupWindow = window.open('', '_blank', 'width=800,height=600');

    popupWindow!.document.open();
    popupWindow!.document.write(`
      <html>
        <head>
          <title>Observation Compliance History</title>

          <!-- Copy all styles -->
          ${Array.from(document.styleSheets)
            .map((styleSheet: any) => {
              try {
                if (styleSheet.href) {
                  return `<link rel="stylesheet" href="${styleSheet.href}">`;
                } else {
                  return `<style>${styleSheet.cssRules
                    ? Array.from(styleSheet.cssRules)
                        .map((rule: any) => rule.cssText)
                        .join('')
                    : ''}</style>`;
                }
              } catch (e) {
                return '';
              }
            })
            .join('')}

          <style>
            body {
              margin: 10px;
            }
          </style>
        </head>

        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);

    popupWindow!.document.close();
  }

  getAllTemplateByAuditType() {

    const selectedAuditType = this.auditTemplateForm.value.auditType;
    // 🔹 Filter categories
    console.log(JSON.stringify(this.categories));
    const categoryAuditType = this.categories.filter(
      a => a.auditType === selectedAuditType
    );
    // 🔹 Reset
    this.auditComponent = [];
    this.rows = [];

    let indexCounter = 1;
    // 🔹 Loop categories
    categoryAuditType.forEach(a => {
      console.log("Category Name >>>> "+a.categoryName);
      // 🔹 Get templates for this category
      const filteredTemplates = this.questionTemplates.filter(t =>
        String(t.category).trim() === String(a.id).trim()
      );
      console.log("Category:", a.categoryName);
      console.log("Templates:", filteredTemplates);
      // 🔹 Loop templates (IMPORTANT FIX)
      filteredTemplates.forEach(b => {
        console.log("Question Template >>>> "+b.name);
        const newComponent: AuditSchedule = {
          id: 0,
          index: indexCounter,
          information: '',   // optional
          createdBy: '',
          entryDate: '',
          status: '',
          category: a.id,
          categoryName: a.categoryName,
          templateName: b.name || '',
          template: b.id                      // ✅ assign template
        };
        this.auditComponent.push(newComponent);
        this.rows.push({
          index: indexCounter,
          categoryId: a.id,
          templateId: b.id,
          templateOptions: filteredTemplates   // ✅ dropdown options
        });
        indexCounter++; // ✅ increment properly
      });
    });

    console.log("Final Components:", this.auditComponent);

    if (this.auditComponent.length === 0) {
      this.toast.show('No templates found for selected audit type!', 'warning');
    } else {
      this.toast.show('All templates for selected audit type fetched!', 'success');
    }
  }

  formatNotificationMessage(template: string, data: AuditScheduleTemplate) {
      return template 
        .replace('{auditname}', data.name)
        .replace('{userName}', data.createdBy)
        .replace('{casoName}', data.casoName)
        .replace('{auditorName}', data.auditorName);
  }
}


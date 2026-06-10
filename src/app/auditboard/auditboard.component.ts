import { NgModule, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { NgbModal, NgbModalRef, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { QuestionTemplate } from '../interface/QuestionTemplate';
import { Questions } from '../interface/Questions';
import { CategoryService } from '../service/category.service';
import { CategoryDetails } from '../interface/CategoryDetails';
import { QuestionsService } from '../service/questions.service';
import { AuditSchedule } from '../interface/AuditSchedule';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { UnitService } from '../service/unit.service';
import { UnitDetails } from '../interface/UnitDetails';
import { UsermanagementService } from '../service/usermanagement.service';
import { User } from '../interface/User';
import { UserRoleDetails } from '../interface/UserRoleDetails';
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { AuditTemplateGen } from '../interface/AuditTemplateGen';
import { ToastService } from '../service/toast.service';
import { AuditorresponseformComponent } from "../auditorresponseform/auditorresponseform.component";
import { AuditBoardScheduleTemplate } from '../interface/AuditBoardScheduleTemplate';
import { AuditBoardTemplateGen } from '../interface/AuditBoardTemplateGen';
import { forkJoin } from 'rxjs';
import { AuditorQuestions } from '../interface/auditor-questions';
import { AuditorResponseFilesTemp } from '../interface/AuditorResponseFilesTemp';
import { AuditorRemarktoCASO } from '../interface/AuditorRemarktoCASO';
import { APP_CONSTANTS } from '../constants/app.constants';

@Component({
  selector: 'app-auditboard',
  imports: [ReactiveFormsModule, NgClass, CommonModule, FormsModule, AuditorresponseformComponent, NgbTooltip],
  templateUrl: './auditboard.component.html',
  styleUrl: './auditboard.component.css'
})
export class AuditboardComponent {

  constants = APP_CONSTANTS;
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  auditorRemarktoCASOList: AuditorRemarktoCASO[] = [];
  casoResponseFilesTemp: AuditorResponseFilesTemp[] = [];

  scheduleFromDate: string = '';
  scheduleToDate: string = '';
auditScheduledate: string = '';
  searchTerm: string = '';
  templateName: string = '';
  templateId: number = 0;
  questionId: number = 0;
  questionIndex: number = 0;
  
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

  categories: CategoryDetails[] = [];
  units: UnitDetails[] = [];
  auditStatus: string = 'Planned';


  templates: AuditScheduleTemplate[] = [];
  auditScheduleTemplate: AuditScheduleTemplate | null = null;
  questionTemplates: QuestionTemplate[] = [];
  auditorList: UserRoleDetails[] = [];
  auditTemplateGen: AuditTemplateGen | null = null;

  rows: { index:number, categoryId: null | string | number, templateId: null | string | number, templateOptions: QuestionTemplate[] }[] = [];

  searchText = '';
  page = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  auditBoardScheduleTemplate: AuditBoardScheduleTemplate | null = null;

  @ViewChild('childRef') childComponent!: AuditorresponseformComponent;

  auditBoardTemplateGen: AuditBoardTemplateGen = {
      id: 0,
      auditBoardScheduleTemplate: null as any,
      questionTemplateList: [],
      auditiorResponse: null as any
  };
   questionForm!: FormGroup;
   auditorQuestionsList: AuditorQuestions | null = null;
   auditorQuestions!: AuditorQuestions;
   selectedTemplateId!: number;
   selectedTemplateStatus!: string;
   today: string = '';
  constructor(private fb: FormBuilder, private auditService: AuditscheduleserviceService, private questionsService: QuestionsService, private unitDetails: UnitService, private umService: UsermanagementService, private modalService: NgbModal, private toast: ToastService) {        
      
  }   

  ngOnInit() {
      this.loadAuditDetails();
      this.questionForm = this.fb.group({
        auditTemplateId: ['', Validators.required],
        auditorId: ['', Validators.required],
        unitId: ['', Validators.required],
        questions: this.fb.array([])   // 👈 FormArray
      });
    this.addRow();
    const current = new Date();
  this.today = current.toISOString().split('T')[0]; 
  }
  // Getter
  get questions(): FormArray {
    return this.questionForm.get('questions') as FormArray;
  }
  addRow() {

  const questionGroup = this.fb.group({
    question: ['', Validators.required],
    benchmark: [''] // optional
  });

  this.questions.push(questionGroup);
}
removeRow(index: number) {
  this.questions.removeAt(index);
}
deleteQuestion(id: number) {

  if (!confirm("Delete this question?")) return;

  this.auditService.deleteQuestion(id).subscribe({
    next: () => {
      this.toast.show('Deleted successfully', 'success');
      this.loadQuestions();
    },
    error: () => {
      this.toast.show('Delete failed', 'error');
    }
  });
}
loadQuestions() {
  this.auditService.getQuestionsByTemplateId(this.selectedTemplateId)
    .subscribe((data: AuditorQuestions) => {
      console.log("response Questions:", data);
      this.auditorQuestions = data;
      console.log("Loaded Questions:", this.auditorQuestions);
    })
}
saveAllQuestions() {

  if (this.questionForm.invalid) {
    return;
  }
const id=this.questionForm.get('auditTemplateId')?.value;
const auditorId=this.questionForm.get('auditorId')?.value;
const unitId=this.questionForm.get('unitId')?.value;
  const payload = this.questionForm.value;

  console.log(id+" "+auditorId+"  "+unitId+" Final Payload:", payload);
  // Call service
  this.auditService.saveBulkQuestions(payload).subscribe({
    next: (data:any) => {
      this.toast.show('Questions saved successfully', 'success');
      this.auditorQuestionsList=data
        console.log("Final Payload response:", this.auditorQuestionsList);
      //this.questionForm.reset();
      this.questions.clear();
      this.addRow();
      this.loadQuestions();
    },
    error: (error) => {
      this.toast.show('Failed to save questions: ' + error.message, 'error');
    } 
  });
   console.log(id+" "+auditorId+"  "+unitId+" Payload:");
 this.questionForm.patchValue({
      auditTemplateId: id,
      auditorId: auditorId,
      unitId: unitId,
      
    });
}
loadAuditDetails() {
    this.auditService.getAuditDetailsData().subscribe({
      next: (data) => {
        this.templates = (data ?? []).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')).map(template => {
          console.log("Audit Status ::", template.auditStatus);
          if(template.auditStatus === 'Observation CASO' || template.auditStatus === 'Observation APS'){
            return { ...template, auditStatus: 'Completed' };
          }
          console.log("Mapped Template ::", template.auditStatus);
          return template;
        });

        this.getAuditorAuditDetails(); // If really needed
      },
      error: (err) => {
        console.error('Failed to fetch templates', err);
        this.toast.show('Failed to fetch templates.', 'error');
      }
    });
}

submitFromPopup() {
    this.childComponent.submitForm();  // calling child function
}

showSendBackToCasoPopup(content: any) {
  this.modalRef = this.modalService.open(content, {
      size: "ssm",
      backdrop: "static",
      keyboard: false
    });  
}

casoRemarks: string = '';
auditorRemarktoCASO: AuditorRemarktoCASO  | null = null; 
showSendBackToCaso() {
  
  if (!this.casoRemarks || this.casoRemarks.trim() === '') {
    this.toast.show("Remarks is required", "error");
    return;
  }

  console.log("Remarks:", this.casoRemarks);
  this.auditorRemarktoCASO = {
    id: 0,
    remarks: this.casoRemarks,
    auditTempalteId: this.selectedTemplateId,
    createdBy: '',
    entryDate: new Date()
  }
  
  this.auditService.saveAuditorRemarksCaso(this.auditorRemarktoCASO).subscribe({
    next: (data) => {
        this.toast.show("Data saved successfully and audit sent back to CASO bucket!", "success"); 
        console.log('>>>>>>>>>>>>>>>>>>>', this.selectedTemplateId); 
        console.log('>>>>>>>>>>>>>>>>>>>', this.templates);
        this.auditScheduleTemplate = this.templates.find(t => t.id === this.selectedTemplateId) || null;
        if (this.auditScheduleTemplate) {
            const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.PRE_QUESTIONNAIRE_FollowUp, this.auditScheduleTemplate);
            this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
              next: (data) => {
                console.log('Notification sent successfully', data);
              }
          }); 
        }   
        this.loadAuditDetails();        
        this.modalService.dismissAll(); 
    },
    error: (err) => {
        this.toast.show('Failed to send to caso templates'+ err, 'error');
        console.error('Failed to send to caso templates', err);
    }
  })
}

sendToCaso(rowId: number) {
      console.log("Row ID ::",rowId);
      this.auditService.auditSendToCaso(rowId).subscribe({
        next: (data) => {
          this.toast.show(data, 'success');
          this.updateAuditStatus(rowId, 'In Progress'); 
          this.auditScheduleTemplate = this.templates.find(t => t.id === rowId) || null;
          if (this.auditScheduleTemplate) {
            const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.PRE_QUESTIONNAIRE, this.auditScheduleTemplate);
            this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.casoId, this.auditScheduleTemplate.casoName, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
              next: (data) => {
                console.log('Notification sent successfully', data);
              }
          });
        }
        },
        error: (err) => {
           this.toast.show('Failed to send to caso templates'+ err, 'error');
           console.error('Failed to send to caso templates', err);
        }
      })
}

updateAuditStatus(row: number, status: string) {
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

viewAuditorResponse(content: any, id: number) {
    this.selectedTemplateId = id;
    this.loadQuestions();
    this.auditService.setAuditorQuestionData( this.auditorQuestions);
    this.auditService.getAuditBoardDetails(id).subscribe({
      next: (data) => {
        this.auditBoardScheduleTemplate = data;
        if (!this.auditBoardScheduleTemplate) return;

        console.log("CASP FILE AUDIT ID>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+this.auditBoardScheduleTemplate.auditTemplateId);
        this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
        this.getAuditorRemarksCASO(id);
    
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
           // this.auditService.setAuditorQuestionData(this.auditorQuestions);
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
}

getAuditorAuditDetails() {
    this.auditService.getAuditorAuditDetails().subscribe({
      next: (data) => {
        this.templates = (data ?? []).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')).map(template => {
          console.log("Audit Status ::", template.auditStatus);
          if(template.auditStatus === 'Observation CASO' || template.auditStatus === 'Observation APS'){
            return { ...template, auditStatus: 'Completed' };
          }
          console.log("Mapped Template ::", template.auditStatus);
          return template;
        });
        console.log('Templates:', this.templates);
      },
      error: (err) => {
        this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
}

viewBoardTemplate(content: any) {
    this.modalRef = this.modalService.open(content, {
      size: "xl",
      backdrop: "static",
      keyboard: false
    });         
}

viewTemplate(content: any, id: number) {
      const template = this.templates.find(t => t.id === id);
      if (!template) return;
      this.auditTemplateGen = {
          id: 0,
          auditScheduleTemplate: template,
          questionTemplateList: []  
      };
      template.casoId;
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
      this.questionForm.patchValue({
      auditTemplateId: template.id,
      auditorId: template.auditorId,
      unitId: template.unitId,
      
    });
  this.selectedTemplateId = template.id;
  this.selectedTemplateStatus = template.auditStatus;

  this.loadQuestions();
  
  this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
}

showReviewResponseAuditor(content: any, id: number, auditScheduleFromDate?: string, auditScheduleToDate?: string) {
    
  if(auditScheduleFromDate && auditScheduleToDate){
      const fromDate = new Date(auditScheduleFromDate)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

    const toDate = new Date(auditScheduleToDate)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

    this.auditScheduledate = fromDate + " to " + toDate;

  }else {
    this.auditScheduledate = 'Not Available';
  }
  console.log("Audit Schedule Date Info ::", this.auditScheduledate);
    this.selectedTemplateId = id;
    this.loadQuestions();
    this.auditService.getAuditorResponseDetails(id).subscribe({
          next: (data) => {
            this.auditBoardTemplateGen.auditiorResponse = data;
            console.log("Auditor Response Details ::", data);
          },
          error: (err) => {
            this.toast.show("Failed to fetch auditor response details"+ err, "error");
            console.error("Failed to fetch auditor response details", err);
          }
        });
    //this.auditService.setAuditorQuestionData( this.auditorQuestions);
    console.log(id+" Setting Auditor Questions in Component..:", this.auditorQuestions);
    this.auditService.getAuditBoardDetails(id).subscribe({
      next: (data) => {
        this.auditBoardScheduleTemplate = data;
        if (!this.auditBoardScheduleTemplate) return;
        // Initialize object
        console.log("CASP FILE AUDIT ID>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+this.auditBoardScheduleTemplate.auditTemplateId);
        this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
        this.getAuditorRemarksCASO(id);
    
        this.auditBoardTemplateGen = {
          id: 0,
          auditBoardScheduleTemplate: this.auditBoardScheduleTemplate,
          questionTemplateList: [],
          auditiorResponse: null as any
        };
        // Extract all template IDs to fetch
        const scheduleList = this.auditBoardScheduleTemplate.auditBoardScheduleList || [];
        const templateIds = scheduleList.map(s => s.template);

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

        console.log("Inside Show Audit scheduleList ::"+scheduleList);
        // Create parallel HTTP calls
        const requests = templateIds.map(() =>
          this.questionsService.getAuditBoardQuestionDetails()
        );
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
            setTimeout(() => {
            // Open modal
            this.modalRef = this.modalService.open(content, {
              size: "xl",
              backdrop: "static",
              keyboard: false
            });}, 100);
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
  return this.templates.filter(t => t.auditStatus === "In Progress").length;
}

get totalCompleted() {
  return this.templates.filter(t => t.auditStatus === "Completed").length;
}

get totalActionRequired() {
  return this.templates.filter(t => t.auditStatus === "Action Required").length;
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
            <title>Question Template</title>
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

  prepareDownloadUrls() {
    this.auditBoardTemplateGen.auditiorResponse.auditorResponseFiles =
      this.auditBoardTemplateGen.auditiorResponse.auditorResponseFiles.map(f => ({
        ...f,
        downloadUrl: this.buildDownloadUrl(f.filePath, f.documentName)
      }));
  }

  buildDownloadUrl(path: string, documentName: string) {
    if(!path || !documentName) {
      console.error("Invalid path or document name for download URL.");
      return "";
    }
    const normalizedPath = path.replace(/[\\\/]+$/, '').replace(/\\/g, '/');
      const fullPath = `${normalizedPath}/${documentName}`;
    //console.log("Building download URL for:", fullPath);
    return this.baseUrl + 'v1/qcmt/master/auditfile?fullPath=' + encodeURIComponent(fullPath);
  
  }

  createModal(content: any) {
    console.log(":::::::::::::::");
    this.btnName = "Create";
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
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

  getAuditorRemarksCASO(id: number) {
    this.auditService.getAuditorRemarksCaso(id).subscribe({
          next: (data) => {
            console.log("Auditor question data:", data);            
            this.auditorRemarktoCASOList = data.sort((a, b) => {
              return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
            });
          }, error: (err) => {
            console.error(err);
          }
    }); 
  }
  showRemarks: boolean = true;
  toggleRemarks() {
    this.showRemarks = !this.showRemarks;
  }

  saveAuditScheduleFromToDatePopup(content: any, id: number | undefined) {
    if (!id) {
      this.toast.show('Invalid audit template id', 'error');
      return;
    }
    this.templateId = id;
    this.modalRef = this.modalService.open(content, { backdrop: 'static', keyboard: false});
  }
  onFromDateChange() {
  // Reset To Date if it is before From Date
  if (this.scheduleToDate && this.scheduleToDate < this.scheduleFromDate) {
    this.scheduleToDate = '';
  }
}

  saveAuditScheduleFromToDate(){
    if(this.scheduleFromDate.trim() === '' || this.scheduleFromDate === null || this.scheduleFromDate === undefined) {
      this.toast.show("Please select from date before submit", "error");
      return;
    }
    if((this.scheduleToDate.trim() === '' || this.scheduleToDate === null || this.scheduleToDate === undefined) ) {
      this.toast.show("Please select to date before submit", "error");
      return;
    }
    this.auditScheduleTemplate = this.templates.find(t => t.id === this.templateId) || null;
    if (!this.auditScheduleTemplate) return;
    this.auditScheduleTemplate.auditScheduleFromDate = this.scheduleFromDate;
    this.auditScheduleTemplate.auditScheduleToDate = this.scheduleToDate;
    this.auditService.saveAuditDetails(this.auditScheduleTemplate).subscribe({
      next: () => {
        this.toast.show('Audit schedule date updated successfully', 'success');
        this.modalService.dismissAll();
      },
      error: (error) => {
        this.toast.show("Error saving audit schedule template: " + error, 'error');
      }
    });  
  }  

  formatNotificationMessage(template: string, data: AuditScheduleTemplate) {
      return template 
        .replace('{auditname}', data.name)
        .replace('{userName}', data.createdBy)
        .replace('{casoName}', data.casoName)
        .replace('{auditorName}', data.auditorName);
  }
}

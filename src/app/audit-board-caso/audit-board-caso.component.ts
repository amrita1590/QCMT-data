import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
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
import { AuditBoardScheduleTemplate } from '../interface/AuditBoardScheduleTemplate';
import { AuditBoardTemplateGen } from '../interface/AuditBoardTemplateGen';
import { forkJoin } from 'rxjs';
import { AuditBoardQuestionTemplate } from '../interface/AuditBoardQuestionTemplate';
import { ToastService } from '../service/toast.service';
import { AuditObservation } from '../interface/AuditObservation';
import { AuditObservationChatComponentComponent } from "../audit-observation-chat-component/audit-observation-chat-component.component";
import { AuditObservationComponent } from '../interface/AuditObservationComponent';
import { AuditObservationComponentMessage } from '../interface/AuditObservationComponentMessage';
import { HttpEventType } from '@angular/common/http';
import { RefreshService } from '../service/refresh.service';
import { AuditorQuestions } from '../interface/auditor-questions';
import { AuditorResponseFilesTemp } from '../interface/AuditorResponseFilesTemp';
import { AuditorRemarktoCASO } from '../interface/AuditorRemarktoCASO';
import { APP_CONSTANTS } from '../constants/app.constants';

@Component({
  selector: 'app-audit-board-caso',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NgbTooltip, AuditObservationChatComponentComponent],
  templateUrl: './audit-board-caso.component.html',
  styleUrl: './audit-board-caso.component.css'
})
export class AuditBoardCasoComponent {

  constants = APP_CONSTANTS;
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  auditorRemarktoCASOList: AuditorRemarktoCASO[] = [];
  searchTerm: string = '';
  templateName: string = '';
  templateId: number = 0;
  questionId: number = 0;
  questionIndex: number = 0;
  letterNo: string = '';
  letterDate: string = '';

  fileId: number = 0;
  fileIndex: number = 0;  

  uploadProgress: number | null = null;
  uploadedFilePath: string | null = null;

  auditorResponseFilesTemp: AuditorResponseFilesTemp[] = [];

  auditBoardTemplateId: number = 0;
  
  errorMsg: string | null = null;
  errorStatus: boolean = false;
  successMsg: string | null = null;
  successStatus: boolean = false;

  btnName = "Create";
  status: boolean = false;
  typeStatus: string = "Non-Basic";

  tempStatus: string = "SAVED";

  private modalRef: NgbModalRef | null = null;

  auditComponent: AuditSchedule[] = [];

  categories: CategoryDetails[] = [];
  units: UnitDetails[] = [];
  auditStatus: string = 'Planned';

  auditBoardScheduleTemplate: AuditBoardScheduleTemplate | null = null;

  auditObservation: AuditObservation | null = null;
  auditObservationComponent: AuditObservationComponent | null = null;

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

  templates: AuditScheduleTemplate[] = [];
  auditScheduleTemplate: AuditScheduleTemplate | null = null;
  questionTemplates: QuestionTemplate[] = [];
  auditorList: UserRoleDetails[] = [];
  auditBoardTemplateGen: AuditBoardTemplateGen = {
    id: 0,
    auditBoardScheduleTemplate: null as any,
    questionTemplateList: [],
    auditiorResponse: null as any
  };

  auditTemplateGen: AuditTemplateGen = {
    id: 0,
    auditScheduleTemplate: null as any,
    questionTemplateList: []
  };

  saveAuditBoardTemplateGen: AuditBoardTemplateGen = {
    id: 0,
    auditBoardScheduleTemplate: null as any,
    questionTemplateList: [],
    auditiorResponse: null as any
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
 auditorQuestions!: AuditorQuestions;
   selectedTemplateId!: number;
   selectedTemplateStatus!: string;
  constructor(private fb: FormBuilder, private auditService: AuditscheduleserviceService, private questionsService: QuestionsService, private unitDetails: UnitService, private umService: UsermanagementService, private modalService: NgbModal, private toast: ToastService, private refreshService: RefreshService) {        

  }  

  ngOnInit() {
    this.getCASOAuditDetails();
  }

  sendToAuditor(rowId: number) {
      console.log("Row ID ::",rowId);
      this.auditService.auditSendToCaso(rowId).subscribe({
        next: (data) => {
          this.toast.show(data, 'success');
          this.updateAuditStatus(rowId, 'In Progress');
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

  getCASOAuditDetails() {
    this.auditService.getCASOAuditDetails().subscribe({
      next: (data) => {

        this.templates = (data ?? [])
          // ✅ remove planned
          .filter(a => a.auditStatus !== 'Planned')
          // ✅ map status changes
          .map(template => {
            if (template.auditStatus === 'Action Required') {
              return { ...template, auditStatus: 'In Progress' };
            }
            if (template.auditStatus === 'In Progress') {
              return { ...template, auditStatus: 'Action Required' };
            }
            return template;
          })
          // ✅ sort at last
          .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        console.log('Templates:', this.templates);
      },

      error: (err) => {
        this.toast.show('Failed to fetch templates: ' + err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }

  viewAuditorResponse(content: any, id: number) {

    this.selectedTemplateId = id;
    this.loadQuestions();
    this.auditService.getAuditBoardDetails(id).subscribe({
      next: (data) => {
        this.auditBoardScheduleTemplate = data;
        if (!this.auditBoardScheduleTemplate) return;

        // Initialize object
        this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
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
        this.auditorResponseFilesTemp = data;
      },
      error: (err) => {
        this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }

  showRemarks: boolean = true;
  toggleRemarks() {
    this.showRemarks = !this.showRemarks;
  }

  showAuditTemplate(content: any, id: number) {
    console.log("Inside Show Audit ID ::"+id);
    this.auditBoardTemplateId = id;
   
    this.auditService.getAuditBoardDetails(id).subscribe({
      next: (data) => {

        this.auditBoardScheduleTemplate = data;
        console.log("Inside Show Audit DATA ::"+this.auditBoardScheduleTemplate);
        if (!this.auditBoardScheduleTemplate) return;

        this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
        this.auditService.getAuditorRemarksCaso(id).subscribe({
          next: (data) => {
            console.log("Auditor question data:", data);            
            this.auditorRemarktoCASOList = data.sort((a, b) => {
              return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
            });
          }, error: (err) => {
            console.error(err);
          }
        }); // Build sections        
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
            this.questionsService.getAuditorAuditBoardQuestionDetails(id).subscribe({
              next: (data) => {
                console.log("Auditor question data:", data);
                if (data&&data.id===-1) {    
                        this.auditBoardTemplateGen.questionTemplateList.push(data);
                }
              },
              error: (err) => {
                console.error(err);
              }
            }); // Build sections
            this.initializeSections(this.auditBoardTemplateGen);

            
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
      this.selectedTemplateId = template.id;
      this.selectedTemplateStatus = template.auditStatus;

      this.loadQuestions();

      this.modalRef = this.modalService.open(content, { size: 'xl', backdrop: 'static', keyboard: false });
  }
  loadQuestions() {
    this.auditService
      .getQuestionsByTemplateId(this.selectedTemplateId)
      .subscribe((data: AuditorQuestions) => {
        console.log("response Questions:", data);
        this.auditorQuestions = data;
        console.log("Loaded Questions:", this.auditorQuestions);
      });
  }
  viewBoardTemplate(content: any, id: number) {
    
    this.modalRef = this.modalService.open(content, {
      size: "xl",
      backdrop: "static",
      keyboard: false
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

  get totalAudit() {
    return this.templates.length;
  } 
  get totalInProgress() {
    return this.templates.filter(t => t.auditStatus === "In Progress" || t.auditStatus === "Observation APS").length;
  }

  get totalCompleted() {
    return this.templates.filter(t => t.auditStatus === "Completed").length;
  }

  get totalActionRequired() {
    return this.templates.filter(t => t.auditStatus === "Action Required" || t.auditStatus === "Observation CASO").length;
  }

  sectionList: AuditBoardQuestionTemplate[] = [];
  currentSectionIndex = 0;
  currentSection: AuditBoardQuestionTemplate | null = null;

  allSection: AuditBoardQuestionTemplate | null = null;

  // Call this with your API response list
  initializeSections(sections: AuditBoardTemplateGen) {
    this.sectionList = sections.questionTemplateList;
      console.log("sectionList!", this.sectionList);
    this.sectionList = this.sectionList.sort((a, b) => a.id - b.id);
     console.log("sectionList!", this.sectionList);
    this.currentSectionIndex = 0;
    this.currentSection = this.sectionList[0];

    this.currentSection.auditBoardQuestionsList = this.currentSection.auditBoardQuestionsList.sort((a, b) => a.id - b.id);
  }  

  validateCurrentSection(): boolean {
    let isValid = true;

    for (let t of this.sectionList) {
      if(t.type === 'Basic') {
        for(let q of t.auditBoardQuestionsList) {
          if (!q.observation || q.observation.trim() === '') isValid = false;
        }  
      } else {
        for(let q of t.auditBoardQuestionsList) {
          if (!q.observation || q.observation.trim() === '') isValid = false;
        }  
      }
    }
    return isValid;
  }

  submitSection() {
    const payload = this.currentSection;
    if(!this.validateCurrentSection()) {
      this.toast.show("Please fill all fields before submit", "error");
      return;
    }
    this.saveSection();
    if(this.auditBoardTemplateId === 0) return;
    this.auditService.submitAuditBoardTemplateCaso(this.auditBoardTemplateId).subscribe(response => {
      console.log("Details & Observation saved successfully!", response);
      this.toast.show("Your data has been submitted successfully and is now in the auditor bucket!", "success");
      this.getCASOAuditDetails();
      this.modalService.dismissAll();
      this.auditScheduleTemplate = this.templates.find(t => t.id === this.auditBoardTemplateGen.auditBoardScheduleTemplate.auditTemplateId) || null;
      if(this.auditScheduleTemplate) {
        const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.SENT_TO_AUDITOR, this.auditScheduleTemplate);
        this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.auditorName,this.auditScheduleTemplate.auditorId,this.auditScheduleTemplate.casoId).subscribe({
          next: (data) => {
            console.log('Notification sent successfully', data);
          }
        });
      }
    }, error => {
      this.toast.show("Error while submit audit schedule template:"+error, "success");
    }); 
    return;
  }
  saveSection() {
      // ---------------------------
      // 2. FILE SIZE VALIDATION
      // ---------------------------
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 5MB
      const oversizedFiles: string[] = [];

      this.auditorResponseFilesTemp.forEach(fileObj => {
        if (fileObj.uploadDocFile && fileObj.uploadDocFile.size > MAX_FILE_SIZE) {
          oversizedFiles.push(`${fileObj.uploadDocFile.name} (${(fileObj.uploadDocFile.size / (1024*1024)).toFixed(2)} MB)`);
        }
      });

      if (oversizedFiles.length > 0) {
        this.toast.show(
          `These files are too large (max 5MB):<br>${oversizedFiles.join("<br>")}`,
          "error"
        );
        return;
      }
      // Files part
      let fileAdded = false;
      const formData = new FormData();
      formData.append("casoResponseFilesBean",
        new Blob(
          [
            JSON.stringify(
              this.auditorResponseFilesTemp
                .filter(f => f.id === 0)
                .map(f => ({
                  auditTemplateId: this.auditBoardScheduleTemplate?.auditTemplateId,
                  id: f.id,
                  index: f.index,
                  documentName: f.uploadDocFile?.name,   // important
                  remarks: f.remarks
                }))
            )
          ],
          { type: "application/json" }
        )
      );
      this.auditorResponseFilesTemp.forEach((fileObj) => {
        if (fileObj.uploadDocFile) {
          formData.append("files", fileObj.uploadDocFile);
          fileAdded = true;
        }
      });

      // If no file uploaded → attach sample file
      if (!fileAdded) {

        const sampleContent = "This is a sample file because no file was uploaded.";
        const sampleFile = new File(
          [sampleContent],
          "sample-audit-response.txt",
          { type: "text/plain" }
        );

        formData.append("files", sampleFile);
      }
      console.log(":::::::::::::::::::"+formData);
      this.questionsService.submitCASOFileResponse(formData).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }
          if (this.auditBoardScheduleTemplate) {
            this.getCASOFileDetailsDetails(this.auditBoardScheduleTemplate.auditTemplateId);
          }
        },
        error: (err) => {
          this.toast.show("Error uploading data! "+err, "error");
          console.error(err);
          return;
        }
      });

      this.questionsService.saveAuditBoardQuestionDetails(this.sectionList).subscribe(response => {
        console.log("Details & Observation saved successfully!", response);
        this.toast.show("Section Save Successfully!", "success");
      }, error => {
        this.toast.show("Error saving data:"+error, "success");
      });    
  }

  goNextSection() {
    if (this.currentSectionIndex < this.sectionList.length - 1) {
      this.currentSectionIndex++;
      this.currentSection = this.sectionList[this.currentSectionIndex];
    } else {
      console.log("All sections completed");
    }
  }

  previousSection() {
    if (this.currentSectionIndex > 0) {
      this.currentSectionIndex--;
      this.currentSection = this.sectionList[this.currentSectionIndex];
    }
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

  submitObservation(content: any, id: number) {
    console.log(":::::::::::::::");    
    this.templateId = id;
    this.getAuditObservationComponent(id);
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  viewObservationMessageHistory(content: any) {
     this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  getAuditObservationComponent(id: number) {
     this.auditService.getAuditObservationDetails(id).subscribe({
      next: (data) => {
        this.auditObservation = { ...data };
        this.auditObservation.auditObservationComponent = this.auditObservation.auditObservationComponent.sort((a, b) => a.id - b.id);
        console.log('Audit Observation Details:', this.auditObservation);
      },
      error: (err) => {
        this.toast.show('Failed to fetch audit observation details'+ err, 'error');
        console.error('Failed to fetch audit observation details', err);
      }
    });
  }

  viewObservation(content: any, id: number) {
    console.log(":::::::::::::::"+id);    
    this.auditObservationComponent = this.auditObservation?.auditObservationComponent.find(o => o.id === id) ?? null;
    this.modalRef = this.modalService.open(content, { size : 'xl' ,   backdrop: 'static', keyboard: false});
  }

  complianceStatusForm(content: any, auditObservationComponent: any) {
    console.log(":::::::::::::::"+auditObservationComponent.id);
     this.modalRef = this.modalService.open(content, { size : 'md' ,   backdrop: 'static', keyboard: false});
  }

  submitObservationToAPS() {
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
          component => component.status === 'APSHQrs' && component.complianceStatus !== 'Dropped' && component.complianceStatus !== 'Compliant'
        );

        if (submitStatus) {
          this.toast.show('Complete all observation components before submitting to APS HQrs', 'error');
          return;
        }
        const formData = new FormData();
        formData.append("auditObservationComponentMessageBean",
          new Blob([JSON.stringify({            
            templateId: this.templateId,
            letterNo: this.letterNo,
            letterDate: this.letterDate,
            status: "CASO",
          })], { type: 'application/json' })
        );
        console.log("Observation Message File ::", formData);
        this.auditService.submitLetterNoDateAPS(formData).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.Response) {
              this.updateAuditStatus(this.templateId, 'Observation APS');
              this.toast.show('Observation submitted to APS HQrs successfully', 'success');
              this.modalService.dismissAll();
              this.auditScheduleTemplate = this.templates.find(t => t.id === this.templateId) || null;
              if(this.auditScheduleTemplate) {
                const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.APS_OBSERVATION_REVIEW_REQUIRED, this.auditScheduleTemplate);
                this.umService.saveNotification(notificationMessage, this.auditScheduleTemplate.createdById, this.auditScheduleTemplate.createdBy, this.auditScheduleTemplate.auditorId, this.auditScheduleTemplate.casoId).subscribe({
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

  submitObservationPopupToAPS(content: any, id: number | undefined) {
    if (!id) {
      this.toast.show('Invalid audit template id', 'error');
      return;
    }
    this.templateId = id;
    this.modalRef = this.modalService.open(content, { backdrop: 'static', keyboard: false});
  }

  csfFile: File | null = null;
  handleFileInput(event: any) {
    this.csfFile = event.target.files[0];
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
          attachmentStatus: this.csfFile ? "Attached" : "No Attachment",
          complianceMessage: this.auditObservationComponentMessage.complianceMessage,
          status: "CASO",
          createdBy: "Current User",
          entryDate: new Date().toISOString().split('T')[0],
          entryTime: new Date().toISOString().split('T')[1].split('.')[0]
        })], { type: 'application/json' })
      );

      // Files part
      if (this.csfFile) {
          formData.append("casofile", this.csfFile);
      } else {
          formData.append("casofile", new Blob([], { type: 'application/octet-stream' }), "emptyfile.txt");
      }
      console.log("Observation Message File ::", formData);
      this.auditService.submitAuditObservationMessageCASO(formData).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.Response) {
            this.toast.show("Compliance message submitted successfully", "success");
            this.getAuditObservationComponent(this.templateId);
            this.resetObservationMessageForm();
            this.refreshService.triggerRefresh();
            this.auditService.getAuditObservationDetails(this.templateId).subscribe(res => {
                this.auditObservation = res;
                this.auditObservationComponent = this.auditObservation?.auditObservationComponent.find(o => o.id === auditObservationComponent.id) ?? null;
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

  addFilesComponent() {
     const newComponent: AuditorResponseFilesTemp =  { id: 0, index: this.auditorResponseFilesTemp.length + 1, documentName: '', remarks: '', auditorResponseId: 0, auditTemplateId: 0, uploadDocFile: null as File | null }
     this.auditorResponseFilesTemp.push(newComponent);
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if(!file)
    return;
    const row = this.auditorResponseFilesTemp.find(f => f.index === index);
    if (row) {
      row.uploadDocFile = file;
      row.documentName = file.name;
    }
  }

  removeFilesComponent(content: any, id: number, index: number) {
      this.fileId = id;
      this.fileIndex = index;
      this.modalRef = this.modalService.open(content, { centered: true });
  }

   deleteFiles(id: number, index: number, content: any) {
      console.log("ID :::::::::::::::::"+id);
      if(id !== 0) {
        this.questionsService.deleteExistingCASOFileData(id).subscribe({
          next: (data) => {
             this.toast.show("File Deleted Successfully !!", "success");
          },
          error: (err) => {
            this.toast.show("Unable to delete !"+err, "error");
          }
        });
        this.auditorResponseFilesTemp = this.auditorResponseFilesTemp.filter(component => component.id !== id);          
      } else {
        console.log("Files not saved yet, removing locally.");
        this.auditorResponseFilesTemp = this.auditorResponseFilesTemp.filter(component => component.index !== index);
      }     
      this.modalRef?.close();
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

  formatNotificationMessage(template: string, data: AuditScheduleTemplate) {
      return template 
        .replace('{auditname}', data.name)
        .replace('{userName}', data.createdBy)
        .replace('{casoName}', data.casoName)
        .replace('{auditorName}', data.auditorName);
  }
} 
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { NgbModal, NgbModalRef, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { AuditscheduleserviceService } from '../service/auditscheduleservice.service';
import { AuditBoardTemplateGen } from '../interface/AuditBoardTemplateGen';
import { AuditorResponseFiles } from '../interface/AuditorResponseFiles';
import { ToastService } from '../service/toast.service';
import { AuditorResponse } from '../interface/AuditorResponse';
import { HttpEventType } from '@angular/common/http';
import { AuditorResponseFilesTemp } from '../interface/AuditorResponseFilesTemp';
import { from, Observable } from 'rxjs';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { AuditorQuestions } from '../interface/auditor-questions';
import { QuestionsService } from '../service/questions.service';
import { AuditorRemarktoCASO } from '../interface/AuditorRemarktoCASO';
import { APP_CONSTANTS } from '../constants/app.constants';
import { AuditBoardScheduleTemplate } from '../interface/AuditBoardScheduleTemplate';
import { UsermanagementService } from '../service/usermanagement.service';

@Component({
  selector: 'app-auditorresponseform',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './auditorresponseform.component.html',
  styleUrl: './auditorresponseform.component.css'
})
export class AuditorresponseformComponent {
  @Input() auditScheduledateinfo: string='';
  constants = APP_CONSTANTS;
  baseUrl = APP_CONSTANTS.FILES.BASE_URL;
  
  auditorRemarktoCASOList: AuditorRemarktoCASO[] = [];
  auditorResponseFilesTemp: AuditorResponseFilesTemp[] = [];
  casoResponseFilesTemp: AuditorResponseFilesTemp[] = [];
  auditorResponseFiles: AuditorResponseFiles[] = [];
  fileId: number = 0;
  fileIndex: number = 0;  

  uploadProgress: number | null = null;
  uploadedFilePath: string | null = null;
  
  registrationForm!: FormGroup;
  auditBoardTemplateGen: AuditBoardTemplateGen | null = {
      id: 0,
      auditBoardScheduleTemplate: null as any,
      questionTemplateList: [],
      auditiorResponse: null as any
  };
  auditorQuestions: AuditorQuestions| null = null;
  auditResponse: AuditorResponse | null = null;
  auditData: any = {};
  reviewForm!: FormGroup;
  templates: AuditScheduleTemplate[] = [];

  private modalRef: NgbModalRef | null = null;
  isEditMode: boolean = false;

  constructor(private fb: FormBuilder, private auditService: AuditscheduleserviceService, private modalService: NgbModal, private questionsService: QuestionsService, private toast: ToastService, private umService: UsermanagementService) {
    this.reviewForm = this.fb.group({auditFromDate: [''], auditToDate: [''],
      letterDate: [''],
      letterNumber: ['']
    });
  }

  ngOnInit() {
   console.log('Received date:', this.auditScheduledateinfo);
    this.auditService.getAuditReviewData().subscribe({
      next: (data) => {
        console.log(">>>>>>>>>>>>>>>>>>", data);
        this.auditBoardTemplateGen = data;
      },
      error: (err) => {
        console.error("Error loading review data:", err);
      }
    });
if(this.auditBoardTemplateGen?.auditBoardScheduleTemplate?.auditTemplateId){

}
    this.auditorResponseFilesTemp = [
      { id: 0, index: 1, documentName: '', remarks: '', auditorResponseId: 0, auditTemplateId: 0, uploadDocFile: null as File | null },
      { id: 0, index: 2, documentName: '', remarks: '', auditorResponseId: 0, auditTemplateId: 0, uploadDocFile: null as File | null }
    ]; 

    this.loadAuditDetails();

   this.reviewForm.get('auditFromDate')?.valueChanges.subscribe(fromDate => {
      const toDate = this.reviewForm.get('auditToDate')?.value;

      if (toDate && toDate < fromDate) {
        this.reviewForm.get('auditToDate')?.setValue('');
      }
    });
  

  }

  addFilesComponent() {
      const newComponent: AuditorResponseFilesTemp =  { id: 0, index: this.auditorResponseFilesTemp.length + 1, documentName: '', remarks: '', auditorResponseId: 0, auditTemplateId: 0, uploadDocFile: null as File | null }
      this.auditorResponseFilesTemp.push(newComponent);
  }

  deleteFiles(id: number, index: number, content: any) {
      console.log("ID :::::::::::::::::"+id);
      if(id !== 0) {
        this.auditService.deleteExistingFileData(id).subscribe({
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
  loadQuestions(id:number) {
    this.auditService
      .getQuestionsByTemplateId(id)
      .subscribe((data: AuditorQuestions) => {
        console.log("response Questions:", data);
        this.auditorQuestions = data;
        console.log("Loaded Questions:", this.auditorQuestions);
      })
      ;
  }
  loadAuditDetails(){

   this.auditService.getAuditReviewData().subscribe({
   next: (data) => {
   console.log("loadAuditDetailsloadAuditDetailsy>>>>>>>>>>>>>>>>>>", data);
   if (data?.auditiorResponse) {
      this.isEditMode = true;

      this.reviewForm.patchValue({
        auditFromDate: data.auditiorResponse.auditFromDate,
        auditToDate: data.auditiorResponse.auditToDate,
        letterNumber: data.auditiorResponse.letterNumber,
        letterDate: data.auditiorResponse.letterDate
      });

      if(data.auditiorResponse.auditorResponseFiles){

        this.auditorResponseFilesTemp =
          data.auditiorResponse.auditorResponseFiles.map((file:any,i:number)=>({
            ...file,
            index:i
          }));

      }else{
        this.auditorResponseFilesTemp = [];
      }

    }

  }});

}

  removeFilesComponent(content: any, id: number, index: number) {
        this.fileId = id;
        this.fileIndex = index;
        this.modalRef = this.modalService.open(content, { centered: true });
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
  buildDownloadUrl(path: string, documentName: string) {
    const normalizedPath = path.replace(/[\\\/]+$/, '');
    const fullPath = `${normalizedPath}\\${documentName}`;
    //console.log("Building download URL for:", fullPath);
    return this.baseUrl + 'v1/qcmt/master/auditfile?fullPath=' + encodeURIComponent(fullPath);
  }
  viewBoardTemplate(content: any) {
      const id = this.auditBoardTemplateGen?.auditBoardScheduleTemplate?.auditTemplateId;
      const auditId = this.auditBoardTemplateGen?.auditBoardScheduleTemplate?.auditTemplateId;
      console.log("viewBoardTemplate auditTemplateId is undefined", id);
      if (id !== undefined && id !== null) {
        this.loadQuestions(id);
        if (auditId !== undefined && auditId !== null) 
        this.getCASOFileDetailsDetails(auditId);
        this.getAuditorRemarksCASO(id);
      } else {
        console.warn("auditTemplateId is undefined");
      }
  
      this.modalRef = this.modalService.open(content, {
        size: "xl",
        backdrop: "static",
        keyboard: false
      });         
  }
  
  submitForm() {

      // ---------------------------
      // 1. BASIC VALIDATION
      // ---------------------------
      if (!this.reviewForm.value.letterNumber || this.reviewForm.value.letterNumber.trim() === '') {
        this.toast.show("Letter number is required!", "error");
        return;
      }

      if (!this.reviewForm.value.letterDate) {
        this.toast.show("Letter Date is required!", "error");
        return;
      }
      if (!this.reviewForm.value.auditFromDate) {
        this.toast.show("Audit From Date is required!", "error");
        return;
      }
      if (!this.reviewForm.value.auditToDate) {
        this.toast.show("Audit To Date is required!", "error");
        return;
      }
      // ---------------------------
      // 2. FILE SIZE VALIDATION
      // ---------------------------
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      const oversizedFiles: string[] = [];
if (!this.auditorResponseFilesTemp||this.auditorResponseFilesTemp.length === 0) {
        this.toast.show(
          `Please upload an Audit Report file`,
          "error"
        );
        return;
      }
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

      const formData = new FormData();
      // JSON part
      formData.append(
        "auditorResponseBean",
        new Blob(
          [
            JSON.stringify({
              id: 0,
              auditTemplateId: this.auditBoardTemplateGen?.auditBoardScheduleTemplate?.auditTemplateId,
              auditTemplateName: this.auditBoardTemplateGen?.auditBoardScheduleTemplate?.name,
              letterNumber: this.reviewForm.value.letterNumber,
              letterDate: this.reviewForm.value.letterDate,
              auditFromDate: this.reviewForm.value.auditFromDate,
              auditToDate: this.reviewForm.value.auditToDate,

              auditorResponseFiles: this.auditorResponseFilesTemp
                .filter(f => f.id === 0)   // ✅ only new files
                .map(f => ({
                  id: f.id,
                  index: f.index,
                  documentName: f.documentName,
                  remarks: f.remarks,
                  auditorResponseId: f.auditorResponseId,
                  auditTemplateId: f.auditTemplateId
                }))
            })
          ],
          { type: "application/json" }
        )
      );

      // Files part
      let fileAdded = false;

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

      console.log("Auditt Response File ::",this.auditResponse);
      this.modalService.dismissAll();

      this.auditService.submitAuditorResponse(formData).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          }

          if (event.type === HttpEventType.Response) {
            this.toast.show("Data saved successfully and audit sent to APS bucket!", "success");
            this.getAuditDetails();
            if (this.auditBoardTemplateGen) { 
              if(this.auditBoardTemplateGen.auditBoardScheduleTemplate) {
                const notificationMessage = this.formatNotificationMessage(this.constants.NOTIFICATION.AUDITOR_TO_APS, this.auditBoardTemplateGen.auditBoardScheduleTemplate);
                this.umService.saveNotification(notificationMessage, this.auditBoardTemplateGen.auditBoardScheduleTemplate.createdById, this.auditBoardTemplateGen.auditBoardScheduleTemplate.createdBy).subscribe({
                  next: (data) => {
                    console.log('Notification sent successfully', data);
                  }
                });
              }
            }
          }
        },
        error: (err) => {
          this.toast.show("Error uploading data! "+err, "error");
          console.error(err);
          return;
        }
      });
  }

  getAuditDetails() {
    this.auditService.getAuditDetails().subscribe({
      next: (data) => {
        this.templates = data;
        this.auditService.setAuditData(this.templates);          
      },
      error: (err) => {
        this.toast.show('Failed to fetch templates'+ err, 'error');
        console.error('Failed to fetch templates', err);
      }
    });
  }
 
  printPDF() {

      const printContents = document.getElementById('printSection')!.innerHTML;

      const generatedBy = this.auditBoardTemplateGen?.auditBoardScheduleTemplate.createdBy ?? "Unknown User";           
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

  getCASOFileDetailsDetails(id: number) {
    this.questionsService.getCASOFileDetails(id).subscribe({
      next: (data) => {
        this.casoResponseFilesTemp = data;
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+this.casoResponseFilesTemp.length);
      
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

   formatNotificationMessage(template: string, data: AuditBoardScheduleTemplate) {
      return template 
        .replace('{auditname}', data.name)
        .replace('{userName}', data.createdBy)
        .replace('{casoName}', data.casoName)
        .replace('{auditorName}', data.auditorName);
  }
showSendBackToCasoPopup(content: any) {
  this.modalRef = this.modalService.open(content, {
      size: "ssm",
      backdrop: "static",
      keyboard: false
    });  
}
showSendBackToCaso() {
  
 
}
}

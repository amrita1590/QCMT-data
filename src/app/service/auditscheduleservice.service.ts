import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { AuditSchedule } from '../interface/AuditSchedule';
import { AuditScheduleTemplate } from '../interface/AuditScheduleTemplate';
import { AuditBoardScheduleTemplate } from '../interface/AuditBoardScheduleTemplate';
import { AuditBoardTemplateGen } from '../interface/AuditBoardTemplateGen';
import { AuditorResponse } from '../interface/AuditorResponse';
import { AuditObservation } from '../interface/AuditObservation';
import { AuditObservationComponentMessage } from '../interface/AuditObservationComponentMessage';
import { AuditorQuestions } from '../interface/auditor-questions';
import { AuditorRemarktoCASO } from '../interface/AuditorRemarktoCASO';
import { AuditObservationStatusHistory } from '../interface/AuditObservationStatusHistory';

@Injectable({
  providedIn: 'root'
})
export class AuditscheduleserviceService {

  private token: any | null = null;
  private saveAuditUrl ='/v1/qcmt/master/saveaudittemplates';
  private getAuditDetailsUrl ='/v1/qcmt/master/getaudittemplates';
  private getAuditorAuditDetailsUrl ='/v1/qcmt/master/getauditoraudittemplates';
  private getCASOAuditDetailsUrl ='/v1/qcmt/master/getcasoaudittemplates';
  private getAuditUrl ='/v1/qcmt/master/getaudittemplates';
  private deleteAuditTemplateUrl ='/v1/qcmt/master/deleteaudittemplates';

  private deleteAuditUrl ='/v1/qcmt/master/deleteaudit';
  private deleteObservationUrl ='/v1/qcmt/master/deleteobservation';
   //Auditor add Questions
    private saveAuditorQuestionsUrl ='/v1/qcmt/master/saveauditorquestions';
    private getQuestionsUrl ='/v1/qcmt/master/getauditquestionsbyaudittempid';
    private deleteQuestionUrl ='/v1/qcmt/master/deleteauditorquestions';
  //Audit board
  private auditBoardSentToCasoUrl ='/v1/qcmt/master/auditsenttocaso';
  private getAuditBoardDetailsUrl ='/v1/qcmt/master/getauditboardtemplates';
  private submitAuditBoarTemplateUrl ='/v1/qcmt/master/submitauditboardtemplatescaso';

  //Audit Response
  private submitAuditorResponseURL = "/v1/qcmt/master/auditoresponsefileupload";
  private getAuditorResponseURL = "/v1/qcmt/master/getauditoresponsebytempid";

  //Audit Observation
  private saveAuditObservationUrl ='/v1/qcmt/master/saveauditobservationscreate';
  private getAuditObservationDetailsUrl ='/v1/qcmt/master/getauditobservationsbytempid';
  private submitAuditObservationMessageCASOUrl ='/v1/qcmt/master/submitobservationmessagecaso';
  private submitAuditObservationMessageAPSUrl ='/v1/qcmt/master/submitobservationmessageaps';
  private getAuditObservationMessagesUrl ='/v1/qcmt/master/getobservationmessagesbyobservationid';
  private updateAuditObservationComponentStatusUrl ='/v1/qcmt/master/updateauditobservationcomponentstatus';
  private getObservationStatusHistoryUrl ='/v1/qcmt/master/getobservationstatushistory';

  private deleteAuditorResponseFileUrl = '/v1/qcmt/master/deleteauditorresponsefile';
  private saveAuditorRemarksCASOUrl ='/v1/qcmt/master/sendbackttocasoremarks';
  private getAuditRemarksForCASOUrl ='/v1/qcmt/master/getauditorremarksforcaso';

  private submitLetterNoDateAPSUrl ='/v1/qcmt/master/submitletternodateaps';
  

  private auditDataSource = new BehaviorSubject<AuditScheduleTemplate[] | null>(null);
  currentAuditData$ = this.auditDataSource.asObservable();
   
  private auditDataGenSource = new BehaviorSubject<AuditBoardTemplateGen | null>(null);
  auditDataGenSource$ = this.auditDataGenSource.asObservable();
  private auditorQuestionsGenSource = new BehaviorSubject<AuditorQuestions| null>(null);
  auditorQuestionsGenSource$ = this.auditorQuestionsGenSource.asObservable();

  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();
  setAuditorQuestionData(data: AuditorQuestions) { 
    console.log("Setting Auditor Questions in Service:", data);
    this.auditorQuestionsGenSource.next(data); 
  }
  setAuditReviewData(data: AuditBoardTemplateGen) { 
    this.auditDataGenSource.next(data); 
  }
  getAuditorQuestionData() { return this.auditorQuestionsGenSource$; }
  setAuditData(data: AuditScheduleTemplate[]) {
    this.auditDataSource.next(data);
  }
  getAuditReviewData() { return this.auditDataGenSource$; }
  
  getAuditDetailsData() { return this.currentAuditData$; } 

  triggerRefresh() {
    this.refreshListSource.next();
  }

  getAuditDetails():Observable<AuditScheduleTemplate[]> {
    return this.http.get<AuditScheduleTemplate[]>(this.getAuditDetailsUrl);
  }

  getAuditorAuditDetails():Observable<AuditScheduleTemplate[]> {
    return this.http.get<AuditScheduleTemplate[]>(this.getAuditorAuditDetailsUrl);
  }

  getCASOAuditDetails():Observable<AuditScheduleTemplate[]> {
    return this.http.get<AuditScheduleTemplate[]>(this.getCASOAuditDetailsUrl);
  }
 
  constructor(private http: HttpClient) { 
    console.log("Inside audit Service Details Service !!");
  } 
   clearAuditData() {
     this.auditDataSource.next(null);
   }
 
   saveAuditDetails(auditDetails: AuditScheduleTemplate):Observable<any> {
       console.log("Inside Audit Details Service ::");
       return this.http.post(this.saveAuditUrl, auditDetails, { responseType: 'text' });
   }
   saveBulkQuestions(data: any) {
    console.log("Inside Audit Details Service saveBulkQuestions::", data);
  return this.http.post(this.saveAuditorQuestionsUrl, data);
}
 getQuestionsByTemplateId(templateId: number) {
  return this.http.post <AuditorQuestions>(
    `${this.getQuestionsUrl}/${templateId}`,
    {}   // 👈 empty body required
  );    
}

deleteQuestion(questionId: number) {
  return this.http.delete<string>(
    `${this.deleteQuestionUrl}/${questionId}`,
    { responseType: 'text' as 'json' }
  );
}
   editAuditDetails(id: number):Observable<AuditScheduleTemplate> {
     console.log("Inside Audit Details Service ::");
     return this.http.get<AuditScheduleTemplate>(this.getAuditUrl+"/"+id);
   }
 
   deleteAuditDetails(id: number):Observable<any> {
     console.log("Inside Audit Details Service ::");
     return this.http.delete(this.deleteAuditTemplateUrl+"/"+id, { responseType: 'text' });
   }

   deleteAudit(id: number):Observable<any> {
     console.log("Inside Audit Details Service ::");
     return this.http.delete(this.deleteAuditUrl+"/"+id, { responseType: 'text' });
   }

   deleteObservation(id: number):Observable<any> {
     console.log("Inside Audit Details Service ::");
     return this.http.delete(this.deleteObservationUrl+"/"+id, { responseType: 'text' });
   }

   //Audit board
   auditSendToCaso(id: number): Observable<any> {
     console.log("Calling Send to CASO");
     return this.http.post(this.auditBoardSentToCasoUrl, id , { responseType: 'text' });
   }

   getAuditBoardDetails(id: number):Observable<AuditBoardScheduleTemplate> {
      return this.http.post<AuditBoardScheduleTemplate>(this.getAuditBoardDetailsUrl, id);
   }

   submitAuditBoardTemplateCaso(id: number):Observable<any> {
      return this.http.post(this.submitAuditBoarTemplateUrl, id , { responseType: 'text' });
   }

   submitAuditorResponse(auditResponse: any):Observable<any> {
      return this.http.post(this.submitAuditorResponseURL, auditResponse , {reportProgress: true, observe: 'events', responseType: 'text' });
   }

   getAuditorResponseDetails(id: number):Observable<AuditorResponse> {
      return this.http.post<AuditorResponse>(this.getAuditorResponseURL, id);
   }

   //Audit Observation
   saveAuditObservationDetails(auditObservation: AuditObservation):Observable<any> {
       console.log("Inside Audit Details Service ::");
       return this.http.post(this.saveAuditObservationUrl, auditObservation, { responseType: 'text' });
   }

   getAuditObservationDetails(id: number):Observable<AuditObservation> {
      return this.http.post<AuditObservation>(this.getAuditObservationDetailsUrl, id);
   }
  
   submitAuditObservationMessageCASO(auditObservationComponentMessage: any):Observable<any> {
      return this.http.post(this.submitAuditObservationMessageCASOUrl, auditObservationComponentMessage , {reportProgress: true, observe: 'events', responseType: 'text' });
   }

   submitAuditObservationMessageAPS(auditObservationComponentMessage: any):Observable<any> {
      return this.http.post(this.submitAuditObservationMessageAPSUrl, auditObservationComponentMessage , {reportProgress: true, observe: 'events', responseType: 'text' });
   }

   getAuditObservationMessages(id: number):Observable<AuditObservationComponentMessage[]> {
      return this.http.post<AuditObservationComponentMessage[]>(this.getAuditObservationMessagesUrl, id);
   }
   
   updateAuditObservationComponentStatus(id: number, status: string):Observable<any> {
      const payload = { id, status };
      return this.http.post(this.updateAuditObservationComponentStatusUrl, payload, { responseType: 'text' });
   }

   getObservationStatusHistory(id: number):Observable<AuditObservationStatusHistory[]> {
      return this.http.post<AuditObservationStatusHistory[]>(this.getObservationStatusHistoryUrl, { id });
   }

   deleteExistingFileData(id: number):Observable<any> {
     console.log("Inside Audit Details Service ::deleteExistingFileData");
     return this.http.delete(this.deleteAuditorResponseFileUrl+"/"+id, { responseType: 'text' });
   }

   saveAuditorRemarksCaso(auditorRemarktoCASOBean: AuditorRemarktoCASO):Observable<any> {
       console.log("Inside Audit Details Service ::");
       return this.http.post(this.saveAuditorRemarksCASOUrl, auditorRemarktoCASOBean, { responseType: 'text' });
   }

   getAuditorRemarksCaso(id: number):Observable<AuditorRemarktoCASO[]> {
      return this.http.post<AuditorRemarktoCASO[]>(this.getAuditRemarksForCASOUrl, id);
   }  

   submitLetterNoDateAPS(auditObservationComponentMessage: any):Observable<any> {
      return this.http.post(this.submitLetterNoDateAPSUrl, auditObservationComponentMessage , {reportProgress: true, observe: 'events', responseType: 'text' });
   }

   uploadIcaoFiles(formData: FormData): Observable<any> {
     return this.http.post('/v1/qcmt/master/auditoresponsefileupload', formData, { responseType: 'text' });
   }

}

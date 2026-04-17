import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { QuestionTemplate } from '../interface/QuestionTemplate';
import { AuditBoardQuestionTemplate } from '../interface/AuditBoardQuestionTemplate';
import { AuditorResponseFilesTemp } from '../interface/AuditorResponseFilesTemp';
@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

   private token: any | null = null;
   private saveQuestionUrl ='/v1/qcmt/master/savequestiontemplates';
   private getQuestionDetailsUrl ='/v1/qcmt/master/getquestiontemplates';
   private getQuestionUrl ='/v1/qcmt/master/getquestiontemplates';
   private deleteQuestionTemplateUrl ='/v1/qcmt/master/deletequestiontemplates';

   private deleteQuestionUrl ='/v1/qcmt/master/deletequestion';

   private submitCASOFileResponseURL = "/v1/qcmt/master/auditcasofileupload";

   // Audit Board QuestionBoard Details
   private getAuditorAuditBoardQuestionDetailsUrl='/v1/qcmt/master/getauditorauditboardquestiontemplates';
   private getAuditBoardQuestionDetailsUrl ='/v1/qcmt/master/getauditboardquestiontemplates';
   private saveAuditBoardQuestionUrl ='/v1/qcmt/master/saveauditboardquestiontemplatescaso';

    private getCASOFileDetailsUrl='/v1/qcmt/master/getauditcasofileuploadbyauditid';
    private deleteCASOResponseFileUrl = '/v1/qcmt/master/deletecasoresponsefile';

   private questionDataSource = new BehaviorSubject<QuestionTemplate | null>(null);
   currentQuestionData = this.questionDataSource.asObservable();
   private refreshListSource = new Subject<void>();
   refreshList$ = this.refreshListSource.asObservable();
 
   triggerRefresh() {
     this.refreshListSource.next();
   }
 
   constructor(private http: HttpClient) { 
      console.log("Inside Question Service Details Service !!");
   }
 
   setQuestionData(data: QuestionTemplate) {
     this.questionDataSource.next(data);
   }
 
   clearQuestionData() {
     this.questionDataSource.next(null);
   }
 
   getQuestionDetails():Observable<QuestionTemplate[]> {
       return this.http.get<QuestionTemplate[]>(this.getQuestionDetailsUrl);
   }
 
   saveQuestionDetails(questionDetails: QuestionTemplate):Observable<any> {
       console.log("Inside Question Details Service ::");
       return this.http.post(this.saveQuestionUrl, questionDetails, { responseType: 'text' });
   }
 
   editQuestionDetails(id: number):Observable<QuestionTemplate> {
     console.log("Inside Question Details Service ::");
     return this.http.get<QuestionTemplate>(this.getQuestionUrl+"/"+id);
   }
 
   deleteQuestionDetails(id: number):Observable<any> {
     console.log("Inside Question Details Service ::");
     return this.http.delete(this.deleteQuestionTemplateUrl+"/"+id, { responseType: 'text' });
   }

   deleteQuestion(id: number):Observable<any> {
     console.log("Inside Question Details Service ::");
     return this.http.delete(this.deleteQuestionUrl+"/"+id, { responseType: 'text' });
   }

   getAuditBoardQuestionDetails():Observable<AuditBoardQuestionTemplate[]> {
       return this.http.get<AuditBoardQuestionTemplate[]>(this.getAuditBoardQuestionDetailsUrl);
   }
   getAuditorAuditBoardQuestionDetails(id:number):Observable<AuditBoardQuestionTemplate> {
     console.log("Inside AuditorQuestion Details Service ::");
       return this.http.get<AuditBoardQuestionTemplate>(this.getAuditorAuditBoardQuestionDetailsUrl+"/"+id);
   }

   saveAuditBoardQuestionDetails(auditBoardQuestionTemplate: AuditBoardQuestionTemplate[]):Observable<any> {
       console.log("Inside Question Details Service ::");
       return this.http.post(this.saveAuditBoardQuestionUrl, auditBoardQuestionTemplate, { responseType: 'text' });
   }

   submitCASOFileResponse(auditResponse: any):Observable<any> {
      return this.http.post(this.submitCASOFileResponseURL, auditResponse , {reportProgress: true, observe: 'events', responseType: 'text' });
   }

   getCASOFileDetails(id:number):Observable<AuditorResponseFilesTemp[]> {
     console.log("Inside AuditorQuestion Details Service ::");
       return this.http.get<AuditorResponseFilesTemp[]>(this.getCASOFileDetailsUrl+"/"+id);
   }
   deleteExistingCASOFileData(id: number):Observable<any> {
     console.log("Inside Audit Details Service ::deleteExistingCASOFileData");
     return this.http.delete(this.deleteCASOResponseFileUrl+"/"+id, { responseType: 'text' });
   }

}

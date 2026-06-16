import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  InternalAuditObservation,
  InternalAuditQuestion,
  InternalAuditResponse,
  InternalAuditSchedule
} from '../internal-audit/internal-audit.model';

@Injectable({
  providedIn: 'root'
})
export class InternalAuditService {
  private saveInternalAuditUrl = '/v1/qcmt/master/saveinternalaudit';
  private getInternalAuditUrl = '/v1/qcmt/master/getinternalaudits';
  private saveQuestionnaireUrl = '/v1/qcmt/master/saveinternalauditquestions';
  private submitUnitResponseUrl = '/v1/qcmt/master/submitinternalauditresponse';
  private submitReportUrl = '/v1/qcmt/master/submitinternalauditreport';
  private saveObservationUrl = '/v1/qcmt/master/saveinternalauditobservations';
  private submitComplianceUrl = '/v1/qcmt/master/submitinternalauditcompliance';

  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  constructor(private http: HttpClient) {
    console.log('Inside Internal Audit Service !!');
  }

  triggerRefresh() {
    this.refreshListSource.next();
  }

  getInternalAudits(): Observable<InternalAuditSchedule[]> {
    return this.http.get<InternalAuditSchedule[]>(this.getInternalAuditUrl);
  }

  saveInternalAudit(audit: InternalAuditSchedule): Observable<any> {
    return this.http.post(this.saveInternalAuditUrl, audit, { responseType: 'text' });
  }

  saveQuestionnaire(auditId: number, questions: InternalAuditQuestion[]): Observable<any> {
    return this.http.post(this.saveQuestionnaireUrl, { auditId, questions }, { responseType: 'text' });
  }

  submitUnitResponse(auditId: number, responses: InternalAuditResponse[]): Observable<any> {
    return this.http.post(this.submitUnitResponseUrl, { auditId, responses }, { responseType: 'text' });
  }

  submitAuditReport(auditId: number, reportData: any): Observable<any> {
    return this.http.post(this.submitReportUrl, reportData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'text'
    });
  }

  saveObservations(auditId: number, observations: InternalAuditObservation[]): Observable<any> {
    return this.http.post(this.saveObservationUrl, { auditId, observations }, { responseType: 'text' });
  }

  submitCompliance(auditId: number, observationId: number, complianceDetails: string): Observable<any> {
    return this.http.post(
      this.submitComplianceUrl,
      { auditId, observationId, complianceDetails },
      { responseType: 'text' }
    );
  }

  getInternalAuditFile(fullPath: string): Observable<Blob> {
    return this.http.get(`/v1/qcmt/master/internalauditfile?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { InternalAuditRecord } from '../interface/InternalAuditRecord';

@Injectable({
  providedIn: 'root'
})
export class InternalAuditService {
  private base = '/v1/qcmt/master';

  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  constructor(private http: HttpClient) {}

  triggerRefresh() {
    this.refreshListSource.next();
  }

  getInternalAudits(): Observable<InternalAuditRecord[]> {
    return this.http.get<InternalAuditRecord[]>(`${this.base}/getinternalaudits`);
  }

  saveInternalAudit(fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/saveinternalaudit`, fd, { responseType: 'text' });
  }

  saveQuestionnaire(auditId: number, questions: any[]): Observable<any> {
    return this.http.post(`${this.base}/saveinternalauditquestions`, { auditId, questions }, { responseType: 'text' });
  }

  submitUnitResponse(auditId: number, responses: any[]): Observable<any> {
    return this.http.post(`${this.base}/submitinternalauditresponse`, { auditId, responses }, { responseType: 'text' });
  }

  submitAuditReport(auditId: number, fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/submitinternalauditreport`, fd, { responseType: 'text' });
  }

  saveObservations(auditId: number, observations: any[]): Observable<any> {
    return this.http.post(`${this.base}/saveinternalauditobservations`, { auditId, observations }, { responseType: 'text' });
  }

  submitCompliance(auditId: number, observationId: number, complianceDetails: string, status: string): Observable<any> {
    return this.http.post(`${this.base}/submitinternalauditcompliance`,
      { auditId, observationId, complianceDetails, status }, { responseType: 'text' });
  }

  requestCompliance(auditId: number, remarks: string): Observable<any> {
    return this.http.post(
      `${this.base}/requestinternalauditcompliance?auditId=${auditId}&remarks=${encodeURIComponent(remarks)}`,
      null, { responseType: 'text' });
  }

  submitFinalCompliance(fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/submitinternalauditfinalcompliance`, fd, { responseType: 'text' });
  }

  deleteInternalAuditFile(fileId: number): Observable<any> {
    return this.http.post(`${this.base}/deleteinternalauditfile?fileId=${fileId}`, null, { responseType: 'text' });
  }

  deleteInternalAudit(id: number): Observable<any> {
    return this.http.post(`${this.base}/deleteinternalaudit?id=${id}`, null, { responseType: 'text' });
  }

  getInternalAuditFile(fullPath: string): Observable<Blob> {
    return this.http.get(`${this.base}/internalauditfile?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }
}

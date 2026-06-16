import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BcasAuditRecord, type BcasObsDraft } from '../interface/BcasAuditRecord';

@Injectable({ providedIn: 'root' })
export class BcasAuditService {

  private base = '/v1/qcmt/master';

  constructor(private http: HttpClient) {}

  saveBcasAudit(fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/savebcasaudit`, fd, { responseType: 'text' });
  }

  updateBcasAudit(fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/updatebcasaudit`, fd, { responseType: 'text' });
  }

  saveBcasObservations(auditId: number, fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/savebcasobservations/${auditId}`, fd, { responseType: 'text' });
  }

  getBcasAudits(): Observable<BcasAuditRecord[]> {
    return this.http.get<BcasAuditRecord[]>(`${this.base}/getbcasaudits`);
  }

  getBcasFile(fullPath: string): Observable<Blob> {
    return this.http.get(`${this.base}/bcasfile?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }

  // ── Draft endpoints ──────────────────────────────────────────────

  saveBcasDraft(fd: FormData): Observable<BcasAuditRecord> {
    return this.http.post<BcasAuditRecord>(`${this.base}/savebcasauditdraft`, fd);
  }

  updateBcasDraft(fd: FormData): Observable<BcasAuditRecord> {
    return this.http.post<BcasAuditRecord>(`${this.base}/updatebcasauditdraft`, fd);
  }

  getBcasDraft(): Observable<BcasAuditRecord | null> {
    // 204 No Content (no draft yet) → body is null → goes to next(), not error
    // catchError handles genuine server errors only
    return this.http.get<BcasAuditRecord | null>(`${this.base}/getbcasauditdraft`).pipe(
      catchError(() => of(null))
    );
  }

  promoteBcasDraft(draftId: number): Observable<any> {
    return this.http.post(`${this.base}/promotebcasauditdraft`, draftId, { responseType: 'text' });
  }

  deleteBcasDraft(draftId: number): Observable<any> {
    return this.http.delete(`${this.base}/deletebcasauditdraft/${draftId}`, { responseType: 'text' });
  }

  // ── Observation draft endpoints ──────────────────────────────────

  saveObsDraft(auditId: number, fd: FormData): Observable<string> {
    return this.http.post(`${this.base}/savebcasobservationdraft/${auditId}`, fd, { responseType: 'text' });
  }

  getObsDraft(auditId: number): Observable<BcasObsDraft | null> {
    return this.http.get<BcasObsDraft | null>(`${this.base}/getbcasobservationdraft/${auditId}`).pipe(
      catchError(() => of(null))
    );
  }

  // ── APS HQrs response endpoint (legacy Accept/Reject) ───────
  saveApsResponse(auditId: number, fd: FormData): Observable<string> {
    return this.http.post(`${this.base}/savebcasapsresponse/${auditId}`, fd, { responseType: 'text' });
  }

  // ── APS HQrs: save compliance progress (no letter, no status change) ──
  saveComplianceDraft(auditId: number, data: any[]): Observable<string> {
    return this.http.post(`${this.base}/savebcasobscompliance/${auditId}`, data, { responseType: 'text' });
  }

  // ── APS HQrs compliance review → Send to CASO (with letter) ─────────
  sendToCaso(auditId: number, fd: FormData): Observable<string> {
    return this.http.post(`${this.base}/sendbcastocaso/${auditId}`, fd, { responseType: 'text' });
  }
}

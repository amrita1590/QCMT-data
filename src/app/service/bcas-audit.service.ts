import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BcasAuditRecord, BcasObservation } from '../interface/BcasAuditRecord';

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

  saveBcasObservations(auditId: number, observations: BcasObservation[]): Observable<any> {
    return this.http.post(`${this.base}/savebcasobservations/${auditId}`, observations, { responseType: 'text' });
  }

  getBcasAudits(): Observable<BcasAuditRecord[]> {
    return this.http.get<BcasAuditRecord[]>(`${this.base}/getbcasaudits`);
  }

  getBcasFile(fullPath: string): Observable<Blob> {
    return this.http.get(`${this.base}/bcasfile?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }
}

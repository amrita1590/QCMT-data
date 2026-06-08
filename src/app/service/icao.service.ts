import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IcaoAuditRecord } from '../interface/IcaoAuditRecord';

@Injectable({ providedIn: 'root' })
export class IcaoService {

  private saveUrl  = '/v1/qcmt/master/saveicaoaudit';
  private getUrl   = '/v1/qcmt/master/geticaoaudits';
  private fileUrl  = '/v1/qcmt/master/icaofile';

  constructor(private http: HttpClient) {}

  saveIcaoAudit(formData: FormData): Observable<any> {
    return this.http.post(this.saveUrl, formData, { responseType: 'text' });
  }

  getIcaoAudits(): Observable<IcaoAuditRecord[]> {
    return this.http.get<IcaoAuditRecord[]>(this.getUrl);
  }

  getIcaoFile(fullPath: string): Observable<Blob> {
    return this.http.get(`${this.fileUrl}?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }
}

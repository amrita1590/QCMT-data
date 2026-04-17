import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { AuditorDetails } from '../interface/auditor-details';
import { UnitDetails } from '../interface/UnitDetails';


@Injectable({
  providedIn: 'root'
})

export class AuditorsService {
private token: any | null = null;
  private saveAuditorUrl ='/v1/qcmt/master/saveauditormaster';
  private getAuditorDetailsUrl ='/v1/qcmt/master/getauditormaster';
  private getAuditorUrl ='/v1/qcmt/master/getauditormaster';
  private deleteAuditorUrl ='/v1/qcmt/master/deleteauditormaster';

  private auditorDataSource = new BehaviorSubject<AuditorDetails | null>(null);
  currentAuditorData = this.auditorDataSource.asObservable();
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();  
  }

  constructor(private http: HttpClient) { 
     console.log("Inside Auditors Details Service !!");
  }
  setAuditorData(data: AuditorDetails) {
      this.auditorDataSource.next(data);
    }
  
    clearAuditorData() {
      this.auditorDataSource.next(null);
    }
  
    getAuditorDetails():Observable<AuditorDetails[]> {
        return this.http.get<AuditorDetails[]>(this.getAuditorDetailsUrl);
    }
  
    saveAuditorDetails(auditorDetails: AuditorDetails):Observable<any> {
        console.log("Inside Auditor Details Service ::");
        return this.http.post(this.saveAuditorUrl, auditorDetails, { responseType: 'text' });
    }
  
    editAuditorDetails(id: number):Observable<AuditorDetails> {
      console.log("Inside Auditor Details Service ::");
      return this.http.get<AuditorDetails>(this.getAuditorUrl+"/"+id);
    }
  
    deleteAuditorDetails(id: number):Observable<any> {
      console.log("Inside Auditor Details Service ::");
      return this.http.delete(this.deleteAuditorUrl+"/"+id, { responseType: 'text' });
    }
}

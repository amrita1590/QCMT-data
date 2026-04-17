import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { UnitDetails } from '../interface/UnitDetails';

@Injectable({
  providedIn: 'root'
})
export class UnitService {

  private token: any | null = null;
  private saveUnitUrl ='/v1/qcmt/master/saveunitmaster';
  private getUnitDetailsUrl ='/v1/qcmt/master/getunitmaster';
  private getUnitUrl ='/v1/qcmt/master/getunitmaster';
  private deleteUnitUrl ='/v1/qcmt/master/deleteunitmaster';

  private unitDataSource = new BehaviorSubject<UnitDetails | null>(null);
  currentUnitData = this.unitDataSource.asObservable();
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();
  }

  constructor(private http: HttpClient) { 
     console.log("Inside Unit Details Service !!");
  }

  setUnitData(data: UnitDetails) {
    this.unitDataSource.next(data);
  }

  clearUnitData() {
    this.unitDataSource.next(null);
  }

  getUnitDetails():Observable<UnitDetails[]> {
      return this.http.get<UnitDetails[]>(this.getUnitDetailsUrl);
  }

  saveUnitDetails(unitDetails: UnitDetails):Observable<any> {
      console.log("Inside Unit Details Service ::");
      return this.http.post(this.saveUnitUrl, unitDetails, { responseType: 'text' });
  }

  editUnitDetails(id: number):Observable<UnitDetails> {
    console.log("Inside Unit Details Service ::");
    return this.http.get<UnitDetails>(this.getUnitUrl+"/"+id);
  }

  deleteUnitDetails(id: number):Observable<any> {
    console.log("Inside Unit Details Service ::");
    return this.http.delete(this.deleteUnitUrl+"/"+id, { responseType: 'text' });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { ClassDetails } from '../interface/ClassDetails';
import { UsermanagementService } from './usermanagement.service';

@Injectable({
  providedIn: 'root'
})
export class ClassdetailsService {

  private token: any | null = null;
  private saveClassUrl ='/v1/qcmt/master/saveclass';
  private getclassDetailsUrl ='/v1/qcmt/master/getclassdetails';
  private getclassUrl ='/v1/qcmt/master/getclass';
  private deleteclassUrl ='/v1/qcmt/master/deleteclass';

  private classDataSource = new BehaviorSubject<ClassDetails | null>(null);
  currentClassData = this.classDataSource.asObservable();
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();
  }

  constructor(private http: HttpClient) { 
     console.log("Inside Class Details Service !!");
  }

  setClassData(data: ClassDetails) {
    this.classDataSource.next(data);
  }

  clearClassData() {
    this.classDataSource.next(null);
  }

  getClassDetails():Observable<ClassDetails[]> {
      return this.http.get<ClassDetails[]>(this.getclassDetailsUrl);
  }

  saveClassDetails(classDetails: ClassDetails):Observable<any> {
      console.log("Inside Class Details Service ::");
      return this.http.post(this.saveClassUrl, classDetails, { responseType: 'text' });
  }

  editClassDetails(id: number):Observable<ClassDetails> {
    console.log("Inside Class Details Service ::");
    return this.http.get<ClassDetails>(this.getclassUrl+"/"+id);
  }

  deleteClassDetails(id: number):Observable<any> {
    console.log("Inside Class Details Service ::");
    return this.http.delete(this.deleteclassUrl+"/"+id, { responseType: 'text' });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { StudentDetails } from '../interface/StudentDetails';
import { UsermanagementService } from './usermanagement.service';
import { ClassDetails } from '../interface/ClassDetails';
import { Report } from '../interface/Report';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  
  private token: any | null = null;
  private saveStudentUrl ='/v1/qcmt/master/savestudent';
  private getStudentDetailsUrl ='/v1/qcmt/master/getstudentdetails';
  private getStudentDetailsbyClassUrl ='/v1/qcmt/master/getstudentdetailsbyclass';
  private getStudentUrl ='/v1/qcmt/master/getstudent';
  private deleteStudentUrl ='/v1/qcmt/master/deletestudent';
  private getAttendanceUrl ='/v1/qcmt/master/getattendancedetails';
  private saveAttendanceUrl ='/v1/qcmt/master/saveattendancedetails';

  private studentReport ='/v1/qcmt/master/studentreport';
  private attendanceDailyReport ='/v1/qcmt/master/getattendancedailyreport';
  private attendanceMonthlyReport ='/v1/qcmt/master/getattendancemonthlyreport';
  private attendanceYearlyReport ='/v1/qcmt/master/getattendanceyearlyreport';
  private studentYearlyReport ='/v1/qcmt/master/getstudentyearlyreport';
  private studentAttendanceDetails ='/v1/qcmt/master/getstudentattendancedetails';

  private studentDataSource = new BehaviorSubject<StudentDetails | null>(null);
  currentStudentData = this.studentDataSource.asObservable();
  private refreshListSource = new Subject<void>();
  refreshList$ = this.refreshListSource.asObservable();

  triggerRefresh() {
    this.refreshListSource.next();
  }

  constructor(private http: HttpClient) { 
     console.log("Inside Student Details Service !!");
  }

  setStudentData(data: StudentDetails) {
    this.studentDataSource.next(data);
  }

  clearStudentData() {
    this.studentDataSource.next(null);
  }

  getStudentDetails():Observable<StudentDetails[]> {
      return this.http.get<StudentDetails[]>(this.getStudentDetailsUrl);
  }

  getStudentsByClassId(classId: number):Observable<StudentDetails[]> {
      return this.http.get<StudentDetails[]>(this.getStudentDetailsbyClassUrl+"/"+classId);
  }

  getStudentReport(report: Report):Observable<StudentDetails[]> {
      return this.http.post<StudentDetails[]>(this.studentReport, report);
  }

  saveStudentDetails(studentDetails: StudentDetails):Observable<any> {
      console.log("Inside Student Details Service ::");
      return this.http.post(this.saveStudentUrl, studentDetails, { responseType: 'text' });
  }

  editStudentDetails(id: number):Observable<StudentDetails> {
    console.log("Inside Student Details Service ::");
    return this.http.get<StudentDetails>(this.getStudentUrl+"/"+id);
  }

  deleteStudentDetails(id: number):Observable<any> {
    console.log("Inside Student Details Service ::");
    return this.http.delete(this.deleteStudentUrl+"/"+id, { responseType: 'text' });
  }
}

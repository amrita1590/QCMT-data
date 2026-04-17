import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClassDetails } from '../interface/ClassDetails';
import { DashboardBean } from '../interface/DashboardBean';
import { AirportListDashboard } from '../interface/AirportListDashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }
  private token: any | null = null;

  private getDashboardDetailsUrl ='/v1/qcmt/master/dashobard';
  private getAirportListDashboardUrl ='/v1/qcmt/master/dashobardAirportList';

  getDashboardDetails(data: any):Observable<DashboardBean> {
      return this.http.post<DashboardBean>(this.getDashboardDetailsUrl, data);
  }

  getAirportDetailList(data: any):Observable<AirportListDashboard[]> {
      return this.http.post<AirportListDashboard[]>(this.getAirportListDashboardUrl, data);
  }


}

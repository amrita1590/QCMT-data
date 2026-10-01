import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClassDetails } from '../interface/ClassDetails';
import { DashboardBean } from '../interface/DashboardBean';
import { AirportListDashboard } from '../interface/AirportListDashboard';
import { UnitObservationCount } from '../interface/UnitObservationCount';
import { UnitObservationRow } from '../interface/UnitObservationRow';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) { }
  private token: any | null = null;

  private getDashboardDetailsUrl ='/v1/qcmt/master/dashobard';
  private getAirportListDashboardUrl ='/v1/qcmt/master/dashobardAirportList';
  private getObservationCountByUnitUrl = '/v1/qcmt/master/dashboard/observationsbyunit';

  getDashboardDetails(data: any):Observable<DashboardBean> {
      return this.http.post<DashboardBean>(this.getDashboardDetailsUrl, data);
  }

  getAirportDetailList(data: any):Observable<AirportListDashboard[]> {
      return this.http.post<AirportListDashboard[]>(this.getAirportListDashboardUrl, data);
  }

  /** Level 1 of the "Total Observations" card drill-down - per-unit observation counts. */
  getObservationCountByUnit(data: any):Observable<UnitObservationCount[]> {
      return this.http.post<UnitObservationCount[]>(this.getObservationCountByUnitUrl, data);
  }

  /** Level 2 of the same drill-down - flat, read-only observation list for one unit. */
  getObservationListByUnit(unitId: number, data: any):Observable<UnitObservationRow[]> {
      return this.http.post<UnitObservationRow[]>(`${this.getObservationCountByUnitUrl}/${unitId}`, data);
  }

}

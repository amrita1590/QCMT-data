import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IqcuCalendar } from '../interface/IqcuCalendar';

@Injectable({ providedIn: 'root' })
export class IqcuCalendarService {

  private base = '/v1/qcmt/master';

  constructor(private http: HttpClient) {}

  uploadCalendar(fd: FormData): Observable<any> {
    return this.http.post(`${this.base}/saveiqcucalendar`, fd, { responseType: 'text' });
  }

  getCalendarList(): Observable<IqcuCalendar[]> {
    return this.http.get<IqcuCalendar[]>(`${this.base}/iqcucalendarlist`);
  }

  /** 204 (no active calendar for that year) resolves as null - see component. */
  getActiveCalendarForYear(year: number): Observable<IqcuCalendar | null> {
    return this.http.get<IqcuCalendar | null>(`${this.base}/iqcucalendaractive/${year}`);
  }

  activateCalendar(id: number): Observable<any> {
    return this.http.post(`${this.base}/activateiqcucalendar/${id}`, {}, { responseType: 'text' });
  }

  deactivateCalendar(id: number): Observable<any> {
    return this.http.post(`${this.base}/deactivateiqcucalendar/${id}`, {}, { responseType: 'text' });
  }

  getCalendarFile(fullPath: string): Observable<Blob> {
    return this.http.get(`${this.base}/iqcucalendarfile?fullPath=${encodeURIComponent(fullPath)}`, { responseType: 'blob' });
  }
}

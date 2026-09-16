import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Feedback, FeedbackStatusUpdateRequest, FeedbackSubmitRequest } from '../interface/Feedback';

export interface FeedbackListFilters {
  feedbackType?: string;
  status?: string;
  unitSection?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {

  private base = '/v1/qcmt/master';

  constructor(private http: HttpClient) {}

  submitFeedback(request: FeedbackSubmitRequest): Observable<any> {
    return this.http.post(`${this.base}/savefeedback`, request, { responseType: 'text' });
  }

  getMyFeedbackList(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.base}/myfeedbacklist`);
  }

  getFeedbackDetail(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.base}/feedback/${id}`);
  }

  getFeedbackList(filters: FeedbackListFilters): Observable<Feedback[]> {
    let params: string[] = [];
    if (filters.feedbackType) params.push(`feedbackType=${encodeURIComponent(filters.feedbackType)}`);
    if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.unitSection) params.push(`unitSection=${encodeURIComponent(filters.unitSection)}`);
    if (filters.fromDate) params.push(`fromDate=${encodeURIComponent(filters.fromDate)}`);
    if (filters.toDate) params.push(`toDate=${encodeURIComponent(filters.toDate)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<Feedback[]>(`${this.base}/feedbacklist${query}`);
  }

  updateFeedbackStatus(id: number, request: FeedbackStatusUpdateRequest): Observable<any> {
    return this.http.post(`${this.base}/updatefeedbackstatus/${id}`, request, { responseType: 'text' });
  }
}

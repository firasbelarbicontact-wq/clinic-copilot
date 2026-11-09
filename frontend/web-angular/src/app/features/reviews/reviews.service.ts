import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { PageResponse } from '../doctors/models/doctor.models';
import { MyReview, PublicReview, RatingSummary } from './review.models';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private readonly http = inject(HttpClient);

  /** Note moyenne d'un médecin ; null si le service d'avis est indisponible. */
  getRating(doctorId: string): Observable<RatingSummary | null> {
    return this.http.get<RatingSummary>(`/api/doctors/${doctorId}/rating`).pipe(catchError(() => of(null)));
  }

  list(doctorId: string, page: number, size = 5): Observable<PageResponse<PublicReview>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<PublicReview>>(`/api/doctors/${doctorId}/reviews`, { params });
  }

  mine(): Observable<MyReview[]> {
    return this.http.get<MyReview[]>('/api/reviews/mine');
  }

  create(body: { doctorId: string; rating: number; comment: string; authorName: string }): Observable<MyReview> {
    return this.http.post<MyReview>('/api/reviews', body);
  }

  update(id: string, body: { rating: number; comment: string }): Observable<MyReview> {
    return this.http.put<MyReview>(`/api/reviews/${id}`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/reviews/${id}`);
  }
}
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export type Verification = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type Professional = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | 'SUSPENDED';
<<<<<<< HEAD
=======
export type AuditKind = 'AUTH' | 'DOCTOR' | 'REVIEW' | 'USER';
export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type ReviewModerationStatus = 'PUBLISHED' | 'HIDDEN';

export interface AdminUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  createdAt: string;
  role: UserRole;
  isActive: boolean;
}

export interface AdminReview {
  id: string;
  doctorId: string;
  patientId: string;
  rating: number;
  comment: string;
  authorName: string;
  status: ReviewModerationStatus;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  kind: AuditKind;
  action: string;
  target: string;
}
>>>>>>> origin/main

export interface AdminDoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  city: string | null;
  verificationStatus: Verification;
  professionalStatus: Professional;
  createdAt: string;
}

export interface AdminDiploma {
  id: string;
  title: string;
  institution: string | null;
  yearObtained: number | null;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  status: Verification;
  rejectionReason: string | null;
  uploadedAt: string;
}

export interface AdminDoctorDetail {
  userId: string;
  profile: { id: string; firstName: string; lastName: string; licenseNumber: string; phone: string | null; addressLine: string | null; city: string | null };
  diplomas: AdminDiploma[];
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/api/admin`;

  list(status: Verification): Observable<Page<AdminDoctorSummary>> {
    const params = new HttpParams().set('verificationStatus', status).set('size', 50);
    return this.http.get<Page<AdminDoctorSummary>>(`${this.base}/doctors`, { params });
  }

  get(id: string): Observable<AdminDoctorDetail> {
    return this.http.get<AdminDoctorDetail>(`${this.base}/doctors/${id}`);
  }

  review(diplomaId: string, decision: 'VERIFIED' | 'REJECTED', reason?: string): Observable<AdminDoctorDetail> {
    return this.http.patch<AdminDoctorDetail>(`${this.base}/diplomas/${diplomaId}/verification`, { decision, reason });
  }

  setStatus(doctorId: string, status: Professional, reason?: string): Observable<AdminDoctorDetail> {
    return this.http.patch<AdminDoctorDetail>(`${this.base}/doctors/${doctorId}/status`, { status, reason });
  }

  file(diplomaId: string): Observable<Blob> {
    return this.http.get(`${this.base}/diplomas/${diplomaId}/file`, { responseType: 'blob' });
  }
<<<<<<< HEAD
}
=======

  audit(): Observable<AuditEntry[]> {
    return this.http.get<AuditEntry[]>(`${this.base}/audit`);
  }

  // --- Gestion des utilisateurs (identity-profile-service) ---
  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${API_BASE_URL}/api/users`);
  }

  activateUser(userId: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/api/users/${userId}/activate`, {});
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/api/users/${userId}/deactivate`, {});
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/users/${userId}`);
  }

  // --- Modération des avis (reviews-feedback-service) ---
  listReviews(status?: ReviewModerationStatus, page = 0, size = 50): Observable<Page<AdminReview>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Page<AdminReview>>(`${this.base}/reviews`, { params });
  }

  hideReview(reviewId: string, reason: string): Observable<AdminReview> {
    return this.http.patch<AdminReview>(`${this.base}/reviews/${reviewId}/hide`, { reason });
  }

  publishReview(reviewId: string): Observable<AdminReview> {
    return this.http.patch<AdminReview>(`${this.base}/reviews/${reviewId}/publish`, {});
  }
}
>>>>>>> origin/main

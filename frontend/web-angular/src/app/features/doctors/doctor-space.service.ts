import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export type Verification = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type Professional = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | 'SUSPENDED';

export interface MyProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  bio: string | null;
  licenseNumber: string;
  yearsExperience: number | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  governorate: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  verificationStatus: Verification;
  professionalStatus: Professional;
  specialties: { code: string; name: string; primary: boolean }[];
  languages: { code: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export type ProfileUpdate = Omit<
  MyProfile,
  'id' | 'verificationStatus' | 'professionalStatus' | 'specialties' | 'languages' | 'createdAt' | 'updatedAt'
>;

export interface MyDiploma {
  id: string;
  type: 'DIPLOMA' | 'LICENSE' | 'OTHER';
  title: string;
  institution: string | null;
  yearObtained: number | null;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  status: Verification;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

export const VERIFICATION_LABEL: Record<Verification, string> = {
  PENDING: 'En attente de vérification',
  VERIFIED: 'Vérifié',
  REJECTED: 'Refusé',
};

export const VERIFICATION_BADGE: Record<Verification, string> = {
  PENDING: 'bg-warning/15 text-deep',
  VERIFIED: 'bg-success/15 text-deep',
  REJECTED: 'bg-destructive/10 text-destructive',
};

@Injectable({ providedIn: 'root' })
export class DoctorSpaceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/api/doctors/me`;

  me(): Observable<MyProfile> {
    return this.http.get<MyProfile>(this.base);
  }
  update(body: ProfileUpdate): Observable<MyProfile> {
    return this.http.put<MyProfile>(this.base, body);
  }
  setSpecialties(codes: string[], primary: string): Observable<MyProfile> {
    return this.http.put<MyProfile>(`${this.base}/specialties`, { specialtyCodes: codes, primaryCode: primary });
  }
  setLanguages(codes: string[]): Observable<MyProfile> {
    return this.http.put<MyProfile>(`${this.base}/languages`, { languageCodes: codes });
  }
  setStatus(status: Professional): Observable<MyProfile> {
    return this.http.patch<MyProfile>(`${this.base}/status`, { status });
  }
  diplomas(): Observable<MyDiploma[]> {
    return this.http.get<MyDiploma[]>(`${this.base}/diplomas`);
  }
  upload(form: FormData): Observable<MyDiploma> {
    return this.http.post<MyDiploma>(`${this.base}/diplomas`, form);
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/diplomas/${id}`);
  }
  file(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/diplomas/${id}/file`, { responseType: 'blob' });
  }
}
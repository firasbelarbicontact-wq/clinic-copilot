import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';

export interface RefItem {
  code: string;
  name: string;
}

export interface DoctorOnboarding {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phone: string;
  addressLine: string;
  city: string;
  specialtyCode: string;
  languageCodes: string[];
  diplomaFile: File;
  diplomaTitle: string;
}

@Injectable({ providedIn: 'root' })
export class DoctorOnboardingService {
  private readonly http = inject(HttpClient);

  specialties(): Observable<RefItem[]> {
    return this.http.get<RefItem[]>(`${API_BASE_URL}/api/specialties`);
  }

  languages(): Observable<RefItem[]> {
    return this.http.get<RefItem[]>(`${API_BASE_URL}/api/languages`);
  }

  /** À appeler une fois connecté (le token est ajouté par l'interceptor). */
  createProfile(d: DoctorOnboarding): Observable<void> {
    const base = `${API_BASE_URL}/api/doctors/me`;
    const profile = {
      firstName: d.firstName,
      lastName: d.lastName,
      licenseNumber: d.licenseNumber,
      phone: d.phone || null,
      addressLine: d.addressLine,
      city: d.city,
    };
    const form = new FormData();
    form.append('file', d.diplomaFile);
    form.append('type', 'DIPLOMA');
    form.append('title', d.diplomaTitle);

    return this.http.post(base, profile).pipe(
      switchMap(() =>
        this.http.put(`${base}/specialties`, { specialtyCodes: [d.specialtyCode], primaryCode: d.specialtyCode }),
      ),
      switchMap(() =>
        d.languageCodes.length ? this.http.put(`${base}/languages`, { languageCodes: d.languageCodes }) : of(null),
      ),
      switchMap(() => this.http.post(`${base}/diplomas`, form)),
      map(() => undefined),
    );
  }
}
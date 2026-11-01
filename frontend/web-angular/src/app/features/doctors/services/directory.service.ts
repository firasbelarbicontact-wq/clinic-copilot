import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api.config';
import {
  DirectorySearchParams,
  PageResponse,
  PublicDoctorDetail,
  PublicDoctorSummary,
  LanguageItem,
  SpecialtyItem,
} from '../models/doctor.models';

@Injectable({ providedIn: 'root' })
export class DirectoryService {
  private readonly http = inject(HttpClient);

  /** Liste des médecins avec filtres (les champs vides sont ignorés). */
  search(params: DirectorySearchParams = {}): Observable<PageResponse<PublicDoctorSummary>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PageResponse<PublicDoctorSummary>>(
      `${API_BASE_URL}/api/directory/doctors`,
      { params: httpParams },
    );
  }

  /** Fiche publique d'un médecin. */
  getById(id: string): Observable<PublicDoctorDetail> {
    return this.http.get<PublicDoctorDetail>(`${API_BASE_URL}/api/directory/doctors/${id}`);
  }

  specialties(): Observable<SpecialtyItem[]> {
    return this.http.get<SpecialtyItem[]>(`${API_BASE_URL}/api/specialties`);
  }

  languages(): Observable<LanguageItem[]> {
    return this.http.get<LanguageItem[]>(`${API_BASE_URL}/api/languages`);
  }
}
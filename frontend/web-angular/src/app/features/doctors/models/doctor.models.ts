export interface SpecialtyView {
  code: string;
  name: string;
  primary: boolean;
}

export interface LanguageView {
  code: string;
  name: string;
}

export interface PublicDoctorSummary {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  city: string | null;
  governorate: string | null;
  yearsExperience: number | null;
  specialties: SpecialtyView[];
  languages: LanguageView[];
  distanceKm: number | null;
}

export interface PublicDoctorDetail {
  id: string;
  title: string | null;
  firstName: string;
  lastName: string;
  bio: string | null;
  yearsExperience: number | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  governorate: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  specialties: SpecialtyView[];
  languages: LanguageView[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DirectorySearchParams {
  q?: string;
  specialty?: string;
  language?: string;
  city?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: 'name' | 'distance';
  page?: number;
  size?: number;
}

/** Réponse de /api/languages */
export interface LanguageItem {
  code: string;
  name: string;
}

/** Réponse de /api/specialties */
export interface SpecialtyItem {
  code: string;
  name: string;
  description: string | null;
}
export interface Vitals {
  sys: number;
  dia: number;
  hr: number;
  weight: number;
}

export interface PatientExtra {
  tags: string[];
  allergies: string[];
  bloodType: string;
  /** Ancienneté du dossier, en jours. */
  sinceDays: number;
  /** Mesures, de la plus ancienne à la plus récente. */
  vitals: Vitals[];
}

export const EMPTY_EXTRA: PatientExtra = { tags: [], allergies: [], bloodType: '—', sinceDays: 0, vitals: [] };

export const PATIENT_EXTRAS: Record<string, PatientExtra> = {
  'p-2': {
    tags: ['Hypertension', 'Suivi régulier'],
    allergies: [],
    bloodType: 'A+',
    sinceDays: 420,
    vitals: [
      { sys: 152, dia: 95, hr: 80, weight: 88 },
      { sys: 149, dia: 94, hr: 78, weight: 87.5 },
      { sys: 146, dia: 92, hr: 79, weight: 87 },
      { sys: 142, dia: 90, hr: 76, weight: 86.5 },
      { sys: 138, dia: 88, hr: 75, weight: 86 },
      { sys: 134, dia: 86, hr: 74, weight: 85.5 },
    ],
  },
  'p-3': {
    tags: ['ECG à revoir'],
    allergies: ['Latex'],
    bloodType: 'O+',
    sinceDays: 300,
    vitals: [
      { sys: 118, dia: 76, hr: 70, weight: 62 },
      { sys: 120, dia: 78, hr: 72, weight: 62 },
      { sys: 119, dia: 77, hr: 69, weight: 61.5 },
      { sys: 121, dia: 79, hr: 71, weight: 61.5 },
      { sys: 117, dia: 75, hr: 68, weight: 61 },
      { sys: 118, dia: 76, hr: 70, weight: 61 },
    ],
  },
  'p-4': {
    tags: ['Nouveau patient'],
    allergies: [],
    bloodType: 'B+',
    sinceDays: 5,
    vitals: [
      { sys: 124, dia: 80, hr: 66, weight: 78 },
      { sys: 122, dia: 79, hr: 65, weight: 78 },
    ],
  },
  'p-me': {
    tags: ['Contrôle tension', 'Allergie pénicilline'],
    allergies: ['Pénicilline'],
    bloodType: 'AB+',
    sinceDays: 700,
    vitals: [
      { sys: 130, dia: 84, hr: 74, weight: 66 },
      { sys: 128, dia: 83, hr: 73, weight: 66 },
      { sys: 131, dia: 85, hr: 75, weight: 65.5 },
      { sys: 126, dia: 82, hr: 72, weight: 65 },
      { sys: 127, dia: 82, hr: 72, weight: 65 },
      { sys: 124, dia: 80, hr: 71, weight: 64.5 },
    ],
  },
};
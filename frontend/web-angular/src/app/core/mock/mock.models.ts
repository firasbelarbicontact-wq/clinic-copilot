export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type AppointmentMode = 'CABINET' | 'VIDEO';

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientId: string;
  patientName: string;
  start: string; // ISO
  durationMin: number;
  reason: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
}

export type RecordType = 'CONSULTATION' | 'ORDONNANCE' | 'ANALYSE' | 'ALLERGIE' | 'VACCIN';

export interface RecordEntry {
  id: string;
  patientId: string;
  date: string; // ISO
  type: RecordType;
  title: string;
  doctorName: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string; // ISO
}

export interface Conversation {
  id: string;
  contactName: string;
  contactRole: 'DOCTOR' | 'PATIENT';
  messages: ChatMessage[];
}

export interface AppNotification {
  id: string;
  kind: 'RDV' | 'AVIS' | 'DOSSIER' | 'SYSTEME';
  title: string;
  body: string;
  at: string; // ISO
  read: boolean;
}

export interface MockPatient {
  id: string;
  name: string;
  age: number;
  phone: string;
  lastVisit: string; // ISO
  note: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  active: boolean;
  createdAt: string; // ISO
}

export interface AuditEntry {
  id: string;
  at: string; // ISO
  actor: string;
  action: string;
  target: string;
}

export interface MockReview {
  id: string;
  doctorName: string;
  authorName: string;
  rating: number;
  comment: string;
  at: string; // ISO
  status: 'PUBLISHED' | 'HIDDEN';
}

export interface Slot {
  start: string; // ISO
  available: boolean;
}
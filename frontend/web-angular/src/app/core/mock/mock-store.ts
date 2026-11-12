import { Injectable, computed, signal } from '@angular/core';
import {
  AppNotification, Appointment, AppointmentMode, AppointmentStatus, AuditEntry, ChatMessage,
  Conversation, MockPatient, MockReview, MockUser, RecordEntry, Slot,
} from './mock.models';

const uid = () => Math.random().toString(36).slice(2, 10);

/** Date relative à maintenant, à l'heure voulue. */
function at(daysFromNow: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const ME_PATIENT = { id: 'p-me', name: 'Sarah Ben Ali', email: 'sarah.benali@demo.tn', phone: '+216 20 123 456', birthDate: '1996-04-12' };
export const ME_DOCTOR = { id: 'd-1', name: 'Dr Karim Trabelsi', specialty: 'Cardiologie' };

export const MOCK_DOCTORS = [
  { id: 'd-1', name: 'Dr Karim Trabelsi', specialty: 'Cardiologie', city: 'Tunis' },
  { id: 'd-2', name: 'Dr Amel Gharbi', specialty: 'Dermatologie', city: 'Sfax' },
  { id: 'd-3', name: 'Dr Youssef Mansouri', specialty: 'Pédiatrie', city: 'Sousse' },
  { id: 'd-4', name: 'Dr Ines Khelifi', specialty: 'Médecine générale', city: 'Tunis' },
];

@Injectable({ providedIn: 'root' })
export class MockStore {
  // ---------- Rendez-vous ----------
  readonly appointments = signal<Appointment[]>([
    { id: 'a1', doctorId: 'd-1', doctorName: 'Dr Karim Trabelsi', specialty: 'Cardiologie', patientId: 'p-me', patientName: 'Sarah Ben Ali', start: at(2, 10), durationMin: 30, reason: 'Contrôle tension', mode: 'CABINET', status: 'CONFIRMED' },
    { id: 'a2', doctorId: 'd-4', doctorName: 'Dr Ines Khelifi', specialty: 'Médecine générale', patientId: 'p-me', patientName: 'Sarah Ben Ali', start: at(6, 15, 30), durationMin: 20, reason: 'Fatigue persistante', mode: 'VIDEO', status: 'PENDING' },
    { id: 'a3', doctorId: 'd-2', doctorName: 'Dr Amel Gharbi', specialty: 'Dermatologie', patientId: 'p-me', patientName: 'Sarah Ben Ali', start: at(-12, 11), durationMin: 30, reason: 'Acné', mode: 'CABINET', status: 'COMPLETED' },
    { id: 'a4', doctorId: 'd-1', doctorName: 'Dr Karim Trabelsi', specialty: 'Cardiologie', patientId: 'p-2', patientName: 'Mohamed Jlassi', start: at(0, 14), durationMin: 30, reason: 'Palpitations', mode: 'CABINET', status: 'CONFIRMED' },
    { id: 'a5', doctorId: 'd-1', doctorName: 'Dr Karim Trabelsi', specialty: 'Cardiologie', patientId: 'p-3', patientName: 'Leila Mejri', start: at(1, 9, 30), durationMin: 30, reason: 'Résultats ECG', mode: 'VIDEO', status: 'PENDING' },
    { id: 'a6', doctorId: 'd-1', doctorName: 'Dr Karim Trabelsi', specialty: 'Cardiologie', patientId: 'p-4', patientName: 'Anis Bouazizi', start: at(3, 16), durationMin: 45, reason: 'Première consultation', mode: 'CABINET', status: 'PENDING' },
  ]);

  readonly myAppointments = computed(() =>
    this.appointments().filter((a) => a.patientId === ME_PATIENT.id).sort((x, y) => x.start.localeCompare(y.start)));
  readonly doctorAppointments = computed(() =>
    this.appointments().filter((a) => a.doctorId === ME_DOCTOR.id).sort((x, y) => x.start.localeCompare(y.start)));

  slotsFor(doctorId: string, dayOffset: number): Slot[] {
    const taken = new Set(this.appointments().filter((a) => a.doctorId === doctorId && a.status !== 'CANCELLED').map((a) => a.start));
    return [9, 10, 11, 14, 15, 16, 17].map((h) => {
      const start = at(dayOffset, h);
      return { start, available: !taken.has(start) };
    });
  }

  book(doctorId: string, start: string, reason: string, mode: AppointmentMode): Appointment {
    const doc = MOCK_DOCTORS.find((d) => d.id === doctorId)!;
    const appt: Appointment = {
      id: uid(), doctorId, doctorName: doc.name, specialty: doc.specialty,
      patientId: ME_PATIENT.id, patientName: ME_PATIENT.name,
      start, durationMin: 30, reason: reason || 'Consultation', mode, status: 'PENDING',
    };
    this.appointments.update((l) => [...l, appt]);
    this.pushNotification({ kind: 'RDV', title: 'Demande envoyée', body: `Votre demande avec ${doc.name} est en attente de confirmation.` });
    return appt;
  }

  setStatus(id: string, status: AppointmentStatus) {
    this.appointments.update((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  // ---------- Dossier médical ----------
  readonly records = signal<RecordEntry[]>([
    { id: 'r1', patientId: 'p-me', date: at(-12), type: 'CONSULTATION', title: 'Consultation dermatologie', doctorName: 'Dr Amel Gharbi', summary: 'Acné modérée. Traitement local pendant 8 semaines.' },
    { id: 'r2', patientId: 'p-me', date: at(-12), type: 'ORDONNANCE', title: 'Ordonnance : crème adapalène 0,1 %', doctorName: 'Dr Amel Gharbi', summary: "1 application le soir, éviter l'exposition au soleil." },
    { id: 'r3', patientId: 'p-me', date: at(-60), type: 'ANALYSE', title: 'Bilan sanguin complet', doctorName: 'Dr Ines Khelifi', summary: 'Résultats dans les normes. Légère carence en vitamine D.' },
    { id: 'r4', patientId: 'p-me', date: at(-200), type: 'VACCIN', title: 'Rappel antitétanique', doctorName: 'Dr Ines Khelifi', summary: 'Prochain rappel dans 10 ans.' },
    { id: 'r5', patientId: 'p-me', date: at(-400), type: 'ALLERGIE', title: 'Allergie à la pénicilline', doctorName: 'Dr Ines Khelifi', summary: 'Éruption cutanée constatée. À signaler à tout prescripteur.' },
  ]);
  readonly myRecords = computed(() => this.records().filter((r) => r.patientId === ME_PATIENT.id).sort((a, b) => b.date.localeCompare(a.date)));

  // ---------- Patients du médecin ----------
  readonly doctorPatients = signal<MockPatient[]>([
    { id: 'p-2', name: 'Mohamed Jlassi', age: 54, phone: '+216 22 555 101', lastVisit: at(-30), note: 'Hypertension suivie, traitement en cours.' },
    { id: 'p-3', name: 'Leila Mejri', age: 38, phone: '+216 98 100 232', lastVisit: at(-9), note: 'ECG normal, à revoir pour résultats.' },
    { id: 'p-4', name: 'Anis Bouazizi', age: 29, phone: '+216 55 800 410', lastVisit: at(-90), note: 'Nouveau patient.' },
    { id: 'p-me', name: 'Sarah Ben Ali', age: 30, phone: '+216 20 123 456', lastVisit: at(-5), note: 'Contrôle tension régulier.' },
  ]);

  // ---------- Messagerie ----------
  readonly conversations = signal<Conversation[]>([
    { id: 'c1', contactName: 'Dr Karim Trabelsi', contactRole: 'DOCTOR', messages: [
      { id: 'm1', from: 'them', text: 'Bonjour Sarah, pensez à apporter vos derniers résultats.', at: at(-1, 17) },
      { id: 'm2', from: 'me', text: "Bonjour docteur, c'est noté, merci !", at: at(-1, 18) },
    ] },
    { id: 'c2', contactName: 'Dr Ines Khelifi', contactRole: 'DOCTOR', messages: [
      { id: 'm3', from: 'them', text: 'Votre bilan est bon, on en parle lors de la visio.', at: at(-3, 12) },
    ] },
  ]);

  sendMessage(conversationId: string, text: string) {
    const msg: ChatMessage = { id: uid(), from: 'me', text, at: new Date().toISOString() };
    this.conversations.update((l) => l.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)));
  }
  // ---------- Messagerie côté médecin ----------
  readonly doctorConversations = signal<Conversation[]>([
    { id: 'dc1', contactName: 'Mohamed Jlassi', contactRole: 'PATIENT', messages: [
      { id: 'dm1', from: 'them', text: "Bonjour docteur, j'ai encore des palpitations le soir.", at: at(-1, 19) },
    ] },
    { id: 'dc2', contactName: 'Leila Mejri', contactRole: 'PATIENT', messages: [
      { id: 'dm2', from: 'them', text: 'Merci pour la consultation, je passe chercher les résultats demain.', at: at(-2, 11) },
      { id: 'dm3', from: 'me', text: 'Parfait, à demain.', at: at(-2, 12) },
    ] },
    { id: 'dc3', contactName: 'Sarah Ben Ali', contactRole: 'PATIENT', messages: [
      { id: 'dm4', from: 'me', text: 'Bonjour Sarah, pensez à apporter vos derniers résultats.', at: at(-1, 17) },
      { id: 'dm5', from: 'them', text: "Bonjour docteur, c'est noté, merci !", at: at(-1, 18) },
    ] },
  ]);

  sendDoctorMessage(conversationId: string, text: string, from: 'me' | 'them' = 'me') {
    const msg: ChatMessage = { id: uid(), from, text, at: new Date().toISOString() };
    this.doctorConversations.update((l) => l.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)));
  }
  // ---------- Notifications ----------
  readonly notifications = signal<AppNotification[]>([
    { id: 'n1', kind: 'RDV', title: 'Rendez-vous confirmé', body: 'Dr Karim Trabelsi a confirmé votre rendez-vous.', at: at(-1, 9), read: false },
    { id: 'n2', kind: 'DOSSIER', title: 'Nouveau document', body: 'Une ordonnance a été ajoutée à votre dossier.', at: at(-12, 12), read: true },
    { id: 'n3', kind: 'SYSTEME', title: 'Bienvenue sur Clinic Copilot', body: 'Complétez votre profil pour de meilleurs rappels.', at: at(-30, 8), read: true },
  ]);
  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  markRead(id: string) {
    this.notifications.update((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
  markAllRead() {
    this.notifications.update((l) => l.map((n) => ({ ...n, read: true })));
  }
  private pushNotification(n: Pick<AppNotification, 'kind' | 'title' | 'body'>) {
    this.notifications.update((l) => [{ id: uid(), at: new Date().toISOString(), read: false, ...n }, ...l]);
  }

  // ---------- Avis ----------
  readonly reviews = signal<MockReview[]>([
    { id: 'v1', doctorName: 'Dr Karim Trabelsi', authorName: 'Sarah M.', rating: 5, comment: "Très à l'écoute et rassurant.", at: at(-10), status: 'PUBLISHED' },
    { id: 'v2', doctorName: 'Dr Karim Trabelsi', authorName: 'Karim B.', rating: 4, comment: "Bon suivi, un peu d'attente.", at: at(-20), status: 'PUBLISHED' },
    { id: 'v3', doctorName: 'Dr Amel Gharbi', authorName: 'Amel T.', rating: 5, comment: 'Excellente prise en charge.', at: at(-8), status: 'PUBLISHED' },
    { id: 'v4', doctorName: 'Dr Ines Khelifi', authorName: 'Anonyme', rating: 1, comment: 'Message hors sujet.', at: at(-4), status: 'HIDDEN' },
    { id: 'v5', doctorName: 'Dr Karim Trabelsi', authorName: 'Leila M.', rating: 5, comment: 'Explications claires et très rassurant, je recommande.', at: at(-3), status: 'PUBLISHED' },
    { id: 'v6', doctorName: 'Dr Karim Trabelsi', authorName: 'Anis B.', rating: 5, comment: 'Rendez-vous ponctuel et suivi sérieux.', at: at(-6), status: 'PUBLISHED' },
    { id: 'v7', doctorName: 'Dr Karim Trabelsi', authorName: 'Mohamed J.', rating: 4, comment: 'Très compétent, cabinet facile d\'accès.', at: at(-14), status: 'PUBLISHED' },
    { id: 'v8', doctorName: 'Dr Karim Trabelsi', authorName: 'Hela S.', rating: 3, comment: 'Bonne consultation mais un long temps d\'attente.', at: at(-27), status: 'PUBLISHED' },
    { id: 'v9', doctorName: 'Dr Karim Trabelsi', authorName: 'Nizar K.', rating: 5, comment: 'À l\'écoute, merci pour votre disponibilité.', at: at(-45), status: 'PUBLISHED' },
  
]);
  readonly doctorReviews = computed(() => this.reviews().filter((r) => r.doctorName === ME_DOCTOR.name && r.status === 'PUBLISHED'));

  setReviewStatus(id: string, status: 'PUBLISHED' | 'HIDDEN') {
    this.reviews.update((l) => l.map((r) => (r.id === id ? { ...r, status } : r)));
    this.log('admin@clinic.tn', status === 'HIDDEN' ? 'Avis masqué' : 'Avis republié', id);
  }

  // ---------- Admin ----------
  readonly users = signal<MockUser[]>([
    { id: 'u1', name: 'Sarah Ben Ali', email: 'sarah.benali@demo.tn', role: 'PATIENT', active: true, createdAt: at(-60) },
    { id: 'u2', name: 'Dr Karim Trabelsi', email: 'k.trabelsi@demo.tn', role: 'DOCTOR', active: true, createdAt: at(-90) },
    { id: 'u3', name: 'Dr Amel Gharbi', email: 'a.gharbi@demo.tn', role: 'DOCTOR', active: true, createdAt: at(-75) },
    { id: 'u4', name: 'Mohamed Jlassi', email: 'm.jlassi@demo.tn', role: 'PATIENT', active: false, createdAt: at(-20) },
    { id: 'u5', name: 'Admin Clinic', email: 'admin@clinic.tn', role: 'ADMIN', active: true, createdAt: at(-120) },
  ]);

  toggleUser(id: string) {
    const u = this.users().find((x) => x.id === id);
    this.users.update((l) => l.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    if (u) this.log('admin@clinic.tn', u.active ? 'Compte désactivé' : 'Compte réactivé', u.email);
  }

  readonly audit = signal<AuditEntry[]>([
    { id: 'l1', at: at(-2, 10), actor: 'admin@clinic.tn', action: 'Diplôme validé', target: 'Dr Amel Gharbi' },
    { id: 'l2', at: at(-5, 15), actor: 'admin@clinic.tn', action: 'Compte désactivé', target: 'm.jlassi@demo.tn' },
    { id: 'l3', at: at(-9, 9), actor: 'system', action: 'Connexion échouée', target: 'unknown@demo.tn' },
  ]);

  private log(actor: string, action: string, target: string) {
    this.audit.update((l) => [{ id: uid(), at: new Date().toISOString(), actor, action, target }, ...l]);
  }

  readonly stats = computed(() => ({
    users: this.users().length,
    doctors: this.users().filter((u) => u.role === 'DOCTOR').length,
    patients: this.users().filter((u) => u.role === 'PATIENT').length,
    appointments: this.appointments().length,
    hiddenReviews: this.reviews().filter((r) => r.status === 'HIDDEN').length,
  }));

  // ---------- Assistant IA (réponse simulée) ----------
  assistantReply(question: string): string {
    const q = question.toLowerCase();
    if (/(douleur|poitrine|cœur|coeur|essouffl)/.test(q)) {
      return 'Une douleur thoracique ou un essoufflement peut être sérieux. En cas de douleur intense ou persistante, appelez le 190 (SAMU). Sinon, je vous conseille un rendez-vous en cardiologie rapidement.';
    }
    if (/(fièvre|fievre|toux|grippe)/.test(q)) {
      return 'Reposez-vous, hydratez-vous et surveillez votre température. Si la fièvre dépasse 3 jours ou 39 °C, consultez un médecin généraliste.';
    }
    if (/(peau|bouton|acné|acne|rougeur)/.test(q)) {
      return "Un avis dermatologique est recommandé. Évitez de gratter ou d'appliquer des produits non prescrits en attendant.";
    }
    return 'Merci pour votre message. Pour vous orienter, pouvez-vous préciser depuis quand les symptômes ont commencé et leur intensité ? Je ne remplace pas un médecin.';
  }
}
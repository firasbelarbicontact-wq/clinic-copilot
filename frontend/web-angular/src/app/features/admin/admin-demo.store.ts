import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

export type ReviewState = 'PUBLISHED' | 'HIDDEN';
export type DemoRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type AuditKind = 'AUTH' | 'DOCTOR' | 'REVIEW' | 'USER';

export interface DemoReview {
  id: string;
  doctorName: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: ReviewState;
  flagged: boolean;
  hiddenReason?: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoRole;
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  kind: AuditKind;
  action: string;
  target: string;
}

const ago = (days: number, hour = 9, min = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};
let seq = 100;
const uid = () => `x${seq++}`;

@Injectable({ providedIn: 'root' })
export class AdminDemoStore {
  private readonly auth = inject(AuthService);

  readonly reviews = signal<DemoReview[]>([
    { id: 'r1', doctorName: 'Dr Karim Trabelsi', authorName: 'Leila M.', rating: 5, comment: 'Explications claires et très rassurant, je recommande.', createdAt: ago(1, 10), status: 'PUBLISHED', flagged: false },
    { id: 'r2', doctorName: 'Dr Karim Trabelsi', authorName: 'Anonyme 4821', rating: 1, comment: 'Médecin incompétent, ce sont des escrocs ! À fuir absolument !!!', createdAt: ago(0, 8, 40), status: 'PUBLISHED', flagged: true },
    { id: 'r3', doctorName: 'Dr Ines Khelifi', authorName: 'Hela S.', rating: 4, comment: "Très à l'écoute, mais un peu d'attente avant la consultation.", createdAt: ago(2, 16), status: 'PUBLISHED', flagged: false },
    { id: 'r4', doctorName: 'Dr Amel Gharbi', authorName: 'Nizar K.', rating: 5, comment: 'Traitement efficace, merci docteur.', createdAt: ago(3, 11), status: 'PUBLISHED', flagged: false },
    { id: 'r5', doctorName: 'Dr Amel Gharbi', authorName: 'Anonyme 7710', rating: 2, comment: 'Profitez de notre offre spéciale sur www.promo-sante.example, réduction de 50 %.', createdAt: ago(1, 19, 20), status: 'PUBLISHED', flagged: true },
    { id: 'r6', doctorName: 'Dr Ines Khelifi', authorName: 'Mohamed J.', rating: 5, comment: 'Consultation rapide et efficace.', createdAt: ago(5, 9), status: 'PUBLISHED', flagged: false },
    { id: 'r7', doctorName: 'Dr Karim Trabelsi', authorName: 'Sami R.', rating: 3, comment: 'Cabinet difficile d\'accès, consultation correcte.', createdAt: ago(6, 15), status: 'PUBLISHED', flagged: false },
    { id: 'r8', doctorName: 'Dr Amel Gharbi', authorName: 'Rim A.', rating: 1, comment: 'Avis contenant des propos injurieux envers le personnel.', createdAt: ago(8, 14), status: 'HIDDEN', flagged: false, hiddenReason: 'Propos injurieux' },
    { id: 'r9', doctorName: 'Dr Ines Khelifi', authorName: 'Yassine T.', rating: 4, comment: 'Bon suivi, merci.', createdAt: ago(10, 10), status: 'PUBLISHED', flagged: false },
  ]);

  readonly users = signal<DemoUser[]>([
    { id: 'u1', name: 'Sarah Ben Ali', email: 'sarah.benali@demo.tn', role: 'PATIENT', active: true, createdAt: ago(40), lastLogin: ago(0, 8) },
    { id: 'u2', name: 'Mohamed Jlassi', email: 'm.jlassi@demo.tn', role: 'PATIENT', active: true, createdAt: ago(32), lastLogin: ago(2, 18) },
    { id: 'u3', name: 'Leila Mejri', email: 'leila.mejri@demo.tn', role: 'PATIENT', active: true, createdAt: ago(25), lastLogin: ago(1, 12) },
    { id: 'u4', name: 'Anis Bouazizi', email: 'anis.b@demo.tn', role: 'PATIENT', active: false, createdAt: ago(18), lastLogin: ago(9, 17) },
    { id: 'u5', name: 'Hela Sassi', email: 'hela.sassi@demo.tn', role: 'PATIENT', active: true, createdAt: ago(6), lastLogin: ago(3, 20) },
    { id: 'u6', name: 'Dr Karim Trabelsi', email: 'k.trabelsi@clinic.tn', role: 'DOCTOR', active: true, createdAt: ago(60), lastLogin: ago(0, 7) },
    { id: 'u7', name: 'Dr Ines Khelifi', email: 'i.khelifi@clinic.tn', role: 'DOCTOR', active: true, createdAt: ago(55), lastLogin: ago(1, 9) },
    { id: 'u8', name: 'Dr Amel Gharbi', email: 'a.gharbi@clinic.tn', role: 'DOCTOR', active: true, createdAt: ago(48), lastLogin: ago(4, 14) },
    { id: 'u9', name: 'Sami Demo', email: 'sami.demo@clinic.tn', role: 'DOCTOR', active: true, createdAt: ago(2), lastLogin: null },
    { id: 'u10', name: 'Administrateur', email: 'admin@demo.local', role: 'ADMIN', active: true, createdAt: ago(90), lastLogin: ago(0, 9) },
  ]);

  readonly audit = signal<AuditEntry[]>([
    { id: 'e1', at: ago(0, 9, 5), actor: 'admin@demo.local', kind: 'AUTH', action: 'Connexion administrateur', target: 'Espace administrateur' },
    { id: 'e2', at: ago(1, 17, 30), actor: 'admin@demo.local', kind: 'DOCTOR', action: 'Diplôme validé', target: 'Dr Amel Gharbi · Doctorat en médecine' },
    { id: 'e3', at: ago(1, 17, 12), actor: 'admin@demo.local', kind: 'DOCTOR', action: 'Profil médecin vérifié', target: 'Dr Amel Gharbi' },
    { id: 'e4', at: ago(2, 11, 40), actor: 'système', kind: 'USER', action: 'Nouveau compte médecin', target: 'Sami Demo' },
    { id: 'e5', at: ago(3, 15, 0), actor: 'admin@demo.local', kind: 'REVIEW', action: 'Avis masqué', target: 'Rim A. → Dr Amel Gharbi · Propos injurieux' },
    { id: 'e6', at: ago(4, 10, 20), actor: 'admin@demo.local', kind: 'USER', action: 'Compte désactivé', target: 'Anis Bouazizi' },
    { id: 'e7', at: ago(5, 9, 45), actor: 'admin@demo.local', kind: 'DOCTOR', action: 'Diplôme refusé', target: 'Dr Test · Document illisible' },
    { id: 'e8', at: ago(6, 16, 10), actor: 'système', kind: 'USER', action: 'Nouveau compte patient', target: 'Hela Sassi' },
  ]);

  readonly flaggedCount = computed(() => this.reviews().filter((r) => r.flagged && r.status === 'PUBLISHED').length);
  readonly hiddenCount = computed(() => this.reviews().filter((r) => r.status === 'HIDDEN').length);

  private actor(): string {
    return this.auth.session()?.email ?? 'admin';
  }

  log(kind: AuditKind, action: string, target: string) {
    this.audit.update((l) => [{ id: uid(), at: new Date().toISOString(), actor: this.actor(), kind, action, target }, ...l]);
  }

  hideReview(id: string, reason: string) {
    const r = this.reviews().find((x) => x.id === id);
    if (!r) return;
    this.reviews.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'HIDDEN', flagged: false, hiddenReason: reason } : x)));
    this.log('REVIEW', 'Avis masqué', `${r.authorName} → ${r.doctorName} · ${reason}`);
  }

  restoreReview(id: string) {
    const r = this.reviews().find((x) => x.id === id);
    if (!r) return;
    this.reviews.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'PUBLISHED', hiddenReason: undefined } : x)));
    this.log('REVIEW', 'Avis rétabli', `${r.authorName} → ${r.doctorName}`);
  }

  dismissFlag(id: string) {
    const r = this.reviews().find((x) => x.id === id);
    if (!r) return;
    this.reviews.update((l) => l.map((x) => (x.id === id ? { ...x, flagged: false } : x)));
    this.log('REVIEW', 'Signalement ignoré', `${r.authorName} → ${r.doctorName}`);
  }

  toggleUser(id: string) {
    const u = this.users().find((x) => x.id === id);
    if (!u) return;
    this.users.update((l) => l.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    this.log('USER', u.active ? 'Compte désactivé' : 'Compte réactivé', u.name);
  }
}
import { Injectable, computed, signal } from '@angular/core';
import { DOCTORS, Doctor, PatientAppointment } from './patient.models';
import {
  Result, addReview, availableSlots, bookAppointment, cancelAppointment, demoAppointments, parseLocal, rescheduleAppointment,
} from './appointment-utils';

export type Outcome = { ok: true } | { ok: false; error: string };

function sessionKey(): string {
  try {
    const raw = localStorage.getItem('clinic-copilot.session');
    const email = raw ? (JSON.parse(raw).email as string) : 'demo';
    return `cc_appointments_${email}`;
  } catch {
    return 'cc_appointments_demo';
  }
}

/** Passe en "terminé" les rendez-vous confirmés dont l'heure est passée. */
function settle(list: PatientAppointment[], now = new Date()): PatientAppointment[] {
  return list.map((a) =>
    a.status === 'confirme' && parseLocal(a.start).getTime() + a.durationMin * 60000 < now.getTime() ? { ...a, status: 'termine' as const } : a,
  );
}

@Injectable({ providedIn: 'root' })
export class PatientAppointments {
  private readonly key = sessionKey();
  readonly appointments = signal<PatientAppointment[]>([]);
  readonly ready = signal(false);
  readonly error = signal<string | null>(null);

  readonly groups = computed(() => {
    const by = (dir: 1 | -1) => (x: PatientAppointment, y: PatientAppointment) => dir * (parseLocal(x.start).getTime() - parseLocal(y.start).getTime());
    const all = this.appointments();
    return {
      avenir: all.filter((a) => a.status === 'confirme' || a.status === 'attente').sort(by(1)),
      termines: all.filter((a) => a.status === 'termine').sort(by(-1)),
      annules: all.filter((a) => a.status === 'annule').sort(by(-1)),
    };
  });

  constructor() {
    setTimeout(() => this.load(), 500);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(this.key);
      const list = settle(raw ? (JSON.parse(raw) as PatientAppointment[]) : demoAppointments());
      this.appointments.set(list);
      localStorage.setItem(this.key, JSON.stringify(list));
      this.error.set(null);
    } catch {
      this.error.set('Impossible de charger vos rendez-vous. Réessayez dans un instant.');
    }
    this.ready.set(true);
  }

  getDoctor(id: string): Doctor | undefined {
    return DOCTORS.find((d) => d.id === id);
  }

  slotsFor(doctorId: string, day: Date, ignoreId?: string): string[] {
    return availableSlots(this.appointments(), doctorId, day, new Date(), ignoreId);
  }

  private async commit(fn: (list: PatientAppointment[]) => Result): Promise<Outcome> {
    await new Promise((r) => setTimeout(r, 450));
    const r = fn(this.appointments());
    if (!r.ok) return r;
    this.appointments.set(r.list);
    try { localStorage.setItem(this.key, JSON.stringify(r.list)); } catch { /* ignore */ }
    return { ok: true };
  }

  book(doctorId: string, start: string, reason: string): Promise<Outcome> {
    return this.commit((l) => bookAppointment(l, { id: crypto.randomUUID(), doctorId, start, reason }));
  }
  cancel(id: string, reason?: string): Promise<Outcome> {
    return this.commit((l) => cancelAppointment(l, id, reason));
  }
  reschedule(id: string, newStart: string): Promise<Outcome> {
    return this.commit((l) => rescheduleAppointment(l, id, newStart));
  }
  review(id: string, rating: number, comment: string): Promise<Outcome> {
    return this.commit((l) => addReview(l, id, rating, comment));
  }
}
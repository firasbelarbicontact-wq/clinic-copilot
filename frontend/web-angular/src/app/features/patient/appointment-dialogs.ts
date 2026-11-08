import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { LucideCircleAlert } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { Modal } from './overlays';
import { MiniCalendar, RatingStars } from './doctor-bits';
import { CANCEL_REASONS, PatientAppointment } from './patient.models';
import { PatientAppointments } from './patient-appointments';
import { Toasts } from './toasts';
import { formatLongDate, isBookableDay, parseLocal } from './appointment-utils';

const ERROR_CLS = 'flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive';

@Component({
  selector: 'app-cancel-dialog',
  imports: [Modal, Icon],
  template: `
    <app-modal [open]="!!appointment()" title="Annuler ce rendez-vous ?" [description]="desc()" (closed)="closed.emit()">
      <p class="text-sm font-medium text-deep">Motif (facultatif)</p>
      <div class="space-y-2">
        @for (r of reasons; track r) {
          <label class="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm text-deep transition-colors hover:bg-soft/60"
            [class]="reason() === r ? 'border-primary bg-soft/60' : 'border-border'">
            <input type="radio" name="cancel-reason" class="accent-primary" [checked]="reason() === r" (change)="reason.set(r)" />{{ r }}
          </label>
        }
      </div>
      @if (error()) { <p role="alert" [class]="errCls"><app-icon [icon]="Alert" [size]="16" />{{ error() }}</p> }
      <div modalFooter class="contents">
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">Garder le rendez-vous</button>
        <button type="button" class="btn rounded-full bg-destructive text-white hover:opacity-90" [disabled]="busy()" (click)="confirm()">
          {{ busy() ? 'Annulation…' : "Confirmer l'annulation" }}
        </button>
      </div>
    </app-modal>
  `,
})
export class CancelDialog {
  private readonly svc = inject(PatientAppointments);
  private readonly toasts = inject(Toasts);
  readonly appointment = input<PatientAppointment | null>(null);
  readonly closed = output<void>();
  protected readonly reasons = CANCEL_REASONS;
  protected readonly Alert = LucideCircleAlert;
  protected readonly errCls = ERROR_CLS;
  protected readonly reason = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly desc = computed(() => {
    const a = this.appointment();
    return a ? `${this.svc.getDoctor(a.doctorId)?.name ?? ''} · ${formatLongDate(a.start)}` : '';
  });

  constructor() {
    effect(() => {
      this.appointment()?.id;
      untracked(() => { this.reason.set(''); this.error.set(null); });
    });
  }

  protected async confirm(): Promise<void> {
    const a = this.appointment();
    if (!a) return;
    this.busy.set(true);
    this.error.set(null);
    const r = await this.svc.cancel(a.id, this.reason() || undefined);
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); return; }
    this.toasts.success('Rendez-vous annulé', 'Le créneau a été libéré.');
    this.closed.emit();
  }
}

@Component({
  selector: 'app-reschedule-dialog',
  imports: [Modal, Icon, MiniCalendar],
  template: `
    <app-modal [open]="!!appointment()" [wide]="true" title="Reporter le rendez-vous" [description]="desc()" (closed)="closed.emit()">
      <div class="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <app-mini-calendar [selected]="day()" [disabled]="isDisabled" (picked)="pick($event)" />
        <div>
          <p class="mb-2 text-sm font-medium capitalize text-deep">{{ dayLabel() }}</p>
          @if (day() && slots().length === 0) {
            <p class="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucun créneau disponible ce jour-là. Essayez une autre date.</p>
          }
          <div role="radiogroup" aria-label="Créneaux disponibles" class="grid grid-cols-3 gap-2">
            @for (s of slots(); track s) {
              <button type="button" role="radio" [attr.aria-checked]="slot() === s" (click)="slot.set(s)"
                class="rounded-lg border py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring"
                [class]="slot() === s ? 'border-primary bg-gradient-primary text-white' : 'border-border bg-card text-deep hover:border-primary/50'">
                {{ s.slice(11) }}
              </button>
            }
          </div>
        </div>
      </div>
      @if (error()) { <p role="alert" [class]="errCls"><app-icon [icon]="Alert" [size]="16" />{{ error() }}</p> }
      <div modalFooter class="contents">
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">Fermer</button>
        <button type="button" class="btn btn-hero" [disabled]="!slot() || busy()" (click)="confirm()">
          {{ busy() ? 'Report…' : 'Confirmer le nouveau créneau' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class RescheduleDialog {
  private readonly svc = inject(PatientAppointments);
  private readonly toasts = inject(Toasts);
  readonly appointment = input<PatientAppointment | null>(null);
  readonly closed = output<void>();
  protected readonly Alert = LucideCircleAlert;
  protected readonly errCls = ERROR_CLS;
  protected readonly isDisabled = (d: Date) => !isBookableDay(d);
  protected readonly day = signal<Date | null>(null);
  protected readonly slot = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly desc = computed(() => {
    const a = this.appointment();
    return a ? `Choisissez un nouveau créneau avec ${this.svc.getDoctor(a.doctorId)?.name ?? ''}. Actuel : ${formatLongDate(a.start)}` : '';
  });
  protected readonly dayLabel = computed(() =>
    this.day() ? this.day()!.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Choisissez une date');
  protected readonly slots = computed(() => {
    const a = this.appointment();
    const d = this.day();
    return a && d ? this.svc.slotsFor(a.doctorId, d, a.id).filter((s) => s !== a.start) : [];
  });

  constructor() {
    effect(() => {
      const a = this.appointment();
      untracked(() => { this.slot.set(null); this.error.set(null); this.day.set(a ? parseLocal(a.start) : null); });
    });
  }

  protected pick(d: Date): void { this.day.set(d); this.slot.set(null); }

  protected async confirm(): Promise<void> {
    const a = this.appointment();
    const s = this.slot();
    if (!a || !s) return;
    this.busy.set(true);
    this.error.set(null);
    const r = await this.svc.reschedule(a.id, s);
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); this.slot.set(null); return; }
    this.toasts.success('Rendez-vous reporté', formatLongDate(s));
    this.closed.emit();
  }
}

@Component({
  selector: 'app-review-dialog',
  imports: [Modal, Icon, RatingStars],
  template: `
    <app-modal [open]="!!appointment()" title="Laisser un avis" [description]="desc()" (closed)="closed.emit()">
      <div role="radiogroup" aria-label="Note" class="flex gap-1" (mouseleave)="hover.set(0)">
        @for (n of [1, 2, 3, 4, 5]; track n) {
          <button type="button" role="radio" [attr.aria-checked]="rating() === n" [attr.aria-label]="n + ' étoile' + (n > 1 ? 's' : '')"
            class="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-ring" (click)="rating.set(n)" (mouseenter)="hover.set(n)">
            <app-rating-stars [value]="n <= (hover() || rating()) ? 5 : 0" [size]="32" class="hidden" />
            <svg viewBox="0 0 24 24" class="h-8 w-8 transition-colors duration-200" stroke="currentColor" stroke-width="2" stroke-linejoin="round"
              [class]="n <= (hover() || rating()) ? 'fill-accent text-accent' : 'fill-none text-border'">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        }
      </div>
      <div>
        <label for="rv-comment" class="text-sm font-medium text-deep">Commentaire (facultatif)</label>
        <textarea id="rv-comment" rows="4" maxlength="500" class="field mt-1.5 w-full" [value]="comment()" (input)="comment.set($any($event.target).value)"></textarea>
        <p class="mt-1.5 text-xs text-muted-foreground">N'écrivez aucune information médicale confidentielle.</p>
      </div>
      @if (error()) { <p role="alert" [class]="errCls"><app-icon [icon]="Alert" [size]="16" />{{ error() }}</p> }
      <div modalFooter class="contents">
        <button type="button" class="btn btn-ghost" (click)="closed.emit()">Fermer</button>
        <button type="button" class="btn btn-hero" [disabled]="busy()" (click)="submit()">{{ busy() ? 'Envoi…' : 'Envoyer mon avis' }}</button>
      </div>
    </app-modal>
  `,
})
export class ReviewDialog {
  private readonly svc = inject(PatientAppointments);
  private readonly toasts = inject(Toasts);
  readonly appointment = input<PatientAppointment | null>(null);
  readonly closed = output<void>();
  protected readonly Alert = LucideCircleAlert;
  protected readonly errCls = ERROR_CLS;
  protected readonly rating = signal(0);
  protected readonly hover = signal(0);
  protected readonly comment = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly desc = computed(() => {
    const a = this.appointment();
    return a ? `Votre consultation avec ${this.svc.getDoctor(a.doctorId)?.name ?? ''}` : '';
  });

  constructor() {
    effect(() => {
      this.appointment()?.id;
      untracked(() => { this.rating.set(0); this.comment.set(''); this.error.set(null); });
    });
  }

  protected async submit(): Promise<void> {
    const a = this.appointment();
    if (!a) return;
    if (this.rating() < 1) { this.error.set('Choisissez une note entre 1 et 5 étoiles.'); return; }
    this.busy.set(true);
    this.error.set(null);
    const r = await this.svc.review(a.id, this.rating(), this.comment());
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); return; }
    this.toasts.success('Merci pour votre avis', 'Il aide les autres patients à bien choisir.');
    this.closed.emit();
  }
}
import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft, LucideBadgeCheck, LucideBanknote, LucideCircleAlert, LucideCircleCheck, LucideClock, LucideLanguages, LucideMapPin,
  LucideMessageCircle, LucideShieldAlert,
} from '@lucide/angular';
import { map } from 'rxjs';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { DoctorAvatar, MiniCalendar, RatingStars } from './doctor-bits';
import { Modal } from './overlays';
import { PatientAppointments } from './patient-appointments';
import { Toasts } from './toasts';
import { DOCTORS, SAMPLE_REVIEWS } from './patient.models';
import { daySlots, formatLongDate, isBookableDay, nextAvailable, parseLocal } from './appointment-utils';

@Component({
  selector: 'app-doctor-detail-page',
  imports: [RouterLink, Icon, Panel, DoctorAvatar, RatingStars, MiniCalendar, Modal],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <a routerLink="/espace-patient/medecins" class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <app-icon [icon]="Back" [size]="16" />Retour aux médecins
        </a>

        @if (doctor(); as d) {
          <section class="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
            <app-doctor-avatar [doctor]="d" size="xl" [showOnline]="true" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold text-deep">{{ d.name }}</h1>
                @if (d.verified) {
                  <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"><app-icon [icon]="Badge" [size]="14" />Vérifié</span>
                }
              </div>
              <p class="text-muted-foreground">{{ d.specialty }}</p>
              <p class="mt-1 flex items-center gap-2 text-sm"><app-rating-stars [value]="d.rating" /><span class="font-semibold text-deep">{{ d.rating }}</span><span class="text-muted-foreground">({{ d.reviewsCount }} avis)</span></p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-hero" (click)="scrollToBooking()">Réserver</button>
              <a class="btn btn-soft" routerLink="/espace-patient/messages" [queryParams]="{ medecin: d.id }"><app-icon [icon]="Msg" [size]="16" />Écrire un message</a>
            </div>
          </section>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div class="space-y-6">
              <app-panel title="À propos"><p class="text-muted-foreground">{{ d.bio }}</p></app-panel>

              <div id="reserver" class="scroll-mt-24">
                <app-panel title="Réserver un créneau">
                  <div class="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
                    <app-mini-calendar [selected]="selectedDay()" [disabled]="isDisabled" (picked)="day.set($event)" />
                    <div>
                      <p class="mb-1 font-semibold capitalize text-deep">{{ dayLabel() }}</p>
                      <p class="mb-3 text-sm text-muted-foreground" aria-live="polite">{{ freeCount() }} créneau{{ freeCount() > 1 ? 'x' : '' }} disponible{{ freeCount() > 1 ? 's' : '' }}</p>
                      @if (freeCount() === 0) {
                        <p class="mb-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Aucun créneau libre ce jour-là. Essayez une autre date.</p>
                      }
                      <ul class="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Créneaux">
                        @for (s of slots(); track s.start) {
                          <li>
                            <button type="button" [disabled]="!s.free" (click)="openBooking(s.start)" [attr.aria-label]="s.free ? 'Réserver à ' + s.time : s.time + ', indisponible'"
                              class="w-full rounded-lg border py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring"
                              [class]="s.free ? 'border-primary/30 bg-card text-primary hover:bg-gradient-primary hover:text-white' : 'cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through'">
                              {{ s.time }}
                            </button>
                          </li>
                        }
                      </ul>
                    </div>
                  </div>
                </app-panel>
              </div>

              <app-panel title="Avis récents">
                <ul class="space-y-4">
                  @for (r of reviews; track r.author) {
                    <li class="rounded-xl bg-soft/60 p-4">
                      <div class="flex items-center justify-between gap-2"><span class="font-semibold text-deep">{{ r.author }}</span><span class="text-xs text-muted-foreground">{{ r.date }}</span></div>
                      <app-rating-stars [value]="r.rating" />
                      <p class="mt-1 text-sm text-muted-foreground">{{ r.text }}</p>
                    </li>
                  }
                </ul>
              </app-panel>
            </div>

            <div class="space-y-6">
              <app-panel title="Langues parlées">
                <ul class="flex flex-wrap gap-2">
                  @for (l of d.languages; track l) {
                    <li class="inline-flex items-center gap-1 rounded-full bg-soft px-3 py-1 text-sm font-medium text-primary"><app-icon [icon]="Lang" [size]="14" />{{ l }}</li>
                  }
                </ul>
              </app-panel>
              <app-panel title="Adresse du cabinet">
                <div class="relative h-36 overflow-hidden rounded-xl bg-soft" aria-hidden="true">
                  <div class="absolute inset-0 bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-[size:28px_28px]"></div>
                  <div class="absolute left-1/4 top-0 h-full w-3 bg-card"></div>
                  <div class="absolute left-0 top-1/2 h-3 w-full bg-card"></div>
                  <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-primary"><app-icon [icon]="Pin" [size]="36" /></span>
                </div>
                <p class="mt-3 flex items-start gap-2 text-sm text-deep"><app-icon [icon]="Pin" [size]="16" />{{ d.address }} · {{ d.distanceKm }} km</p>
              </app-panel>
              <app-panel title="Tarif">
                <p class="flex items-center gap-2 text-deep"><app-icon [icon]="Money" [size]="20" /><span class="text-2xl font-bold">{{ d.fee }} DT</span><span class="text-sm text-muted-foreground">par consultation</span></p>
              </app-panel>
            </div>
          </div>

          <app-modal [open]="!!start()" [title]="done() ? 'Rendez-vous confirmé' : 'Confirmer le rendez-vous'"
            [description]="done() ? d.name + ' · ' + fmt(start()!) : 'Vérifiez le récapitulatif avant de valider.'" (closed)="start.set(null)">
            @if (done()) {
              <div class="py-2 text-center text-success"><app-icon [icon]="Check" [size]="56" /></div>
              <div class="grid gap-2 sm:grid-cols-2">
                <a class="btn btn-hero" routerLink="/espace-patient/rendez-vous">Voir mes rendez-vous</a>
                <button type="button" class="btn btn-soft" (click)="start.set(null)">Fermer</button>
              </div>
            } @else {
              <dl class="space-y-2 rounded-xl bg-soft p-4 text-sm">
                <div class="font-semibold text-deep">{{ d.name }} <span class="font-normal text-muted-foreground">· {{ d.specialty }}</span></div>
                <div class="flex items-center gap-2 font-medium text-deep"><app-icon [icon]="Clock" [size]="16" />{{ start() ? fmt(start()!) : '' }}</div>
                <div class="flex items-center gap-2 text-deep"><app-icon [icon]="Pin" [size]="16" />{{ d.address }}</div>
              </dl>
              <div>
                <label for="bk-reason" class="text-sm font-medium text-deep">Motif de la consultation <span class="text-destructive">*</span></label>
                <textarea id="bk-reason" rows="3" maxlength="300" class="field mt-1.5 w-full" placeholder="Ex. : toux persistante depuis une semaine"
                  [value]="reason()" (input)="reason.set($any($event.target).value)" (blur)="touched.set(true)"></textarea>
                @if (touched() && !reason().trim()) { <p class="mt-1.5 text-sm font-medium text-destructive">Indiquez le motif de la consultation.</p> }
              </div>
              <p class="flex items-start gap-2 rounded-xl border border-destructive/20 p-3 text-sm text-muted-foreground"><app-icon [icon]="Shield" [size]="16" />Cette plateforme ne remplace pas les services d'urgence.</p>
              @if (error()) {
                <p role="alert" class="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive"><app-icon [icon]="Alert" [size]="16" />{{ error() }}</p>
              }
<<<<<<< HEAD
=======
            }
            @if (!done()) {
>>>>>>> origin/main
              <div modalFooter class="contents">
                <button type="button" class="btn btn-ghost" (click)="start.set(null)">Annuler</button>
                <button type="button" class="btn btn-hero" [disabled]="busy()" (click)="confirm()">{{ busy() ? 'Réservation…' : 'Confirmer le rendez-vous' }}</button>
              </div>
            }
          </app-modal>
        } @else {
          <p class="rounded-2xl bg-card p-8 text-center text-muted-foreground">Ce médecin est introuvable.</p>
        }
      </div>
    </div>
  `,
})
export class DoctorDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(PatientAppointments);
  private readonly toasts = inject(Toasts);

  protected readonly Back = LucideArrowLeft;
  protected readonly Badge = LucideBadgeCheck;
  protected readonly Msg = LucideMessageCircle;
  protected readonly Lang = LucideLanguages;
  protected readonly Pin = LucideMapPin;
  protected readonly Money = LucideBanknote;
  protected readonly Clock = LucideClock;
  protected readonly Check = LucideCircleCheck;
  protected readonly Shield = LucideShieldAlert;
  protected readonly Alert = LucideCircleAlert;
  protected readonly reviews = SAMPLE_REVIEWS;
  protected readonly fmt = formatLongDate;
  protected readonly isDisabled = (d: Date) => !isBookableDay(d);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), { initialValue: '' });
  protected readonly doctor = computed(() => DOCTORS.find((d) => d.id === this.id()));

  protected readonly day = signal<Date | null>(null);
  protected readonly selectedDay = computed(() => {
    const picked = this.day();
    if (picked) return picked;
    const d = this.doctor();
    const n = d ? nextAvailable(this.svc.appointments(), d.id) : null;
    return n ? parseLocal(n) : new Date();
  });
  protected readonly dayLabel = computed(() => this.selectedDay().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  protected readonly slots = computed(() => {
    const d = this.doctor();
    return d ? daySlots(this.svc.appointments(), d.id, this.selectedDay()) : [];
  });
  protected readonly freeCount = computed(() => this.slots().filter((s) => s.free).length);

  protected readonly start = signal<string | null>(null);
  protected readonly reason = signal('');
  protected readonly touched = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly done = signal(false);

  constructor() {
    afterNextRender(() => {
      if (this.route.snapshot.fragment === 'reserver') setTimeout(() => this.scrollToBooking(), 100);
    });
  }

  protected scrollToBooking(): void {
    document.getElementById('reserver')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected openBooking(s: string): void {
    this.reason.set(''); this.touched.set(false); this.error.set(null); this.done.set(false);
    this.start.set(s);
  }

  protected async confirm(): Promise<void> {
    this.touched.set(true);
    const d = this.doctor();
    const s = this.start();
    if (!d || !s || !this.reason().trim()) return;
    this.busy.set(true);
    this.error.set(null);
    const r = await this.svc.book(d.id, s, this.reason());
    this.busy.set(false);
    if (!r.ok) { this.error.set(r.error); return; }
    this.done.set(true);
    this.toasts.success('Rendez-vous confirmé', `${d.name} · ${formatLongDate(s)}`);
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main

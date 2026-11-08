import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarCheck, LucideCalendarClock, LucideCalendarDays, LucideCalendarPlus, LucideCalendarX, LucideCircleAlert,
  LucideClock, LucideFileText, LucideMapPin, LucideMessageCircle, LucidePlus, LucideRotateCcw, LucideCircleX,
} from '@lucide/angular';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Drawer } from './overlays';
import { DoctorAvatar, RatingStars, StatusPill } from './doctor-bits';
import { CancelDialog, RescheduleDialog, ReviewDialog } from './appointment-dialogs';
import { PatientAppointments } from './patient-appointments';
import { PatientAppointment } from './patient.models';
import { downloadIcs, formatLongDate } from './appointment-utils';

type TabKey = 'avenir' | 'termines' | 'annules';

@Component({
  selector: 'app-appointments-page',
  imports: [NgTemplateOutlet, RouterLink, Icon, RevealDirective, Drawer, DoctorAvatar, StatusPill, RatingStars, CancelDialog, RescheduleDialog, ReviewDialog],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <div appReveal class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-deep sm:text-3xl">Mes rendez-vous</h1>
            <p class="mt-1 text-muted-foreground">{{ svc.ready() ? svc.groups().avenir.length + ' rendez-vous à venir' : 'Chargement…' }}</p>
          </div>
          <a routerLink="/espace-patient/medecins" class="btn btn-hero"><app-icon [icon]="Plus" [size]="18" />Nouveau rendez-vous</a>
        </div>

        <div role="tablist" class="inline-flex w-full gap-1 rounded-full border border-border bg-card p-1 shadow-soft sm:w-auto">
          @for (t of tabs; track t.key) {
            <button type="button" role="tab" [attr.aria-selected]="tab() === t.key" (click)="tab.set(t.key)"
              class="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 sm:flex-none"
              [class]="tab() === t.key ? 'bg-gradient-primary text-white' : 'text-muted-foreground hover:text-deep'">
              {{ t.label }}
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="tab() === t.key ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'">
                {{ svc.ready() ? svc.groups()[t.key].length : '–' }}
              </span>
            </button>
          }
        </div>

        <div>
          @if (svc.error()) {
            <p role="alert" class="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
              <app-icon [icon]="Alert" [size]="16" />{{ svc.error() }}
            </p>
          } @else if (!svc.ready()) {
            <div class="space-y-4" aria-busy="true">
              @for (i of [0, 1, 2]; track i) {
                <div class="flex animate-pulse gap-4 rounded-2xl border border-border bg-card p-5">
                  <div class="h-12 w-12 rounded-full bg-muted"></div>
                  <div class="flex-1 space-y-2"><div class="h-4 w-1/3 rounded bg-muted"></div><div class="h-3 w-1/4 rounded bg-muted"></div><div class="h-3 w-2/3 rounded bg-muted"></div></div>
                </div>
              }
            </div>
          } @else if (list().length === 0) {
            @let e = empty[tab()];
            <div class="flex flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-card px-6 py-14 text-center">
              <span class="grid h-14 w-14 place-items-center rounded-2xl bg-soft text-primary"><app-icon [icon]="e.icon" [size]="28" /></span>
              <p class="mt-4 font-semibold text-deep">{{ e.title }}</p>
              <p class="mt-1 max-w-sm text-sm text-muted-foreground">{{ e.text }}</p>
              <a routerLink="/espace-patient/medecins" class="btn btn-hero mt-6">{{ e.cta }}</a>
            </div>
          } @else {
            <div class="space-y-4">
              @for (a of list(); track a.id; let i = $index) {
                @let d = svc.getDoctor(a.doctorId);
                @if (d) {
                  <article appReveal class="card-lift rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <button type="button" (click)="openId.set(a.id)" [attr.aria-label]="'Voir le détail du rendez-vous avec ' + d.name"
                      class="flex w-full items-start gap-4 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                      <app-doctor-avatar [doctor]="d" />
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-start justify-between gap-2">
                          <div class="min-w-0">
                            <h3 class="truncate font-semibold text-deep">{{ d.name }}</h3>
                            <p class="text-sm text-muted-foreground">{{ d.specialty }}</p>
                          </div>
                          <app-status-pill [status]="a.status" />
                        </div>
                        <dl class="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                          <div class="flex items-center gap-2 text-deep"><app-icon [icon]="Clock" [size]="16" /><dt class="sr-only">Date</dt><dd class="font-medium">{{ fmt(a.start) }}</dd></div>
                          <div class="flex min-w-0 items-center gap-2 text-muted-foreground"><app-icon [icon]="Pin" [size]="16" /><dt class="sr-only">Adresse</dt><dd class="truncate">{{ d.address }}</dd></div>
                          <div class="text-muted-foreground sm:col-span-2"><dt class="inline font-medium text-deep">Motif : </dt><dd class="inline">{{ a.reason }}</dd></div>
                        </dl>
                      </div>
                    </button>
                    <div class="mt-4 border-t border-border pt-4">
                      <ng-container [ngTemplateOutlet]="actionsTpl" [ngTemplateOutletContext]="{ $implicit: a, stacked: false }" />
                    </div>
                  </article>
                }
              }
            </div>
          }
        </div>
      </div>
    </div>

    <ng-template #actionsTpl let-a let-stacked="stacked">
      <div class="flex flex-wrap gap-2" [class.flex-col]="stacked" [class.items-stretch]="stacked">
        @if (a.status === 'confirme' || a.status === 'attente') {
          <button type="button" class="btn btn-soft text-sm" (click)="reschedule(a, stacked)"><app-icon [icon]="CalClock" [size]="16" />Reporter</button>
          <button type="button" class="btn btn-soft text-sm" (click)="calendar(a)"><app-icon [icon]="CalPlus" [size]="16" />Ajouter au calendrier</button>
          <a class="btn btn-soft text-sm" routerLink="/espace-patient/messages" [queryParams]="{ medecin: a.doctorId }"><app-icon [icon]="Msg" [size]="16" />Écrire au médecin</a>
          <button type="button" class="btn btn-ghost text-sm text-destructive hover:bg-destructive/10" (click)="cancel(a, stacked)"><app-icon [icon]="XCircle" [size]="16" />Annuler</button>
        } @else if (a.status === 'termine') {
          @if (a.review) {
            <span class="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-primary">
              <app-rating-stars [value]="1" [size]="14" />Avis envoyé ({{ a.review.rating }}/5)
            </span>
          } @else {
            <button type="button" class="btn btn-hero text-sm" (click)="review(a, stacked)">Laisser un avis</button>
          }
          <a class="btn btn-soft text-sm" routerLink="/espace-patient/medecins"><app-icon [icon]="Redo" [size]="16" />Reprendre rendez-vous</a>
        } @else {
          <a class="btn btn-soft text-sm" routerLink="/espace-patient/medecins"><app-icon [icon]="Redo" [size]="16" />Reprendre rendez-vous</a>
        }
      </div>
    </ng-template>

    <app-drawer [open]="!!opened()" title="Détail du rendez-vous" description="Toutes les informations de votre consultation." (closed)="openId.set(null)">
      @if (opened(); as a) {
        @if (openedDoctor(); as d) {
          <div class="flex items-center gap-4 rounded-2xl bg-soft p-4">
            <app-doctor-avatar [doctor]="d" size="lg" />
            <div class="min-w-0 flex-1"><p class="font-bold text-deep">{{ d.name }}</p><p class="text-sm text-muted-foreground">{{ d.specialty }}</p></div>
            <app-status-pill [status]="a.status" />
          </div>
          <dl class="mt-6 space-y-4 text-sm">
            <div class="flex gap-3"><app-icon [icon]="Clock" [size]="16" /><div><dt class="text-muted-foreground">Date et heure</dt><dd class="font-semibold text-deep">{{ fmt(a.start) }} ({{ a.durationMin }} min)</dd></div></div>
            <div class="flex gap-3"><app-icon [icon]="Pin" [size]="16" /><div><dt class="text-muted-foreground">Adresse</dt><dd class="font-semibold text-deep">{{ d.address }}</dd></div></div>
            <div class="flex gap-3"><app-icon [icon]="FileText" [size]="16" /><div><dt class="text-muted-foreground">Motif</dt><dd class="font-semibold text-deep">{{ a.reason }}</dd></div></div>
            @if (a.cancelReason) {
              <div class="rounded-xl bg-destructive/10 p-3"><dt class="text-destructive">Motif d'annulation</dt><dd class="font-semibold text-deep">{{ a.cancelReason }}</dd></div>
            }
            @if (a.review) {
              <div class="rounded-xl border border-border p-3">
                <dt class="text-muted-foreground">Votre avis</dt>
                <dd class="mt-1"><app-rating-stars [value]="a.review.rating" /></dd>
                @if (a.review.comment) { <dd class="mt-1 text-deep">{{ a.review.comment }}</dd> }
              </div>
            }
          </dl>
          <div class="mt-8">
            <ng-container [ngTemplateOutlet]="actionsTpl" [ngTemplateOutletContext]="{ $implicit: a, stacked: true }" />
          </div>
        }
      }
    </app-drawer>

    <app-cancel-dialog [appointment]="cancelAppt()" (closed)="cancelId.set(null)" />
    <app-reschedule-dialog [appointment]="rescheduleAppt()" (closed)="rescheduleId.set(null)" />
    <app-review-dialog [appointment]="reviewAppt()" (closed)="reviewId.set(null)" />
  `,
})
export class AppointmentsPage {
  protected readonly svc = inject(PatientAppointments);

  protected readonly Plus = LucidePlus;
  protected readonly Alert = LucideCircleAlert;
  protected readonly Clock = LucideClock;
  protected readonly Pin = LucideMapPin;
  protected readonly FileText = LucideFileText;
  protected readonly CalClock = LucideCalendarClock;
  protected readonly CalPlus = LucideCalendarPlus;
  protected readonly Msg = LucideMessageCircle;
  protected readonly XCircle = LucideCircleX;
  protected readonly Redo = LucideRotateCcw;

  protected readonly tabs: { key: TabKey; label: string }[] = [
    { key: 'avenir', label: 'À venir' },
    { key: 'termines', label: 'Terminés' },
    { key: 'annules', label: 'Annulés' },
  ];
  protected readonly empty = {
    avenir: { icon: LucideCalendarDays, title: 'Aucun rendez-vous à venir', text: 'Trouvez un médecin et réservez un créneau en quelques secondes.', cta: 'Prendre rendez-vous' },
    termines: { icon: LucideCalendarCheck, title: 'Aucun rendez-vous terminé', text: 'Vos consultations passées apparaîtront ici.', cta: 'Trouver un médecin' },
    annules: { icon: LucideCalendarX, title: 'Aucun rendez-vous annulé', text: 'Tant mieux ! Vos annulations apparaîtraient ici.', cta: 'Découvrir les médecins' },
  };

  protected readonly tab = signal<TabKey>('avenir');
  protected readonly openId = signal<string | null>(null);
  protected readonly cancelId = signal<string | null>(null);
  protected readonly rescheduleId = signal<string | null>(null);
  protected readonly reviewId = signal<string | null>(null);

  protected readonly list = computed(() => this.svc.groups()[this.tab()]);
  private find(id: string | null): PatientAppointment | null {
    return id ? this.svc.appointments().find((a) => a.id === id) ?? null : null;
  }
  protected readonly opened = computed(() => this.find(this.openId()));
  protected readonly openedDoctor = computed(() => {
    const a = this.opened();
    return a ? this.svc.getDoctor(a.doctorId) : undefined;
  });
  protected readonly cancelAppt = computed(() => this.find(this.cancelId()));
  protected readonly rescheduleAppt = computed(() => this.find(this.rescheduleId()));
  protected readonly reviewAppt = computed(() => this.find(this.reviewId()));

  protected fmt = formatLongDate;

  protected cancel(a: PatientAppointment, fromDrawer: boolean): void { if (fromDrawer) this.openId.set(null); this.cancelId.set(a.id); }
  protected reschedule(a: PatientAppointment, fromDrawer: boolean): void { if (fromDrawer) this.openId.set(null); this.rescheduleId.set(a.id); }
  protected review(a: PatientAppointment, fromDrawer: boolean): void { if (fromDrawer) this.openId.set(null); this.reviewId.set(a.id); }
  protected calendar(a: PatientAppointment): void {
    const d = this.svc.getDoctor(a.doctorId);
    if (d) downloadIcs(a, d);
  }
}
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight, LucideBuilding2, LucideCalendarDays, LucideCheck, LucideClock, LucideStar, LucideUsers, LucideVideo, LucideX,
} from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { Appointment } from '../../core/mock/mock.models';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { StatCard } from '../../shared/ui/stat-card';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-doctor-home-page',
  imports: [RouterLink, Icon, Panel, StatCard, StatusBadge, RevealDirective],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <section appReveal class="relative overflow-hidden rounded-3xl bg-deep p-6 text-deep-foreground shadow-soft sm:p-8">
          <div class="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-tertiary/25 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary/30 blur-3xl"></div>
          <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-60" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
            <path class="ecg-line" pathLength="1" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              d="M0 42 H110 L122 38 L134 42 H190 L202 34 L214 42 H250 L262 44 L274 6 L290 74 L304 30 L316 42 H380 L392 37 L404 42 H470 L482 40 L494 42 H600" />
          </svg>

          <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <p class="text-sm font-medium text-deep-foreground/70">{{ today }}</p>
              <h1 class="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{{ greeting }}, <span class="text-tertiary">{{ name }}</span></h1>
              <p class="mt-3 max-w-md text-deep-foreground/70">{{ summary() }}</p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/espace-medecin/agenda" class="btn btn-hero btn-lg">Ouvrir l'agenda <app-icon [icon]="Arrow" [size]="16" /></a>
                <a routerLink="/espace-medecin/patients" class="btn btn-lg border border-white/20 bg-white/10 text-white hover:bg-white/20">Mes patients</a>
              </div>
            </div>

            <div class="glass rounded-2xl p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">Prochain patient</p>
              @if (next(); as n) {
                <div class="mt-3 flex items-center gap-3">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">{{ ini(n.patientName) }}</span>
                  <div class="min-w-0">
                    <p class="truncate text-lg font-semibold">{{ n.patientName }}</p>
                    <p class="truncate text-sm text-deep-foreground/70">{{ n.reason }}</p>
                  </div>
                </div>
                <div class="mt-4 flex items-center justify-between gap-3 text-sm">
                  <span class="flex items-center gap-1.5 text-deep-foreground/80"><app-icon [icon]="Clock" [size]="16" />{{ heading(n.start) }} · {{ time(n.start) }}</span>
                  <app-status-badge [status]="n.status" />
                </div>
              } @else {
                <p class="mt-3 text-deep-foreground/70">Aucun rendez-vous à venir. Votre agenda est libre.</p>
              }
            </div>
          </div>
        </section>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-stat-card tone="primary" [icon]="Calendar" label="Aujourd'hui" [value]="today_().length" hint="rendez-vous" to="/espace-medecin/agenda" />
          <app-stat-card tone="warning" [icon]="Clock" label="En attente" [value]="pending().length" hint="à traiter" to="/espace-medecin/agenda" />
          <app-stat-card tone="info" [icon]="Users" label="Patients suivis" [value]="patientCount()" hint="au total" to="/espace-medecin/patients" />
          <app-stat-card tone="success" [icon]="Star" label="Note moyenne" [value]="average()" hint="/ 5" to="/espace-medecin/avis" />
        </div>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <app-panel [title]="timeline().title">
            <a panelAction routerLink="/espace-medecin/agenda" class="text-sm font-semibold text-primary hover:underline">Voir l'agenda</a>
            @if (timeline().items.length) {
              <ol>
                @for (a of timeline().items; track a.id; let last = $last) {
                  <li class="flex gap-4">
                    <div class="w-14 shrink-0 pt-3.5 text-right text-sm font-semibold text-deep">{{ time(a.start) }}</div>
                    <div class="flex flex-col items-center">
                      <span class="mt-4 h-3 w-3 rounded-full ring-4 ring-soft" [class]="dot(a)"></span>
                      @if (!last) {
                        <span class="w-px flex-1 bg-border"></span>
                      }
                    </div>
                    <div class="mb-3 min-w-0 flex-1 rounded-xl border border-border p-3 transition-colors duration-200 hover:bg-soft/60">
                      <div class="flex items-center justify-between gap-3">
                        <p class="truncate font-semibold text-deep">{{ a.patientName }}</p>
                        <app-status-badge [status]="a.status" />
                      </div>
                      <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ a.reason }}</p>
                      <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <app-icon [icon]="a.mode === 'VIDEO' ? Video : Building" [size]="14" />{{ a.mode === 'VIDEO' ? 'Visio' : 'Cabinet' }} · {{ heading(a.start) }}
                      </p>
                    </div>
                  </li>
                }
              </ol>
            } @else {
              <p class="text-sm text-muted-foreground">Rien de prévu pour le moment.</p>
            }
          </app-panel>

          <div class="space-y-6">
            <app-panel title="Demandes à traiter">
              @if (pending().length) {
                <ul class="space-y-3">
                  @for (a of pending(); track a.id) {
                    <li class="rounded-xl bg-soft/60 p-3">
                      <p class="font-semibold text-deep">{{ a.patientName }}</p>
                      <p class="text-sm text-muted-foreground">{{ heading(a.start) }} · {{ time(a.start) }} · {{ a.reason }}</p>
                      <div class="mt-3 flex gap-2">
                        <button type="button" class="btn btn-hero" (click)="set(a, 'CONFIRMED')"><app-icon [icon]="Check" [size]="16" />Confirmer</button>
                        <button type="button" class="btn btn-soft" (click)="set(a, 'CANCELLED')"><app-icon [icon]="X" [size]="16" />Refuser</button>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-sm text-muted-foreground">Rien à traiter. Tout est à jour.</p>
              }
            </app-panel>

            <app-panel title="Visibilité">
              <p class="text-sm leading-relaxed text-muted-foreground">
                Votre fiche apparaît dans l'annuaire public dès que votre diplôme a été vérifié par un administrateur.
              </p>
              <div class="mt-4 flex flex-wrap gap-3">
                <a routerLink="/espace-medecin/diplomes" class="btn btn-soft">Mes diplômes</a>
                <a routerLink="/medecins" class="btn btn-soft">Voir l'annuaire</a>
              </div>
            </app-panel>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DoctorHomePage {
  private readonly store = inject(MockStore);

  protected readonly Arrow = LucideArrowRight;
  protected readonly Calendar = LucideCalendarDays;
  protected readonly Clock = LucideClock;
  protected readonly Star = LucideStar;
  protected readonly Users = LucideUsers;
  protected readonly Check = LucideCheck;
  protected readonly X = LucideX;
  protected readonly Video = LucideVideo;
  protected readonly Building = LucideBuilding2;

  protected readonly name = 'Dr Trabelsi';
  protected readonly heading = dayHeading;
  protected readonly time = timeLabel;
  protected readonly ini = initials;

  protected readonly today = (() => {
    const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  protected readonly greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  })();

  private readonly startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  private readonly active = computed(() => this.store.doctorAppointments().filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING'));
  protected readonly today_ = computed(() => this.store.doctorAppointments().filter((a) => a.status !== 'CANCELLED' && new Date(a.start).toDateString() === new Date().toDateString()));
  protected readonly pending = computed(() => this.store.doctorAppointments().filter((a) => a.status === 'PENDING'));
  protected readonly next = computed(() => this.active().find((a) => new Date(a.start) >= this.startOfToday) ?? null);
  protected readonly patientCount = computed(() => this.store.doctorPatients().length);
  protected readonly average = computed(() => {
    const list = this.store.doctorReviews();
    return list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '–';
  });

  protected readonly timeline = computed(() => {
    const todays = this.today_();
    if (todays.length) return { title: 'Programme du jour', items: todays };
    return { title: 'Prochains rendez-vous', items: this.active().filter((a) => new Date(a.start) >= this.startOfToday).slice(0, 4) };
  });

  protected readonly summary = computed(() => {
    const t = this.today_().length;
    const p = this.pending().length;
    return `${t} rendez-vous aujourd'hui · ${p} demande${p > 1 ? 's' : ''} en attente de confirmation.`;
  });

  protected dot(a: Appointment): string {
    return a.status === 'CONFIRMED' ? 'bg-success' : a.status === 'PENDING' ? 'bg-warning' : 'bg-muted-foreground';
  }

  protected set(a: Appointment, status: Appointment['status']) {
    this.store.setStatus(a.id, status);
  }
}
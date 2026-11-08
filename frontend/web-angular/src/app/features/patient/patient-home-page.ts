import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowRight, LucideBell, LucideCalendarDays, LucideClock, LucideMessageCircle, LucideShieldCheck,
} from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { ME_PATIENT, MockStore } from '../../core/mock/mock-store';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { StatCard } from '../../shared/ui/stat-card';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-patient-home-page',
  imports: [RouterLink, Icon, Panel, StatCard, StatusBadge, RevealDirective],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <div appReveal>
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight text-deep sm:text-3xl">Bonjour, {{ firstName }}</h1>
            <span class="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-primary">Patient</span>
          </div>
          <p class="mt-1 text-muted-foreground">Prenez soin de vous, on est là pour vous guider.</p>
        </div>

        <section appReveal class="relative overflow-hidden rounded-3xl border border-primary/15 bg-linear-to-br from-soft via-white to-soft p-6 shadow-soft sm:p-8">
          <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-tertiary/25 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-primary/15 blur-3xl"></div>
          <div class="relative grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_200px]">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Assistant IA</p>
              <h2 class="mt-2 text-2xl font-bold tracking-tight text-deep sm:text-3xl">Comment vous sentez-vous ?</h2>
              <p class="mt-2 max-w-md text-muted-foreground">Décrivez vos symptômes et recevez une première orientation prudente.</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/60 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur"><app-icon [icon]="Shield" [size]="14" />Orientation, pas un diagnostic</span>
                <span class="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white/60 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur"><app-icon [icon]="Clock" [size]="14" />Réponse en quelques secondes</span>
              </div>
              <a routerLink="/espace-patient/assistant" class="btn btn-hero btn-lg mt-6">Commencer <app-icon [icon]="Arrow" [size]="16" /></a>
            </div>
            <div class="mx-auto h-40 w-44 sm:h-48 sm:w-full">
              <svg viewBox="0 0 200 180" class="h-full w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="var(--tertiary)" />
                    <stop offset="1" stop-color="var(--primary)" />
                  </linearGradient>
                </defs>
                <circle cx="105" cy="92" r="78" fill="var(--card)" opacity="0.6" />
                <path d="M100 150 C40 112 30 70 55 50 C75 34 95 44 100 60 C105 44 125 34 145 50 C170 70 160 112 100 150Z" fill="url(#hg)" />
                <path d="M70 92 h18 l8 -16 l10 30 l8 -14 h18" fill="none" stroke="var(--card)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M150 40 c18 4 26 22 22 40 c-3 14 -14 22 -26 22" fill="none" stroke="var(--deep)" stroke-width="5" stroke-linecap="round" />
                <circle cx="146" cy="104" r="10" fill="var(--card)" stroke="var(--deep)" stroke-width="5" />
                <circle cx="146" cy="40" r="5" fill="var(--deep)" />
                <circle cx="170" cy="32" r="5" fill="var(--deep)" />
              </svg>
            </div>
          </div>
        </section>

        <div class="grid gap-4 sm:grid-cols-3">
          <app-stat-card tone="primary" [icon]="Calendar" label="Prochains rendez-vous" [value]="upcoming().length" hint="à venir" to="/espace-patient/rendez-vous" />
          <app-stat-card tone="info" [icon]="Message" label="Messages à lire" [value]="unreadChats()" hint="nouveaux" to="/espace-patient/messages" />
          <app-stat-card tone="warning" [icon]="Bell" label="Rappels" [value]="store.unreadCount()" hint="à voir" to="/espace-patient/rappels" />
        </div>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <app-panel title="Vos prochains rendez-vous">
            <a panelAction routerLink="/espace-patient/rendez-vous" class="text-sm font-semibold text-primary hover:underline">Voir tout</a>
            @if (upcoming().length) {
              <ul class="space-y-3">
                @for (a of upcoming(); track a.id) {
                  <li class="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 transition-colors duration-200 hover:bg-soft/60 sm:gap-4">
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">{{ ini(a.doctorName) }}</span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-semibold text-deep">{{ a.doctorName }}</p>
                      <p class="truncate text-sm text-muted-foreground">{{ a.specialty }}</p>
                    </div>
                    <div class="hidden text-right text-sm sm:block">
                      <p class="font-medium text-deep">{{ heading(a.start) }}</p>
                      <p class="flex items-center justify-end gap-1 text-muted-foreground"><app-icon [icon]="Clock" [size]="14" />{{ time(a.start) }}</p>
                    </div>
                    <app-status-badge [status]="a.status" />
                  </li>
                }
              </ul>
            } @else {
              <p class="text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
              <a routerLink="/espace-patient/medecins" class="btn btn-hero mt-4">Trouver un médecin</a>
            }
          </app-panel>

          <app-panel title="Rappels du jour">
            <ul class="space-y-3">
              @for (r of reminders(); track r.title) {
                <li class="flex items-start gap-3 rounded-xl bg-soft/60 p-3">
                  <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-primary"><app-icon [icon]="Bell" [size]="16" /></span>
                  <div class="min-w-0">
                    <p class="font-semibold text-deep">{{ r.title }}</p>
                    <p class="text-sm text-muted-foreground">{{ r.detail }}</p>
                  </div>
                </li>
              }
            </ul>
          </app-panel>
        </div>

        <p class="rounded-xl border border-destructive/20 bg-card/70 px-4 py-3 text-center text-sm text-muted-foreground backdrop-blur">
          <span class="font-semibold text-deep">Orientation, pas un diagnostic.</span> En cas d'urgence vitale, appelez le 190 (SAMU).
        </p>
      </div>
    </div>
  `,
})
export class PatientHomePage {
  protected readonly store = inject(MockStore);

  protected readonly Arrow = LucideArrowRight;
  protected readonly Bell = LucideBell;
  protected readonly Calendar = LucideCalendarDays;
  protected readonly Clock = LucideClock;
  protected readonly Message = LucideMessageCircle;
  protected readonly Shield = LucideShieldCheck;

  protected readonly firstName = ME_PATIENT.name.split(' ')[0];
  protected readonly heading = dayHeading;
  protected readonly time = timeLabel;
  protected readonly ini = initials;

  private readonly startOfToday = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  protected readonly upcoming = computed(() =>
    this.store.myAppointments()
      .filter((a) => (a.status === 'CONFIRMED' || a.status === 'PENDING') && new Date(a.start) >= this.startOfToday)
      .slice(0, 3));

  protected readonly unreadChats = computed(() =>
    this.store.conversations().filter((c) => c.messages[c.messages.length - 1]?.from === 'them').length);

  protected readonly reminders = computed(() => {
    const list: { title: string; detail: string }[] = [];
    const confirmed = this.upcoming().find((a) => a.status === 'CONFIRMED');
    if (confirmed) {
      list.push({
        title: `Rendez-vous ${dayHeading(confirmed.start).toLowerCase()} à ${timeLabel(confirmed.start)}`,
        detail: `${confirmed.doctorName} · ${confirmed.mode === 'VIDEO' ? 'Téléconsultation' : 'Au cabinet'}`,
      });
    }
    const pending = this.upcoming().find((a) => a.status === 'PENDING');
    if (pending) {
      list.push({
        title: 'Demande en attente de confirmation',
        detail: `${pending.doctorName} · ${dayHeading(pending.start)} à ${timeLabel(pending.start)}`,
      });
    }
    if (!list.length) list.push({ title: "Aucun rappel aujourd'hui", detail: 'Profitez-en pour prendre soin de vous.' });
    return list;
  });
}
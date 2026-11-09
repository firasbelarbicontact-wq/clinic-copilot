import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarDays, LucideClock, LucideHeartPulse, LucideLayoutGrid, LucideList, LucideMessageCircle,
  LucidePhone, LucideSearch, LucideUserPlus, LucideUsers, LucideX,
} from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { Appointment, MockPatient } from '../../core/mock/mock.models';
import { EMPTY_EXTRA, PATIENT_EXTRAS, PatientExtra } from '../../core/mock/patient-extras';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { StatusBadge } from '../../shared/ui/status-badge';

interface Row {
  p: MockPatient;
  x: PatientExtra;
  next: Appointment | null;
  days: number;
}
type Filter = 'all' | 'upcoming' | 'review' | 'new';
type Tab = 'overview' | 'appointments' | 'notes';

const PALETTES = [
  'from-deep to-primary',
  'from-primary to-tertiary',
  'from-deep-muted to-secondary',
  'from-primary to-secondary',
  'from-deep to-tertiary',
];

@Component({
  selector: 'app-doctor-patients-page',
  imports: [FormsModule, RouterLink, Icon, PageHeader, StatusBadge],
  host: { '(document:keydown.escape)': 'selectedId.set(null)' },
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <app-page-header title="Mes patients" subtitle="Suivez vos patients, leurs constantes et leurs prochains rendez-vous." />

        <!-- Tuiles = filtres -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          @for (k of kpis(); track k.id) {
            <button type="button" (click)="filter.set(k.id)" [attr.aria-pressed]="filter() === k.id"
              class="card-lift relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-soft"
              [class]="filter() === k.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'">
              <span class="pointer-events-none absolute -bottom-5 -right-4 text-deep opacity-[0.05]" aria-hidden="true"><app-icon [icon]="k.icon" [size]="90" /></span>
              <span class="relative grid h-10 w-10 place-items-center rounded-xl" [class]="k.tone"><app-icon [icon]="k.icon" [size]="20" /></span>
              <p class="relative mt-3 text-3xl font-bold tracking-tight text-deep">{{ k.value }}</p>
              <p class="relative text-sm text-muted-foreground">{{ k.label }}</p>
            </button>
          }
        </div>

        <!-- Barre d'outils -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative min-w-[220px] max-w-md flex-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
            <input type="search" class="field pl-9" placeholder="Rechercher un nom, une étiquette…" aria-label="Rechercher un patient"
              [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
          <select class="field w-auto" aria-label="Trier les patients" [ngModel]="sort()" (ngModelChange)="sort.set($event)">
            <option value="name">Nom (A → Z)</option>
            <option value="recent">Dernière visite</option>
          </select>
          <div class="inline-flex rounded-full border border-border bg-muted p-1" role="group" aria-label="Affichage">
            <button type="button" (click)="layout.set('grid')" aria-label="Affichage en grille" [attr.aria-pressed]="layout() === 'grid'"
              class="grid h-8 w-9 place-items-center rounded-full transition-colors"
              [class]="layout() === 'grid' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground'"><app-icon [icon]="Grid" [size]="16" /></button>
            <button type="button" (click)="layout.set('list')" aria-label="Affichage en liste" [attr.aria-pressed]="layout() === 'list'"
              class="grid h-8 w-9 place-items-center rounded-full transition-colors"
              [class]="layout() === 'list' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground'"><app-icon [icon]="List" [size]="16" /></button>
          </div>
        </div>

        @if (!rows().length) {
          <div class="flex flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-card px-6 py-14 text-center shadow-soft">
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-soft text-primary"><app-icon [icon]="Users" [size]="28" /></span>
            <p class="mt-4 font-semibold text-deep">Aucun patient ne correspond</p>
            <p class="mt-1 text-sm text-muted-foreground">Essayez un autre filtre ou une autre recherche.</p>
            <button type="button" class="btn btn-soft mt-5" (click)="reset()">Réinitialiser</button>
          </div>
        } @else if (layout() === 'grid') {
          <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            @for (r of rows(); track r.p.id) {
              <article class="card-lift overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div class="relative h-20 overflow-hidden bg-linear-to-br" [class]="pal(r.p.id)">
                  <svg class="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 300 64" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 36 H80 L90 30 L100 36 H140 L150 8 L162 60 L174 28 L182 36 H300" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <div class="px-5 pb-5">
                <div class="relative z-10 -mt-8 flex items-end justify-between gap-2">
                    <span class="grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br text-xl font-bold text-white shadow-soft ring-4 ring-card" [class]="pal(r.p.id)">{{ ini(r.p.name) }}</span>
                    @if (r.next) {
                      <span class="mb-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                        <span class="h-1.5 w-1.5 rounded-full bg-success"></span>RDV {{ heading(r.next.start).toLowerCase() }}
                      </span>
                    }
                  </div>
                  <h3 class="mt-3 truncate text-lg font-bold tracking-tight text-deep">{{ r.p.name }}</h3>
                  <p class="text-sm text-muted-foreground">{{ r.p.age }} ans · groupe {{ r.x.bloodType }}</p>

                  <div class="mt-3 flex min-h-[1.75rem] flex-wrap gap-1.5">
                    @for (t of r.x.tags; track t) {
                      <span class="rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium text-primary">{{ t }}</span>
                    }
                    @for (al of r.x.allergies; track al) {
                      <span class="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">⚠ {{ al }}</span>
                    }
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                    <div>
                      <p class="text-xs text-muted-foreground">Dernière visite</p>
                      <p class="font-semibold text-deep">{{ ago(r.p.lastVisit) }}</p>
                    </div>
                        <div>
                            <p class="text-xs text-muted-foreground">Prochain RDV</p>
                            <p class="font-semibold text-deep">{{ r.next ? time(r.next.start) : '—' }}</p>
                            @if (r.next) {
                                <p class="text-xs text-muted-foreground">{{ heading(r.next.start) }}</p>
                            }
                        </div>
                  </div>

                  <div class="mt-4 flex gap-2">
                    <button type="button" class="btn btn-hero flex-1" (click)="open(r)">Ouvrir le dossier</button>
                    <a routerLink="/espace-medecin/messages" class="btn btn-soft btn-icon" aria-label="Envoyer un message"><app-icon [icon]="Message" [size]="16" /></a>
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <ul class="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            @for (r of rows(); track r.p.id) {
              <li>
                <button type="button" (click)="open(r)" class="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-soft/60">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-linear-to-br text-sm font-bold text-white" [class]="pal(r.p.id)">{{ ini(r.p.name) }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-deep">{{ r.p.name }} <span class="font-normal text-muted-foreground">· {{ r.p.age }} ans</span></p>
                    <div class="mt-1 flex flex-wrap gap-1.5">
                      @for (t of r.x.tags; track t) {
                        <span class="rounded-full bg-soft px-2 py-0.5 text-[11px] font-medium text-primary">{{ t }}</span>
                      }
                    </div>
                  </div>
                  <div class="hidden text-sm sm:block">
                    <p class="text-xs text-muted-foreground">Dernière visite</p>
                    <p class="font-medium text-deep">{{ ago(r.p.lastVisit) }}</p>
                  </div>
                  <div class="hidden w-40 text-sm md:block">
                    <p class="text-xs text-muted-foreground">Prochain RDV</p>
                    <p class="truncate font-medium text-deep">{{ r.next ? time(r.next.start) + ' · ' + heading(r.next.start) : '—' }}</p>
                  </div>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>

    <!-- Dossier patient -->
    @if (current(); as r) {
      <div class="fixed inset-0 z-50 flex justify-end">
        <button type="button" class="absolute inset-0 bg-deep/50 backdrop-blur-sm" (click)="selectedId.set(null)" aria-label="Fermer le dossier"></button>
        <aside class="drawer-in relative flex h-full w-full max-w-md flex-col overflow-hidden bg-card shadow-lift" role="dialog" aria-modal="true" [attr.aria-label]="'Dossier de ' + r.p.name">
          <div class="relative overflow-hidden bg-deep p-6 text-deep-foreground">
            <div class="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-tertiary/30 blur-3xl"></div>
            <button type="button" (click)="selectedId.set(null)" aria-label="Fermer"
              class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"><app-icon [icon]="Close" [size]="18" /></button>
            <div class="relative flex items-center gap-4">
              <span class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-linear-to-br text-xl font-bold text-white ring-4 ring-white/15" [class]="pal(r.p.id)">{{ ini(r.p.name) }}</span>
              <div class="min-w-0">
                <h2 class="truncate text-xl font-bold tracking-tight">{{ r.p.name }}</h2>
                <p class="text-sm text-deep-foreground/70">{{ r.p.age }} ans · groupe {{ r.x.bloodType }}</p>
                <p class="mt-1 flex items-center gap-1.5 text-sm text-deep-foreground/70"><app-icon [icon]="Phone" [size]="14" />{{ r.p.phone }}</p>
              </div>
            </div>
            <div class="relative mt-5 flex gap-2">
              <a routerLink="/espace-medecin/messages" class="btn btn-hero flex-1"><app-icon [icon]="Message" [size]="16" />Message</a>
              <a routerLink="/espace-medecin/agenda" class="btn flex-1 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"><app-icon [icon]="Calendar" [size]="16" />Planifier</a>
            </div>
          </div>

          <div role="tablist" class="flex border-b border-border px-4">
            @for (t of tabs; track t.id) {
              <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
                class="relative px-4 py-3 text-sm font-semibold transition-colors"
                [class]="tab() === t.id ? 'text-primary' : 'text-muted-foreground hover:text-deep'">
                {{ t.label }}
                @if (tab() === t.id) {
                  <span class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-primary"></span>
                }
              </button>
            }
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            @switch (tab()) {
              @case ('overview') {
                @if (last(); as v) {
                  <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-xl bg-soft/70 p-3 text-center"><p class="text-xs text-muted-foreground">Tension</p><p class="mt-1 text-lg font-bold text-deep">{{ v.sys }}/{{ v.dia }}</p><p class="text-[11px] text-muted-foreground">mmHg</p></div>
                    <div class="rounded-xl bg-soft/70 p-3 text-center"><p class="text-xs text-muted-foreground">Pouls</p><p class="mt-1 text-lg font-bold text-deep">{{ v.hr }}</p><p class="text-[11px] text-muted-foreground">bpm</p></div>
                    <div class="rounded-xl bg-soft/70 p-3 text-center"><p class="text-xs text-muted-foreground">Poids</p><p class="mt-1 text-lg font-bold text-deep">{{ v.weight }}</p><p class="text-[11px] text-muted-foreground">kg</p></div>
                  </div>
                }
                @if (spark(); as s) {
                  <div class="mt-5 rounded-2xl border border-border p-4">
                    <p class="flex items-center gap-2 text-sm font-semibold text-deep"><app-icon [icon]="Pulse" [size]="16" />Tension systolique</p>
                    <p class="text-xs text-muted-foreground">{{ r.x.vitals.length }} dernières mesures</p>
                    <svg viewBox="0 0 300 70" class="mt-2 h-20 w-full" aria-hidden="true">
                      <defs>
                        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stop-color="#14b8a6" stop-opacity="0.35" />
                          <stop offset="1" stop-color="#14b8a6" stop-opacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon [attr.points]="s.area" fill="url(#spk)" />
                      <polyline [attr.points]="s.line" fill="none" stroke="#0d8488" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
                      @for (d of s.dots; track $index) {
                        <circle [attr.cx]="d[0]" [attr.cy]="d[1]" r="3.5" fill="#fff" stroke="#0d8488" stroke-width="2" />
                      }
                    </svg>
                  </div>
                }

                <h3 class="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Allergies</h3>
                @if (r.x.allergies.length) {
                  <div class="flex flex-wrap gap-2">
                    @for (al of r.x.allergies; track al) {
                      <span class="rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">⚠ {{ al }}</span>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-muted-foreground">Aucune allergie connue.</p>
                }

                <h3 class="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dossier</h3>
                <ul class="space-y-2 text-sm">
                  <li class="flex justify-between"><span class="text-muted-foreground">Dernière visite</span><span class="font-medium text-deep">{{ ago(r.p.lastVisit) }}</span></li>
                  <li class="flex justify-between"><span class="text-muted-foreground">Patient depuis</span><span class="font-medium text-deep">{{ since(r.x.sinceDays) }}</span></li>
                </ul>
              }
              @case ('appointments') {
                @if (patientAppointments().length) {
                  <ul class="space-y-3">
                    @for (a of patientAppointments(); track a.id) {
                      <li class="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                        <div class="min-w-0">
                          <p class="font-semibold text-deep">{{ heading(a.start) }} · {{ time(a.start) }}</p>
                          <p class="truncate text-sm text-muted-foreground">{{ a.reason }}</p>
                        </div>
                        <app-status-badge [status]="a.status" />
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="text-sm text-muted-foreground">Aucun rendez-vous enregistré.</p>
                }
              }
              @case ('notes') {
                <label class="mb-2 block text-sm font-semibold text-deep" for="pn">Notes privées</label>
                <textarea id="pn" class="field min-h-44 py-3" placeholder="Observations, points de vigilance…" [ngModel]="draft()" (ngModelChange)="draft.set($event); saved.set(false)"></textarea>
                <div class="mt-3 flex items-center gap-3">
                  <button type="button" class="btn btn-hero" (click)="saveNote(r.p.id)">Enregistrer</button>
                  @if (saved()) {
                    <span class="text-sm font-medium text-success" role="status">Notes enregistrées ✓</span>
                  }
                </div>
                <p class="mt-3 text-xs text-muted-foreground">Visibles uniquement par vous.</p>
              }
            }
          </div>
        </aside>
      </div>
    }
  `,
})
export class DoctorPatientsPage {
  private readonly store = inject(MockStore);

  protected readonly Search = LucideSearch;
  protected readonly Grid = LucideLayoutGrid;
  protected readonly List = LucideList;
  protected readonly Message = LucideMessageCircle;
  protected readonly Phone = LucidePhone;
  protected readonly Calendar = LucideCalendarDays;
  protected readonly Close = LucideX;
  protected readonly Users = LucideUsers;
  protected readonly Pulse = LucideHeartPulse;

  protected readonly ini = initials;
  protected readonly time = timeLabel;
  protected readonly heading = dayHeading;

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'appointments', label: 'Rendez-vous' },
    { id: 'notes', label: 'Notes' },
  ];

  protected readonly filter = signal<Filter>('all');
  protected readonly query = signal('');
  protected readonly sort = signal<'name' | 'recent'>('name');
  protected readonly layout = signal<'grid' | 'list'>('grid');

  protected readonly selectedId = signal<string | null>(null);
  protected readonly tab = signal<Tab>('overview');
  protected readonly draft = signal('');
  protected readonly saved = signal(false);
  private readonly notes = signal<Record<string, string>>({});

  private readonly all = computed<Row[]>(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const appointments = this.store.doctorAppointments();
    return this.store.doctorPatients().map((p) => {
      const next =
        appointments
          .filter((a) => a.patientId === p.id && (a.status === 'CONFIRMED' || a.status === 'PENDING') && new Date(a.start) >= startOfToday)
          .sort((x, y) => x.start.localeCompare(y.start))[0] ?? null;
      return {
        p,
        x: PATIENT_EXTRAS[p.id] ?? EMPTY_EXTRA,
        next,
        days: Math.floor((Date.now() - new Date(p.lastVisit).getTime()) / 86400000),
      };
    });
  });

  protected readonly kpis = computed(() => {
    const a = this.all();
    return [
      { id: 'all' as Filter, label: 'Patients suivis', value: a.length, icon: LucideUsers, tone: 'bg-primary/12 text-primary' },
      { id: 'upcoming' as Filter, label: 'Avec RDV à venir', value: a.filter((r) => r.next).length, icon: LucideCalendarDays, tone: 'bg-success/15 text-success' },
      { id: 'review' as Filter, label: 'À revoir (> 2 mois)', value: a.filter((r) => r.days > 60).length, icon: LucideClock, tone: 'bg-warning/20 text-accent-foreground' },
      { id: 'new' as Filter, label: 'Nouveaux (30 jours)', value: a.filter((r) => r.x.sinceDays <= 30).length, icon: LucideUserPlus, tone: 'bg-info/15 text-info' },
    ];
  });

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    const list = this.all().filter((r) => {
      if (f === 'upcoming' && !r.next) return false;
      if (f === 'review' && r.days <= 60) return false;
      if (f === 'new' && r.x.sinceDays > 30) return false;
      return !q || r.p.name.toLowerCase().includes(q) || r.x.tags.some((t) => t.toLowerCase().includes(q));
    });
    return this.sort() === 'name'
      ? list.sort((a, b) => a.p.name.localeCompare(b.p.name, 'fr'))
      : list.sort((a, b) => a.days - b.days);
  });

  protected readonly current = computed(() => this.all().find((r) => r.p.id === this.selectedId()) ?? null);
  protected readonly last = computed(() => {
    const v = this.current()?.x.vitals ?? [];
    return v.length ? v[v.length - 1] : null;
  });
  protected readonly patientAppointments = computed(() => {
    const id = this.selectedId();
    return this.store.doctorAppointments().filter((a) => a.patientId === id).sort((x, y) => y.start.localeCompare(x.start));
  });

  protected readonly spark = computed(() => {
    const vals = this.current()?.x.vitals.map((v) => v.sys) ?? [];
    if (vals.length < 2) return null;
    const w = 300, h = 70, pad = 8;
    const min = Math.min(...vals) - 4;
    const max = Math.max(...vals) + 4;
    const dots = vals.map((y, i) => [pad + (i * (w - 2 * pad)) / (vals.length - 1), h - pad - ((y - min) / (max - min)) * (h - 2 * pad)]);
    const line = dots.map((d) => `${d[0].toFixed(1)},${d[1].toFixed(1)}`).join(' ');
    return { dots, line, area: `${pad},${h} ${line} ${w - pad},${h}` };
  });

  protected pal(id: string): string {
    let s = 0;
    for (const c of id) s += c.charCodeAt(0);
    return PALETTES[s % PALETTES.length];
  }

  protected ago(iso: string): string {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (d <= 0) return "Aujourd'hui";
    if (d === 1) return 'Hier';
    if (d < 30) return `Il y a ${d} jours`;
    const m = Math.floor(d / 30);
    if (m < 12) return `Il y a ${m} mois`;
    const y = Math.floor(m / 12);
    return `Il y a ${y} an${y > 1 ? 's' : ''}`;
  }

  protected since(days: number): string {
    if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`;
    const m = Math.floor(days / 30);
    return m < 12 ? `${m} mois` : `${Math.floor(m / 12)} an${m >= 24 ? 's' : ''}`;
  }

  protected open(r: Row) {
    this.selectedId.set(r.p.id);
    this.tab.set('overview');
    this.draft.set(this.notes()[r.p.id] ?? r.p.note);
    this.saved.set(false);
  }

  protected saveNote(id: string) {
    this.notes.update((n) => ({ ...n, [id]: this.draft() }));
    this.saved.set(true);
  }

  protected reset() {
    this.filter.set('all');
    this.query.set('');
  }
}
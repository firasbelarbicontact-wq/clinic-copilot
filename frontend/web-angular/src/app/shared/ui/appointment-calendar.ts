import { Component, computed, input, output, signal } from '@angular/core';
import { LucideBuilding2, LucideChevronLeft, LucideChevronRight, LucideVideo } from '@lucide/angular';
import { timeLabel } from '../../core/mock/format';
import { Appointment } from '../../core/mock/mock.models';
import { Icon } from './icon';

type ViewMode = 'month' | 'week' | 'day';

interface Cell {
  date: Date;
  inMonth: boolean;
  today: boolean;
  events: Appointment[];
}
interface Placed {
  a: Appointment;
  top: number;
  height: number;
  left: number;
  width: number;
}
interface Column {
  key: string;
  date: Date;
  today: boolean;
  placed: Placed[];
}

const DAY_START = 8;
const DAY_END = 19;
const ROW = 56; // px par heure

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const mondayOf = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Place les rendez-vous dans la grille horaire, en gérant les chevauchements. */
function place(list: Appointment[]): Placed[] {
  const items = list
    .map((a) => {
      const s = new Date(a.start);
      const startMin = s.getHours() * 60 + s.getMinutes();
      return { a, startMin, endMin: startMin + a.durationMin, lane: 0, lanes: 1 };
    })
    .sort((x, y) => x.startMin - y.startMin);

  let cluster: typeof items = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const lanesEnd: number[] = [];
    for (const it of cluster) {
      let l = lanesEnd.findIndex((end) => end <= it.startMin);
      if (l === -1) {
        l = lanesEnd.length;
        lanesEnd.push(it.endMin);
      } else {
        lanesEnd[l] = it.endMin;
      }
      it.lane = l;
    }
    for (const it of cluster) it.lanes = lanesEnd.length;
    cluster = [];
  };
  for (const it of items) {
    if (cluster.length && it.startMin >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.endMin);
  }
  flush();

  const min = DAY_START * 60;
  const max = DAY_END * 60;
  return items.map((it) => {
    const s = Math.min(Math.max(it.startMin, min), max);
    return {
      a: it.a,
      top: ((s - min) / 60) * ROW,
      height: Math.max(((it.endMin - it.startMin) / 60) * ROW - 3, 28),
      left: (it.lane * 100) / it.lanes + 0.5,
      width: 100 / it.lanes - 1.5,
    };
  });
}

@Component({
  selector: 'app-appointment-calendar',
  imports: [Icon],
  template: `
    <!-- Barre d'outils -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" class="btn btn-soft btn-icon" (click)="move(-1)" aria-label="Période précédente"><app-icon [icon]="Left" [size]="18" /></button>
        <button type="button" class="btn btn-soft btn-icon" (click)="move(1)" aria-label="Période suivante"><app-icon [icon]="Right" [size]="18" /></button>
        <button type="button" class="btn btn-soft" (click)="goToday()">Aujourd'hui</button>
        <h2 class="ml-1 text-lg font-bold tracking-tight text-deep">{{ title() }}</h2>
      </div>
      <div role="tablist" aria-label="Mode d'affichage" class="inline-flex rounded-full border border-border bg-muted p-1">
        @for (v of views; track v.id) {
          <button type="button" role="tab" [attr.aria-selected]="view() === v.id" (click)="setView(v.id)"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200"
            [class]="view() === v.id ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground hover:text-deep'">{{ v.label }}</button>
        }
      </div>
    </div>

    @if (view() === 'month') {
      <!-- Vue mois -->
      <div class="grid grid-cols-7 border-b border-border bg-soft/60">
        @for (d of weekdays; track d) {
          <div class="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ d }}</div>
        }
      </div>
      <div class="grid grid-cols-7">
        @for (c of monthCells(); track c.date.getTime()) {
          <div class="min-h-[5rem] border-b border-r border-border p-1.5 sm:min-h-[7.5rem] [&:nth-child(7n)]:border-r-0"
            [class]="c.today ? 'bg-soft/70' : c.inMonth ? 'bg-card' : 'bg-muted/40'">
            <button type="button" (click)="openDay(c.date)"
              class="grid h-7 w-7 place-items-center rounded-full text-sm font-semibold transition-colors"
              [class]="c.today ? 'bg-gradient-primary text-primary-foreground shadow-soft' : c.inMonth ? 'text-deep hover:bg-soft' : 'text-muted-foreground/50'"
              [attr.aria-label]="'Ouvrir le ' + c.date.getDate()">{{ c.date.getDate() }}</button>

            <ul class="mt-1 hidden space-y-1 sm:block">
              @for (a of c.events.slice(0, 3); track a.id) {
                <li>
                  <button type="button" (click)="eventClick.emit(a)"
                    class="flex w-full items-center gap-1 truncate rounded-md border-l-4 px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight transition-shadow hover:shadow-md"
                    [class]="chipClass(a)">
                    <span class="font-bold">{{ time(a.start) }}</span><span class="truncate">{{ name(a) }}</span>
                  </button>
                </li>
              }
              @if (c.events.length > 3) {
                <li><button type="button" (click)="openDay(c.date)" class="px-1 text-[11px] font-semibold text-primary hover:underline">+{{ c.events.length - 3 }} de plus</button></li>
              }
            </ul>

            <div class="mt-1 flex flex-wrap gap-1 sm:hidden">
              @for (a of c.events.slice(0, 4); track a.id) {
                <span class="h-1.5 w-1.5 rounded-full" [class]="dotClass(a)"></span>
              }
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Vues semaine / jour -->
      <div class="overflow-x-auto">
        <div [style.min-width.px]="view() === 'week' ? 760 : 320">
          <div class="grid border-b border-border" [style.grid-template-columns]="gridCols()">
            <div></div>
            @for (c of columns(); track c.key) {
              <button type="button" (click)="openDay(c.date)" class="border-l border-border py-3 text-center" [class]="c.today ? 'bg-soft/50' : ''">
                <span class="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ weekday(c.date) }}</span>
                <span class="mx-auto mt-1 grid h-9 w-9 place-items-center rounded-full text-lg font-bold"
                  [class]="c.today ? 'bg-gradient-primary text-primary-foreground shadow-soft' : 'text-deep'">{{ c.date.getDate() }}</span>
              </button>
            }
          </div>

          <div class="grid" [style.grid-template-columns]="gridCols()">
            <div class="relative" [style.height.px]="gridHeight">
              @for (h of hourMarks; track h) {
                <span class="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" [style.top.px]="(h - DAY_START) * ROW">{{ h }}:00</span>
              }
            </div>

            @for (c of columns(); track c.key) {
              <div class="relative border-l border-border" [class]="c.today ? 'bg-soft/40' : ''" [style.height.px]="gridHeight">
                @for (h of hourMarks; track h) {
                  <div class="absolute inset-x-0 border-t border-border/70" [style.top.px]="(h - DAY_START) * ROW"></div>
                }
                @if (c.today && nowTop() !== null) {
                  <div class="pointer-events-none absolute inset-x-0 z-10 flex items-center" [style.top.px]="nowTop()">
                    <span class="-ml-1 h-2 w-2 rounded-full bg-destructive"></span><span class="h-px flex-1 bg-destructive"></span>
                  </div>
                }
                @for (p of c.placed; track p.a.id) {
                  <button type="button" (click)="eventClick.emit(p.a)"
                    class="absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs shadow-sm transition-shadow hover:shadow-md"
                    [class]="chipClass(p.a)" [style.top.px]="p.top" [style.height.px]="p.height" [style.left.%]="p.left" [style.width.%]="p.width">
                    <span class="block truncate font-bold">{{ time(p.a.start) }} · {{ name(p.a) }}</span>
                    @if (p.height > 44) {
                      <span class="block truncate opacity-80">{{ p.a.reason }}</span>
                    }
                    @if (p.height > 64) {
                      <span class="mt-0.5 flex items-center gap-1 opacity-80"><app-icon [icon]="p.a.mode === 'VIDEO' ? Video : Building" [size]="12" />{{ p.a.mode === 'VIDEO' ? 'Visio' : 'Cabinet' }}</span>
                    }
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AppointmentCalendar {
  readonly appointments = input.required<Appointment[]>();
  readonly selectedId = input<string | null>(null);
  /** Quel nom afficher sur les pastilles. */
  readonly person = input<'patient' | 'doctor'>('patient');
  readonly eventClick = output<Appointment>();

  protected readonly Left = LucideChevronLeft;
  protected readonly Right = LucideChevronRight;
  protected readonly Video = LucideVideo;
  protected readonly Building = LucideBuilding2;

  protected readonly DAY_START = DAY_START;
  protected readonly ROW = ROW;
  protected readonly gridHeight = (DAY_END - DAY_START) * ROW;
  protected readonly hourMarks = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => DAY_START + i);
  protected readonly weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  protected readonly views: { id: ViewMode; label: string }[] = [
    { id: 'month', label: 'Mois' },
    { id: 'week', label: 'Semaine' },
    { id: 'day', label: 'Jour' },
  ];
  protected readonly time = timeLabel;

  protected readonly view = signal<ViewMode>('month');
  protected readonly cursor = signal(startOfDay(new Date()));

  private readonly byDay = computed(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of this.appointments()) {
      const k = keyOf(new Date(a.start));
      map.set(k, [...(map.get(k) ?? []), a]);
    }
    for (const list of map.values()) list.sort((x, y) => x.start.localeCompare(y.start));
    return map;
  });

  protected readonly title = computed(() => {
    const c = this.cursor();
    switch (this.view()) {
      case 'month':
        return cap(c.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
      case 'week': {
        const s = mondayOf(c);
        const e = addDays(s, 6);
        const from = s.toLocaleDateString('fr-FR', s.getMonth() === e.getMonth() ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
        const to = e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${from} – ${to}`;
      }
      default:
        return cap(c.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    }
  });

  protected readonly monthCells = computed<Cell[]>(() => {
    const c = this.cursor();
    const first = new Date(c.getFullYear(), c.getMonth(), 1);
    const gridStart = mondayOf(first);
    const count = addDays(gridStart, 35).getMonth() !== c.getMonth() ? 35 : 42;
    const map = this.byDay();
    const today = new Date();
    return Array.from({ length: count }, (_, i) => {
      const date = addDays(gridStart, i);
      return { date, inMonth: date.getMonth() === c.getMonth(), today: sameDay(date, today), events: map.get(keyOf(date)) ?? [] };
    });
  });

  protected readonly columns = computed<Column[]>(() => {
    const v = this.view();
    if (v === 'month') return [];
    const days = v === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(mondayOf(this.cursor()), i)) : [this.cursor()];
    const map = this.byDay();
    const today = new Date();
    return days.map((d) => ({ key: keyOf(d), date: d, today: sameDay(d, today), placed: place(map.get(keyOf(d)) ?? []) }));
  });

  protected readonly gridCols = computed(() => `3.5rem repeat(${this.view() === 'week' ? 7 : 1}, minmax(0, 1fr))`);

  protected readonly nowTop = computed(() => {
    const n = new Date();
    const m = n.getHours() * 60 + n.getMinutes();
    return m < DAY_START * 60 || m > DAY_END * 60 ? null : ((m - DAY_START * 60) / 60) * ROW;
  });

  protected move(dir: 1 | -1) {
    const c = this.cursor();
    switch (this.view()) {
      case 'month':
        this.cursor.set(new Date(c.getFullYear(), c.getMonth() + dir, 1));
        break;
      case 'week':
        this.cursor.set(addDays(c, 7 * dir));
        break;
      default:
        this.cursor.set(addDays(c, dir));
    }
  }

  protected goToday() {
    this.cursor.set(startOfDay(new Date()));
  }

  protected setView(v: ViewMode) {
    if (v !== 'month' && this.view() === 'month') {
      const t = startOfDay(new Date());
      const c = this.cursor();
      if (t.getMonth() === c.getMonth() && t.getFullYear() === c.getFullYear()) this.cursor.set(t);
    }
    this.view.set(v);
  }

  protected openDay(d: Date) {
    this.cursor.set(startOfDay(d));
    this.view.set('day');
  }

  protected weekday(d: Date) {
    return this.weekdays[(d.getDay() + 6) % 7];
  }

  protected name(a: Appointment) {
    return this.person() === 'patient' ? a.patientName : a.doctorName;
  }

  protected chipClass(a: Appointment): string {
    const tone = {
      PENDING: 'border-l-warning bg-warning/20 text-accent-foreground',
      CONFIRMED: 'border-l-success bg-success/15 text-deep',
      COMPLETED: 'border-l-muted-foreground bg-muted text-muted-foreground',
      CANCELLED: 'border-l-destructive bg-destructive/10 text-destructive line-through opacity-70',
    }[a.status];
    return a.id === this.selectedId() ? `${tone} ring-2 ring-primary` : tone;
  }

  protected dotClass(a: Appointment): string {
    return { PENDING: 'bg-warning', CONFIRMED: 'bg-success', COMPLETED: 'bg-muted-foreground', CANCELLED: 'bg-destructive' }[a.status];
  }
}
import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { AppointmentStatus, Doctor } from './patient.models';
import { toDateKey } from './appointment-utils';

const TONE: Record<Doctor['tone'], string> = {
  primary: 'bg-primary/15 text-primary',
  info: 'bg-info/15 text-info',
  accent: 'bg-accent/20 text-accent-foreground',
};

@Component({
  selector: 'app-doctor-avatar',
  template: `
    <span class="relative z-10 grid shrink-0 place-items-center rounded-full font-bold" [class]="cls()" aria-hidden="true">
      {{ initials() }}
      @if (showOnline()) {
        <span class="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card" [class]="doctor().online ? 'bg-success' : 'bg-muted-foreground/50'"></span>
      }
    </span>
  `,
})
export class DoctorAvatar {
  readonly doctor = input.required<Doctor>();
  readonly size = input<'md' | 'lg' | 'xl'>('md');
  readonly showOnline = input(false);
  protected readonly initials = computed(() =>
    this.doctor().name.replace('Dr. ', '').split(' ').map((p) => p[0]).slice(0, 2).join(''));
  protected readonly cls = computed(() => {
    const s = { md: 'h-12 w-12 text-sm', lg: 'h-14 w-14 text-base', xl: 'h-20 w-20 text-xl' }[this.size()];
    return `${s} ${TONE[this.doctor().tone]}`;
  });
}

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirme: { label: 'Confirmé', cls: 'bg-success/15 text-success' },
  attente: { label: 'En attente', cls: 'bg-warning/20 text-accent-foreground' },
  termine: { label: 'Terminé', cls: 'bg-muted text-muted-foreground' },
  annule: { label: 'Annulé', cls: 'bg-destructive/10 text-destructive' },
};

@Component({
  selector: 'app-status-pill',
  template: `<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" [class]="meta().cls">{{ meta().label }}</span>`,
})
export class StatusPill {
  readonly status = input.required<AppointmentStatus>();
  protected readonly meta = computed(() => STATUS[this.status()]);
}

@Component({
  selector: 'app-rating-stars',
  template: `
    <span class="inline-flex gap-0.5" [attr.aria-label]="'Note ' + value() + ' sur 5'">
      @for (n of [1, 2, 3, 4, 5]; track n) {
        <svg viewBox="0 0 24 24" [style.width.px]="size()" [style.height.px]="size()" stroke="currentColor" stroke-width="2" stroke-linejoin="round"
          [class]="n <= rounded() ? 'fill-accent text-accent' : 'fill-none text-border'" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      }
    </span>
  `,
})
export class RatingStars {
  readonly value = input.required<number>();
  readonly size = input(16);
  protected readonly rounded = computed(() => Math.round(this.value()));
}

@Component({
  selector: 'app-mini-calendar',
  imports: [Icon],
  template: `
    <div class="w-full max-w-xs rounded-2xl border border-border bg-card p-3">
      <div class="mb-2 flex items-center justify-between">
        <button type="button" class="btn btn-ghost btn-icon" (click)="shift(-1)" aria-label="Mois précédent"><app-icon [icon]="Left" [size]="16" /></button>
        <p class="font-semibold capitalize text-deep">{{ title() }}</p>
        <button type="button" class="btn btn-ghost btn-icon" (click)="shift(1)" aria-label="Mois suivant"><app-icon [icon]="Right" [size]="16" /></button>
      </div>
      <div class="grid grid-cols-7 text-center text-xs text-muted-foreground">
        @for (h of heads; track h) { <span class="py-1">{{ h }}</span> }
      </div>
      <div class="grid grid-cols-7 gap-1">
        @for (c of cells(); track $index) {
          @if (c) {
            <button type="button" [disabled]="disabled()(c)" (click)="picked.emit(c)"
              class="aspect-square rounded-lg text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:text-muted-foreground/40"
              [class]="isSelected(c) ? 'bg-gradient-primary text-white' : 'text-deep enabled:hover:bg-soft'">
              {{ c.getDate() }}
            </button>
          } @else { <span></span> }
        }
      </div>
    </div>
  `,
})
export class MiniCalendar {
  readonly selected = input<Date | null>(null);
  readonly disabled = input<(d: Date) => boolean>(() => false);
  readonly picked = output<Date>();
  protected readonly Left = LucideChevronLeft;
  protected readonly Right = LucideChevronRight;
  protected readonly heads = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  private readonly month = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  constructor() {
    effect(() => {
      const s = this.selected();
      if (s) untracked(() => this.month.set(new Date(s.getFullYear(), s.getMonth(), 1)));
    });
  }

  protected readonly title = computed(() => this.month().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  protected readonly cells = computed(() => {
    const m = this.month();
    const lead = (m.getDay() + 6) % 7;
    const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) out.push(new Date(m.getFullYear(), m.getMonth(), d));
    return out;
  });
  protected isSelected(d: Date): boolean {
    const s = this.selected();
    return !!s && toDateKey(s) === toDateKey(d);
  }
  protected shift(n: number): void {
    const m = this.month();
    this.month.set(new Date(m.getFullYear(), m.getMonth() + n, 1));
  }
}
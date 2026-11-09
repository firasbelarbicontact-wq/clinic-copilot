import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

const TONES = {
  primary: 'bg-primary/12 text-primary',
  info: 'bg-info/15 text-info',
  warning: 'bg-warning/20 text-accent-foreground',
  success: 'bg-success/15 text-success',
} as const;

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink, Icon],
  template: `
    <a [routerLink]="to()" class="card-lift relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft focus-visible:outline-2 focus-visible:outline-ring">
      <span class="pointer-events-none absolute -bottom-6 -right-5 text-deep opacity-[0.05]" aria-hidden="true"><app-icon [icon]="icon()" [size]="104" /></span>
      <span class="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl" [class]="toneClass()"><app-icon [icon]="icon()" [size]="24" /></span>
      <div class="relative min-w-0">
        <p class="truncate text-sm text-muted-foreground">{{ label() }}</p>
        <p class="text-2xl font-bold tracking-tight text-deep">{{ value() }} <span class="text-sm font-medium text-muted-foreground">{{ hint() }}</span></p>
      </div>
    </a>
  `,
})
export class StatCard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon = input.required<any>();
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly to = input.required<string>();
  readonly tone = input<keyof typeof TONES>('primary');

  protected readonly toneClass = computed(() => TONES[this.tone()]);
}
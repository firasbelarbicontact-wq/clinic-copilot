import { Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-page-header',
  imports: [Icon],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="flex items-center gap-4">
        @if (icon()) {
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft"><app-icon [icon]="icon()" [size]="24" /></span>
        }
        <div>
          @if (eyebrow()) {
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{{ eyebrow() }}</p>
          }
          <h1 class="text-2xl font-bold tracking-tight text-deep sm:text-3xl">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="mt-1 text-muted-foreground">{{ subtitle() }}</p>
          }
          <span class="mt-3 block h-1 w-12 rounded-full bg-gradient-primary" aria-hidden="true"></span>
        </div>
      </div>
      <ng-content />
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon = input<any>(null);
}
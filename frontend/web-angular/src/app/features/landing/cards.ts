import { Component, computed, input } from '@angular/core';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { IconItem, UrgencyLevel } from './landing.data';

@Component({
  selector: 'app-section-title',
  imports: [RevealDirective],
  template: `
    <div appReveal class="mx-auto mb-12 max-w-2xl text-center">
      @if (eyebrow()) {
        <p class="mb-3 text-sm font-semibold uppercase tracking-widest" [class]="light() ? 'text-tertiary' : 'text-primary'">{{ eyebrow() }}</p>
      }
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl" [class]="light() ? 'text-deep-foreground' : 'text-deep'">{{ title() }}</h2>
      @if (text()) {
        <p class="mt-4 text-lg" [class]="light() ? 'text-deep-foreground/70' : 'text-muted-foreground'">{{ text() }}</p>
      }
    </div>
  `,
})
export class SectionTitle {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly text = input('');
  readonly light = input(false);
}

@Component({
  selector: 'app-feature-card',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="card-lift h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div class="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-soft text-primary"><app-icon [icon]="item().icon" [size]="24" /></div>
      <h3 class="font-semibold text-deep">{{ item().title }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">{{ item().text }}</p>
    </div>
  `,
})
export class FeatureCard {
  readonly item = input.required<IconItem>();
}

@Component({
  selector: 'app-step-card',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="card-lift relative h-full rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div class="flex items-center justify-between">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">{{ n() }}</span>
        <span class="text-secondary"><app-icon [icon]="item().icon" [size]="24" /></span>
      </div>
      <h3 class="mt-5 font-semibold text-deep">{{ item().title }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">{{ item().text }}</p>
    </div>
  `,
})
export class StepCard {
  readonly n = input.required<number>();
  readonly item = input.required<IconItem>();
}

const badgeStyles: Record<UrgencyLevel, string> = {
  urgence: 'bg-destructive text-white',
  urgent: 'bg-warning text-accent-foreground',
  courant: 'bg-primary text-primary-foreground',
  conseil: 'bg-success text-deep',
};
const cardStyles: Record<UrgencyLevel, string> = {
  urgence: 'border-destructive/40 bg-destructive/5',
  urgent: 'border-warning/40 bg-warning/5',
  courant: 'border-primary/30 bg-primary/5',
  conseil: 'border-success/40 bg-success/5',
};
const labels: Record<UrgencyLevel, string> = { urgence: 'Urgence', urgent: 'Urgent', courant: 'Courant', conseil: 'Conseil' };

@Component({
  selector: 'app-urgency-badge',
  host: { class: 'inline-flex' },
  template: `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="style()">{{ label() }}</span>`,
})
export class UrgencyBadge {
  readonly level = input.required<UrgencyLevel>();
  protected readonly style = computed(() => badgeStyles[this.level()]);
  protected readonly label = computed(() => labels[this.level()]);
}

@Component({
  selector: 'app-urgency-card',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="card-lift h-full rounded-2xl border-2 p-6" [class]="card()">
      <div class="mb-4 grid h-12 w-12 place-items-center rounded-xl" [class]="badge()"><app-icon [icon]="item().icon" [size]="24" /></div>
      <h3 class="text-lg font-bold text-deep">{{ item().title }}</h3>
      <p class="mt-2 text-sm text-muted-foreground">{{ item().text }}</p>
    </div>
  `,
})
export class UrgencyCard {
  readonly item = input.required<IconItem & { level: UrgencyLevel }>();
  protected readonly card = computed(() => cardStyles[this.item().level]);
  protected readonly badge = computed(() => badgeStyles[this.item().level]);
}

@Component({
  selector: 'app-role-card',
  host: { class: 'block h-full' },
  template: `
    <div class="card-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div class="bg-gradient-soft p-5"><ng-content /></div>
      <div class="p-6">
        <h3 class="text-xl font-bold text-deep">{{ title() }}</h3>
        <p class="mt-1 text-muted-foreground">{{ tagline() }}</p>
      </div>
    </div>
  `,
})
export class RoleCard {
  readonly title = input.required<string>();
  readonly tagline = input.required<string>();
}
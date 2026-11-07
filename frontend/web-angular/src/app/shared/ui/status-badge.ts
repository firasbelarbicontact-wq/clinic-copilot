import { Component, computed, input } from '@angular/core';

const MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-warning/20 text-accent-foreground' },
  CONFIRMED: { label: 'Confirmé', cls: 'bg-success/15 text-success' },
  COMPLETED: { label: 'Terminé', cls: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Annulé', cls: 'bg-destructive/15 text-destructive' },
  PUBLISHED: { label: 'Publié', cls: 'bg-success/15 text-success' },
  HIDDEN: { label: 'Masqué', cls: 'bg-muted text-muted-foreground' },
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" [class]="view().cls">{{ view().label }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<string>();
  protected readonly view = computed(() => MAP[this.status()] ?? { label: this.status(), cls: 'bg-muted text-muted-foreground' });
}
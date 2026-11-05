import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stars',
  template: `
    <span class="relative inline-flex align-middle" role="img" [attr.aria-label]="value().toFixed(1) + ' sur 5'">
      <span class="inline-flex text-muted-foreground/30">
        @for (i of five; track i) {
          <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" class="shrink-0">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        }
      </span>
      <span class="absolute inset-y-0 left-0 inline-flex overflow-hidden text-amber-400" [style.width.%]="percent()">
        @for (i of five; track i) {
          <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" class="shrink-0">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        }
      </span>
    </span>
  `,
})
export class StarRating {
  readonly value = input.required<number>();
  readonly size = input(16);

  protected readonly five = [1, 2, 3, 4, 5];
  protected readonly percent = computed(() => Math.max(0, Math.min(5, this.value())) * 20);
}
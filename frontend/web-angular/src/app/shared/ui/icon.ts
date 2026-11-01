import { Component, input } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  host: { class: 'inline-flex shrink-0' },
  template: `<svg [lucideIcon]="icon()" [size]="size()"></svg>`,
})
export class Icon {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly icon = input.required<any>();
  readonly size = input(16);
}
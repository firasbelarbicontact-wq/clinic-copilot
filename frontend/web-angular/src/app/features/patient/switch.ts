import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-switch',
  template: `
    <button type="button" role="switch" [attr.aria-checked]="checked()" [attr.aria-label]="label()" (click)="changed.emit(!checked())"
      class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-ring"
      [class]="checked() ? 'bg-primary' : 'bg-muted-foreground/30'">
      <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200" [class]="checked() ? 'left-[22px]' : 'left-0.5'"></span>
    </button>
  `,
})
export class Switch {
  readonly checked = input(false);
  readonly label = input('');
  readonly changed = output<boolean>();
}
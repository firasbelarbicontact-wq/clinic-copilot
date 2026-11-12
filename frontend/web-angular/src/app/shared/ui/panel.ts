import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel',
  template: `
    <section class="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      @if (title()) {
        <div class="mb-4 flex items-center justify-between gap-3">
          <h2 class="flex items-center gap-2.5 text-lg font-bold tracking-tight text-deep">
            <span class="h-5 w-1 rounded-full bg-gradient-primary" aria-hidden="true"></span>{{ title() }}
          </h2>
          <ng-content select="[panelAction]" />
        </div>
      }
      <ng-content />
    </section>
  `,
})
export class Panel {
  readonly title = input('');
}
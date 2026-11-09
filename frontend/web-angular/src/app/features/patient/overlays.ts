import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-modal',
  imports: [Icon],
  host: { '(document:keydown.escape)': 'open() && closed.emit()' },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 grid place-items-center p-4">
        <div class="absolute inset-0 bg-deep/50 backdrop-blur-sm" (click)="closed.emit()"></div>
        <div role="dialog" aria-modal="true" [attr.aria-label]="title()"
          class="modal-in relative max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"
          [class]="wide() ? 'max-w-2xl' : 'max-w-lg'">
          <button type="button" class="btn btn-ghost btn-icon absolute right-3 top-3" (click)="closed.emit()" aria-label="Fermer">
            <app-icon [icon]="X" [size]="18" />
          </button>
          <h2 class="pr-8 text-xl font-bold text-deep">{{ title() }}</h2>
          @if (description()) { <p class="mt-1 text-sm text-muted-foreground">{{ description() }}</p> }
          <div class="mt-5 space-y-4"><ng-content /></div>
          <div class="mt-6 flex flex-wrap justify-end gap-2"><ng-content select="[modalFooter]" /></div>
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly wide = input(false);
  readonly closed = output<void>();
  protected readonly X = LucideX;
}

@Component({
  selector: 'app-drawer',
  imports: [Icon],
  host: { '(document:keydown.escape)': 'open() && closed.emit()' },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-deep/40 backdrop-blur-sm" (click)="closed.emit()"></div>
        <aside role="dialog" aria-modal="true" [attr.aria-label]="title()"
          class="drawer-in absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 shadow-2xl">
          <button type="button" class="btn btn-ghost btn-icon absolute right-3 top-3" (click)="closed.emit()" aria-label="Fermer">
            <app-icon [icon]="X" [size]="18" />
          </button>
          <h2 class="pr-8 text-xl font-bold text-deep">{{ title() }}</h2>
          @if (description()) { <p class="mt-1 text-sm text-muted-foreground">{{ description() }}</p> }
          <div class="mt-6"><ng-content /></div>
        </aside>
      </div>
    }
  `,
})
export class Drawer {
  readonly open = input(false);
  readonly title = input('');
  readonly description = input('');
  readonly closed = output<void>();
  protected readonly X = LucideX;
}
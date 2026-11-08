import { Component, Injectable, inject, signal } from '@angular/core';

export interface Toast { id: number; title: string; description?: string; kind: 'success' | 'error' }

@Injectable({ providedIn: 'root' })
export class Toasts {
  readonly items = signal<Toast[]>([]);
  private n = 0;
  success(title: string, description?: string): void { this.push({ title, description, kind: 'success' }); }
  error(title: string, description?: string): void { this.push({ title, description, kind: 'error' }); }
  private push(t: Omit<Toast, 'id'>): void {
    const id = ++this.n;
    this.items.update((l) => [...l, { ...t, id }]);
    setTimeout(() => this.items.update((l) => l.filter((x) => x.id !== id)), 4000);
  }
}

@Component({
  selector: 'app-toasts',
  template: `
    <div class="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      @for (t of toasts.items(); track t.id) {
        <div role="status" class="modal-in pointer-events-auto rounded-2xl border border-border border-l-4 bg-card/90 p-4 shadow-soft backdrop-blur"
          [class]="t.kind === 'success' ? 'border-l-success' : 'border-l-destructive'">
          <p class="font-semibold text-deep">{{ t.title }}</p>
          @if (t.description) { <p class="mt-0.5 text-sm text-muted-foreground">{{ t.description }}</p> }
        </div>
      }
    </div>
  `,
})
export class ToastsHost {
  protected readonly toasts = inject(Toasts);
}
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideFlag, LucideSearch } from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { avatarGradient } from '../../core/mock/palette';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { StatusBadge } from '../../shared/ui/status-badge';
import { StarRating } from '../reviews/star-rating';
import { AdminDemoStore, DemoReview } from './admin-demo.store';

type Tab = 'all' | 'flagged' | 'published' | 'hidden';

@Component({
  selector: 'app-admin-reviews-page',
  imports: [FormsModule, Icon, PageHeader, StarRating, StatusBadge],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-5xl space-y-6">
        <app-page-header eyebrow="Modération" title="Avis des patients" subtitle="Examinez les avis signalés et gardez l'annuaire fiable." [icon]="Flag">
          <span class="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-accent-foreground">Données de démonstration</span>
        </app-page-header>

        @if (notice()) {
          <p role="status" class="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-deep">{{ notice() }}</p>
        }

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">À examiner</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ store.flaggedCount() }}</p>
          </div>
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avis publiés</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ publishedCount() }}</p>
          </div>
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avis masqués</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ store.hiddenCount() }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-2" role="tablist">
            @for (t of tabs(); track t.id) {
              <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
                class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
                [class]="tab() === t.id ? 'bg-primary text-primary-foreground shadow-soft' : 'border border-border bg-card text-muted-foreground hover:border-primary/40'">
                {{ t.label }} <span class="opacity-70">({{ t.n }})</span>
              </button>
            }
          </div>
          <div class="relative min-w-[220px] flex-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
            <input type="search" class="field h-10 pl-9" placeholder="Rechercher un patient, un médecin, un mot…" aria-label="Rechercher dans les avis"
              [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
        </div>

        <ul class="space-y-4">
          @for (r of rows(); track r.id) {
            <li class="rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
              [class]="r.flagged && r.status === 'PUBLISHED' ? 'border-amber-300' : 'border-border'">
              <div class="flex items-start gap-4">
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(r.authorName)">{{ ini(r.authorName) }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="font-semibold text-deep">{{ r.authorName }}</span>
                    <span class="text-sm text-muted-foreground">sur {{ r.doctorName }}</span>
                    <app-stars [value]="r.rating" />
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">{{ day(r.createdAt) }} · {{ time(r.createdAt) }}</p>
                  <p class="mt-3 leading-relaxed text-deep">{{ r.comment }}</p>

                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="r.status" />
                    @if (r.flagged && r.status === 'PUBLISHED') {
                      <span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700"><app-icon [icon]="Flag" [size]="12" />Signalé</span>
                    }
                    @if (r.hiddenReason) {
                      <span class="text-xs text-muted-foreground">Motif : {{ r.hiddenReason }}</span>
                    }
                  </div>

                  <div class="mt-4 flex flex-wrap gap-2">
                    @if (r.status === 'PUBLISHED') {
                      <button type="button" class="btn btn-soft" (click)="openHide(r)">Masquer</button>
                      @if (r.flagged) {
                        <button type="button" class="btn btn-ghost" (click)="dismiss(r)">Ignorer le signalement</button>
                      }
                    } @else {
                      <button type="button" class="btn btn-soft" (click)="restore(r)">Rétablir l'avis</button>
                    }
                  </div>
                </div>
              </div>
            </li>
          } @empty {
            <li class="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
              <p class="font-semibold text-deep">Aucun avis dans cette vue</p>
              <p class="mt-1 text-sm text-muted-foreground">Changez de filtre ou modifiez votre recherche.</p>
            </li>
          }
        </ul>
      </div>
    </div>

    @if (target(); as t) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-deep/50 p-4 backdrop-blur-sm" (click)="target.set(null)">
        <div role="dialog" aria-modal="true" aria-labelledby="hide-title" class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift" (click)="$event.stopPropagation()">
          <h2 id="hide-title" class="text-lg font-bold text-deep">Masquer cet avis ?</h2>
          <p class="mt-1 text-sm text-muted-foreground">L'avis de {{ t.authorName }} ne sera plus visible sur la fiche de {{ t.doctorName }}.</p>
          <p class="mt-4 text-sm font-medium text-deep">Motif</p>
          <div class="mt-2 flex flex-wrap gap-2">
            @for (m of reasons; track m) {
              <button type="button" (click)="reason.set(m)" class="rounded-full border px-3 py-1.5 text-sm font-medium transition"
                [class]="reason() === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-deep hover:border-primary/40'">{{ m }}</button>
            }
          </div>
          <label for="note" class="mt-4 block text-sm font-medium text-deep">Précision (facultatif)</label>
          <textarea id="note" rows="2" class="field mt-1 h-auto py-2" [ngModel]="note()" (ngModelChange)="note.set($event)"></textarea>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn btn-ghost" (click)="target.set(null)">Annuler</button>
            <button type="button" class="btn btn-hero" [disabled]="!reason()" (click)="confirmHide(t)">Masquer l'avis</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminReviewsPage {
  protected readonly store = inject(AdminDemoStore);

  protected readonly Flag = LucideFlag;
  protected readonly Search = LucideSearch;
  protected readonly ini = initials;
  protected readonly grad = avatarGradient;
  protected readonly day = dayHeading;
  protected readonly time = timeLabel;
  protected readonly reasons = ['Propos injurieux', 'Publicité', 'Hors sujet', 'Données personnelles', 'Autre'];

  protected readonly tab = signal<Tab>('all');
  protected readonly query = signal('');
  protected readonly target = signal<DemoReview | null>(null);
  protected readonly reason = signal('');
  protected readonly note = signal('');
  protected readonly notice = signal<string | null>(null);

  protected readonly publishedCount = computed(() => this.store.reviews().filter((r) => r.status === 'PUBLISHED').length);
  protected readonly tabs = computed(() => [
    { id: 'all' as Tab, label: 'Tous', n: this.store.reviews().length },
    { id: 'flagged' as Tab, label: 'Signalés', n: this.store.flaggedCount() },
    { id: 'published' as Tab, label: 'Publiés', n: this.publishedCount() },
    { id: 'hidden' as Tab, label: 'Masqués', n: this.store.hiddenCount() },
  ]);

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = this.tab();
    return this.store
      .reviews()
      .filter((r) => {
        if (tab === 'flagged') return r.flagged && r.status === 'PUBLISHED';
        if (tab === 'published') return r.status === 'PUBLISHED';
        if (tab === 'hidden') return r.status === 'HIDDEN';
        return true;
      })
      .filter((r) => !q || `${r.authorName} ${r.doctorName} ${r.comment}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.createdAt.localeCompare(a.createdAt));
  });

  @HostListener('document:keydown.escape')
  protected onEscape() {
    this.target.set(null);
  }

  protected openHide(r: DemoReview) {
    this.reason.set('');
    this.note.set('');
    this.target.set(r);
  }

  protected confirmHide(r: DemoReview) {
    const note = this.note().trim();
    this.store.hideReview(r.id, note ? `${this.reason()} (${note})` : this.reason());
    this.target.set(null);
    this.flash('Avis masqué. L\u2019action est enregistrée dans le journal d\u2019audit.');
  }

  protected restore(r: DemoReview) {
    this.store.restoreReview(r.id);
    this.flash('Avis rétabli.');
  }

  protected dismiss(r: DemoReview) {
    this.store.dismissFlag(r.id);
    this.flash('Signalement ignoré.');
  }

  private flash(text: string) {
    this.notice.set(text);
    setTimeout(() => this.notice.set(null), 3500);
  }
}
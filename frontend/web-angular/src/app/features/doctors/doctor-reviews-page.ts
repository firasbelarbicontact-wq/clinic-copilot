import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCornerDownRight, LucideQuote, LucideSearch } from '@lucide/angular';
import { initials, shortDate } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { MockReview } from '../../core/mock/mock.models';
import { avatarGradient } from '../../core/mock/palette';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { StarRating } from '../reviews/star-rating';

type Sort = 'recent' | 'best' | 'worst';

@Component({
  selector: 'app-doctor-reviews-page',
  imports: [DecimalPipe, FormsModule, Icon, PageHeader, StarRating],
  template: `
    <div class="bg-gradient-soft px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <app-page-header title="Avis reçus" subtitle="Ce que vos patients disent de vous." />

        <!-- Indicateurs -->
        <div class="grid gap-4 md:grid-cols-3">
          <article class="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p class="text-sm font-medium text-muted-foreground">Note moyenne</p>
            <div class="mt-2 flex items-end gap-3">
              <p class="text-5xl font-extrabold leading-none text-deep">{{ average() | number: '1.1-1' }}</p>
              <span class="pb-1 text-sm text-muted-foreground">sur 5</span>
            </div>
            <div class="mt-3"><app-stars [value]="average()" [size]="20" /></div>
          </article>
          <article class="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p class="text-sm font-medium text-muted-foreground">Avis publiés</p>
            <p class="mt-2 text-5xl font-extrabold leading-none text-deep">{{ total() }}</p>
            <p class="mt-3 text-sm text-muted-foreground"><span class="font-semibold text-primary">+{{ last30() }}</span> au cours des 30 derniers jours</p>
          </article>
          <article class="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p class="text-sm font-medium text-muted-foreground">Satisfaction</p>
            <p class="mt-2 text-5xl font-extrabold leading-none text-deep">{{ satisfaction() }} %</p>
            <div class="mt-4 h-2 overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-success transition-all" [style.width.%]="satisfaction()"></span></div>
            <p class="mt-2 text-xs text-muted-foreground">Avis de 4 étoiles et plus</p>
          </article>
        </div>

        <div class="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <!-- Distribution -->
          <aside class="rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
            <h2 class="font-semibold text-deep">Répartition des notes</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">Cliquez sur une note pour filtrer.</p>
            <ul class="mt-4 space-y-1">
              @for (star of levels; track star) {
                <li>
                  <button type="button" (click)="toggleStar(star)" [attr.aria-pressed]="starFilter() === star"
                    class="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition hover:bg-soft"
                    [class]="starFilter() === star ? 'bg-soft ring-1 ring-primary/40' : ''">
                    <span class="w-8 shrink-0 text-left text-muted-foreground">{{ star }} ★</span>
                    <span class="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span class="block h-full rounded-full bg-amber-400" [style.width.%]="pct(star)"></span></span>
                    <span class="w-5 shrink-0 text-right text-muted-foreground">{{ count(star) }}</span>
                  </button>
                </li>
              }
            </ul>
          </aside>

          <!-- Liste -->
          <section class="space-y-4">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative min-w-[200px] flex-1">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
                <input type="search" class="field h-11 pl-9" placeholder="Rechercher dans les avis…" aria-label="Rechercher dans les avis"
                  [ngModel]="query()" (ngModelChange)="query.set($event)" />
              </div>
              <select class="field h-11 w-auto" aria-label="Trier les avis" (change)="sort.set($any($event.target).value)">
                <option value="recent" [selected]="sort() === 'recent'">Plus récents</option>
                <option value="best" [selected]="sort() === 'best'">Mieux notés</option>
                <option value="worst" [selected]="sort() === 'worst'">Moins bien notés</option>
              </select>
              @if (starFilter() !== null || query()) {
                <button type="button" class="btn btn-ghost" (click)="reset()">Réinitialiser</button>
              }
            </div>

            <ul class="space-y-4">
              @for (r of rows(); track r.id) {
                <li class="rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-lift">
                  <div class="flex items-start gap-4">
                    <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(r.authorName)">{{ ini(r.authorName) }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span class="font-semibold text-deep">{{ r.authorName }}</span>
                        <app-stars [value]="r.rating" />
                        <span class="text-xs text-muted-foreground">{{ date(r.at) }}</span>
                        @if (isRecent(r)) {
                          <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Récent</span>
                        }
                      </div>
                      <p class="mt-2 flex gap-2 leading-relaxed text-muted-foreground">
                        <span class="mt-0.5 shrink-0 text-primary/50"><app-icon [icon]="Quote" [size]="16" /></span>{{ r.comment }}
                      </p>

                      @if (replies()[r.id]; as reply) {
                        <div class="mt-3 flex gap-2 rounded-xl bg-soft p-3 text-sm">
                          <span class="mt-0.5 shrink-0 text-primary"><app-icon [icon]="Reply" [size]="16" /></span>
                          <div>
                            <p class="text-xs font-semibold text-primary">Votre réponse</p>
                            <p class="mt-0.5 leading-relaxed text-deep">{{ reply }}</p>
                          </div>
                        </div>
                      }

                      @if (replyOpen() === r.id) {
                        <div class="mt-3 space-y-2">
                          <textarea rows="3" class="field h-auto py-2" placeholder="Remerciez votre patient…" aria-label="Votre réponse"
                            [ngModel]="replyDraft()" (ngModelChange)="replyDraft.set($event)"></textarea>
                          <div class="flex gap-2">
                            <button type="button" class="btn btn-hero" [disabled]="!replyDraft().trim()" (click)="saveReply(r.id)">Publier la réponse</button>
                            <button type="button" class="btn btn-ghost" (click)="replyOpen.set(null)">Annuler</button>
                          </div>
                        </div>
                      } @else {
                        <button type="button" class="btn btn-ghost mt-3 -ml-3" (click)="openReply(r)">
                          <app-icon [icon]="Reply" [size]="16" />{{ replies()[r.id] ? 'Modifier ma réponse' : 'Répondre' }}
                        </button>
                      }
                    </div>
                  </div>
                </li>
              } @empty {
                <li class="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
                  <p class="font-semibold text-deep">{{ total() ? 'Aucun avis ne correspond à votre recherche' : "Vous n'avez pas encore reçu d'avis" }}</p>
                  @if (total()) { <button type="button" class="btn btn-hero mt-4" (click)="reset()">Réinitialiser</button> }
                </li>
              }
            </ul>
            <p class="text-xs text-muted-foreground">Vos réponses sont conservées dans cette session de démonstration.</p>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class DoctorReviewsPage {
  private readonly store = inject(MockStore);

  protected readonly Search = LucideSearch;
  protected readonly Quote = LucideQuote;
  protected readonly Reply = LucideCornerDownRight;

  protected readonly ini = initials;
  protected readonly date = shortDate;
  protected readonly grad = avatarGradient;
  protected readonly levels = [5, 4, 3, 2, 1];

  protected readonly query = signal('');
  protected readonly sort = signal<Sort>('recent');
  protected readonly starFilter = signal<number | null>(null);
  protected readonly replies = signal<Record<string, string>>({});
  protected readonly replyOpen = signal<string | null>(null);
  protected readonly replyDraft = signal('');

  private readonly reviews = this.store.doctorReviews;
  protected readonly total = computed(() => this.reviews().length);
  protected readonly average = computed(() => {
    const l = this.reviews();
    return l.length ? l.reduce((s, r) => s + r.rating, 0) / l.length : 0;
  });
  protected readonly satisfaction = computed(() => {
    const l = this.reviews();
    return l.length ? Math.round((l.filter((r) => r.rating >= 4).length * 100) / l.length) : 0;
  });
  protected readonly last30 = computed(() => this.reviews().filter((r) => Date.now() - new Date(r.at).getTime() <= 30 * 86400000).length);

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const star = this.starFilter();
    const list = this.reviews().filter(
      (r) => (star === null || r.rating === star) && (!q || r.comment.toLowerCase().includes(q) || r.authorName.toLowerCase().includes(q)),
    );
    switch (this.sort()) {
      case 'best':
        return list.sort((a, b) => b.rating - a.rating || b.at.localeCompare(a.at));
      case 'worst':
        return list.sort((a, b) => a.rating - b.rating || b.at.localeCompare(a.at));
      default:
        return list.sort((a, b) => b.at.localeCompare(a.at));
    }
  });

  protected count(star: number): number {
    return this.reviews().filter((r) => r.rating === star).length;
  }
  protected pct(star: number): number {
    const t = this.total();
    return t ? (this.count(star) * 100) / t : 0;
  }
  protected isRecent(r: MockReview): boolean {
    return Date.now() - new Date(r.at).getTime() <= 7 * 86400000;
  }
  protected toggleStar(star: number) {
    this.starFilter.update((s) => (s === star ? null : star));
  }
  protected reset() {
    this.starFilter.set(null);
    this.query.set('');
  }
  protected openReply(r: MockReview) {
    this.replyOpen.set(r.id);
    this.replyDraft.set(this.replies()[r.id] ?? '');
  }
  protected saveReply(id: string) {
    const text = this.replyDraft().trim();
    if (!text) return;
    this.replies.update((m) => ({ ...m, [id]: text }));
    this.replyOpen.set(null);
  }
}
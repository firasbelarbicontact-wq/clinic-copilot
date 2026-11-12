import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideFlag, LucideSearch } from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { avatarGradient } from '../../core/mock/palette';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { StarRating } from '../reviews/star-rating';
import { AdminReview, AdminService, ReviewModerationStatus } from './admin.service';

type Tab = 'all' | 'published' | 'hidden';

@Component({
  selector: 'app-admin-reviews-page',
  imports: [FormsModule, Icon, PageHeader, StarRating],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-5xl space-y-6">
        <app-page-header eyebrow="Modération" title="Avis des patients" subtitle="Examinez et modérez les avis pour garder l'annuaire fiable." [icon]="Flag">
          <span class="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">Données en direct</span>
        </app-page-header>

        @if (error()) {
          <div role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-card p-5 shadow-soft">
            <p class="text-sm text-deep">{{ error() }}</p>
            <button type="button" class="btn btn-soft" (click)="load()">Réessayer</button>
          </div>
        }

        @if (notice()) {
          <p role="status" class="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-deep">{{ notice() }}</p>
        }

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total des avis</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ loading() ? '…' : reviews().length }}</p>
          </div>
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avis publiés</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ loading() ? '…' : publishedCount() }}</p>
          </div>
          <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avis masqués</p>
            <p class="mt-1 text-3xl font-extrabold text-deep">{{ loading() ? '…' : hiddenCount() }}</p>
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
            <input type="search" class="field h-10 pl-9" placeholder="Rechercher par patient ou commentaire…" aria-label="Rechercher dans les avis"
              [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
        </div>

        @if (loading()) {
          <div class="space-y-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="h-28 animate-pulse rounded-2xl bg-muted"></div>
            }
          </div>
        } @else {
          <ul class="space-y-4">
            @for (r of rows(); track r.id) {
              <li class="rounded-2xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
                [class]="r.status === 'HIDDEN' ? 'border-amber-300/60 bg-amber-500/5' : 'border-border'">
                <div class="flex items-start gap-4">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(r.authorName || 'Patient')">{{ ini(r.authorName || 'Patient') }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span class="font-semibold text-deep">{{ r.authorName || 'Anonyme' }}</span>
                      <span class="text-xs text-muted-foreground">ID Médecin : {{ shortId(r.doctorId) }}</span>
                      <app-stars [value]="r.rating" />
                    </div>
                    <p class="mt-1 text-xs text-muted-foreground">{{ formatCreated(r.createdAt) }}</p>
                    <p class="mt-3 leading-relaxed text-deep">{{ r.comment }}</p>

                    <div class="mt-3 flex flex-wrap items-center gap-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                        [class]="r.status === 'PUBLISHED' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'">
                        {{ r.status === 'PUBLISHED' ? 'Publié' : 'Masqué' }}
                      </span>
                      @if (r.moderationReason) {
                        <span class="text-xs text-muted-foreground">Motif : {{ r.moderationReason }}</span>
                      }
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2">
                      @if (r.status === 'PUBLISHED') {
                        <button type="button" class="btn btn-soft" (click)="openHide(r)">Masquer l'avis</button>
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
        }
      </div>
    </div>

    @if (target(); as t) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-deep/50 p-4 backdrop-blur-sm" (click)="target.set(null)">
        <div role="dialog" aria-modal="true" aria-labelledby="hide-title" class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lift" (click)="$event.stopPropagation()">
          <h2 id="hide-title" class="text-lg font-bold text-deep">Masquer cet avis ?</h2>
          <p class="mt-1 text-sm text-muted-foreground">L'avis de {{ t.authorName }} ne sera plus visible publiquement sur la plateforme.</p>
          <p class="mt-4 text-sm font-medium text-deep">Motif de modération</p>
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
export class AdminReviewsPage implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly Flag = LucideFlag;
  protected readonly Search = LucideSearch;
  protected readonly ini = initials;
  protected readonly grad = avatarGradient;
  protected readonly reasons = ['Propos injurieux', 'Publicité non sollicitée', 'Hors sujet', 'Données personnelles sensibles', 'Autre'];

  protected readonly reviews = signal<AdminReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly tab = signal<Tab>('all');
  protected readonly query = signal('');
  protected readonly target = signal<AdminReview | null>(null);
  protected readonly reason = signal('');
  protected readonly note = signal('');
  protected readonly notice = signal<string | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.listReviews(undefined, 0, 100).subscribe({
      next: (page) => {
        this.reviews.set(page.content || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les avis. Vérifiez que reviews-feedback-service est démarré.');
        this.loading.set(false);
      },
    });
  }

  protected readonly publishedCount = computed(() => this.reviews().filter((r) => r.status === 'PUBLISHED').length);
  protected readonly hiddenCount = computed(() => this.reviews().filter((r) => r.status === 'HIDDEN').length);

  protected readonly tabs = computed(() => [
    { id: 'all' as Tab, label: 'Tous', n: this.reviews().length },
    { id: 'published' as Tab, label: 'Publiés', n: this.publishedCount() },
    { id: 'hidden' as Tab, label: 'Masqués', n: this.hiddenCount() },
  ]);

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = this.tab();
    return this.reviews()
      .filter((r) => {
        if (tab === 'published') return r.status === 'PUBLISHED';
        if (tab === 'hidden') return r.status === 'HIDDEN';
        return true;
      })
      .filter((r) => !q || `${r.authorName || ''} ${r.comment || ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  protected shortId(id: string): string {
    return id ? id.substring(0, 8) : '—';
  }

  protected formatCreated(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return `${dayHeading(dateStr)} · ${timeLabel(dateStr)}`;
    } catch {
      return dateStr;
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    this.target.set(null);
  }

  protected openHide(r: AdminReview) {
    this.reason.set('');
    this.note.set('');
    this.target.set(r);
  }

  protected confirmHide(r: AdminReview) {
    const fullReason = this.note().trim() ? `${this.reason()} (${this.note().trim()})` : this.reason();
    this.adminService.hideReview(r.id, fullReason).subscribe({
      next: (updated) => {
        this.target.set(null);
        this.reviews.update((list) =>
          list.map((item) => (item.id === r.id ? { ...item, status: 'HIDDEN' as ReviewModerationStatus, moderationReason: fullReason } : item))
        );
        this.flash('Avis masqué avec succès.');
      },
      error: () => {
        this.target.set(null);
        this.flash('Erreur lors de la modération de l\'avis.');
      },
    });
  }

  protected restore(r: AdminReview) {
    this.adminService.publishReview(r.id).subscribe({
      next: (updated) => {
        this.reviews.update((list) =>
          list.map((item) => (item.id === r.id ? { ...item, status: 'PUBLISHED' as ReviewModerationStatus, moderationReason: null } : item))
        );
        this.flash('Avis rétabli avec succès.');
      },
      error: () => {
        this.flash('Erreur lors du rétablissement de l\'avis.');
      },
    });
  }

  private flash(text: string) {
    this.notice.set(text);
    setTimeout(() => this.notice.set(null), 3500);
  }
}

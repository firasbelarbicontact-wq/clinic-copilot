import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MyReview, PublicReview, RatingSummary } from './review.models';
import { ReviewsService } from './reviews.service';
import { StarRating } from './star-rating';

function readRole(): string | null {
  try {
    const raw = localStorage.getItem('clinic-copilot.session');
    if (!raw) return null;
    const role = (JSON.parse(raw) as { role?: string }).role;
    return role ? role.replace(/^ROLE_/, '') : null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-doctor-reviews',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, StarRating],
  template: `
    <section class="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <h2 class="text-xl font-bold text-deep">Avis des patients</h2>

      @if (summary(); as s) {
        @if (s.count > 0) {
          <div class="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div class="text-center sm:pr-6">
              <div class="text-5xl font-extrabold text-deep">{{ s.average | number: '1.1-1' }}</div>
              <app-stars [value]="s.average" [size]="20" />
              <div class="mt-1 text-sm text-muted-foreground">{{ s.count }} avis</div>
            </div>
            <ul class="space-y-1.5">
              @for (star of levels; track star) {
                <li class="flex items-center gap-3 text-sm">
                  <span class="w-10 shrink-0 text-muted-foreground">{{ star }} ★</span>
                  <span class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span class="block h-full rounded-full bg-amber-400" [style.width.%]="pct(star)"></span>
                  </span>
<<<<<<< HEAD
                  <span class="w-6 shrink-0 text-right text-muted-foreground">{{ s.distribution[star] ?? 0 }}</span>
=======
                  <span class="w-6 shrink-0 text-right text-muted-foreground">{{ s.distribution[star] }}</span>
>>>>>>> origin/main
                </li>
              }
            </ul>
          </div>
        } @else {
          <p class="mt-3 text-sm text-muted-foreground">Aucun avis pour le moment. Soyez le premier à donner le vôtre.</p>
        }
      }

      @if (reviews().length) {
        <ul class="mt-6 divide-y divide-border">
          @for (r of reviews(); track r.id) {
            <li class="py-4">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="font-semibold text-deep">{{ r.authorName }}</span>
                <app-stars [value]="r.rating" />
                <span class="text-xs text-muted-foreground">{{ r.createdAt | date: 'dd/MM/yyyy' }}</span>
              </div>
              @if (r.comment) {
                <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{{ r.comment }}</p>
              }
            </li>
          }
        </ul>
        @if (page() + 1 < totalPages()) {
          <button type="button" class="btn btn-soft mt-2" [disabled]="loading()" (click)="more()">Afficher plus d'avis</button>
        }
      }

      <div class="mt-8 border-t border-border pt-6">
        @if (isPatient) {
          <h3 class="text-lg font-semibold text-deep">{{ mine() ? 'Modifier mon avis' : 'Donner mon avis' }}</h3>

          @if (mine()?.status === 'HIDDEN') {
            <p class="mt-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">Votre avis a été masqué par la modération et n'est plus visible publiquement.</p>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-4 space-y-4">
            <div>
              <span class="mb-1 block text-sm font-medium text-deep">Votre note</span>
              <div class="flex gap-1" (mouseleave)="hover.set(0)">
                @for (n of stars; track n) {
                  <button type="button" class="p-0.5 transition-transform hover:scale-110" [attr.aria-label]="n + ' étoile' + (n > 1 ? 's' : '')" (mouseenter)="hover.set(n)" (click)="rating.set(n)">
                    <svg width="30" height="30" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1" stroke-linejoin="round" [attr.fill]="n <= (hover() || rating()) ? 'currentColor' : 'none'" [class]="n <= (hover() || rating()) ? 'text-amber-400' : 'text-muted-foreground/40'">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                }
              </div>
            </div>

            @if (!mine()) {
              <div>
                <label class="mb-1 block text-sm font-medium text-deep" for="rv-name">Nom affiché (facultatif)</label>
                <input id="rv-name" class="field" type="text" maxlength="60" placeholder="Ex. Sarah M." formControlName="authorName" />
              </div>
            }

            <div>
              <label class="mb-1 block text-sm font-medium text-deep" for="rv-comment">Votre commentaire (facultatif)</label>
              <textarea id="rv-comment" class="field min-h-28" maxlength="1000" placeholder="Partagez votre expérience…" formControlName="comment"></textarea>
            </div>

            @if (message(); as m) {
              <p class="text-sm" [class]="m.kind === 'ok' ? 'text-primary' : 'text-destructive'" role="status">{{ m.text }}</p>
            }

            <div class="flex flex-wrap gap-3">
              <button type="submit" class="btn btn-hero" [disabled]="saving()">{{ mine() ? 'Enregistrer' : 'Publier mon avis' }}</button>
              @if (mine()) {
                <button type="button" class="btn btn-soft" [disabled]="saving()" (click)="remove()">Supprimer mon avis</button>
              }
            </div>
          </form>
        } @else if (role === null) {
          <p class="text-sm text-muted-foreground">
            <a routerLink="/connexion" class="font-semibold text-primary underline">Connectez-vous</a> avec un compte patient pour laisser un avis.
          </p>
        } @else {
          <p class="text-sm text-muted-foreground">Seuls les comptes patients peuvent laisser un avis.</p>
        }
      </div>
    </section>
  `,
})
export class DoctorReviews {
  readonly doctorId = input.required<string>();

  private readonly api = inject(ReviewsService);
  private readonly fb = inject(FormBuilder);

  protected readonly role = readRole();
  protected readonly isPatient = this.role === 'PATIENT';

  protected readonly levels = [5, 4, 3, 2, 1];
  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly summary = signal<RatingSummary | null>(null);
  protected readonly reviews = signal<PublicReview[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(false);

  protected readonly mine = signal<MyReview | null>(null);
  protected readonly rating = signal(0);
  protected readonly hover = signal(0);
  protected readonly saving = signal(false);
  protected readonly message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    authorName: ['', [Validators.maxLength(60)]],
    comment: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      const id = this.doctorId();
      untracked(() => {
        this.loadPublic(id);
        this.loadMine(id);
      });
    });
  }

  protected pct(star: number): number {
    const s = this.summary();
    return s && s.count ? ((s.distribution[star] ?? 0) * 100) / s.count : 0;
  }

  protected more() {
    this.fetchPage(this.page() + 1, false);
  }

  protected submit() {
    if (this.rating() < 1) {
      this.message.set({ kind: 'error', text: 'Choisissez une note de 1 à 5 étoiles.' });
      return;
    }
    if (this.form.invalid) return;

    const { authorName, comment } = this.form.getRawValue();
    const current = this.mine();
    this.saving.set(true);
    this.message.set(null);

    const request$ = current
      ? this.api.update(current.id, { rating: this.rating(), comment })
      : this.api.create({ doctorId: this.doctorId(), rating: this.rating(), comment, authorName });

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.mine.set(saved);
        this.message.set({ kind: 'ok', text: current ? 'Votre avis a été mis à jour.' : 'Merci, votre avis est publié.' });
        this.loadPublic(this.doctorId());
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.message.set({ kind: 'error', text: this.errorText(e) });
      },
    });
  }

  protected remove() {
    const current = this.mine();
    if (!current || !window.confirm('Supprimer votre avis ?')) return;
    this.saving.set(true);
    this.message.set(null);
    this.api.remove(current.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.mine.set(null);
        this.rating.set(0);
        this.form.reset();
        this.message.set({ kind: 'ok', text: 'Votre avis a été supprimé.' });
        this.loadPublic(this.doctorId());
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.message.set({ kind: 'error', text: this.errorText(e) });
      },
    });
  }

  private loadPublic(id: string) {
    this.api.getRating(id).subscribe((s) => this.summary.set(s));
    this.fetchPage(0, true);
  }

  private fetchPage(page: number, reset: boolean) {
    this.loading.set(true);
    this.api.list(this.doctorId(), page).subscribe({
      next: (res) => {
        this.reviews.update((list) => (reset ? res.content : [...list, ...res.content]));
        this.page.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        if (reset) this.reviews.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadMine(id: string) {
    if (!this.isPatient) return;
    this.api.mine().subscribe({
      next: (list) => {
        const found = list.find((r) => r.doctorId === id) ?? null;
        this.mine.set(found);
        if (found) {
          this.rating.set(found.rating);
          this.form.patchValue({ comment: found.comment ?? '' });
        }
      },
      error: () => this.mine.set(null),
    });
  }

  private errorText(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 409) return 'Vous avez déjà laissé un avis pour ce médecin.';
      if (e.status === 401 || e.status === 403) return 'Session expirée ou accès refusé. Reconnectez-vous en tant que patient.';
      if (e.status === 400) return 'Données invalides. Vérifiez la note et la longueur du commentaire.';
    }
    return 'Une erreur est survenue. Réessayez.';
  }
}
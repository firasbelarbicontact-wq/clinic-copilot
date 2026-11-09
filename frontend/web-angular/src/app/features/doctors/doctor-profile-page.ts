import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft, LucideBadgeCheck, LucideCalendarDays, LucideCheck, LucideCopy,
  LucideMapPin, LucideNavigation, LucidePhone, LucideShieldAlert,
} from '@lucide/angular';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Footer } from '../../shared/layout/footer';
import { Header } from '../../shared/layout/header';
import { Icon } from '../../shared/ui/icon';
import { DoctorReviews } from '../reviews/doctor-reviews';
import { PublicDoctorDetail } from './models/doctor.models';
import { DirectoryService } from './services/directory.service';

type ProfileState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ok'; doctor: PublicDoctorDetail };

@Component({
  selector: 'app-doctor-profile-page',
  imports: [Header, Footer, Icon, RouterLink, RevealDirective, DoctorReviews],
  template: `
    <div class="min-h-screen bg-gradient-soft">
      <app-header />
      <main class="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <button type="button" class="btn btn-ghost -ml-3 mb-4" (click)="back()">
          <app-icon [icon]="Back" [size]="16" />Retour à l'annuaire
        </button>

        @if (status() === 'loading') {
          <div class="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div class="h-40 animate-pulse bg-muted"></div>
            <div class="space-y-3 p-8">
              <div class="h-7 w-64 animate-pulse rounded bg-muted"></div>
              <div class="h-4 w-40 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        } @else if (status() === 'notfound') {
          <div class="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
            <h1 class="text-lg font-semibold text-deep">Médecin introuvable</h1>
            <p class="mt-2 text-sm text-muted-foreground">Cette fiche n'existe pas ou n'est plus disponible.</p>
            <a routerLink="/medecins" class="btn btn-hero mt-5">Voir l'annuaire</a>
          </div>
        } @else if (status() === 'error') {
          <div class="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-soft">
            <h1 class="text-lg font-semibold text-deep">Impossible de charger la fiche</h1>
            <p class="mt-2 text-sm text-muted-foreground">Vérifiez que le service est démarré, puis rechargez la page.</p>
          </div>
        } @else if (doctor(); as d) {
          <!-- En-tête -->
          <article appReveal class="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div class="relative h-32 overflow-hidden bg-linear-to-br from-deep to-primary sm:h-40">
              <svg class="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 90 H180 L200 74 L220 90 H300 L320 20 L344 150 L368 70 L384 90 H600" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <div class="px-6 pb-6 sm:px-8 sm:pb-8">
              <div class="relative z-10 -mt-12 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-soft ring-4 ring-card sm:-mt-14 sm:h-28 sm:w-28 sm:text-4xl" aria-hidden="true">
                {{ initials() }}
              </div>

              <div class="mt-4">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 class="text-2xl font-extrabold tracking-tight text-deep sm:text-3xl">{{ fullName() }}</h1>
                  <span class="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                    <app-icon [icon]="Verified" [size]="14" />Profil vérifié
                  </span>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  @if (primary(); as s) {
                    <span class="rounded-full bg-soft px-3 py-1 text-sm font-semibold text-primary">{{ s.name }}</span>
                  }
                  @if (place()) {
                    <span class="flex items-center gap-1.5 text-sm text-muted-foreground"><app-icon [icon]="MapPin" [size]="16" />{{ place() }}</span>
                  }
                </div>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                @if (phoneHref(); as tel) {
                  <a [href]="tel" class="btn btn-hero btn-lg"><app-icon [icon]="Phone" [size]="16" />Appeler {{ d.phone }}</a>
                }
                @if (mapsUrl(); as m) {
                  <a [href]="m" target="_blank" rel="noopener noreferrer" class="btn btn-soft btn-lg"><app-icon [icon]="Navigation" [size]="16" />Itinéraire</a>
                }
                <button type="button" class="btn btn-ghost btn-lg" (click)="copyLink()">
                  <app-icon [icon]="copied() ? Check : Copy" [size]="16" />{{ copied() ? 'Lien copié' : 'Copier le lien' }}
                </button>
              </div>
            </div>
          </article>

          <!-- Tuiles -->
          <div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            @for (s of stats(); track s.label) {
              <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ s.label }}</p>
                <p class="mt-1 truncate text-xl font-extrabold text-deep">{{ s.value }}</p>
              </div>
            }
          </div>

          <!-- Onglets -->
          <nav aria-label="Sections de la fiche" class="sticky top-[4.5rem] z-30 mt-6 flex gap-1 overflow-x-auto rounded-full border border-border bg-card/90 p-1 shadow-soft backdrop-blur-md">
            @for (t of tabs; track t.id) {
              <button type="button" (click)="go(t.id)"
                class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-soft hover:text-primary">{{ t.label }}</button>
            }
          </nav>

          <div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div class="min-w-0 space-y-6">
              <section id="about" class="scroll-mt-32 rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 class="text-lg font-semibold text-deep">À propos</h2>
                <p class="mt-3 leading-relaxed text-muted-foreground">{{ d.bio || "Ce médecin n'a pas encore renseigné de présentation." }}</p>
              </section>

              <section id="specialties" class="scroll-mt-32 rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 class="text-lg font-semibold text-deep">Spécialités</h2>
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (s of specialties(); track s.code) {
                    <span class="rounded-full px-3 py-1.5 text-sm font-semibold"
                      [class]="s.primary ? 'bg-gradient-primary text-primary-foreground' : 'bg-soft text-primary'">
                      {{ s.name }}@if (s.primary) { · principale }
                    </span>
                  }
                </div>
              </section>

              <app-doctor-reviews id="reviews" class="block scroll-mt-32" [doctorId]="d.id" />
            </div>

            <aside class="space-y-6 lg:sticky lg:top-32">
              <section id="office" class="scroll-mt-32 rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 class="text-lg font-semibold text-deep">Cabinet</h2>
                <address class="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
                  @if (d.addressLine) { {{ d.addressLine }}<br /> }
                  {{ postalCity() }}
                  @if (d.governorate) { <br />{{ d.governorate }} }
                </address>
                @if (phoneHref(); as tel) {
                  <a [href]="tel" class="mt-3 flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><app-icon [icon]="Phone" [size]="16" />{{ d.phone }}</a>
                }
                @if (mapsUrl(); as m) {
                  <a [href]="m" target="_blank" rel="noopener noreferrer" class="btn btn-soft mt-4 w-full"><app-icon [icon]="Navigation" [size]="16" />Obtenir l'itinéraire</a>
                }
                <button type="button" class="btn btn-ghost mt-2 w-full cursor-not-allowed opacity-60" disabled>
                  <app-icon [icon]="Calendar" [size]="16" />Rendez-vous en ligne bientôt
                </button>
              </section>

              <section class="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 class="text-lg font-semibold text-deep">Langues parlées</h2>
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (l of d.languages; track l.code) {
                    <span class="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">{{ l.name }}</span>
                  } @empty {
                    <span class="text-sm text-muted-foreground">Non renseignées.</span>
                  }
                </div>
              </section>

              <p class="flex items-start gap-2 rounded-2xl bg-destructive/10 p-4 text-sm text-deep">
                <span class="mt-0.5 shrink-0 text-destructive"><app-icon [icon]="Alert" [size]="16" /></span>
                <span>En cas d'urgence vitale, appelez le <a href="tel:190" class="font-semibold text-destructive underline">190 (SAMU)</a>.</span>
              </p>
            </aside>
          </div>
        }
      </main>
      <app-footer />
    </div>
  `,
})
export class DoctorProfilePage {
  private readonly api = inject(DirectoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly title = inject(Title);

  protected readonly Back = LucideArrowLeft;
  protected readonly Verified = LucideBadgeCheck;
  protected readonly Calendar = LucideCalendarDays;
  protected readonly Check = LucideCheck;
  protected readonly Copy = LucideCopy;
  protected readonly MapPin = LucideMapPin;
  protected readonly Navigation = LucideNavigation;
  protected readonly Phone = LucidePhone;
  protected readonly Alert = LucideShieldAlert;

  protected readonly tabs = [
    { id: 'about', label: 'À propos' },
    { id: 'specialties', label: 'Spécialités' },
    { id: 'office', label: 'Cabinet' },
    { id: 'reviews', label: 'Avis' },
  ];
  protected readonly copied = signal(false);

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('id') ?? ''),
      switchMap((id) =>
        this.api.getById(id).pipe(
          tap((d) => this.title.setTitle(`${[d.title, d.firstName, d.lastName].filter(Boolean).join(' ')} · Clinic Copilot`)),
          map((doctor): ProfileState => ({ status: 'ok', doctor })),
          startWith<ProfileState>({ status: 'loading' }),
          catchError((e: unknown) =>
            of<ProfileState>(e instanceof HttpErrorResponse && (e.status === 404 || e.status === 400) ? { status: 'notfound' } : { status: 'error' }),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as ProfileState },
  );

  protected readonly status = computed(() => this.state().status);
  protected readonly doctor = computed(() => {
    const s = this.state();
    return s.status === 'ok' ? s.doctor : null;
  });

  protected readonly fullName = computed(() => {
    const d = this.doctor();
    return d ? [d.title, d.firstName, d.lastName].filter(Boolean).join(' ') : '';
  });
  protected readonly initials = computed(() => {
    const d = this.doctor();
    return d ? ((d.firstName[0] ?? '') + (d.lastName[0] ?? '')).toUpperCase() : '';
  });
  protected readonly specialties = computed(() => {
    const list = this.doctor()?.specialties ?? [];
    return [...list].sort((a, b) => Number(b.primary) - Number(a.primary));
  });
  protected readonly primary = computed(() => this.specialties()[0] ?? null);
  protected readonly place = computed(() => {
    const d = this.doctor();
    return d ? [d.city, d.governorate].filter(Boolean).join(', ') : '';
  });
  protected readonly postalCity = computed(() => {
    const d = this.doctor();
    return d ? [d.postalCode, d.city].filter(Boolean).join(' ') : '';
  });
  protected readonly stats = computed(() => {
    const d = this.doctor();
    if (!d) return [];
    return [
      { label: 'Expérience', value: d.yearsExperience !== null ? `${d.yearsExperience} ans` : '—' },
      { label: 'Spécialités', value: String(d.specialties.length) },
      { label: 'Langues', value: String(d.languages.length) },
      { label: 'Ville', value: d.city || d.governorate || '—' },
    ];
  });
  protected readonly phoneHref = computed(() => {
    const p = this.doctor()?.phone;
    return p ? 'tel:' + p.replace(/[^\d+]/g, '') : null;
  });
  protected readonly mapsUrl = computed(() => {
    const d = this.doctor();
    if (!d) return null;
    if (d.latitude !== null && d.longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`;
    }
    const address = [d.addressLine, d.postalCode, d.city].filter(Boolean).join(' ');
    return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  });

  protected back() {
    if (window.history.length > 1) this.location.back();
    else this.router.navigate(['/medecins']);
  }

  protected go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      /* presse-papiers indisponible : on ignore */
    }
  }
}
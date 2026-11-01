import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideAward, LucideMapPin, LucideNavigation, LucidePhone, LucideShieldAlert } from '@lucide/angular';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Footer } from '../../shared/layout/footer';
import { Header } from '../../shared/layout/header';
import { Icon } from '../../shared/ui/icon';
import { PublicDoctorDetail } from './models/doctor.models';
import { DirectoryService } from './services/directory.service';

type ProfileState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ok'; doctor: PublicDoctorDetail };

@Component({
  selector: 'app-doctor-profile-page',
  imports: [Header, Footer, Icon, RouterLink, RevealDirective],
  template: `
    <div class="min-h-screen">
      <app-header />
      <main class="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <button type="button" class="btn btn-ghost -ml-3 mb-6" (click)="back()">
          <app-icon [icon]="Back" [size]="16" />Retour à l'annuaire
        </button>

        @if (status() === 'loading') {
          <div class="h-80 animate-pulse rounded-3xl border border-border bg-muted"></div>
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
          <article appReveal class="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div class="bg-gradient-soft p-6 sm:p-8">
              <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div class="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-gradient-primary text-3xl font-bold text-primary-foreground" aria-hidden="true">{{ initials() }}</div>
                <div class="min-w-0 flex-1">
                  <h1 class="text-2xl font-extrabold tracking-tight text-deep sm:text-3xl">{{ fullName() }}</h1>
                  @if (primary(); as s) {
                    <span class="mt-2 inline-block rounded-full bg-card px-3 py-1 text-sm font-semibold text-primary">{{ s.name }}</span>
                  }
                  <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    @if (place()) {
                      <li class="flex items-center gap-1.5"><app-icon [icon]="MapPin" [size]="16" />{{ place() }}</li>
                    }
                    @if (d.yearsExperience !== null) {
                      <li class="flex items-center gap-1.5"><app-icon [icon]="Award" [size]="16" />{{ d.yearsExperience }} ans d'expérience</li>
                    }
                  </ul>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                @if (phoneHref(); as tel) {
                  <a [href]="tel" class="btn btn-hero btn-lg"><app-icon [icon]="Phone" [size]="16" />Appeler {{ d.phone }}</a>
                }
                @if (mapsUrl(); as m) {
                  <a [href]="m" target="_blank" rel="noopener noreferrer" class="btn btn-soft btn-lg"><app-icon [icon]="Navigation" [size]="16" />Itinéraire</a>
                }
              </div>
            </div>

            <div class="grid gap-8 p-6 sm:p-8 md:grid-cols-3">
              <div class="space-y-8 md:col-span-2">
                <section>
                  <h2 class="mb-2 text-lg font-semibold text-deep">À propos</h2>
                  <p class="leading-relaxed text-muted-foreground">{{ d.bio || "Ce médecin n'a pas encore renseigné de présentation." }}</p>
                </section>
                <section>
                  <h2 class="mb-2 text-lg font-semibold text-deep">Spécialités</h2>
                  <div class="flex flex-wrap gap-2">
                    @for (s of d.specialties; track s.code) {
                      <span class="rounded-full px-3 py-1 text-sm font-medium" [class]="s.primary ? 'bg-soft text-primary' : 'border border-border text-muted-foreground'">{{ s.name }}</span>
                    }
                  </div>
                </section>
              </div>

              <aside class="space-y-6">
                <section>
                  <h2 class="mb-2 text-lg font-semibold text-deep">Langues</h2>
                  <div class="flex flex-wrap gap-2">
                    @for (l of d.languages; track l.code) {
                      <span class="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">{{ l.name }}</span>
                    }
                  </div>
                </section>
                <section>
                  <h2 class="mb-2 text-lg font-semibold text-deep">Adresse</h2>
                  <address class="text-sm not-italic leading-relaxed text-muted-foreground">
                    @if (d.addressLine) { {{ d.addressLine }}<br /> }
                    {{ postalCity() }}
                    @if (d.governorate) { <br />{{ d.governorate }} }
                  </address>
                </section>
              </aside>
            </div>
          </article>

          <p class="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <span class="text-destructive"><app-icon [icon]="Alert" [size]="16" /></span>
            En cas d'urgence vitale, appelez le <a href="tel:190" class="font-semibold text-destructive underline">190 (SAMU)</a>.
          </p>
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
  protected readonly MapPin = LucideMapPin;
  protected readonly Award = LucideAward;
  protected readonly Phone = LucidePhone;
  protected readonly Navigation = LucideNavigation;
  protected readonly Alert = LucideShieldAlert;

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
  protected readonly primary = computed(() => {
    const list = this.doctor()?.specialties ?? [];
    return list.find((s) => s.primary) ?? list[0] ?? null;
  });
  protected readonly place = computed(() => {
    const d = this.doctor();
    return d ? [d.city, d.governorate].filter(Boolean).join(', ') : '';
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
    protected readonly postalCity = computed(() => {
    const d = this.doctor();
    return d ? [d.postalCode, d.city].filter(Boolean).join(' ') : '';
  });
}
import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  LucideAward, LucideChevronLeft, LucideChevronRight, LucideCircleAlert, LucideLanguages, LucideMapPin, LucideNavigation,
  LucideRotateCcw, LucideSearch, LucideSearchX, LucideShieldAlert,
} from '@lucide/angular';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import {
  DirectorySearchParams, LanguageItem, PageResponse, PublicDoctorSummary, SpecialtyItem,
} from '../doctors/models/doctor.models';
import { DirectoryService } from '../doctors/services/directory.service';

type SearchState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; page: PageResponse<PublicDoctorSummary> };

interface Filters {
  q: string; specialty: string; language: string; city: string;
  lat: number | null; lng: number | null; radiusKm: number; sort: '' | 'name' | 'distance'; page: number;
}

const PAGE_SIZE = 9;
const EMPTY: Filters = { q: '', specialty: '', language: '', city: '', lat: null, lng: null, radiusKm: 25, sort: '', page: 0 };

@Component({
  selector: 'app-doctors-page',
  imports: [RouterLink, Icon, RevealDirective, DecimalPipe],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <div appReveal class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-deep sm:text-3xl">Découvrir les médecins</h1>
            <p class="mt-1 text-muted-foreground">Trouvez le bon praticien selon votre besoin, votre langue et votre position.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn" [class]="nearby() ? 'btn-hero' : 'btn-soft'" [disabled]="geoBusy()" (click)="toggleNearby()">
              <app-icon [icon]="Nav" [size]="16" />{{ geoBusy() ? 'Localisation…' : nearby() ? 'Autour de moi · activé' : 'Médecins les plus proches' }}
            </button>
            <button type="button" class="btn rounded-full bg-destructive text-white hover:opacity-90" [disabled]="geoBusy()" (click)="urgence()">
              <app-icon [icon]="Shield" [size]="16" />Urgence
            </button>
          </div>
        </div>

        @if (nearby()) {
          <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/20 bg-soft p-4 text-sm">
            <span class="text-deep">Résultats triés par distance depuis <strong>votre position</strong>.
              <span class="text-muted-foreground">Elle n'est jamais enregistrée.</span></span>
            <label class="ml-auto flex items-center gap-2 text-muted-foreground">Rayon
              <select class="field h-9 py-0" aria-label="Rayon de recherche" (change)="setRadius(+$any($event.target).value)">
                @for (r of radii; track r) { <option [value]="r" [selected]="f().radiusKm === r">{{ r }} km</option> }
              </select>
            </label>
          </div>
        }
        @if (geoError()) {
          <p role="alert" class="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"><app-icon [icon]="Alert" [size]="16" />{{ geoError() }}</p>
        }

        <div class="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
          <div class="relative">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
            <input type="search" aria-label="Rechercher un médecin" class="field w-full rounded-full pl-9" placeholder="Nom du médecin"
              [value]="qText()" (input)="onQ($any($event.target).value)" />
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label class="block text-xs text-muted-foreground">Spécialité
              <select class="field mt-1.5 w-full" (change)="patch({ specialty: $any($event.target).value })">
                <option value="" [selected]="!f().specialty">Toutes les spécialités</option>
                @for (s of specialties(); track s.code) { <option [value]="s.code" [selected]="f().specialty === s.code">{{ s.name }}</option> }
              </select>
            </label>
            <label class="block text-xs text-muted-foreground">Langue
              <select class="field mt-1.5 w-full" (change)="patch({ language: $any($event.target).value })">
                <option value="" [selected]="!f().language">Toutes les langues</option>
                @for (l of languages(); track l.code) { <option [value]="l.code" [selected]="f().language === l.code">{{ l.name }}</option> }
              </select>
            </label>
            <label class="block text-xs text-muted-foreground">Ville
              <input class="field mt-1.5 w-full" placeholder="Ex. : Tunis" [value]="cityText()" (input)="onCity($any($event.target).value)" />
            </label>
            <label class="block text-xs text-muted-foreground">Trier par
              <select class="field mt-1.5 w-full" (change)="patch({ sort: $any($event.target).value })">
                <option value="" [selected]="!f().sort">Pertinence</option>
                <option value="name" [selected]="f().sort === 'name'">Nom</option>
                @if (nearby()) { <option value="distance" [selected]="f().sort === 'distance'">Distance</option> }
              </select>
            </label>
          </div>
          @if (hasFilters()) {
            <button type="button" class="btn btn-ghost text-sm" (click)="reset()"><app-icon [icon]="Reset" [size]="16" />Réinitialiser les filtres</button>
          }
        </div>

        <p class="text-sm text-muted-foreground" aria-live="polite">
          @if (loading()) { Chargement… }
          @else if (page(); as p) { {{ p.totalElements }} médecin{{ p.totalElements > 1 ? 's' : '' }} trouvé{{ p.totalElements > 1 ? 's' : '' }} }
        </p>

        @if (loading()) {
          <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
            @for (i of skeletons; track i) {
              <div class="animate-pulse space-y-4 rounded-2xl border border-border bg-card p-5">
                <div class="flex gap-4"><div class="h-14 w-14 rounded-full bg-muted"></div><div class="flex-1 space-y-2"><div class="h-4 w-2/3 rounded bg-muted"></div><div class="h-3 w-1/2 rounded bg-muted"></div></div></div>
                <div class="h-3 w-3/4 rounded bg-muted"></div>
                <div class="h-10 rounded-xl bg-muted"></div>
              </div>
            }
          </div>
        } @else if (failed()) {
          <div class="flex flex-col items-center rounded-3xl border border-dashed border-destructive/30 bg-card px-6 py-14 text-center">
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive"><app-icon [icon]="Alert" [size]="28" /></span>
            <p class="mt-4 font-semibold text-deep">Impossible de charger l'annuaire</p>
            <p class="mt-1 max-w-sm text-sm text-muted-foreground">Vérifiez que le service médecin est démarré, puis réessayez.</p>
            <button type="button" class="btn btn-hero mt-6" (click)="retry()">Réessayer</button>
          </div>
        } @else if (page(); as p) {
          @if (p.content.length === 0) {
            <div class="flex flex-col items-center rounded-3xl border border-dashed border-primary/30 bg-card px-6 py-14 text-center">
              <span class="grid h-14 w-14 place-items-center rounded-2xl bg-soft text-primary"><app-icon [icon]="SearchX" [size]="28" /></span>
              <p class="mt-4 font-semibold text-deep">Aucun médecin ne correspond à votre recherche</p>
              <p class="mt-1 max-w-sm text-sm text-muted-foreground">Essayez d'élargir vos filtres ou d'augmenter le rayon.</p>
              <button type="button" class="btn btn-hero mt-6" (click)="reset()">Réinitialiser les filtres</button>
            </div>
          } @else {
            <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              @for (d of p.content; track d.id) {
                <article appReveal class="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div class="flex items-start gap-4">
                    <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-white" aria-hidden="true">{{ initials(d) }}</span>
                    <div class="min-w-0 flex-1">
                      <h3 class="truncate font-semibold text-deep">{{ fullName(d) }}</h3>
                      @if (primary(d); as s) {
                        <span class="mt-1 inline-block rounded-full bg-soft px-3 py-0.5 text-xs font-semibold text-primary">{{ s.name }}</span>
                      }
                    </div>
                    @if (d.distanceKm !== null) {
                      <span class="shrink-0 rounded-full bg-deep px-2.5 py-1 text-xs font-semibold text-deep-foreground">{{ d.distanceKm | number: '1.0-1' }} km</span>
                    }
                  </div>
                  <ul class="mt-4 space-y-1.5 text-sm text-muted-foreground">
                    @if (place(d)) { <li class="flex items-center gap-2"><app-icon [icon]="Pin" [size]="16" />{{ place(d) }}</li> }
                    @if (d.yearsExperience !== null) { <li class="flex items-center gap-2"><app-icon [icon]="Award" [size]="16" />{{ d.yearsExperience }} ans d'expérience</li> }
                    @if (d.languages.length) { <li class="flex items-center gap-2"><app-icon [icon]="Lang" [size]="16" />{{ langNames(d) }}</li> }
                  </ul>
                  <div class="mt-auto pt-5">
                    <a class="btn btn-hero w-full" [routerLink]="['/medecins', d.id]">Voir le profil</a>
                  </div>
                </article>
              }
            </div>

            @if (p.totalPages > 1) {
              <nav class="flex items-center justify-center gap-3 pt-2" aria-label="Pagination">
                <button type="button" class="btn btn-soft" [disabled]="p.page === 0" (click)="goTo(p.page - 1)"><app-icon [icon]="Prev" [size]="16" />Précédent</button>
                <span class="text-sm text-muted-foreground">Page {{ p.page + 1 }} / {{ p.totalPages }}</span>
                <button type="button" class="btn btn-soft" [disabled]="p.page + 1 >= p.totalPages" (click)="goTo(p.page + 1)">Suivant<app-icon [icon]="Next" [size]="16" /></button>
              </nav>
            }
          }
        }
      </div>
    </div>
  `,
})
export class DoctorsPage {
  private readonly api = inject(DirectoryService);

  protected readonly Search = LucideSearch;
  protected readonly SearchX = LucideSearchX;
  protected readonly Nav = LucideNavigation;
  protected readonly Shield = LucideShieldAlert;
  protected readonly Alert = LucideCircleAlert;
  protected readonly Reset = LucideRotateCcw;
  protected readonly Prev = LucideChevronLeft;
  protected readonly Next = LucideChevronRight;
  protected readonly Pin = LucideMapPin;
  protected readonly Award = LucideAward;
  protected readonly Lang = LucideLanguages;
  protected readonly radii = [5, 10, 25, 50, 100, 200];
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  protected readonly specialties = toSignal(this.api.specialties().pipe(catchError(() => of([] as SpecialtyItem[]))), { initialValue: [] as SpecialtyItem[] });
  protected readonly languages = toSignal(this.api.languages().pipe(catchError(() => of([] as LanguageItem[]))), { initialValue: [] as LanguageItem[] });

  protected readonly f = signal<Filters>({ ...EMPTY });
  protected readonly qText = signal('');
  protected readonly cityText = signal('');
  private readonly qInput$ = new Subject<string>();
  private readonly cityInput$ = new Subject<string>();
  private readonly reload = signal(0);

  protected readonly nearby = computed(() => this.f().lat !== null);
  protected readonly hasFilters = computed(() => {
    const f = this.f();
    return !!(f.q || f.specialty || f.language || f.city || f.lat !== null || f.sort);
  });

  private readonly params = computed<DirectorySearchParams>(() => {
    const f = this.f();
    return {
      q: f.q || undefined,
      specialty: f.specialty || undefined,
      language: f.language || undefined,
      city: f.city || undefined,
      lat: f.lat ?? undefined,
      lng: f.lng ?? undefined,
      radiusKm: f.lat !== null ? f.radiusKm : undefined,
      sort: f.sort || undefined,
      page: f.page,
      size: PAGE_SIZE,
    };
  });

  private readonly state = toSignal(
    toObservable(computed(() => ({ p: this.params(), r: this.reload() }))).pipe(
      switchMap(({ p }) =>
        this.api.search(p).pipe(
          map((page): SearchState => ({ status: 'ok', page })),
          startWith<SearchState>({ status: 'loading' }),
          catchError(() => of<SearchState>({ status: 'error' })),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as SearchState },
  );
  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly page = computed(() => {
    const s = this.state();
    return s.status === 'ok' ? s.page : null;
  });

  protected readonly geoBusy = signal(false);
  protected readonly geoError = signal<string | null>(null);

  constructor() {
    this.qInput$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed()).subscribe((v) => this.patch({ q: v.trim() }));
    this.cityInput$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed()).subscribe((v) => this.patch({ city: v.trim() }));
  }

  protected onQ(v: string): void { this.qText.set(v); this.qInput$.next(v); }
  protected onCity(v: string): void { this.cityText.set(v); this.cityInput$.next(v); }
  protected patch(p: Partial<Filters>): void { this.f.update((f) => ({ ...f, ...p, page: 'page' in p ? (p.page as number) : 0 })); }
  protected setRadius(r: number): void { this.patch({ radiusKm: r }); }
  protected goTo(n: number): void { this.patch({ page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  protected retry(): void { this.reload.update((n) => n + 1); }

  protected reset(): void {
    this.qText.set(''); this.cityText.set(''); this.geoError.set(null);
    this.f.set({ ...EMPTY });
  }

  protected toggleNearby(): void {
    if (this.nearby()) {
      this.geoError.set(null);
      this.patch({ lat: null, lng: null, sort: this.f().sort === 'distance' ? '' : this.f().sort });
      return;
    }
    this.locate({});
  }

  /** Urgence : généralistes les plus proches, triés par distance. */
  protected urgence(): void {
    this.qText.set(''); this.cityText.set('');
    this.locate({ specialty: 'GENERAL_MEDICINE', language: '', city: '', q: '' }, 200);
  }

  private locate(extra: Partial<Filters>, radiusKm?: number): void {
    this.geoError.set(null);
    if (!('geolocation' in navigator)) {
      this.geoError.set('La géolocalisation n\u2019est pas disponible sur ce navigateur.');
      return;
    }
    this.geoBusy.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geoBusy.set(false);
        this.patch({
          ...extra,
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          radiusKm: radiusKm ?? this.f().radiusKm,
          sort: 'distance',
        });
      },
      () => {
        this.geoBusy.set(false);
        this.geoError.set('Position refusée ou indisponible. Autorisez la localisation dans votre navigateur.');
      },
      { timeout: 10000 },
    );
  }

  protected fullName(d: PublicDoctorSummary): string { return [d.title, d.firstName, d.lastName].filter(Boolean).join(' '); }
  protected initials(d: PublicDoctorSummary): string { return ((d.firstName[0] ?? '') + (d.lastName[0] ?? '')).toUpperCase(); }
  protected primary(d: PublicDoctorSummary) { return d.specialties.find((s) => s.primary) ?? d.specialties[0] ?? null; }
  protected place(d: PublicDoctorSummary): string { return [d.city, d.governorate].filter(Boolean).join(', '); }
  protected langNames(d: PublicDoctorSummary): string { return d.languages.map((l) => l.name).join(', '); }
}
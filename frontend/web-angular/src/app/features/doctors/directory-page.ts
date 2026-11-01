import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideChevronLeft, LucideChevronRight, LucideNavigation, LucideRotateCcw, LucideSearch,LucideShieldAlert} from '@lucide/angular';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Footer } from '../../shared/layout/footer';
import { Header } from '../../shared/layout/header';
import { Icon } from '../../shared/ui/icon';
import { DoctorCard } from './doctor-card';
import { DirectorySearchParams, LanguageItem, PageResponse, PublicDoctorSummary, SpecialtyItem } from './models/doctor.models';
import { DirectoryService } from './services/directory.service';


type SearchState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; page: PageResponse<PublicDoctorSummary> };

const PAGE_SIZE = 12;

@Component({
  selector: 'app-directory-page',
  imports: [Header, Footer, Icon, DoctorCard, RevealDirective],
  templateUrl: './directory-page.html',
})
export class DirectoryPage {
  private readonly api = inject(DirectoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly Search = LucideSearch;
  protected readonly Navigation = LucideNavigation;
  protected readonly Reset = LucideRotateCcw;
  protected readonly Prev = LucideChevronLeft;
  protected readonly Next = LucideChevronRight;
    protected readonly Alert = LucideShieldAlert;
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];
  protected readonly radii = [5, 10, 25, 50, 100,200];

  // Listes pour les menus déroulants
  protected readonly specialties = toSignal(this.api.specialties().pipe(catchError(() => of([] as SpecialtyItem[]))), { initialValue: [] as SpecialtyItem[] });
  protected readonly languages = toSignal(this.api.languages().pipe(catchError(() => of([] as LanguageItem[]))), { initialValue: [] as LanguageItem[] });

  // Les filtres viennent de l'adresse (query params)
  private readonly qp = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });

  protected readonly filters = computed<DirectorySearchParams>(() => {
    const p = this.qp();
    const text = (k: string) => p.get(k)?.trim() || undefined;
    const num = (k: string) => {
      const v = p.get(k);
      if (v === null || v.trim() === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    const sort = p.get('sort');
    return {
      q: text('q'),
      specialty: text('specialty'),
      language: text('language'),
      city: text('city'),
      lat: num('lat'),
      lng: num('lng'),
      radiusKm: num('radiusKm'),
      sort: sort === 'name' || sort === 'distance' ? sort : undefined,
      page: Math.max(0, num('page') ?? 0),
      size: PAGE_SIZE,
    };
  });

  protected readonly nearby = computed(() => this.filters().lat !== undefined);
  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return !!(f.q || f.specialty || f.language || f.city || f.lat !== undefined || f.sort);
  });

  // Textes saisis (gardés localement pour ne pas écraser la frappe)
  protected readonly qText = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  protected readonly cityText = signal(this.route.snapshot.queryParamMap.get('city') ?? '');
  private readonly qInput$ = new Subject<string>();
  private readonly cityInput$ = new Subject<string>();

  // Résultats
  private readonly reload = signal(0);
  private readonly state$ = toObservable(computed(() => ({ f: this.filters(), r: this.reload() }))).pipe(
    switchMap(({ f }) =>
      this.api.search(f).pipe(
        map((page): SearchState => ({ status: 'ok', page })),
        startWith<SearchState>({ status: 'loading' }),
        catchError(() => of<SearchState>({ status: 'error' })),
      ),
    ),
  );
  private readonly state = toSignal(this.state$, { initialValue: { status: 'loading' } as SearchState });

  protected readonly loading = computed(() => this.state().status === 'loading');
  protected readonly failed = computed(() => this.state().status === 'error');
  protected readonly page = computed(() => {
    const s = this.state();
    return s.status === 'ok' ? s.page : null;
  });

  protected readonly geoBusy = signal(false);
  protected readonly geoError = signal<string | null>(null);

  constructor() {
    this.qInput$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((v) => this.setParams({ q: v.trim() || null, page: null }, true));
    this.cityInput$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((v) => this.setParams({ city: v.trim() || null, page: null }, true));
  }

  protected onQ(value: string) { this.qText.set(value); this.qInput$.next(value); }
  protected onCity(value: string) { this.cityText.set(value); this.cityInput$.next(value); }
  protected onSelect(key: 'specialty' | 'language' | 'sort', value: string) { this.setParams({ [key]: value || null, page: null }); }
  protected onRadius(value: string) { this.setParams({ radiusKm: value || null, page: null }); }
  protected goTo(page: number) { this.setParams({ page: page > 0 ? page : null }); }
  protected retry() { this.reload.update((n) => n + 1); }

  protected reset() {
    this.qText.set('');
    this.cityText.set('');
    this.geoError.set(null);
    this.setParams({ q: null, specialty: null, language: null, city: null, lat: null, lng: null, radiusKm: null, sort: null, page: null });
  }

    protected toggleNearby() {
    if (this.nearby()) {
      const current = this.filters();
      this.geoError.set(null);
      this.setParams({ lat: null, lng: null, radiusKm: null, sort: current.sort === 'distance' ? null : (current.sort ?? null), page: null });
      return;
    }
    this.locate({});
  }

  /** Urgence : les médecins généralistes les plus proches, triés par distance. */
  protected urgence() {
    this.locate({ specialty: 'GENERAL_MEDICINE', language: null, city: null, q: null }, 200);
  }

  private locate(extra: Record<string, string | number | null>, radiusKm?: number) {
    this.geoError.set(null);
    if (!('geolocation' in navigator)) {
      this.geoError.set('La géolocalisation n\u2019est pas disponible sur ce navigateur.');
      return;
    }
    const radius = radiusKm ?? this.filters().radiusKm ?? 25;
    this.geoBusy.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geoBusy.set(false);
        if ('q' in extra) this.qText.set('');
        if ('city' in extra) this.cityText.set('');
        this.setParams({
          ...extra,
          lat: pos.coords.latitude.toFixed(5),
          lng: pos.coords.longitude.toFixed(5),
          radiusKm: radius,
          sort: 'distance',
          page: null,
        });
      },
      () => {
        this.geoBusy.set(false);
        this.geoError.set('Position refusée ou indisponible. Autorisez la localisation dans votre navigateur.');
      },
      { timeout: 10000 },
    );
  }

  private setParams(patch: Record<string, string | number | null>, replaceUrl = false) {
    this.router.navigate([], { relativeTo: this.route, queryParams: patch, queryParamsHandling: 'merge', replaceUrl });
  }
}
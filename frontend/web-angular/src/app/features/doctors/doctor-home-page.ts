import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBadgeCheck, LucideFileCheck, LucideLanguages, LucideStethoscope } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import {
  DoctorSpaceService,
  MyProfile,
  Professional,
  VERIFICATION_BADGE,
  VERIFICATION_LABEL,
} from './doctor-space.service';

@Component({
  selector: 'app-doctor-home-page',
  imports: [RouterLink, Icon],
  template: `
    <section class="bg-gradient-soft min-h-full">
      <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        @if (loading()) {
          <p class="text-muted-foreground">Chargement…</p>
        } @else if (error()) {
          <p role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">{{ error() }}</p>
        } @else if (p(); as d) {
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold tracking-tight text-deep">
                Bonjour, <span class="text-gradient">Dr {{ d.lastName }}</span>
              </h1>
              <p class="mt-1 text-muted-foreground">Voici l'état de votre fiche professionnelle.</p>
            </div>
            <span class="rounded-full px-3 py-1.5 text-sm font-semibold" [class]="badge[d.verificationStatus]">
              {{ label[d.verificationStatus] }}
            </span>
          </div>

          @if (d.verificationStatus === 'PENDING') {
            <p class="mt-6 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-deep">
              Votre fiche n'apparaît pas encore dans l'annuaire : un administrateur doit d'abord vérifier votre diplôme.
              <a routerLink="/espace-medecin/diplomes" class="font-semibold text-primary hover:underline">Voir mes diplômes</a>
            </p>
          } @else if (d.verificationStatus === 'REJECTED') {
            <p class="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-deep">
              Votre diplôme a été refusé. Consultez le motif et déposez un nouveau document.
              <a routerLink="/espace-medecin/diplomes" class="font-semibold text-primary hover:underline">Mes diplômes</a>
            </p>
          }

          <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            @for (s of stats(); track s.label) {
              <article class="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <span class="grid h-10 w-10 place-items-center rounded-xl bg-soft text-primary"><app-icon [icon]="s.icon" [size]="20" /></span>
                <p class="mt-4 text-3xl font-extrabold text-deep">{{ s.value }}</p>
                <p class="text-sm text-muted-foreground">{{ s.label }}</p>
              </article>
            }
          </div>

          <div class="mt-6 grid gap-5 lg:grid-cols-2">
            <article class="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 class="text-lg font-semibold text-deep">Complétude du profil</h2>
              <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-gradient-primary transition-all duration-500" [style.width.%]="completion()"></div>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">{{ completion() }} % complété</p>
              <a routerLink="/espace-medecin/profil" class="btn btn-soft mt-4">Compléter mon profil</a>
            </article>

            <article class="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 class="text-lg font-semibold text-deep">Disponibilité</h2>
              <p class="mt-1 text-sm text-muted-foreground">Votre statut professionnel dans l'annuaire.</p>
              <div class="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Statut professionnel">
                @for (o of statusOptions; track o.value) {
                  <button type="button" role="radio" [attr.aria-checked]="d.professionalStatus === o.value"
                    [disabled]="busy() || d.professionalStatus === 'SUSPENDED'" (click)="setStatus(o.value)"
                    class="rounded-full border px-4 py-2 text-sm font-medium transition"
                    [class]="d.professionalStatus === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-deep hover:border-primary/40'">
                    {{ o.label }}
                  </button>
                }
              </div>
              @if (d.professionalStatus === 'SUSPENDED') {
                <p class="mt-3 text-sm font-medium text-destructive">Votre compte est suspendu par un administrateur.</p>
              }
            </article>
          </div>
        }
      </div>
    </section>
  `,
})
export class DoctorHomePage {
  private readonly api = inject(DoctorSpaceService);

  protected readonly badge = VERIFICATION_BADGE;
  protected readonly label = VERIFICATION_LABEL;
  protected readonly statusOptions: { value: Professional; label: string }[] = [
    { value: 'ACTIVE', label: 'Disponible' },
    { value: 'ON_LEAVE', label: 'En congé' },
    { value: 'INACTIVE', label: 'Inactif' },
  ];

  protected readonly p = signal<MyProfile | null>(null);
  protected readonly diplomaCount = signal(0);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly stats = computed(() => {
    const d = this.p();
    if (!d) return [];
    return [
      { label: 'Vérification', value: d.verificationStatus === 'VERIFIED' ? 'OK' : '…', icon: LucideBadgeCheck },
      { label: 'Spécialités', value: d.specialties.length, icon: LucideStethoscope },
      { label: 'Langues parlées', value: d.languages.length, icon: LucideLanguages },
      { label: 'Diplômes déposés', value: this.diplomaCount(), icon: LucideFileCheck },
    ];
  });

  protected readonly completion = computed(() => {
    const d = this.p();
    if (!d) return 0;
    const checks = [d.bio, d.phone, d.addressLine, d.city, d.yearsExperience, d.specialties.length, d.languages.length];
    return Math.round((checks.filter((x) => !!x).length / checks.length) * 100);
  });

  constructor() {
    this.api.me().subscribe({
      next: (d) => {
        this.p.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(
          e?.status === 404
            ? "Votre profil médecin n'existe pas encore."
            : e?.status === 403
              ? "Ce compte n'a pas le rôle médecin."
              : 'Impossible de charger votre profil.',
        );
      },
    });
    this.api.diplomas().subscribe({ next: (l) => this.diplomaCount.set(l.length), error: () => {} });
  }

  protected setStatus(s: Professional) {
    this.busy.set(true);
    this.api.setStatus(s).subscribe({
      next: (d) => {
        this.p.set(d);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Changement de statut refusé.');
      },
    });
  }
}
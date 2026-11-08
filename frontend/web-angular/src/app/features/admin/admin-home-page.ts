import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideBadgeCheck, LucideCircleX, LucideClock, LucideFlag } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import { initials } from '../../core/mock/format';
import { avatarGradient } from '../../core/mock/palette';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { StatCard } from '../../shared/ui/stat-card';
import { AdminDoctorSummary, AdminService } from './admin.service';
import {DecimalPipe} from '@angular/common';
import { AdminDemoStore } from './admin-demo.store';  

@Component({
  selector: 'app-admin-home-page',
  imports: [DecimalPipe, RouterLink, Icon, Panel, StatCard, RevealDirective],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <section appReveal class="relative overflow-hidden rounded-3xl bg-deep p-6 text-deep-foreground shadow-soft sm:p-8">
          <div class="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-tertiary/25 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary/30 blur-3xl"></div>
          <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-60" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden="true">
            <path class="ecg-line" pathLength="1" fill="none" stroke="#14b8a6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              d="M0 42 H110 L122 38 L134 42 H190 L202 34 L214 42 H250 L262 44 L274 6 L290 74 L304 30 L316 42 H380 L392 37 L404 42 H470 L482 40 L494 42 H600" />
          </svg>
          <div class="relative">
            <p class="text-sm font-medium text-deep-foreground/70">{{ today }}</p>
            <h1 class="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{{ greeting }}, <span class="text-tertiary">administrateur</span></h1>
            <p class="mt-3 max-w-xl text-deep-foreground/70">{{ summary() }}</p>
            <div class="mt-6">
              <a routerLink="/admin/medecins" class="btn btn-hero btn-lg">Vérifier les médecins <app-icon [icon]="Arrow" [size]="16" /></a>
            </div>
          </div>
        </section>

        @if (failed()) {
          <div role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-card p-5 shadow-soft">
            <p class="text-sm text-deep">Impossible de charger les indicateurs. Vérifiez que le service médecins est démarré et que vous êtes connecté en administrateur.</p>
            <button type="button" class="btn btn-soft" (click)="load()">Réessayer</button>
          </div>
        }

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <app-stat-card [icon]="Clock" label="En attente de vérification" [value]="loading() ? '…' : counts().pending" hint="médecins" to="/admin/medecins" tone="warning" />
          <app-stat-card [icon]="Verified" label="Médecins vérifiés" [value]="loading() ? '…' : counts().verified" hint="visibles" to="/admin/medecins" tone="success" />
          <app-stat-card [icon]="Rejected" label="Profils refusés" [value]="loading() ? '…' : counts().rejected" hint="médecins" to="/admin/medecins" tone="primary" />
          <app-stat-card [icon]="Flag" label="Avis à modérer" [value]="demo.flaggedCount()" hint="signalés" to="/admin/avis" tone="info" />
        </div>

        <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <app-panel title="À vérifier en priorité">
            <a panelAction routerLink="/admin/medecins" class="text-sm font-semibold text-primary hover:underline">Voir tout</a>
            @if (loading()) {
              <div class="space-y-3">
                @for (i of [1, 2, 3]; track i) { <div class="h-16 animate-pulse rounded-xl bg-muted"></div> }
              </div>
            } @else if (queue().length) {
              <ul class="space-y-3">
                @for (d of queue(); track d.id) {
                  <li class="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors duration-200 hover:bg-soft/60 sm:gap-4">
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(d.firstName + d.lastName)">{{ ini(d.firstName + ' ' + d.lastName) }}</span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-semibold text-deep">{{ d.firstName }} {{ d.lastName }}</p>
                      <p class="truncate text-sm text-muted-foreground">N° d'ordre {{ d.licenseNumber }}{{ d.city ? ' · ' + d.city : '' }}</p>
                    </div>
                    <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      [class]="late(d.createdAt) ? 'bg-destructive/15 text-destructive' : 'bg-warning/20 text-accent-foreground'">{{ waiting(d.createdAt) }}</span>
                  </li>
                }
              </ul>
            } @else {
              <div class="rounded-xl bg-soft/60 p-6 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-card text-success"><app-icon [icon]="Verified" [size]="24" /></span>
                <p class="mt-3 font-semibold text-deep">Aucune vérification en attente</p>
                <p class="mt-1 text-sm text-muted-foreground">Tous les profils ont été traités.</p>
              </div>
            }
          </app-panel>

          <app-panel title="Répartition des profils">
            @if (loading()) {
              <div class="h-24 animate-pulse rounded-xl bg-muted"></div>
            } @else if (total()) {
              <div class="flex h-3 overflow-hidden rounded-full bg-muted" role="img" [attr.aria-label]="'Répartition : ' + counts().verified + ' vérifiés, ' + counts().pending + ' en attente, ' + counts().rejected + ' refusés'">
                @for (b of bars(); track b.label) {
                  <span class="h-full transition-all duration-500" [class]="b.cls" [style.width.%]="b.pct"></span>
                }
              </div>
              <ul class="mt-5 space-y-3">
                @for (b of bars(); track b.label) {
                  <li class="flex items-center justify-between gap-3 text-sm">
                    <span class="flex items-center gap-2 text-muted-foreground"><span class="h-2.5 w-2.5 rounded-full" [class]="b.cls"></span>{{ b.label }}</span>
                    <span class="font-semibold text-deep">{{ b.n }} <span class="font-normal text-muted-foreground">({{ b.pct | number: '1.0-0' }} %)</span></span>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-sm text-muted-foreground">Aucun profil médecin pour le moment.</p>
            }
          </app-panel>
        </div>

        <p class="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          Un médecin n'apparaît dans l'annuaire public qu'une fois son diplôme <span class="font-semibold text-deep">vérifié</span> et son statut <span class="font-semibold text-deep">actif</span>.
        </p>
      </div>
    </div>
  `,
})
export class AdminHomePage {
  private readonly api = inject(AdminService);

  protected readonly Arrow = LucideArrowRight;
  protected readonly Clock = LucideClock;
  protected readonly Verified = LucideBadgeCheck;
  protected readonly Rejected = LucideCircleX;
  protected readonly ini = initials;
  protected readonly grad = avatarGradient;

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly counts = signal({ pending: 0, verified: 0, rejected: 0 });
  protected readonly queue = signal<AdminDoctorSummary[]>([]);

  protected readonly today = (() => {
    const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();
  protected readonly greeting = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';

  protected readonly total = computed(() => this.counts().pending + this.counts().verified + this.counts().rejected);
  protected readonly summary = computed(() => {
    if (this.loading()) return 'Chargement des indicateurs…';
    if (this.failed()) return 'Les indicateurs ne sont pas disponibles pour le moment.';
    const n = this.counts().pending;
    return n > 0
      ? `${n} médecin${n > 1 ? 's attendent' : ' attend'} votre vérification.`
      : 'Aucune vérification en attente. Tout est à jour.';
  });
  protected readonly bars = computed(() => {
    const c = this.counts();
    const t = this.total() || 1;
    return [
      { label: 'Vérifiés', n: c.verified, pct: (c.verified * 100) / t, cls: 'bg-success' },
      { label: 'En attente', n: c.pending, pct: (c.pending * 100) / t, cls: 'bg-amber-400' },
      { label: 'Refusés', n: c.rejected, pct: (c.rejected * 100) / t, cls: 'bg-destructive' },
    ];
  });

  constructor() {
    this.load();
  }

  protected load() {
    this.loading.set(true);
    this.failed.set(false);
    forkJoin({
      p: this.api.list('PENDING'),
      v: this.api.list('VERIFIED'),
      r: this.api.list('REJECTED'),
    }).subscribe({
      next: ({ p, v, r }) => {
        this.counts.set({ pending: p.totalElements, verified: v.totalElements, rejected: r.totalElements });
        this.queue.set([...p.content].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 5));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
   protected readonly demo = inject(AdminDemoStore);
   protected readonly Flag = LucideFlag;

  private days(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  }
  protected late(iso: string): boolean {
    return this.days(iso) >= 3;
  }
  protected waiting(iso: string): string {
    const d = this.days(iso);
    return d <= 0 ? "Reçu aujourd'hui" : d === 1 ? 'Depuis 1 jour' : `Depuis ${d} jours`;
  }
}
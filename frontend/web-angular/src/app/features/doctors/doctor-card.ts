import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAward, LucideLanguages, LucideMapPin } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { PublicDoctorSummary } from './models/doctor.models';
import { switchMap } from 'rxjs';
import { ReviewsService } from '../reviews/reviews.service';
import { StarRating } from '../reviews/star-rating';
@Component({
  selector: 'app-doctor-card',
  imports: [RouterLink, Icon, DecimalPipe, StarRating],
  template: `
    <article class="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div class="flex items-start gap-4">
        <div class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground" aria-hidden="true">
          {{ initials() }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-semibold text-deep">{{ fullName() }}</h3>
          @if (primary(); as s) {
            <span class="mt-1 inline-block rounded-full bg-soft px-3 py-0.5 text-xs font-semibold text-primary">{{ s.name }}</span>
          }
        </div>
        @if (doctor().distanceKm !== null) {
          <span class="shrink-0 rounded-full bg-deep px-2.5 py-1 text-xs font-semibold text-deep-foreground">{{ doctor().distanceKm | number: '1.0-1' }} km</span>
        }
      </div>
      <div class="mt-3 flex items-center gap-2 text-sm">
        @if (rating(); as r) {
          @if (r.count > 0) {
            <app-stars [value]="r.average" />
            <span class="font-semibold text-deep">{{ r.average | number: '1.1-1' }}</span>
            <span class="text-muted-foreground">({{ r.count }} avis)</span>
          } @else {
            <span class="text-muted-foreground">Pas encore d'avis</span>
          }
        }
      </div>
      <ul class="mt-4 space-y-2 text-sm text-muted-foreground">
        @if (place()) {
          <li class="flex items-center gap-2"><app-icon [icon]="MapPin" [size]="16" />{{ place() }}</li>
        }
        @if (doctor().yearsExperience !== null) {
          <li class="flex items-center gap-2"><app-icon [icon]="Award" [size]="16" />{{ doctor().yearsExperience }} ans d'expérience</li>
        }
        @if (doctor().languages.length) {
          <li class="flex items-center gap-2"><app-icon [icon]="Languages" [size]="16" />{{ languageNames() }}</li>
        }
      </ul>

      @if (others().length) {
        <div class="mt-3 flex flex-wrap gap-1.5">
          @for (s of others(); track s.code) {
            <span class="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{{ s.name }}</span>
          }
        </div>
      }

      <a [routerLink]="['/medecins', doctor().id]" class="btn btn-soft mt-auto w-full">Voir la fiche</a>
    </article>
  `,
})
export class DoctorCard {
  readonly doctor = input.required<PublicDoctorSummary>();

  private readonly reviews = inject(ReviewsService);
  protected readonly rating = toSignal(
    toObservable(this.doctor).pipe(switchMap((d) => this.reviews.getRating(d.id))),
    { initialValue: null },
  );

  protected readonly MapPin = LucideMapPin;
  protected readonly Award = LucideAward;
  protected readonly Languages = LucideLanguages;

  protected readonly fullName = computed(() => {
    const d = this.doctor();
    return [d.title, d.firstName, d.lastName].filter(Boolean).join(' ');
  });
  protected readonly initials = computed(() => {
    const d = this.doctor();
    return ((d.firstName[0] ?? '') + (d.lastName[0] ?? '')).toUpperCase();
  });
  protected readonly primary = computed(() => {
    const list = this.doctor().specialties;
    return list.find((s) => s.primary) ?? list[0] ?? null;
  });
  protected readonly others = computed(() => {
    const p = this.primary();
    return this.doctor().specialties.filter((s) => s.code !== p?.code);
  });
  protected readonly place = computed(() => {
    const d = this.doctor();
    return [d.city, d.governorate].filter(Boolean).join(', ');
  });
  protected readonly languageNames = computed(() => this.doctor().languages.map((l) => l.name).join(', '));
}
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoctorOnboardingService, RefItem } from '../auth/doctor-onboarding.service';
import { DoctorSpaceService, MyProfile } from './doctor-space.service';

const orNull = (v: string) => v.trim() || null;

@Component({
  selector: 'app-my-profile-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="bg-gradient-soft min-h-full">
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 class="text-3xl font-bold tracking-tight text-deep">Mon profil professionnel</h1>
        <p class="mt-1 text-muted-foreground">Ces informations sont visibles sur votre fiche dans l'annuaire.</p>

        @if (notice()) {
          <p role="status" class="mt-5 rounded-xl border border-success/40 bg-success/10 p-3 text-sm font-medium text-deep">{{ notice() }}</p>
        }
        @if (error()) {
          <p role="alert" class="mt-5 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ error() }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="saveInfo()" class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft" novalidate>
          <h2 class="text-lg font-semibold text-deep">Informations</h2>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label for="title" class="mb-1.5 block text-sm font-medium text-deep">Titre</label>
              <input id="title" class="field h-11" placeholder="Dr, Pr…" formControlName="title" />
            </div>
            <div>
              <label for="licenseNumber" class="mb-1.5 block text-sm font-medium text-deep">Numéro d'ordre</label>
              <input id="licenseNumber" class="field h-11" formControlName="licenseNumber" />
            </div>
            <div>
              <label for="firstName" class="mb-1.5 block text-sm font-medium text-deep">Prénom</label>
              <input id="firstName" class="field h-11" formControlName="firstName" />
            </div>
            <div>
              <label for="lastName" class="mb-1.5 block text-sm font-medium text-deep">Nom</label>
              <input id="lastName" class="field h-11" formControlName="lastName" />
            </div>
            <div>
              <label for="yearsExperience" class="mb-1.5 block text-sm font-medium text-deep">Années d'expérience</label>
              <input id="yearsExperience" type="number" min="0" max="70" class="field h-11" formControlName="yearsExperience" />
            </div>
            <div>
              <label for="phone" class="mb-1.5 block text-sm font-medium text-deep">Téléphone</label>
              <input id="phone" type="tel" class="field h-11" formControlName="phone" />
              @if (form.controls.phone.invalid) { <p class="mt-1 text-xs font-medium text-destructive">Numéro de téléphone invalide.</p> }
            </div>
            <div class="sm:col-span-2">
              <label for="addressLine" class="mb-1.5 block text-sm font-medium text-deep">Adresse du cabinet</label>
              <input id="addressLine" class="field h-11" formControlName="addressLine" />
            </div>
            <div>
              <label for="city" class="mb-1.5 block text-sm font-medium text-deep">Ville</label>
              <input id="city" class="field h-11" formControlName="city" />
            </div>
            <div>
              <label for="governorate" class="mb-1.5 block text-sm font-medium text-deep">Gouvernorat</label>
              <input id="governorate" class="field h-11" formControlName="governorate" />
            </div>
            <div>
              <label for="postalCode" class="mb-1.5 block text-sm font-medium text-deep">Code postal</label>
              <input id="postalCode" class="field h-11" formControlName="postalCode" />
            </div>
            <div class="sm:col-span-2">
              <label for="bio" class="mb-1.5 block text-sm font-medium text-deep">Présentation</label>
              <textarea id="bio" rows="5" maxlength="2000" class="field py-2" formControlName="bio"></textarea>
            </div>
          </div>
          <button type="submit" class="btn btn-hero mt-5" [disabled]="busy()">Enregistrer les informations</button>
        </form>

        <div class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 class="text-lg font-semibold text-deep">Spécialités</h2>
          <p class="text-sm text-muted-foreground">Jusqu'à 5 spécialités, dont une principale.</p>
          <div class="mt-4 flex flex-wrap gap-2">
            @for (s of specialties(); track s.code) {
              <button type="button" role="checkbox" [attr.aria-checked]="selSpec().includes(s.code)" (click)="toggleSpec(s.code)"
                class="rounded-full border px-3 py-1.5 text-sm font-medium transition"
                [class]="selSpec().includes(s.code) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-deep hover:border-primary/40'">
                {{ s.name }}
              </button>
            }
          </div>
          @if (selSpec().length) {
            <label for="primary" class="mb-1.5 mt-4 block text-sm font-medium text-deep">Spécialité principale</label>
            <select id="primary" class="field h-11 max-w-xs" [value]="primary()" (change)="primary.set($any($event.target).value)">
              @for (c of selSpec(); track c) { <option [value]="c" [selected]="c === primary()">{{ nameOf(c) }}</option> }
            </select>
          }
          <button type="button" class="btn btn-hero mt-5" [disabled]="busy() || !selSpec().length" (click)="saveSpecialties()">Enregistrer les spécialités</button>
        </div>

        <div class="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 class="text-lg font-semibold text-deep">Langues parlées</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            @for (l of languages(); track l.code) {
              <button type="button" role="checkbox" [attr.aria-checked]="selLang().includes(l.code)" (click)="toggleLang(l.code)"
                class="rounded-full border px-3 py-1.5 text-sm font-medium transition"
                [class]="selLang().includes(l.code) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-deep hover:border-primary/40'">
                {{ l.name }}
              </button>
            }
          </div>
          <button type="button" class="btn btn-hero mt-5" [disabled]="busy() || !selLang().length" (click)="saveLanguages()">Enregistrer les langues</button>
        </div>
      </div>
    </section>
  `,
})
export class MyProfilePage {
  private readonly api = inject(DoctorSpaceService);
  private readonly catalog = inject(DoctorOnboardingService);

  protected readonly specialties = signal<RefItem[]>([]);
  protected readonly languages = signal<RefItem[]>([]);
  protected readonly selSpec = signal<string[]>([]);
  protected readonly primary = signal('');
  protected readonly selLang = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  private current: MyProfile | null = null;

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    licenseNumber: ['', Validators.required],
    yearsExperience: [''],
    phone: ['', Validators.pattern(/^[+0-9 ()-]*$/)],
    addressLine: [''],
    city: [''],
    governorate: [''],
    postalCode: [''],
    bio: [''],
  });

  constructor() {
    this.catalog.specialties().subscribe({ next: (s) => this.specialties.set(s), error: () => {} });
    this.catalog.languages().subscribe({ next: (l) => this.languages.set(l), error: () => {} });
    this.api.me().subscribe({
      next: (d) => this.apply(d),
      error: () => this.error.set('Impossible de charger votre profil.'),
    });
  }

  private apply(d: MyProfile) {
    this.current = d;
    this.form.patchValue({
      title: d.title ?? '',
      firstName: d.firstName,
      lastName: d.lastName,
      licenseNumber: d.licenseNumber,
      yearsExperience: d.yearsExperience?.toString() ?? '',
      phone: d.phone ?? '',
      addressLine: d.addressLine ?? '',
      city: d.city ?? '',
      governorate: d.governorate ?? '',
      postalCode: d.postalCode ?? '',
      bio: d.bio ?? '',
    });
    this.selSpec.set(d.specialties.map((s) => s.code));
    this.primary.set(d.specialties.find((s) => s.primary)?.code ?? d.specialties[0]?.code ?? '');
    this.selLang.set(d.languages.map((l) => l.code));
  }

  protected nameOf(code: string) {
    return this.specialties().find((s) => s.code === code)?.name ?? code;
  }

  protected toggleSpec(code: string) {
    this.selSpec.update((l) => {
      if (l.includes(code)) return l.filter((x) => x !== code);
      return l.length >= 5 ? l : [...l, code];
    });
    if (!this.selSpec().includes(this.primary())) this.primary.set(this.selSpec()[0] ?? '');
  }

  protected toggleLang(code: string) {
    this.selLang.update((l) => (l.includes(code) ? l.filter((x) => x !== code) : [...l, code]));
  }

  protected saveInfo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.run(
      this.api.update({
        title: orNull(v.title),
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        licenseNumber: v.licenseNumber.trim(),
        yearsExperience: v.yearsExperience.trim() ? Number(v.yearsExperience) : null,
        phone: orNull(v.phone),
        addressLine: orNull(v.addressLine),
        city: orNull(v.city),
        governorate: orNull(v.governorate),
        postalCode: orNull(v.postalCode),
        bio: orNull(v.bio),
        latitude: this.current?.latitude ?? null,
        longitude: this.current?.longitude ?? null,
      }),
      'Informations enregistrées.',
    );
  }

  protected saveSpecialties() {
    this.run(this.api.setSpecialties(this.selSpec(), this.primary()), 'Spécialités enregistrées.');
  }

  protected saveLanguages() {
    this.run(this.api.setLanguages(this.selLang()), 'Langues enregistrées.');
  }

  private run(call: ReturnType<DoctorSpaceService['me']>, ok: string) {
    this.busy.set(true);
    this.notice.set(null);
    this.error.set(null);
    call.subscribe({
      next: (d) => {
        this.busy.set(false);
        this.apply(d);
        this.notice.set(ok);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.detail ?? 'Enregistrement refusé par le serveur.');
      },
    });
  }
}
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAward, LucideBriefcaseMedical, LucideBuilding2, LucideCamera,
  LucideCheck, LucideGlobe2, LucideMapPin, LucidePhone, LucideSave,
  LucideShieldCheck, LucideStar, LucideUserRound,
} from '@lucide/angular';
import { DoctorOnboardingService, RefItem } from '../auth/doctor-onboarding.service';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { DoctorSpaceService, MyProfile, Verification, Professional } from './doctor-space.service';

const orNull = (v: string) => v.trim() || null;

const PROF_LABEL: Record<Professional, string> = {
  ACTIVE: 'En activite',
  ON_LEAVE: 'En conge',
  INACTIVE: 'Inactif',
  SUSPENDED: 'Suspendu',
};
const PROF_COLOR: Record<Professional, string> = {
  ACTIVE: 'bg-success/15 text-success border border-success/30',
  ON_LEAVE: 'bg-warning/15 text-warning border border-warning/30',
  INACTIVE: 'bg-muted/40 text-muted-foreground border border-border',
  SUSPENDED: 'bg-destructive/10 text-destructive border border-destructive/30',
};
const VERIF_LABEL: Record<Verification, string> = {
  PENDING: 'En attente de verification',
  VERIFIED: 'Profil verifie',
  REJECTED: 'Verification refusee',
};
const VERIF_COLOR: Record<Verification, string> = {
  PENDING: 'bg-warning/15 text-warning border border-warning/30',
  VERIFIED: 'bg-success/15 text-success border border-success/30',
  REJECTED: 'bg-destructive/10 text-destructive border border-destructive/30',
};

@Component({
  selector: 'app-my-profile-page',
  imports: [ReactiveFormsModule, Icon, PageHeader],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-4xl space-y-6">

        <!-- En-tete -->
        <app-page-header
          title="Mon profil professionnel"
          subtitle="Ces informations sont visibles sur votre fiche dans l'annuaire."
          eyebrow="Espace medecin"
          [icon]="IconUser"
        />

        <!-- Notifications -->
        @if (notice()) {
          <div role="status" class="flex items-center gap-3 rounded-2xl border border-success/40 bg-success/10 px-5 py-4 text-sm font-medium text-deep">
            <app-icon [icon]="IconCheck" [size]="18" class="shrink-0 text-success" />
            {{ notice() }}
          </div>
        }
        @if (error()) {
          <div role="alert" class="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive">
            {{ error() }}
          </div>
        }

        <!-- ===== CARTE IDENTITE + PHOTO ===== -->
        <div class="rounded-2xl border border-border bg-card shadow-soft">
          <div class="border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <app-icon [icon]="IconUser" [size]="18" class="text-primary" />
              </span>
              <div>
                <h2 class="font-semibold text-deep">Photo de profil</h2>
                <p class="text-xs text-muted-foreground">Visible par les patients dans l'annuaire</p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div class="flex flex-wrap items-center gap-6">

              <!-- Avatar / Photo -->
              <div class="relative shrink-0">
                @if (avatarUrl()) {
                  <img
                    [src]="avatarUrl()"
                    alt="Photo de profil"
                    class="h-24 w-24 rounded-2xl object-cover shadow-soft ring-2 ring-border"
                  />
                } @else {
                  <span class="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-primary text-3xl font-bold text-primary-foreground shadow-soft">
                    {{ initials() }}
                  </span>
                }

                <!-- Bouton camera overlay -->
                <label for="avatar-upload"
                  class="absolute -bottom-2 -right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90"
                  title="Changer la photo">
                  <app-icon [icon]="IconCamera" [size]="14" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  class="sr-only"
                  (change)="onAvatar($event)"
                />
              </div>

              <!-- Infos + actions -->
              <div class="flex-1 min-w-0">
                <p class="text-lg font-bold text-deep">{{ displayName() || 'Votre nom' }}</p>
                @if (profile()) {
                  <p class="mt-0.5 text-sm text-muted-foreground">N{{ '\u00b0' }} {{ profile()!.licenseNumber }}</p>
                }

                <div class="mt-3 flex flex-wrap gap-2">
                  @if (profile()) {
                    <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" [class]="verifColor()">
                      <app-icon [icon]="IconShield" [size]="12" />{{ verifLabel() }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" [class]="profColor()">
                      <span class="h-1.5 w-1.5 rounded-full bg-current"></span>{{ profLabel() }}
                    </span>
                  }
                </div>

                <div class="mt-4 flex flex-wrap gap-2">
                  <label for="avatar-upload" class="btn btn-soft cursor-pointer gap-2 text-sm">
                    <app-icon [icon]="IconCamera" [size]="15" />
                    {{ avatarUrl() ? 'Changer la photo' : 'Ajouter une photo' }}
                  </label>
                  @if (avatarUrl()) {
                    <button type="button" class="btn btn-soft gap-2 text-sm text-destructive hover:border-destructive/40 hover:bg-destructive/5" (click)="removeAvatar()">
                      Supprimer la photo
                    </button>
                  }
                </div>

                @if (avatarError()) {
                  <p class="mt-2 text-xs font-medium text-destructive">{{ avatarError() }}</p>
                }
                <p class="mt-1.5 text-xs text-muted-foreground">JPG, PNG ou WebP · 5 Mo maximum · Recommande : 400x400 px</p>
              </div>

            </div>
          </div>
        </div>

        <!-- Section : Informations professionnelles -->
        <form [formGroup]="form" (ngSubmit)="saveInfo()" novalidate>
          <div class="rounded-2xl border border-border bg-card shadow-soft">
            <div class="border-b border-border px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <app-icon [icon]="IconBriefcase" [size]="18" class="text-primary" />
                </span>
                <div>
                  <h2 class="font-semibold text-deep">Informations professionnelles</h2>
                  <p class="text-xs text-muted-foreground">Identite et coordonnees du cabinet</p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="title" class="mb-1.5 block text-sm font-medium text-deep">
                    Titre <span class="text-xs font-normal text-muted-foreground">(optionnel)</span>
                  </label>
                  <input id="title" class="field h-11" placeholder="Dr, Pr..." formControlName="title" />
                </div>
                <div>
                  <label for="licenseNumber" class="mb-1.5 block text-sm font-medium text-deep">
                    Numero d'ordre <span class="text-destructive">*</span>
                  </label>
                  <input id="licenseNumber" class="field h-11" placeholder="12345" formControlName="licenseNumber" />
                  @if (form.controls.licenseNumber.touched && form.controls.licenseNumber.invalid) {
                    <p class="mt-1 text-xs font-medium text-destructive">Champ requis.</p>
                  }
                </div>
                <div>
                  <label for="firstName" class="mb-1.5 block text-sm font-medium text-deep">
                    Prenom <span class="text-destructive">*</span>
                  </label>
                  <input id="firstName" class="field h-11" formControlName="firstName" />
                  @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
                    <p class="mt-1 text-xs font-medium text-destructive">Champ requis.</p>
                  }
                </div>
                <div>
                  <label for="lastName" class="mb-1.5 block text-sm font-medium text-deep">
                    Nom <span class="text-destructive">*</span>
                  </label>
                  <input id="lastName" class="field h-11" formControlName="lastName" />
                  @if (form.controls.lastName.touched && form.controls.lastName.invalid) {
                    <p class="mt-1 text-xs font-medium text-destructive">Champ requis.</p>
                  }
                </div>
                <div>
                  <label for="yearsExperience" class="mb-1.5 block text-sm font-medium text-deep">
                    Annees d'experience
                  </label>
                  <div class="relative">
                    <input id="yearsExperience" type="number" min="0" max="70" class="field h-11 pr-14" formControlName="yearsExperience" />
                    <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ans</span>
                  </div>
                </div>
                <div>
                  <label for="phone" class="mb-1.5 block text-sm font-medium text-deep">Telephone</label>
                  <div class="relative">
                    <app-icon [icon]="IconPhone" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input id="phone" type="tel" class="field h-11 pl-9" placeholder="+216 XX XXX XXX" formControlName="phone" />
                  </div>
                  @if (form.controls.phone.invalid && form.controls.phone.touched) {
                    <p class="mt-1 text-xs font-medium text-destructive">Numero de telephone invalide.</p>
                  }
                </div>
              </div>

              <!-- Adresse -->
              <div class="mt-5 rounded-xl border border-border/60 bg-soft/40 p-4">
                <div class="mb-4 flex items-center gap-2 text-sm font-semibold text-deep">
                  <app-icon [icon]="IconMapPin" [size]="16" class="text-primary" />
                  Adresse du cabinet
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label for="addressLine" class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Rue / Adresse</label>
                    <input id="addressLine" class="field h-10 text-sm" placeholder="12 rue de la Republique" formControlName="addressLine" />
                  </div>
                  <div>
                    <label for="city" class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Ville</label>
                    <input id="city" class="field h-10 text-sm" placeholder="Tunis" formControlName="city" />
                  </div>
                  <div>
                    <label for="governorate" class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Gouvernorat</label>
                    <input id="governorate" class="field h-10 text-sm" formControlName="governorate" />
                  </div>
                  <div>
                    <label for="postalCode" class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Code postal</label>
                    <input id="postalCode" class="field h-10 text-sm" placeholder="1000" formControlName="postalCode" />
                  </div>
                </div>
              </div>

              <!-- Bio -->
              <div class="mt-5">
                <label for="bio" class="mb-1.5 block text-sm font-medium text-deep">
                  Presentation
                  <span class="ml-1 text-xs font-normal text-muted-foreground">— visible par les patients</span>
                </label>
                <textarea id="bio" rows="5" maxlength="2000" class="field py-3 text-sm leading-relaxed"
                  placeholder="Decrivez votre parcours, votre approche et vos domaines d'expertise..."
                  formControlName="bio"></textarea>
                <p class="mt-1 text-right text-xs text-muted-foreground">{{ form.controls.bio.value.length }}&nbsp;/ 2000</p>
              </div>

              <div class="mt-6 flex items-center justify-between border-t border-border pt-5">
                <p class="text-xs text-muted-foreground"><span class="text-destructive">*</span> Champs obligatoires</p>
                <button type="submit" class="btn btn-hero gap-2" [disabled]="busy()">
                  <app-icon [icon]="IconSave" [size]="16" />
                  {{ busy() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </div>
          </div>
        </form>

        <!-- Section : Specialites -->
        <div class="rounded-2xl border border-border bg-card shadow-soft">
          <div class="border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <app-icon [icon]="IconStar" [size]="18" class="text-primary" />
              </span>
              <div>
                <h2 class="font-semibold text-deep">Specialites medicales</h2>
                <p class="text-xs text-muted-foreground">Jusqu'a 5 specialites, dont une principale</p>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="flex flex-wrap gap-2">
              @for (s of specialties(); track s.code) {
                <button type="button" role="checkbox" [attr.aria-checked]="selSpec().includes(s.code)" (click)="toggleSpec(s.code)"
                  class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150"
                  [class]="selSpec().includes(s.code)
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-soft/50 text-deep hover:border-primary/50 hover:bg-primary/5'">
                  {{ s.name }}
                </button>
              }
            </div>

            @if (selSpec().length) {
              <div class="mt-5 rounded-xl border border-border/60 bg-soft/40 p-4">
                <label for="primary" class="mb-2 block text-sm font-medium text-deep">
                  Specialite principale
                  <span class="ml-1 text-xs text-muted-foreground">— affichee en priorite</span>
                </label>
                <select id="primary" class="field h-11 max-w-xs" [value]="primary()" (change)="primary.set($any($event.target).value)">
                  @for (c of selSpec(); track c) {
                    <option [value]="c" [selected]="c === primary()">{{ nameOf(c) }}</option>
                  }
                </select>
              </div>
            }

            <div class="mt-5 flex justify-end border-t border-border pt-5">
              <button type="button" class="btn btn-hero gap-2" [disabled]="busy() || !selSpec().length" (click)="saveSpecialties()">
                <app-icon [icon]="IconSave" [size]="16" />Enregistrer les specialites
              </button>
            </div>
          </div>
        </div>

        <!-- Section : Langues -->
        <div class="rounded-2xl border border-border bg-card shadow-soft">
          <div class="border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <app-icon [icon]="IconGlobe" [size]="18" class="text-primary" />
              </span>
              <div>
                <h2 class="font-semibold text-deep">Langues parlees</h2>
                <p class="text-xs text-muted-foreground">Langues dans lesquelles vous consultez</p>
              </div>
            </div>
          </div>
          <div class="p-6">
            <div class="flex flex-wrap gap-2">
              @for (l of languages(); track l.code) {
                <button type="button" role="checkbox" [attr.aria-checked]="selLang().includes(l.code)" (click)="toggleLang(l.code)"
                  class="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150"
                  [class]="selLang().includes(l.code)
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-soft/50 text-deep hover:border-primary/50 hover:bg-primary/5'">
                  {{ l.name }}
                </button>
              }
            </div>
            <div class="mt-5 flex justify-end border-t border-border pt-5">
              <button type="button" class="btn btn-hero gap-2" [disabled]="busy() || !selLang().length" (click)="saveLanguages()">
                <app-icon [icon]="IconSave" [size]="16" />Enregistrer les langues
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class MyProfilePage {
  private readonly api = inject(DoctorSpaceService);
  private readonly catalog = inject(DoctorOnboardingService);

  protected readonly IconUser = LucideUserRound;
  protected readonly IconBriefcase = LucideBriefcaseMedical;
  protected readonly IconMapPin = LucideMapPin;
  protected readonly IconPhone = LucidePhone;
  protected readonly IconStar = LucideStar;
  protected readonly IconGlobe = LucideGlobe2;
  protected readonly IconShield = LucideShieldCheck;
  protected readonly IconSave = LucideSave;
  protected readonly IconCheck = LucideCheck;
  protected readonly IconAward = LucideAward;
  protected readonly IconBuilding = LucideBuilding2;
  protected readonly IconCamera = LucideCamera;

  protected readonly specialties = signal<RefItem[]>([]);
  protected readonly languages = signal<RefItem[]>([]);
  protected readonly selSpec = signal<string[]>([]);
  protected readonly primary = signal('');
  protected readonly selLang = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly profile = signal<MyProfile | null>(null);

  // Photo de profil (locale uniquement pour le mock)
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);

  private current: MyProfile | null = null;

  protected displayName() {
    const p = this.profile();
    if (!p) return '';
    return [p.title, p.firstName, p.lastName].filter(Boolean).join(' ');
  }

  protected initials() {
    const p = this.profile();
    if (!p) return '?';
    return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase() || '?';
  }

  protected verifLabel() { return VERIF_LABEL[this.profile()?.verificationStatus ?? 'PENDING']; }
  protected verifColor() { return VERIF_COLOR[this.profile()?.verificationStatus ?? 'PENDING']; }
  protected profLabel() { return PROF_LABEL[this.profile()?.professionalStatus ?? 'ACTIVE']; }
  protected profColor() { return PROF_COLOR[this.profile()?.professionalStatus ?? 'ACTIVE']; }

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
    this.profile.set(d);
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

  // ===== GESTION PHOTO =====
  protected onAvatar(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.avatarError.set(null);
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      this.avatarError.set('Format non accepte. Utilisez JPG, PNG ou WebP.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      this.avatarError.set('Image trop volumineuse (5 Mo maximum).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => this.avatarUrl.set(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  protected removeAvatar() {
    this.avatarUrl.set(null);
    this.avatarError.set(null);
  }
  // =========================

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
      'Informations enregistrees.',
    );
  }

  protected saveSpecialties() {
    this.run(this.api.setSpecialties(this.selSpec(), this.primary()), 'Specialites enregistrees.');
  }

  protected saveLanguages() {
    this.run(this.api.setLanguages(this.selLang()), 'Langues enregistrees.');
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
        this.error.set(e?.error?.detail ?? 'Enregistrement refuse par le serveur.');
      },
    });
  }
}

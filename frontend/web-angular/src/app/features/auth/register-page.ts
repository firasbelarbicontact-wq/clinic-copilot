import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideCircleCheck, LucideInfo, LucideStethoscope, LucideUpload, LucideUserRound } from '@lucide/angular';
import { switchMap } from 'rxjs';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';
import { Icon } from '../../shared/ui/icon';
import { AuthShell } from './auth-shell';
import { DoctorOnboardingService, RefItem } from './doctor-onboarding.service';
import { PasswordInput, PasswordStrength } from './password-input';

type Role = 'PATIENT' | 'DOCTOR';

const today = () => new Date().toISOString().slice(0, 10);
const notInFuture = (c: AbstractControl): ValidationErrors | null =>
  !c.value || c.value <= today() ? null : { future: true };
const passwordsMatch = (g: AbstractControl): ValidationErrors | null =>
  g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };

const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon, PasswordInput, PasswordStrength],
  template: `
    @if (done()) {
      <app-auth-shell title="Compte créé">
        <div class="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <app-icon class="mx-auto text-success" [icon]="CircleCheck" [size]="56" />
          <p class="mt-4 text-lg font-semibold text-deep">Votre compte a bien été créé.</p>
          <p class="mt-2 text-muted-foreground">Vous pouvez maintenant vous connecter.</p>
          @if (role() === 'DOCTOR') {
            <p class="mt-4 rounded-lg bg-warning/10 p-3 text-sm font-medium text-deep">
              Votre compte est en attente de vérification de votre diplôme par un administrateur.
            </p>
          }
          <a routerLink="/connexion" class="btn btn-hero btn-lg mt-6">Se connecter</a>
        </div>
      </app-auth-shell>
    } @else {
      <app-auth-shell title="Créer un compte" subtitle="Rejoignez Clinic Copilot en quelques minutes.">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
          <div>
            <span class="mb-1.5 block text-sm font-medium text-deep">Type de compte</span>
            <div role="radiogroup" aria-label="Type de compte" class="grid grid-cols-2 gap-3">
              @for (o of roles; track o.value) {
                <button type="button" role="radio" [attr.aria-checked]="role() === o.value" (click)="setRole(o.value)"
                  class="rounded-2xl border-2 bg-card p-4 text-left transition-all duration-200"
                  [class]="role() === o.value ? 'border-primary shadow-soft' : 'border-border hover:border-primary/40'">
                  <span class="mb-2 grid h-10 w-10 place-items-center rounded-xl"
                    [class]="role() === o.value ? 'bg-gradient-primary text-primary-foreground' : 'bg-soft text-primary'">
                    <app-icon [icon]="o.icon" [size]="20" />
                  </span>
                  <span class="block font-semibold text-deep">{{ o.label }}</span>
                  <span class="block text-xs text-muted-foreground">{{ o.desc }}</span>
                </button>
              }
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="firstName" class="mb-1.5 block text-sm font-medium text-deep">Prénom</label>
              <input id="firstName" type="text" autocomplete="given-name" class="field h-11" formControlName="firstName" />
              @if (bad('firstName')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir votre prénom.</p> }
            </div>
            <div>
              <label for="lastName" class="mb-1.5 block text-sm font-medium text-deep">Nom</label>
              <input id="lastName" type="text" autocomplete="family-name" class="field h-11" formControlName="lastName" />
              @if (bad('lastName')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir votre nom.</p> }
            </div>
            <div>
              <label for="email" class="mb-1.5 block text-sm font-medium text-deep">E-mail</label>
              <input id="email" type="email" autocomplete="email" class="field h-11" formControlName="email" />
              @if (bad('email')) { <p class="mt-1 text-xs font-medium text-destructive">Adresse e-mail invalide.</p> }
            </div>
            <div>
              <label for="dateOfBirth" class="mb-1.5 block text-sm font-medium text-deep">Date de naissance</label>
              <input id="dateOfBirth" type="date" autocomplete="bday" class="field h-11" formControlName="dateOfBirth" [max]="maxDate" />
              @if (bad('dateOfBirth')) { <p class="mt-1 text-xs font-medium text-destructive">Date de naissance invalide.</p> }
            </div>
            <div>
              <label for="password" class="mb-1.5 block text-sm font-medium text-deep">Mot de passe</label>
              <app-password-input inputId="password" autocomplete="new-password" [control]="form.controls.password" />
              <app-password-strength [value]="form.controls.password.value" />
              @if (bad('password')) { <p class="mt-1 text-xs font-medium text-destructive">Au moins 8 caractères.</p> }
            </div>
            <div>
              <label for="confirm" class="mb-1.5 block text-sm font-medium text-deep">Confirmation</label>
              <app-password-input inputId="confirm" autocomplete="new-password" [control]="form.controls.confirm" />
              @if (form.hasError('mismatch') && form.controls.confirm.touched) {
                <p class="mt-1 text-xs font-medium text-destructive">Les mots de passe ne correspondent pas.</p>
              }
            </div>
          </div>

          @if (role() === 'PATIENT') {
            <label class="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
              <input type="checkbox" class="mt-1 h-4 w-4 accent-[var(--primary)]" formControlName="consent" />
              <span>
                J'accepte le traitement de mes données de santé pour recevoir une orientation et gérer mes rendez-vous.
                <a routerLink="/" fragment="securite" class="font-semibold text-primary hover:underline">En savoir plus</a>
              </span>
            </label>
            @if (bad('consent')) {
              <p class="-mt-3 text-xs font-medium text-destructive">Votre consentement est nécessaire pour créer un compte patient.</p>
            }
          } @else {
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="specialtyCode" class="mb-1.5 block text-sm font-medium text-deep">Spécialité</label>
                <select id="specialtyCode" class="field h-11" formControlName="specialtyCode">
                  <option value="">Choisir une spécialité</option>
                  @for (s of specialties(); track s.code) { <option [value]="s.code">{{ s.name }}</option> }
                </select>
                @if (bad('specialtyCode')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez choisir une spécialité.</p> }
              </div>
              <div>
                <label for="licenseNumber" class="mb-1.5 block text-sm font-medium text-deep">Numéro d'ordre</label>
                <input id="licenseNumber" type="text" class="field h-11" formControlName="licenseNumber" />
                @if (bad('licenseNumber')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir votre numéro d'ordre.</p> }
              </div>
              <div>
                <label for="phone" class="mb-1.5 block text-sm font-medium text-deep">Téléphone</label>
                <input id="phone" type="tel" autocomplete="tel" placeholder="+216 20 123 456" class="field h-11" formControlName="phone" />
                @if (bad('phone')) { <p class="mt-1 text-xs font-medium text-destructive">Numéro de téléphone invalide.</p> }
              </div>
              <div>
                <label for="city" class="mb-1.5 block text-sm font-medium text-deep">Ville</label>
                <input id="city" type="text" class="field h-11" formControlName="city" />
                @if (bad('city')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir la ville.</p> }
              </div>
            </div>
            <div>
              <label for="addressLine" class="mb-1.5 block text-sm font-medium text-deep">Adresse du cabinet</label>
              <input id="addressLine" type="text" autocomplete="street-address" class="field h-11" formControlName="addressLine" />
              @if (bad('addressLine')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir l'adresse du cabinet.</p> }
            </div>

            <fieldset>
              <legend class="mb-1.5 text-sm font-medium text-deep">Langues parlées</legend>
              <div class="flex flex-wrap gap-2">
                @for (l of languages(); track l.code) {
                  <button type="button" role="checkbox" [attr.aria-checked]="langs().includes(l.code)" (click)="toggleLang(l.code)"
                    class="rounded-full border px-3 py-1.5 text-sm font-medium transition"
                    [class]="langs().includes(l.code) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-deep hover:border-primary/40'">
                    {{ l.name }}
                  </button>
                }
              </div>
            </fieldset>

            <div class="rounded-xl border border-dashed border-border bg-card p-4">
              <p class="text-sm font-medium text-deep">Diplôme de médecine</p>
              <p class="mt-0.5 text-xs text-muted-foreground">PDF, JPG ou PNG, 5 Mo maximum.</p>
              <input id="diplomaTitle" type="text" placeholder="Intitulé (ex. Doctorat en médecine)" class="field mt-3 h-11" formControlName="diplomaTitle" />
              @if (bad('diplomaTitle')) { <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir l'intitulé du diplôme.</p> }
              <label for="diplomaFile" class="btn btn-soft mt-3 cursor-pointer">
                <app-icon [icon]="Upload" [size]="16" />{{ file() ? 'Changer le fichier' : 'Choisir un fichier' }}
              </label>
              <input id="diplomaFile" type="file" accept=".pdf,.jpg,.jpeg,.png" class="sr-only" (change)="onFile($event)" />
              @if (file()) { <p class="mt-2 text-sm text-deep">{{ file()!.name }}</p> }
              @if (fileError()) { <p class="mt-1 text-xs font-medium text-destructive">{{ fileError() }}</p> }
            </div>

            <p class="flex gap-2 rounded-xl bg-info/10 p-3 text-sm text-deep">
              <app-icon class="mt-0.5 shrink-0 text-info" [icon]="Info" [size]="16" />
              Votre compte sera vérifié par un administrateur avant d'apparaître dans l'annuaire.
            </p>
          }

          @if (error()) {
            <p role="alert" class="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ error() }}</p>
          }

          <button type="submit" class="btn btn-hero btn-lg h-11 w-full" [disabled]="busy()">
            {{ busy() ? 'Création…' : 'Créer mon compte' }}
          </button>
          <p class="text-center text-sm text-muted-foreground">
            Déjà un compte? <a routerLink="/connexion" class="font-semibold text-primary hover:underline">Se connecter</a>
          </p>
        </form>
      </app-auth-shell>
    }
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly onboarding = inject(DoctorOnboardingService);
  private readonly router = inject(Router);

  protected readonly CircleCheck = LucideCircleCheck;
  protected readonly Info = LucideInfo;
  protected readonly Upload = LucideUpload;
  protected readonly roles = [
    { value: 'PATIENT' as Role, label: 'Patient', desc: 'Orientation et rendez-vous', icon: LucideUserRound },
    { value: 'DOCTOR' as Role, label: 'Médecin', desc: 'Agenda et patients', icon: LucideStethoscope },
  ];

  protected readonly maxDate = today();
  protected readonly role = signal<Role>('PATIENT');
  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly specialties = signal<RefItem[]>([]);
  protected readonly languages = signal<RefItem[]>([]);
  protected readonly langs = signal<string[]>([]);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', [Validators.required, notInFuture]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
      consent: [false, [Validators.requiredTrue]],
      specialtyCode: [''],
      licenseNumber: [''],
      phone: ['', [Validators.pattern(/^[+0-9 ()-]*$/)]],
      city: [''],
      addressLine: [''],
      diplomaTitle: [''],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    this.onboarding.specialties().subscribe({ next: (s) => this.specialties.set(s), error: () => {} });
    this.onboarding.languages().subscribe({ next: (l) => this.languages.set(l), error: () => {} });
    this.applyRole('PATIENT');
  }

  protected bad(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected setRole(r: Role) {
    this.role.set(r);
    this.error.set(null);
    this.applyRole(r);
  }

  private applyRole(r: Role) {
    const c = this.form.controls;
    const doctorOnly = [c.specialtyCode, c.licenseNumber, c.city, c.addressLine, c.diplomaTitle];
    doctorOnly.forEach((x) => (r === 'DOCTOR' ? x.addValidators(Validators.required) : x.clearValidators()));
    if (r === 'PATIENT') c.consent.setValidators(Validators.requiredTrue);
    else c.consent.clearValidators();
    [...doctorOnly, c.consent].forEach((x) => x.updateValueAndValidity());
  }

  protected toggleLang(code: string) {
    this.langs.update((l) => (l.includes(code) ? l.filter((x) => x !== code) : [...l, code]));
  }

  protected onFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.fileError.set(null);
    if (f && !ALLOWED.includes(f.type)) {
      this.fileError.set('Format non accepté (PDF, JPG ou PNG).');
      this.file.set(null);
    } else if (f && f.size > MAX_FILE) {
      this.fileError.set('Fichier trop volumineux (5 Mo maximum).');
      this.file.set(null);
    } else {
      this.file.set(f);
    }
  }

  protected submit() {
    this.error.set(null);
    const isDoctor = this.role() === 'DOCTOR';
    if (isDoctor && !this.file()) this.fileError.set('Veuillez joindre votre diplôme.');
    if (this.form.invalid || (isDoctor && !this.file())) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      password: v.password,
      dateOfBirth: v.dateOfBirth,
      role: this.role(),
    };
    this.busy.set(true);

    const register$ = this.auth.register(body);
    if (!isDoctor) {
      register$.subscribe({
        next: () => this.finish(),
        error: (e: unknown) => this.fail(authErrorMessage(e, 'register')),
      });
      return;
    }

    register$
      .pipe(
        switchMap(() => this.auth.login({ email: body.email, password: body.password })),
        switchMap(() =>
          this.onboarding.createProfile({
            firstName: body.firstName,
            lastName: body.lastName,
            licenseNumber: v.licenseNumber.trim(),
            phone: v.phone.trim(),
            addressLine: v.addressLine.trim(),
            city: v.city.trim(),
            specialtyCode: v.specialtyCode,
            languageCodes: this.langs(),
            diplomaFile: this.file()!,
            diplomaTitle: v.diplomaTitle.trim(),
          }),
        ),
      )
      .subscribe({
        next: () => {
          this.auth.logout();
          this.finish();
        },
        error: (e: any) => {
          const step = e?.url?.includes('/api/doctors/') ? 'doctor' : 'auth';
          this.fail(
            step === 'doctor'
              ? e?.status === 403
                ? "Compte créé, mais il n'a pas le rôle médecin (à corriger côté Identity)."
                : "Compte créé, mais l'envoi du profil ou du diplôme a échoué. Connectez-vous pour réessayer."
              : authErrorMessage(e, 'register'),
          );
        },
      });
  }

  private finish() {
    this.busy.set(false);
    this.done.set(true);
  }

  private fail(msg: string) {
    this.busy.set(false);
    this.error.set(msg);
  }
}
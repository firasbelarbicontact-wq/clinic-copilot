import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideUserRound } from '@lucide/angular';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';
import { Icon } from '../../shared/ui/icon';
import { AuthShell } from './auth-shell';
import { PasswordInput } from './password-input';
import { hasRole } from '../../core/auth/role.guard';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon, PasswordInput],
  template: `
    <app-auth-shell title="Connexion" subtitle="Heureux de vous revoir. Connectez-vous à votre espace.">
      @if (justRegistered) {
        <p class="mb-6 rounded-lg border border-success/40 bg-success/10 p-3 text-sm font-medium text-deep" role="status">
          Compte créé. Vous pouvez vous connecter.
        </p>
      }
      @if (raison) {
        <p class="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-deep" role="status">
          {{ raison === 'role' ? "Vous n'avez pas accès à cet espace avec votre compte." : 'Veuillez vous connecter pour accéder à votre espace.' }}
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
        <div>
          <label for="email" class="mb-1.5 block text-sm font-medium text-deep">E-mail</label>
          <input id="email" type="email" autocomplete="email" placeholder="vous@exemple.fr" class="field h-11" formControlName="email" />
          @if (invalid('email')) {
            <p class="mt-1 text-xs font-medium text-destructive">Adresse e-mail invalide.</p>
          }
        </div>

        <div>
          <label for="password" class="mb-1.5 block text-sm font-medium text-deep">Mot de passe</label>
          <app-password-input inputId="password" autocomplete="current-password" [control]="form.controls.password" />
          @if (invalid('password')) {
            <p class="mt-1 text-xs font-medium text-destructive">Veuillez saisir votre mot de passe.</p>
          }
        </div>

        <div class="flex justify-end">
          <a routerLink="/mot-de-passe-oublie" class="text-sm font-medium text-primary hover:underline">Mot de passe oublié ?</a>
        </div>

        @if (error()) {
          <p role="alert" class="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ error() }}</p>
        }

        <button type="submit" class="btn btn-hero btn-lg h-11 w-full" [disabled]="busy()">
          {{ busy() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <div class="my-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span class="h-px flex-1 bg-border"></span>ou<span class="h-px flex-1 bg-border"></span>
      </div>

      <a routerLink="/medecins" class="btn btn-soft btn-lg h-11 w-full">
        <app-icon [icon]="UserRound" [size]="18" />Continuer en tant qu'invité
      </a>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?
        <a routerLink="/inscription" class="font-semibold text-primary hover:underline">Créer un compte</a>
      </p>
    </app-auth-shell>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly justRegistered = this.params.get('inscrit') === '1';
  protected readonly raison = this.params.get('raison');

  protected readonly UserRound = LucideUserRound;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected invalid(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email.trim(), password }).subscribe({
        next: (res) => {
        this.busy.set(false);
        this.router.navigateByUrl(hasRole(res, 'ADMIN') ? '/admin' : '/medecins');
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.error.set(authErrorMessage(e, 'login'));
      },
    });
  }
}
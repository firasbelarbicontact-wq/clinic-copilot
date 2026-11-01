import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideMailCheck } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon],
  template: `
    @if (sent()) {
      <app-auth-shell title="Vérifiez vos e-mails">
        <div class="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <app-icon class="mx-auto text-success" [icon]="MailCheck" [size]="48" />
          <p class="mt-4 text-muted-foreground">Si un compte existe, un lien a été envoyé.</p>
          <a routerLink="/connexion" class="btn btn-hero mt-6">Retour à la connexion</a>
        </div>
      </app-auth-shell>
    } @else {
      <app-auth-shell title="Mot de passe oublié" subtitle="Saisissez votre e-mail, nous vous enverrons un lien de réinitialisation.">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
          <div>
            <label for="email" class="mb-1.5 block text-sm font-medium text-deep">E-mail</label>
            <input id="email" type="email" autocomplete="email" class="field h-11" formControlName="email" />
            @if (form.controls.email.invalid && form.controls.email.touched) {
              <p class="mt-1 text-xs font-medium text-destructive">Adresse e-mail invalide.</p>
            }
          </div>
          <button type="submit" class="btn btn-hero btn-lg h-11 w-full" [disabled]="busy()">
            {{ busy() ? 'Envoi…' : 'Envoyer le lien' }}
          </button>
        </form>
        <a routerLink="/connexion" class="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <app-icon [icon]="ArrowLeft" [size]="16" />Retour à la connexion
        </a>
      </app-auth-shell>
    }
  `,
})
export class ForgotPasswordPage {
  protected readonly MailCheck = LucideMailCheck;
  protected readonly ArrowLeft = LucideArrowLeft;
  protected readonly sent = signal(false);
  protected readonly busy = signal(false);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.sent.set(true);
    }, 700);
  }
}
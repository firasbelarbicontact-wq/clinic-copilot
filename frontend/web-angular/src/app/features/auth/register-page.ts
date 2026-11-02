import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../core/api.config';
import { Footer } from '../../shared/layout/footer';
import { Header } from '../../shared/layout/header';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, Header, Footer],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly registered = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly form = this.formBuilder.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.get('password')?.value === group.get('confirmPassword')?.value
          ? null
          : { passwordMismatch: true },
    },
  );

  protected submit(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set('');

    if (this.form.invalid) return;

    const { confirmPassword: _confirmPassword, ...request } = this.form.getRawValue();
    this.submitting.set(true);

    this.http.post(`${API_BASE_URL}/api/auth/register`, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.registered.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error.status === 409
            ? 'Un compte existe déjà avec cette adresse e-mail.'
            : 'Votre inscription n’a pas pu aboutir. Veuillez réessayer.',
        );
      },
    });
  }
}

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from './auth.models';

const STORAGE_KEY = 'clinic-copilot.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<AuthResponse | null>(this.read());
  readonly session = this._session.asReadonly();
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly token = computed(() => this._session()?.token ?? null);

  login(body: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/api/auth/login`, body)
      .pipe(tap((r) => this.save(r)));
  }

  register(body: RegisterRequest) {
    return this.http.post<UserResponse>(`${API_BASE_URL}/api/auth/register`, body);
  }

  logout() {
    this._session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* stockage indisponible : on ignore */
    }
    this.router.navigateByUrl('/');
  }

  private save(r: AuthResponse) {
    this._session.set(r);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {
      /* stockage indisponible : la session reste en mémoire */
    }
  }

  private read(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}

/** Message lisible à partir de l'erreur HTTP. */
export function authErrorMessage(e: unknown, context: 'login' | 'register'): string {
  if (!(e instanceof HttpErrorResponse)) return 'Une erreur est survenue. Réessayez.';
  switch (e.status) {
    case 0:
      return 'Impossible de joindre le serveur. Vérifiez que le service est démarré.';
    case 400:
      return 'Vérifiez les champs du formulaire.';
    case 401:
    case 404:
      return context === 'login' ? 'Email ou mot de passe incorrect.' : 'Une erreur est survenue. Réessayez.';
    case 403:
      return 'Ce compte est désactivé.';
    case 409:
      return 'Un compte existe déjà avec cet email.';
    default:
      return 'Une erreur est survenue. Réessayez.';
  }
}
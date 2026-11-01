import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const hasRole = (session: { role?: string } | null | undefined, role: string) =>
  !!session?.role && session.role.toUpperCase().replace('ROLE_', '') === role;

export const roleGuard =
  (role: string): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/connexion'], { queryParams: { raison: 'auth' } });
    if (!hasRole(auth.session(), role)) return router.createUrlTree(['/connexion'], { queryParams: { raison: 'role' } });
    return true;
  };
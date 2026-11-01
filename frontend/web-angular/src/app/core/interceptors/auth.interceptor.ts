import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../api.config';
import { AuthService } from '../auth/auth.service';

// Routes publiques : on n'envoie pas de token
const PUBLIC_PREFIXES = ['/api/auth', '/api/directory', '/api/specialties', '/api/languages'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const path = req.url.startsWith(API_BASE_URL) ? req.url.slice(API_BASE_URL.length) : req.url;
  const isProtectedApi = path.startsWith('/api/') && !PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (token && isProtectedApi) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
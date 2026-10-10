import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!isPlatformBrowser(platformId)) return next(req);

  const publicEndpoints = [/\/usuarios\/login-firebase$/];
  const isPublic = publicEndpoints.some((regex) => regex.test(req.url));

  if (isPublic) {
    return next(req);
  }

  const token = authService.getJwtToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.clearJwtToken();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
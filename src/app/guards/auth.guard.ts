import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  await authService.waitForSessionReady();

  const token = authService.getJwtToken();
  const hasStoredToken = isPlatformBrowser(platformId) && !!localStorage.getItem('jwt_token');

  if (token || hasStoredToken) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
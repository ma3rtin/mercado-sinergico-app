import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // 🕒 Esperar a que la sesión esté lista (garantiza que restoreSession terminó)
    await authService.waitForSessionReady();

    // ✅ Determinar autenticación
    const token = authService.getJwtToken() ?? authService.getFirebaseToken();
    const isAuthenticated = !!token;

    // 🔍 Verificar si hay tokens en localStorage (backup)
    const hasStoredToken =
        isPlatformBrowser(platformId) &&
        (!!localStorage.getItem('jwt_token') || !!localStorage.getItem('firebase_token'));

    // 🔐 Permitir acceso si hay sesión activa o tokens guardados
    if (isAuthenticated || hasStoredToken) {
        return true;
    }

    // 🚫 Si no hay sesión, redirigir al login
    console.warn('🛡️ AuthGuard - acceso denegado, redirigiendo al login');
    return router.createUrlTree(['/login']);
};

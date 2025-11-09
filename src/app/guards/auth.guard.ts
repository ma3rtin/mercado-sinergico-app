import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const isAuthenticated = authService.isAuthenticated();
    console.log('🛡️ AuthGuard - Usuario autenticado:', isAuthenticated);

    if (!isAuthenticated) {
        console.log('🛡️ AuthGuard - Redirigiendo al login');
        // 👇 Devolvemos un UrlTree en lugar de hacer navigate()
        return router.createUrlTree(['/login']);
    }

    console.log('🛡️ AuthGuard - Acceso permitido');
    return true;
};

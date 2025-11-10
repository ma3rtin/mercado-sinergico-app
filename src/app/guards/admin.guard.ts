import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // 🕐 Esperar a que la sesión esté lista
    await authService.waitForSessionReady();

    const role = authService.getUserRole();

    if (role === 'Admin') {
        console.log('🛡️ Acceso admin permitido');
        return true;
    }

    console.warn('🚫 Acceso denegado: se requiere rol Admin');
    return router.createUrlTree(['/']); // Redirige al home o donde prefieras
};

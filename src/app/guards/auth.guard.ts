// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../services/auth/auth.service';
// export const authGuard: CanActivateFn = () => {
//     const authService = inject(AuthService);
//     const router = inject(Router);

//     const isAuthenticated = authService.isAuthenticated();
//     console.log('🛡️ AuthGuard - Usuario autenticado:', isAuthenticated);
    
//     if (!isAuthenticated) {
//         console.log('🛡️ AuthGuard - Redirigiendo al login');
//         router.navigate(['/login']);
//         return false;
//     } else {
//         console.log('🛡️ AuthGuard - Acceso permitido');
//         return true;
//     }
// };

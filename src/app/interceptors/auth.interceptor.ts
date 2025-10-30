import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    const token = authService.getJwtToken();

    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    console.log('🟡 Token agregado al header:', token ? 'Sí ✅' : 'No ❌');

    return next(authReq).pipe(
        catchError((error) => {
            if (error.status === 401) {
                console.warn('⚠️ Token inválido o expirado. Redirigiendo al login...');
                authService.clearTokens();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
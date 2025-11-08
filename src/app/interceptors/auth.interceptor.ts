import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);
    const authService = inject(AuthService);

    // ⚠️ NO ejecutar en SSR
    if (!isPlatformBrowser(platformId)) {
        return next(req);
    }

    // ⚠️ Ignorar rutas de autenticación
    const authPaths = ['/login', '/register', '/auth', '/firebase'];
    const shouldSkip = authPaths.some(path => req.url.includes(path));

    if (shouldSkip) {
        console.log('🔵 Omitiendo interceptor para:', req.url);
        return next(req);
    }

    const token = authService.getJwtToken();

    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    console.log('🟡 Token agregado al header:', token ? 'Sí ✅' : 'No ❌', 'URL:', req.url);

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

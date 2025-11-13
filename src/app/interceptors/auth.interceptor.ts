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

    // 🧩 Ignorar en entorno no browser (SSR)
    if (!isPlatformBrowser(platformId)) return next(req);

    // 🚫 URLs públicas (sin autenticación)
    const publicEndpoints = ['/login', '/registrarse', '/auth', '/firebase'];
    if (publicEndpoints.some((url) => req.url.includes(url))) {
        return next(req);
    }

    // 🔑 Intentar obtener token válido (JWT o Firebase)
    const token = authService.getJwtToken() ?? authService.getFirebaseToken();

    // 📨 Clonar request con encabezado Authorization si hay token
    const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    // 🚨 Manejo global de errores
    return next(authReq).pipe(
        catchError((error) => {
            if (error.status === 401) {
                const hasAnyToken =
                    !!authService.getJwtToken() || !!authService.getFirebaseToken();

                if (!hasAnyToken) {
                    authService.clearTokens();
                    router.navigate(['/login']);
                }
            }

            return throwError(() => error);
        })
    );
};

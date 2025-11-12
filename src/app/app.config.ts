import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),

    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      preventDuplicates: true,
      toastClass:
        'text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2',
      titleClass: 'text-black-400 font-bold',
      messageClass: 'text-sm text-gray-200',
    }),

    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideRouter(routes),
    provideClientHydration(withEventReplay()),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      // Retornamos la promesa — así Angular realmente espera
      return authService.restoreSession();
    }),

  ],
};

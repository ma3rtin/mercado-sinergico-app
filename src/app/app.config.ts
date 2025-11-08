import {
  ApplicationConfig,
  provideZonelessChangeDetection,
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
  //  withInterceptors
} from '@angular/common/http';
//import { AuthInterceptor } from './interceptors/auth.interceptor';

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

    // ⚠️ COMENTAR TEMPORALMENTE
    provideHttpClient(withFetch()),
    // provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),

    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};

import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { App } from './app/app';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      closeButton: true,
      preventDuplicates: true,
      toastClass: 'bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2',
      titleClass: 'text-yellow-400 font-bold',
      messageClass: 'text-sm text-gray-200'
    }),

    provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),

    provideRouter(routes),
  ],
};

bootstrapApplication(App, appConfig).catch(err => console.error(err));

import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth/auth.service';
import { AnalyticsService } from './services/analytics/analytics.service';

// 🎨 ngicons
import { NgIconsModule } from '@ng-icons/core';
import {
  featherArchive, featherRotateCcw, featherLock, featherChevronRight, featherChevronLeft,
  featherArrowRight, featherArrowLeft, featherMenu, featherX, featherHome, featherSearch,
  featherFilter, featherSliders, featherDollarSign, featherShoppingCart, featherShoppingBag,
  featherTrendingUp, featherTrendingDown, featherCheck, featherCheckCircle, featherAlertCircle,
  featherAlertTriangle, featherInfo, featherUser, featherUsers, featherUserCheck, featherLogOut,
  featherLogIn, featherBox, featherPackage, featherGift, featherStar, featherHeart, featherMapPin,
  featherMap, featherNavigation, featherSettings, featherEdit, featherEdit2, featherTrash,
  featherTrash2, featherCopy, featherClock, featherCalendar, featherBarChart2, featherPieChart,
  featherLink, featherExternalLink, featherDownload, featherUpload, featherShare2, featherEye,
  featherEyeOff, featherLoader, featherRefreshCw, featherChevronDown, featherChevronUp, featherPhone,
  featherMail, featherBell, featherZap, featherTag, featherLayers, featherAward, featherClipboard,
  featherList, featherGrid, featherMinus, featherPlus, featherAlertOctagon, featherFilePlus,
  featherHelpCircle, featherLifeBuoy, featherMessageCircle, featherShield, featherInbox,
  featherImage, featherTruck, featherThumbsUp, featherFileText, featherXCircle, featherHash,
} from '@ng-icons/feather-icons';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from './config/firebase.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),

    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideClientHydration(withEventReplay()),

    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const analytics = inject(AnalyticsService);
      analytics.startAutoPageTracking();
      return authService.restoreSession();
    }),

    // 🔥 Firebase Providers
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),

    // ⭐️ NgIcons
    importProvidersFrom(
      NgIconsModule.withIcons({
        featherArchive, featherRotateCcw, featherChevronRight, featherChevronLeft,
        featherChevronDown, featherChevronUp, featherArrowRight, featherArrowLeft, featherMenu,
        featherX, featherHome, featherTag, featherLayers, featherSearch, featherFilter,
        featherSliders, featherDollarSign, featherShoppingCart, featherShoppingBag,
        featherTrendingUp, featherTrendingDown, featherCheck, featherCheckCircle, featherAlertCircle,
        featherAlertTriangle, featherInfo, featherUser, featherUsers, featherUserCheck,
        featherLogOut, featherLogIn, featherBox, featherPackage, featherGift, featherStar,
        featherHeart, featherMapPin, featherMap, featherNavigation, featherSettings, featherEdit,
        featherEdit2, featherTrash, featherTrash2, featherCopy, featherClock, featherCalendar,
        featherBarChart2, featherPieChart, featherLink, featherExternalLink, featherDownload,
        featherUpload, featherShare2, featherEye, featherEyeOff, featherLoader, featherRefreshCw,
        featherPhone, featherMail, featherBell, featherZap, featherAward, featherClipboard,
        featherList, featherGrid, featherMinus, featherPlus, featherAlertOctagon, featherFilePlus,
        featherFileText, featherLock, featherHelpCircle, featherLifeBuoy, featherMessageCircle,
        featherShield, featherInbox, featherImage, featherTruck, featherThumbsUp, featherXCircle,
        featherHash,
      })
    ),
  ],
};
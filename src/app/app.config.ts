import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideAppInitializer,
  inject,
  importProvidersFrom,
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
// 🎨 ngicons
import { NgIconsModule } from '@ng-icons/core';
import {
  featherChevronRight,
  featherChevronLeft,
  featherArrowRight,
  featherArrowLeft,
  featherMenu,
  featherX,
  featherHome,
  featherSearch,
  featherFilter,
  featherSliders,
  featherDollarSign,
  featherShoppingCart,
  featherShoppingBag,
  featherTrendingUp,
  featherTrendingDown,
  featherCheck,
  featherCheckCircle,
  featherAlertCircle,
  featherAlertTriangle,
  featherInfo,
  featherUser,
  featherUsers,
  featherUserCheck,
  featherLogOut,
  featherLogIn,
  featherBox,
  featherPackage,
  featherGift,
  featherStar,
  featherHeart,
  featherMapPin,
  featherMap,
  featherNavigation,
  featherSettings,
  featherEdit,
  featherEdit2,
  featherTrash,
  featherTrash2,
  featherCopy,
  featherClock,
  featherCalendar,
  featherBarChart2,
  featherPieChart,
  featherLink,
  featherExternalLink,
  featherDownload,
  featherUpload,
  featherShare2,
  featherEye,
  featherEyeOff,
  featherLoader,
  featherRefreshCw,
  featherChevronDown,
  featherChevronUp,
  featherPhone,
  featherMail,
  featherBell,
  featherZap,
  featherTag,
  featherLayers
} from '@ng-icons/feather-icons';
import { L } from 'vitest/dist/chunks/reporters.d.BFLkQcL6';

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
      return authService.restoreSession();
    }),

    // ⭐️ Agregamos NgIcons correctamente
    importProvidersFrom(
      NgIconsModule.withIcons({
        // ➕ Navegación
        featherChevronRight,
        featherChevronLeft,
        featherChevronDown,
        featherChevronUp,
        featherArrowRight,
        featherArrowLeft,
        featherMenu,
        featherX,
        featherHome,
        featherTag,
        featherLayers,

        // 🔍 Búsqueda
        featherSearch,
        featherFilter,
        featherSliders,

        // 💰 Precios
        featherDollarSign,
        featherShoppingCart,
        featherShoppingBag,
        featherTrendingUp,
        featherTrendingDown,

        // ✅ Estados
        featherCheck,
        featherCheckCircle,
        featherAlertCircle,
        featherAlertTriangle,
        featherInfo,

        // 👤 Usuario
        featherUser,
        featherUsers,
        featherUserCheck,
        featherLogOut,
        featherLogIn,

        // 📦 Productos
        featherBox,
        featherPackage,
        featherGift,
        featherStar,
        featherHeart,

        // 🗺️ Ubicación
        featherMapPin,
        featherMap,
        featherNavigation,

        // ⚙️ Configuración
        featherSettings,
        featherEdit,
        featherEdit2,
        featherTrash,
        featherTrash2,
        featherCopy,

        // ⏰ Tiempo
        featherClock,
        featherCalendar,

        // 📊 Datos
        featherBarChart2,
        featherPieChart,

        // 🔗 Links
        featherLink,
        featherExternalLink,
        featherDownload,
        featherUpload,
        featherShare2,

        // 🎨 UI
        featherEye,
        featherEyeOff,
        featherLoader,
        featherRefreshCw,

        // 📱 Misc
        featherPhone,
        featherMail,
        featherBell,
        featherZap,

      })
    ),
  ],
};

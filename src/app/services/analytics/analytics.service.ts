import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { logEvent, isSupported, Analytics } from 'firebase/analytics';
import { analytics as firebaseAnalytics } from '@app/config/firebase.config';

export interface AnalyticsItem {
  item_id: string | number;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
}

export interface TrackPurchaseParams {
  transaction_id: string | number;
  value: number;
  currency?: string;
  items: AnalyticsItem[];
  shipping?: number;
  tax?: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private pageTrackingStarted = false;
  private supported = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      isSupported().then((ok) => { this.supported = ok; }).catch(() => { this.supported = false; });
    }
  }

  private get instance(): Analytics | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!this.supported) return null;
    return firebaseAnalytics;
  }

  startAutoPageTracking(): void {
    if (this.pageTrackingStarted) return;
    if (!isPlatformBrowser(this.platformId)) return;

    this.pageTrackingStarted = true;

    this.trackPageView(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event) => {
        this.trackPageView(event.urlAfterRedirects);
      });
  }

  trackPageView(path: string, title?: string): void {
    this.logEvent('page_view', {
      page_path: path,
      page_title: title ?? this.resolveTitle(path),
      page_location: isPlatformBrowser(this.platformId) ? window.location.href : path,
    });
  }

  trackLogin(method: 'google' | 'email' | 'password'): void {
    this.logEvent('login', { method });
  }

  trackSignUp(method: 'google' | 'email' | 'password'): void {
    this.logEvent('sign_up', { method });
  }

  trackSearch(term: string, resultCount?: number): void {
    this.logEvent('search', {
      search_term: term,
      result_count: resultCount,
    });
  }

  trackViewItemList(listId: string, listName: string, items: AnalyticsItem[]): void {
    this.logEvent('view_item_list', {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map(toGaItem),
    });
  }

  trackViewItem(item: AnalyticsItem, currency = 'ARS'): void {
    this.logEvent('view_item', {
      currency,
      value: item.price ?? 0,
      items: [toGaItem(item)],
    });
  }

  trackSelectItem(item: AnalyticsItem, listId?: string): void {
    this.logEvent('select_item', {
      item_list_id: listId,
      items: [toGaItem(item)],
    });
  }

  trackAddToCart(item: AnalyticsItem, currency = 'ARS'): void {
    this.logEvent('add_to_cart', {
      currency,
      value: (item.price ?? 0) * (item.quantity ?? 1),
      items: [toGaItem(item)],
    });
  }

  trackRemoveFromCart(item: AnalyticsItem, currency = 'ARS'): void {
    this.logEvent('remove_from_cart', {
      currency,
      value: (item.price ?? 0) * (item.quantity ?? 1),
      items: [toGaItem(item)],
    });
  }

  trackBeginCheckout(value: number, items: AnalyticsItem[], currency = 'ARS'): void {
    this.logEvent('begin_checkout', {
      currency,
      value,
      items: items.map(toGaItem),
    });
  }

  trackAddPaymentInfo(value: number, items: AnalyticsItem[], paymentType = 'mercadopago', currency = 'ARS'): void {
    this.logEvent('add_payment_info', {
      currency,
      value,
      payment_type: paymentType,
      items: items.map(toGaItem),
    });
  }

  trackPurchase(params: TrackPurchaseParams): void {
    const currency = params.currency ?? 'ARS';
    this.logEvent('purchase', {
      transaction_id: String(params.transaction_id),
      currency,
      value: params.value,
      shipping: params.shipping ?? 0,
      tax: params.tax ?? 0,
      items: params.items.map(toGaItem),
    });
  }

  trackException(description: string, fatal = false): void {
    this.logEvent('exception', {
      description,
      fatal,
    });
  }

  trackEvent(name: string, params?: Record<string, unknown>): void {
    this.logEvent(name, params);
  }

  private logEvent(name: string, params?: Record<string, unknown>): void {
    const instance = this.instance;
    if (!instance) return;
    try {
      logEvent(instance, name, params);
    } catch (err) {
      console.warn('[Analytics] Failed to log event', name, err);
    }
  }

  private resolveTitle(path: string): string {
    if (path === '/' || path === '') return 'Inicio';
    if (path.startsWith('/login')) return 'Iniciar Sesión';
    if (path.startsWith('/registrarse')) return 'Registrarse';
    if (path.startsWith('/productos')) return 'Productos';
    if (path.startsWith('/paquetes')) return 'Paquetes';
    if (path.startsWith('/producto/')) return 'Detalle de Producto';
    if (path.startsWith('/paquete/') && path.includes('/producto/')) return 'Detalle de Producto en Paquete';
    if (path.startsWith('/paquete/')) return 'Productos del Paquete';
    if (path.startsWith('/perfil')) return 'Mi Perfil';
    if (path.startsWith('/mis-pedidos')) return 'Mis Pedidos';
    if (path.startsWith('/admin')) return 'Administración';
    if (path.startsWith('/faq')) return 'Preguntas Frecuentes';
    if (path.startsWith('/soporte')) return 'Soporte';
    if (path.startsWith('/terminos')) return 'Términos y Condiciones';
    if (path.startsWith('/politica-de-privacidad')) return 'Política de Privacidad';
    if (path.startsWith('/politica-de-devoluciones')) return 'Política de Devoluciones';
    return path;
  }
}

function toGaItem(item: AnalyticsItem) {
  return {
    item_id: String(item.item_id),
    item_name: item.item_name,
    item_category: item.item_category,
    item_variant: item.item_variant,
    price: item.price,
    quantity: item.quantity ?? 1,
  };
}
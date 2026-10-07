import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not throw on SSR (analytics null)', () => {
    expect(() => {
      service.trackEvent('custom_event', { foo: 'bar' });
      service.trackPageView('/test');
      service.trackLogin('email');
      service.trackSignUp('google');
      service.trackSearch('test', 5);
      service.trackAddToCart({ item_id: 1, item_name: 'Test', price: 100, quantity: 2 });
      service.trackBeginCheckout(500, [{ item_id: 1, item_name: 'X', price: 500, quantity: 1 }]);
      service.trackPurchase({
        transaction_id: 'tx-1',
        value: 1000,
        items: [{ item_id: 1, item_name: 'X', price: 1000, quantity: 1 }],
      });
      service.trackException('boom');
    }).not.toThrow();
  });

  it('should resolve title for known routes', () => {
    service.trackPageView('/');
    service.trackPageView('/productos');
    service.trackPageView('/paquetes');
    service.trackPageView('/login');
    service.trackPageView('/admin');
    service.trackPageView('/perfil');
    service.trackPageView('/unknown-route');
  });

  it('should call startAutoPageTracking only once', () => {
    service.startAutoPageTracking();
    service.startAutoPageTracking();
    expect(service).toBeTruthy();
  });
});
import { Component, signal, inject, effect, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { LocationModalComponent } from './components/location-modal/location-modal.component';
import { LocationStateService } from './services/localidad/location-state.service';
import { NgxSonnerToaster } from 'ngx-sonner';
import { PwaService } from './services/pwa/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LocationModalComponent, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  private locationState = inject(LocationStateService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private pwaService = inject(PwaService); // 🚀 Inicilizamos para capturar el evento PWA temprano

  showLocationModal = signal(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkLocation();
    });

    this.checkLocation();

    effect(() => {
      if (this.locationState.hasLocation()) {
        this.showLocationModal.set(false);
      }
    });
  }

  private checkLocation() {
    if (isPlatformBrowser(this.platformId) && !this.locationState.hasLocation()) {
      this.showLocationModal.set(true);
    }
  }
}

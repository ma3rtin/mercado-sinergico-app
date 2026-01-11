import { Component, signal, inject, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { NgxSonnerToaster } from 'ngx-sonner'; // ⬅️ NUEVA LÍNEA
import { WhatsAppButton } from '@app/shared/whatsapp-button/whatsapp-button';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { LocationModalComponent } from './components/location-modal/location-modal.component';
import { LocationStateService } from './services/localidad/location-state.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    WhatsAppButton,
    Header,
    Footer,
    LocationModalComponent,
    NgxSonnerToaster // ⬅️ NUEVA LÍNEA
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  private locationState = inject(LocationStateService);
  private router = inject(Router);

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
    if (!this.locationState.hasLocation()) {
      this.showLocationModal.set(true);
    }
  }
}

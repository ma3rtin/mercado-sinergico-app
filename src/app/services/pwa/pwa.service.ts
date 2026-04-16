import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  showInstallButton = signal<boolean>(false);

  constructor() {
    console.log('PwaService iniciado, esperando evento...');
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('✅ Evento beforeinstallprompt capturado!');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      console.log('⭐ PWA instalada correctamente');
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
    });
  }

  installPwa(): void {
    if (!this.deferredPrompt) {
      return;
    }
    // Mostrar el prompt
    this.deferredPrompt.prompt();
    // Esperar a la respuesta del usuario
    this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó instalar la PWA');
      } else {
        console.log('El usuario canceló la instalación de la PWA');
      }
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
    });
  }
}

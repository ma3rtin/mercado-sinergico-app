import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  showInstallButton = signal<boolean>(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir que el navegador muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      this.deferredPrompt = e;
      // Mostrar el botón de instalación en la UI
      this.showInstallButton.set(true);
    });

    window.addEventListener('appinstalled', () => {
      // Limpiar el prompt guardado
      this.deferredPrompt = null;
      this.showInstallButton.set(false);
      console.log('PWA instalada correctamente');
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

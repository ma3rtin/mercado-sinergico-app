import { Component } from '@angular/core';

@Component({
  selector: 'app-whatsapp-button',
  standalone: true,
  templateUrl: './whatsapp-button.html',
  styleUrl: './whatsapp-button.css'
})
export class WhatsAppButton {
  private telefono = '5491123053347';
  private mensajeBase = 'Hola, estoy interesado/a en comprar algunos productos que vi en la web, me gustaría más info.';

  openWhatsApp(): void {
    const mensajeCodificado = encodeURIComponent(this.mensajeBase);
    const url = `https://wa.me/${this.telefono}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  }
}

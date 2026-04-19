import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, RouterModule, CatalogoWrapperComponent],
  templateUrl: './soporte.html',
})
export class SoporteComponent {
  categories = [
    {
      icon: 'fa-solid fa-box-open',
      title: 'Pedidos y Envíos',
      description: 'Estado de tu pedido, seguimiento y zonas de entrega.',
      link: '#'
    },
    {
      icon: 'fa-solid fa-credit-card',
      title: 'Pagos y Facturación',
      description: 'Métodos de pago, comprobantes y devoluciones.',
      link: '#'
    },
    {
      icon: 'fa-solid fa-user-gear',
      title: 'Mi Cuenta',
      description: 'Gestión de perfil, seguridad y preferencias.',
      link: '#'
    },
    {
      icon: 'fa-solid fa-handshake-angle',
      title: 'Compras Conjuntas',
      description: 'Cómo funcionan los paquetes y el ahorro sinérgico.',
      link: '#'
    }
  ];

  contactOptions = [
    {
      icon: 'fa-brands fa-whatsapp',
      title: 'WhatsApp',
      description: 'Atención inmediata por chat.',
      action: 'https://wa.me/5491123053347?text=Hola!%20Vengo%20desde%20la%20web%20y%20necesito%20ayuda%20del%20soporte.',
      buttonText: 'Escribinos',
      primary: true
    },
    {
      icon: 'fa-solid fa-envelope',
      title: 'Correo Electrónico',
      description: 'Consultas generales y soporte técnico.',
      action: 'mailto:soporte@mercadosinergico.com',
      buttonText: 'Enviar Mail',
      primary: false
    }
  ];
}

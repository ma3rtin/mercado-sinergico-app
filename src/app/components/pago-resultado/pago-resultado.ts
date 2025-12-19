import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '@app/services/pedido/pedido.service';
import { interval, takeWhile } from 'rxjs';

type EstadoPago = 'success' | 'failure' | 'pending';

@Component({
  selector: 'app-pago-resultado',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      @if (verificando) {
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Verificando tu pago...</h2>
          <p class="text-gray-600">Por favor espera un momento</p>
        </div>
      }
      @else if (estadoPago === 'success' && pagoConfirmado) {
        <div class="text-center">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h2>
          <p class="text-gray-600 mb-6">Tu pedido #{{ pedidoId }} ha sido procesado</p>
          <button (click)="irAMisPedidos()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
            Ver mis pedidos
          </button>
        </div>
      }
      @else if (estadoPago === 'pending') {
        <div class="text-center">
          <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Pago pendiente</h2>
          <p class="text-gray-600 mb-2">Tu pedido #{{ pedidoId }} está en proceso</p>
          <p class="text-sm text-gray-500 mb-6">Te notificaremos cuando se confirme el pago</p>
          <button (click)="irAMisPedidos()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
            Ver mis pedidos
          </button>
        </div>
      }
      @else if (estadoPago === 'failure') {
        <div class="text-center">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Pago fallido</h2>
          <p class="text-gray-600 mb-6">Hubo un problema al procesar tu pago</p>
          <div class="space-x-4">
            <button (click)="intentarNuevamente()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
              Intentar nuevamente
            </button>
            <button (click)="irAMisPedidos()" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg">
              Volver
            </button>
          </div>
        </div>
      }
      @else {
        <div class="text-center">
          <p class="text-gray-600">No se pudo verificar el pago. Intentá de nuevo o contactanos.</p>
          <button (click)="irAMisPedidos()" class="mt-4 bg-blue-500 text-white px-6 py-3 rounded-lg">
            Volver a mis pedidos
          </button>
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class PagoResultadoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pedidoService = inject(PedidoService);

  verificando = true;
  pagoConfirmado = false;
  pedidoId: number = 0;
  estadoPago: EstadoPago = 'success';

  ngOnInit() {
    const url = this.router.url;
    if (url.includes('/failure')) {
      this.estadoPago = 'failure';
      this.verificando = false;
    } else if (url.includes('/pending')) {
      this.estadoPago = 'pending';
      this.verificando = false;
    } else {
      this.estadoPago = 'success';
    }

    const externalRef = this.route.snapshot.queryParams['external_reference'];
    this.pedidoId = externalRef || localStorage.getItem('pedido_en_pago');

    if (this.pedidoId && this.estadoPago === 'success') {
      this.verificarEstadoPedido();
    } else if (this.pedidoId) {
      this.verificando = false;
    }
  }

  verificarEstadoPedido() {
    let intentos = 0;
    const maxIntentos = 10;

    interval(2000)
      .pipe(takeWhile(() => intentos < maxIntentos && !this.pagoConfirmado))
      .subscribe(() => {
        intentos++;
        this.pedidoService.getPedidoById(this.pedidoId).subscribe({
          next: (pedido) => {
            const estado = pedido.estado?.nombre?.toLowerCase();
            if (estado === 'pagado' || estado === 'confirmado') {
              this.pagoConfirmado = true;
              this.verificando = false;
              localStorage.removeItem('pedido_en_pago');
            } else if (intentos >= maxIntentos) {
              this.verificando = false;
            }
          },
          error: () => {
            if (intentos >= maxIntentos) {
              this.verificando = false;
            }
          }
        });
      });
  }

  intentarNuevamente() {
    this.router.navigate(['/carrito']);
  }

  irAMisPedidos() {
    localStorage.removeItem('pedido_en_pago');
    this.router.navigate(['/mis-pedidos']);
  }
}

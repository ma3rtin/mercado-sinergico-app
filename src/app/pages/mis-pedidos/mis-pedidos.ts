import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,

} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


// Models
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';

// Services
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastService } from '@app/services/toast/toast.service';

// Shared components
import { PaqueteUsuarioCardComponent } from '@app/shared/paquete-usuario-card/paquete-usuario-card';


// ------------------------------
// MODELOS INTERNOS
// ------------------------------

type ProductoEnPedido = {
  id_producto: number;
  nombre: string;
  precio: number;
  precioConDescuento?: number;
  imagen_url?: string;
  cantidad: number;
  variante?: string | null;
};

interface PedidoDelUsuario extends Pedido {
  expandido?: boolean;
  productosSeleccionados: ProductoEnPedido[];
  subtotal: number;
  total: number;
  descuento: number;
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaqueteUsuarioCardComponent
  ],
  templateUrl: './mis-pedidos.html'
})
export class MisPedidosComponent implements OnInit {

  // ------------------------------
  // INYECCIONES
  // ------------------------------
  private readonly pedidoService = inject(PedidoService);
  private toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  // ------------------------------
  // SIGNALS PRINCIPALES
  // ------------------------------
  pedidos = signal<PedidoDelUsuario[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  terminoBusqueda = signal<string>('');   // <-- nuevo

  // 👉 NO ROMPE NADA del HTML porque tu HTML usa pedidosFiltrados()
  pedidosFiltrados = computed(() => {
    const lista = this.pedidos();
    const t = this.terminoBusqueda().toLowerCase();

    if (!t) return lista;

    return lista.filter(p =>
      p.id_pedido?.toString().includes(t) ||
      p.estado?.nombre?.toLowerCase().includes(t) ||
      p.paquetePublicado?.paqueteBase?.nombre?.toLowerCase().includes(t)
    );
  });





  // ------------------------------
  // INIT
  // ------------------------------
  ngOnInit(): void {
    this.cargarPedidos();
  }

  // ------------------------------
  // CARGA PRINCIPAL
  // ------------------------------
  cargarPedidos(): void {
    this.isLoading.set(true);

    this.pedidoService.getPedidos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async pedidos => {
          const enriched = await Promise.all(pedidos.map(p => this.mapPedido(p)));

          this.pedidos.set(enriched);

          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Error al cargar los pedidos.');
          this.isLoading.set(false);
        }
      });
  }

  // ------------------------------
  // MAPEO / NORMALIZACIÓN
  // ------------------------------
  private async mapPedido(p: Pedido): Promise<PedidoDelUsuario> {

    const productosSeleccionados: ProductoEnPedido[] =
      (p.detalles ?? [])
        .filter(x => x.producto)
        .map(x => {
          const precio = x.producto!.precio;
          const descuento = p.paquetePublicado?.descuento ?? 0;
          const precioConDescuento = precio - (precio * descuento / 100);

          return {
            id_producto: x.productoId,
            nombre: x.producto!.nombre,
            precio,
            precioConDescuento,
            imagen_url: x.producto!.imagen_url,
            cantidad: x.cantidad,
            variante: x.variante ?? null
          };
        });

    const subtotal = this.calcularSubtotal(productosSeleccionados);
    const descuento = p.paquetePublicado?.descuento ?? 0;
    const total = subtotal - (subtotal * descuento / 100);

    return {
      ...p,
      expandido: false,
      productosSeleccionados,
      subtotal,
      total,
      descuento
    };
  }


  // ------------------------------
  // CÁLCULOS
  // ------------------------------
  private calcularSubtotal(productos: ProductoEnPedido[]): number {
    return productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  private recalcularPedido(p: PedidoDelUsuario): void {
    const subtotal = this.calcularSubtotal(p.productosSeleccionados);
    const descuento = p.descuento ?? 0;

    p.subtotal = subtotal;
    p.total = subtotal - (subtotal * descuento / 100);
  }


  // ------------------------------
  // ACCIONES DE UI
  // ------------------------------
  toggleExpansion(pedido: PedidoDelUsuario): void {
    pedido.expandido = !pedido.expandido;
  }

  aumentarCantidad(pedido: PedidoDelUsuario, producto: ProductoEnPedido) {
    // 1. Reemplazar el array sin mutar objetos
    pedido.productosSeleccionados = pedido.productosSeleccionados.map(
      (p: ProductoEnPedido) =>
        p.id_producto === producto.id_producto
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
    );

    // 2. Recalcular totales
    this.recalcularPedido(pedido);

    // 3. Buscar nueva versión del producto (ya actualizada)
    const actualizado = pedido.productosSeleccionados.find(
      (x: ProductoEnPedido) => x.id_producto === producto.id_producto
    )!;

    // 4. Enviar update al backend
    this.pedidoService.actualizarCantidad(
      pedido.id_pedido!,
      actualizado.id_producto,
      { cantidad: actualizado.cantidad, variante: actualizado.variante }
    ).subscribe({
      error: () => {
        // revertir cambios en caso de error
        pedido.productosSeleccionados = pedido.productosSeleccionados.map(
          (p: ProductoEnPedido) =>
            p.id_producto === producto.id_producto
              ? { ...p, cantidad: producto.cantidad }
              : p
        );

        this.recalcularPedido(pedido);
        this.toast.error('No se pudo aumentar la cantidad.');
      }
    });
  }

  disminuirCantidad(pedido: PedidoDelUsuario, producto: ProductoEnPedido) {
    // 1. Reemplazar el array sin mutar objetos
    pedido.productosSeleccionados = pedido.productosSeleccionados.map(
      (p: ProductoEnPedido) =>
        p.id_producto === producto.id_producto
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
    );

    // 2. Recalcular totales
    this.recalcularPedido(pedido);

    // 3. Buscar nueva versión del producto (ya actualizada)
    const actualizado = pedido.productosSeleccionados.find(
      (x: ProductoEnPedido) => x.id_producto === producto.id_producto
    )!;

    // 4. Enviar update al backend
    this.pedidoService.actualizarCantidad(
      pedido.id_pedido!,
      actualizado.id_producto,
      { cantidad: actualizado.cantidad, variante: actualizado.variante }
    ).subscribe({
      error: () => {
        // revertir cambios en caso de error
        pedido.productosSeleccionados = pedido.productosSeleccionados.map(
          (p: ProductoEnPedido) =>
            p.id_producto === producto.id_producto
              ? { ...p, cantidad: producto.cantidad }
              : p
        );

        this.recalcularPedido(pedido);
        this.toast.error('No se pudo disminuir la cantidad.');
      }
    });
  }

  eliminarProducto(pedido: PedidoDelUsuario, producto: ProductoEnPedido) {

  const esUltimoProducto = pedido.productosSeleccionados.length === 1;

  // 🧨 CASO B: último producto → eliminar pedido completo
  if (esUltimoProducto) {
    Swal.fire({
      title: '¿Eliminar pedido completo?',
      html: `
        <p class="mb-2">
          <strong>${producto.nombre}</strong> es el único producto del pedido.
        </p>
        <p>
          Si continuás, se eliminará el pedido completo
          y saldrás del paquete.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar pedido',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then(result => {
      if (!result.isConfirmed) return;

      const paqueteId = pedido.paquetePublicado?.id_paquete_publicado;

      if (!paqueteId) {
        this.toast.error('No se pudo identificar el paquete.');
        return;
      }

      // 👉 reutilizamos la lógica existente
      this.pedidoService
        .salirDelPaquete(paqueteId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.pedidos.set(
              this.pedidos().filter(p => p.id_pedido !== pedido.id_pedido)
            );
            this.toast.success('Pedido eliminado y salida del paquete confirmada.');
          },
          error: () => {
            this.toast.error('No se pudo eliminar el pedido.');
          }
        });
    });

    return;
  }

  // 📦 CASO A: hay más productos → eliminar solo el producto
  Swal.fire({
    title: '¿Eliminar producto?',
    text: producto.nombre,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (!result.isConfirmed) return;

    this.pedidoService
      .eliminarProductoDelPedido(pedido.id_pedido!, producto.id_producto)
      .subscribe({
        next: () => {
          pedido.productosSeleccionados =
            pedido.productosSeleccionados.filter(
              p => p.id_producto !== producto.id_producto
            );

          this.recalcularPedido(pedido);
          this.toast.success('Producto eliminado.');
        },
        error: () => {
          this.toast.error('No se pudo eliminar el producto.');
        }
      });
  });
}


  // ------------------------------
  // NEGOCIO
  // ------------------------------
  salirDelPaquete(pedido: PedidoDelUsuario): void {

    const paqueteId = pedido.paquetePublicado?.id_paquete_publicado;

    if (!paqueteId) {
      this.toast.error('No se pudo identificar el paquete.');
      return;
    }

    Swal.fire({
      title: '¿Salir del paquete?',
      text: 'Perderás los productos reservados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.pedidoService
        .salirDelPaquete(paqueteId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.pedidos.set(
              this.pedidos().filter(p => p.id_pedido !== pedido.id_pedido)
            );
            this.toast.success('Saliste del paquete.');
          },
          error: () => {
            this.toast.error('No se pudo salir del paquete.');
          }
        });
    });
  }

  finalizarCompra(pedido: PedidoDelUsuario) {
  const pedidoId = pedido.id_pedido;

  if (!pedidoId) {
    this.toast.error('Error: ID de pedido no válido');
    return;
  }

  // Opcional: Guardar en localStorage para verificar después
  localStorage.setItem('pedido_en_pago', pedidoId.toString());

  // Llamar al servicio para obtener la preferencia
  this.pedidoService.iniciarCheckout(pedidoId)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        // Redirigir a MercadoPago
        window.location.href = response.checkoutUrl.checkoutUrl;
      },
      error: (err) => {
        this.toast.error('No se pudo iniciar el pago');
        console.error('Error al crear preferencia:', err);
      }
    });
}
  // ------------------------------
  // HELPERS
  // ------------------------------
  onImageError(ev: Event): void {
    (ev.target as HTMLImageElement).src = '/assets/images/placeholder-product.png';
  }

  formatPrice(n: number): string {
    return n.toLocaleString('es-AR');
  }
}

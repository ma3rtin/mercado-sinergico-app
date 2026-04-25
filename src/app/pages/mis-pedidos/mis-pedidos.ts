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
import { ProductoEnPedido } from '@app/models/PedidosInterfaces/ProductoEnPedido';

// Services
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastService } from '@app/services/toast/toast.service';

// Shared components
import { PaqueteUsuarioCardComponent } from '@app/shared/paquete-usuario-card/paquete-usuario-card';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';


import { DelayedSkeleton } from '@app/shared/skeleton/delayed-skeleton';
import { ErrorState } from '@app/shared/error-state/error-state';

import { PaginationComponent } from '@app/shared/paginacion/paginacion';

// ------------------------------
// MODELOS INTERNOS
// ------------------------------

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
    PaqueteUsuarioCardComponent,
    CatalogoWrapperComponent,
    DelayedSkeleton,
    ErrorState,
    PaginationComponent
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
  terminoBusqueda = signal<string>('');
  estadoFiltro = signal<string>('Todos');

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(10);

  pedidosFiltrados = computed(() => {
    const lista = this.pedidos();
    const t = this.terminoBusqueda().toLowerCase();
    const estado = this.estadoFiltro();

    let filtrados = lista;

    // Filtro por estado
    if (estado !== 'Todos') {
      filtrados = filtrados.filter(p => p.estado?.nombre === estado);
    }

    // Filtro por texto
    if (t) {
      filtrados = filtrados.filter(p =>
        p.id_pedido?.toString().includes(t) ||
        p.estado?.nombre?.toLowerCase().includes(t) ||
        p.paquetePublicado?.paqueteBase?.nombre?.toLowerCase().includes(t)
      );
    }

    return filtrados;
  });

  pedidosPaginados = computed(() => {
    const page = this.paginaActual();
    const perPage = this.itemsPorPagina();
    const filtrados = this.pedidosFiltrados();

    const start = (page - 1) * perPage;
    return filtrados.slice(start, start + perPage);
  });

  totalItemsPaginacion = computed(() => this.pedidosFiltrados().length);

  cambiarBusqueda(texto: string) {
    this.terminoBusqueda.set(texto);
    this.paginaActual.set(1);
  }

  cambiarEstadoFiltro(estado: string) {
    this.estadoFiltro.set(estado);
    this.paginaActual.set(1);
  }

  onPageChange(page: number): void {
    this.paginaActual.set(page);
  }

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
        error: (error) => {

          if (error.name === 'TimeoutError') {
            this.errorMessage.set('El servidor no respondió a tiempo. Por favor, intentá de nuevo.');
          }
          else if (error.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor. Verificá tu conexión.');
          }
          else if (error.status >= 500) {
            this.errorMessage.set('Error interno del servidor. Intentá más tarde.');
          }
          else {
            this.errorMessage.set('Ocurrió un error inesperado.');
          }

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
            id_detalle: x.id, // <-- agregamos el id real del detalle
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
        p.id_detalle === producto.id_detalle
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
    );

    // 2. Recalcular totales
    this.recalcularPedido(pedido);

    // 3. Buscar nueva versión del producto (ya actualizada)
    const actualizado = pedido.productosSeleccionados.find(
      (x: ProductoEnPedido) => x.id_detalle === producto.id_detalle
    )!;

    // 4. Enviar update al backend
    this.pedidoService.actualizarCantidad(
      pedido.id_pedido!,
      actualizado.id_detalle,
      { cantidad: actualizado.cantidad }
    ).subscribe({
      error: () => {
        // revertir cambios en caso de error
        pedido.productosSeleccionados = pedido.productosSeleccionados.map(
          (p: ProductoEnPedido) =>
            p.id_detalle === producto.id_detalle
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
        p.id_detalle === producto.id_detalle
          ? { ...p, cantidad: p.cantidad - 1 }
          : p
    );

    // 2. Recalcular totales
    this.recalcularPedido(pedido);

    // 3. Buscar nueva versión del producto (ya actualizada)
    const actualizado = pedido.productosSeleccionados.find(
      (x: ProductoEnPedido) => x.id_detalle === producto.id_detalle
    )!;

    // 4. Enviar update al backend
    this.pedidoService.actualizarCantidad(
      pedido.id_pedido!,
      actualizado.id_detalle,
      { cantidad: actualizado.cantidad }
    ).subscribe({
      error: () => {
        // revertir cambios en caso de error
        pedido.productosSeleccionados = pedido.productosSeleccionados.map(
          (p: ProductoEnPedido) =>
            p.id_detalle === producto.id_detalle
              ? { ...p, cantidad: producto.cantidad }
              : p
        );

        this.recalcularPedido(pedido);
        this.toast.error('No se pudo disminuir la cantidad.');
      }
    });
  }

  setCantidadManual(pedido: PedidoDelUsuario, payload: any) {
    const nuevaCantidad = payload.nuevaCantidad;
    const productoOriginal = pedido.productosSeleccionados.find(p => p.id_detalle === payload.id_detalle);
    if (!productoOriginal) return;
    
    const cantidadAnterior = productoOriginal.cantidad;

    // 1. Reemplazar array sin mutar objetos
    pedido.productosSeleccionados = pedido.productosSeleccionados.map(
      (p: ProductoEnPedido) =>
        p.id_detalle === payload.id_detalle
          ? { ...p, cantidad: nuevaCantidad }
          : p
    );

    // 2. Recalcular
    this.recalcularPedido(pedido);

    // 3. Update backend
    this.pedidoService.actualizarCantidad(
      pedido.id_pedido!,
      payload.id_detalle,
      { cantidad: nuevaCantidad }
    ).subscribe({
      error: () => {
        // revertir
        pedido.productosSeleccionados = pedido.productosSeleccionados.map(
          (p: ProductoEnPedido) =>
            p.id_detalle === payload.id_detalle
              ? { ...p, cantidad: cantidadAnterior }
              : p
        );
        this.recalcularPedido(pedido);
        this.toast.error('No se pudo actualizar la cantidad.');
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
        confirmButtonColor: 'var(--error)'
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
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.pedidoService
        .eliminarProductoDelPedido(pedido.id_pedido!, producto.id_detalle)
        .subscribe({
          next: () => {
            pedido.productosSeleccionados =
              pedido.productosSeleccionados.filter(
                p => p.id_detalle !== producto.id_detalle
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
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)'
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

  solicitarReembolso(pedido: PedidoDelUsuario): void {
    const pedidoId = pedido.id_pedido;
    if (!pedidoId) return;

    Swal.fire({
      title: '¿Solicitar reembolso?',
      html: `<p>¿Seguro que querés pedir el reembolso de tu pedido en <strong>${pedido.paquetePublicado?.paqueteBase?.nombre ?? 'este paquete'}</strong>?</p>
             <p class="text-sm text-gray-500 mt-2">Si se aprueba, se devolverá el dinero a tu cuenta de Mercado Pago.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, pedir reembolso',
      confirmButtonColor: 'var(--error)',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.pedidoService.solicitarReembolso(pedidoId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Reembolso solicitado correctamente. Recibirás un email de confirmación.', '¡Listo!');
            this.cargarPedidos();
          },
          error: () => {
            this.toast.error('No se pudo procesar el reembolso. Intentá más tarde.');
          }
        });
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

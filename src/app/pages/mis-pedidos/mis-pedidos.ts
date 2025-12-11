import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

// Models
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';

// Services
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastrService } from 'ngx-toastr';

// Shared components
import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';
import {
  BuscadorComponent,
  ConfigBuscador,
  OpcionSelect
} from "@app/shared/buscador/buscador";
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
    BreadcrumbComponent,
    BuscadorComponent,
    PaqueteUsuarioCardComponent
  ],
  templateUrl: './mis-pedidos.html'
})
export class MisPedidosComponent implements OnInit {

  // ------------------------------
  // INYECCIONES
  // ------------------------------
  private readonly pedidoService = inject(PedidoService);
  private readonly toastr = inject(ToastrService);
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

  @ViewChild(BuscadorComponent) buscador!: BuscadorComponent<any>;

  // ------------------------------
  // CONFIG BUSCADOR
  // ------------------------------
  configBuscador: ConfigBuscador<PedidoDelUsuario> = {
    obtenerDatos: () => of(this.pedidos()),
    filtrar: () => [], // ya no filtra aquí — ahora filtramos con computed
    mapear: (p: PedidoDelUsuario): OpcionSelect => ({
      id: p.id_pedido!,
      etiqueta: `Pedido #${p.id_pedido} (${p.estado?.nombre})`,
      grupo: p.estado?.nombre ?? 'Estado'
    }),
    debounceMs: 300
  };

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

          queueMicrotask(() => this.buscador?.recargarDatos());

          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set("Error al cargar los pedidos.");
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
  // BUSCADOR
  // ------------------------------
  onBuscadorCambio(opcion: OpcionSelect | OpcionSelect[] | null) {
    if (!opcion) {
      this.terminoBusqueda.set('');
      return;
    }
    const selected = Array.isArray(opcion) ? opcion[0] : opcion;
    this.terminoBusqueda.set(selected.etiqueta ?? '');
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
        this.toastr.error("No se pudo aumentar la cantidad.");
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
        this.toastr.error("No se pudo disminuir la cantidad.");
      }
    });
  }

  // ------------------------------
  // NEGOCIO
  // ------------------------------
  eliminarPedido(pedido: PedidoDelUsuario): void {
    Swal.fire({
      title: "¿Eliminar pedido?",
      text: `Eliminarás el pedido #${pedido.id_pedido}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    }).then(result => {
      if (result.isConfirmed) {
        const nuevos = this.pedidos().filter(p => p.id_pedido !== pedido.id_pedido);
        this.pedidos.set(nuevos);
        this.toastr.success("Pedido eliminado.");
      }
    });
  }

  finalizarCompra(p: PedidoDelUsuario) {
    console.log("Finalizar compra:", p.id_pedido);
  }

  // ------------------------------
  // HELPERS
  // ------------------------------
  onImageError(ev: Event): void {
    (ev.target as HTMLImageElement).src = "/assets/images/placeholder-product.png";
  }

  formatPrice(n: number): string {
    return n.toLocaleString("es-AR");
  }
}

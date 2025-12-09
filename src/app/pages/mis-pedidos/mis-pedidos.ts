import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Models
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PedidoProducto } from '@app/models/PedidosInterfaces/PedidoProducto';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { ToastrService } from 'ngx-toastr';

// Shared components
import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';
import { BuscadorComponent, ConfigBuscador, OpcionSelect } from "@app/shared/buscador/buscador";
import { PedidoCard } from '@app/shared/pedido-card/pedido-card';


// ------------------------------
// INTERNAS
// ------------------------------

interface ProductoEnPedido extends Producto {
  cantidad: number;
  variante?: string;
}

interface PedidoDelUsuario extends Pedido {
  expandido?: boolean;

  productosSeleccionados: ProductoEnPedido[];

  precioTotal: number;
  precioFinal: number;
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
    PedidoCard
  ],
  templateUrl: './mis-pedidos.html'
})
export class MisPedidosComponent implements OnInit {

  // ------------------------------
  // INYECCIONES
  // ------------------------------
  private readonly pedidoService = inject(PedidoService);
  private readonly productosService = inject(ProductosService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // ------------------------------
  // SIGNALS
  // ------------------------------
  pedidos = signal<PedidoDelUsuario[]>([]);
  pedidosFiltrados = signal<PedidoDelUsuario[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  tienePedidos = computed(() => this.pedidos().length > 0);


  // ------------------------------
  // BUSCADOR
  // ------------------------------
  configBuscador: ConfigBuscador<Pedido> = {
    obtenerDatos: () => this.pedidoService.getPedidos(),

    filtrar: (pedidos: Pedido[], termino: string) => {
      const t = termino.toLowerCase();
      return pedidos.filter(p =>
        p.id_pedido?.toString().includes(t) ||
        p.estado?.nombre?.toLowerCase().includes(t) ||
        p.paquetePublicado?.paqueteBase?.nombre?.toLowerCase().includes(t)
      );
    },

    mapear: (p: Pedido): OpcionSelect => ({
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
          const enriched = await Promise.all(
            pedidos.map(p => this.enriquecerPedido(p))
          );

          this.pedidos.set(enriched);
          this.pedidosFiltrados.set(enriched);
          this.isLoading.set(false);
        },
        error: err => {
          console.error(err);
          this.errorMessage.set("Error al cargar los pedidos.");
          this.isLoading.set(false);
        }
      });
  }

  // ------------------------------
  // ENRIQUECER PEDIDO
  // ------------------------------
  private async enriquecerPedido(p: Pedido): Promise<PedidoDelUsuario> {

    // Convertir pedidoProductos[] → productosSeleccionados[]
    const productosSeleccionados: ProductoEnPedido[] =
      (p.pedidoProductos ?? [])
        .filter(x => !!x.producto)
        .map(x => ({
          ...x.producto!,
          cantidad: x.cantidad,
          variante: x.variante
        }));

    const precioTotal = this.calcularSubtotal(productosSeleccionados);

    return {
      ...p,
      expandido: false,
      productosSeleccionados,
      precioTotal,
      precioFinal: precioTotal,
      descuento: 0
    };
  }

  // ------------------------------
  // BUSCADOR
  // ------------------------------
  onBuscadorCambio(opcion: OpcionSelect | OpcionSelect[] | null) {
    if (!opcion) {
      this.pedidosFiltrados.set(this.pedidos());
      return;
    }
    const selected = Array.isArray(opcion) ? opcion[0] : opcion;

    const filtrado = this.pedidos().filter(p => p.id_pedido === selected.id);
    this.pedidosFiltrados.set(filtrado);
  }


  // ------------------------------
  // CÁLCULOS
  // ------------------------------
  private calcularSubtotal(productos: ProductoEnPedido[]): number {
    return productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  }

  private recalcularPedido(p: PedidoDelUsuario): void {
    p.precioTotal = this.calcularSubtotal(p.productosSeleccionados);
    p.precioFinal = p.precioTotal;
  }


  // ------------------------------
  // UI ACTIONS
  // ------------------------------
  toggleExpansion(pedido: PedidoDelUsuario): void {
    pedido.expandido = !pedido.expandido;
  }

  aumentarCantidad(pedido: PedidoDelUsuario, producto: ProductoEnPedido): void {
    producto.cantidad++;
    this.recalcularPedido(pedido);
  }

  disminuirCantidad(pedido: PedidoDelUsuario, producto: ProductoEnPedido): void {
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.recalcularPedido(pedido);
    }
  }


  // ------------------------------
  // NEGOCIO
  // ------------------------------
  actualizarPedido(pedido: PedidoDelUsuario): void {
    this.toastr.success("Pedido actualizado.");
  }

  eliminarPedido(pedido: PedidoDelUsuario): void {
    Swal.fire({
      title: "¿Eliminar pedido?",
      text: `Eliminarás el pedido #${pedido.id_pedido}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    }).then(result => {
      if (result.isConfirmed) {
        const nuevos = this.pedidos().filter(p => p.id_pedido !== pedido.id_pedido);
        this.pedidos.set(nuevos);
        this.pedidosFiltrados.set(nuevos);
        this.toastr.success("Pedido eliminado.");
      }
    });
  }


  // ------------------------------
  // HELPERS
  // ------------------------------
  onImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = "/assets/images/placeholder-product.png";
  }

  formatPrice(n: number): string {
    return n.toLocaleString("es-AR");
  }
}

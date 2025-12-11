import { Component, OnInit, inject, signal, computed, DestroyRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

// Models
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { ToastrService } from 'ngx-toastr';

// Shared components
import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';
import { BuscadorComponent, ConfigBuscador, OpcionSelect } from "@app/shared/buscador/buscador";
import { PaqueteUsuarioCardComponent } from '@app/shared/paquete-usuario-card/paquete-usuario-card';

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
  // SIGNALS
  // ------------------------------
  pedidos = signal<PedidoDelUsuario[]>([]);
  pedidosFiltrados = signal<PedidoDelUsuario[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  tienePedidos = computed(() => this.pedidos().length > 0);

  @ViewChild(BuscadorComponent) buscador!: BuscadorComponent<any>;


  // ------------------------------
  // BUSCADOR
  // ------------------------------

  configBuscador: ConfigBuscador<PedidoDelUsuario> = {
    obtenerDatos: () => of(this.pedidos()),

    filtrar: (pedidos: PedidoDelUsuario[], termino: string) => {
      const t = termino.toLowerCase();
      return pedidos.filter(p =>
        p.id_pedido?.toString().includes(t) ||
        p.estado?.nombre?.toLowerCase().includes(t) ||
        p.paquetePublicado?.paqueteBase?.nombre?.toLowerCase().includes(t)
      );
    },

    mapear: (p: PedidoDelUsuario): OpcionSelect => ({
      id: p.id_pedido!,
      etiqueta: `Pedido #${p.id_pedido} (${p.estado?.nombre})`,
      grupo: p.estado?.nombre ?? 'Estado'
    }),

    debounceMs: 300
  };

  marcas: any[] = [];
  categorias: any[] = [];

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
          setTimeout(() => this.buscador?.recargarDatos(), 0);

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

  finalizarCompra(pedido: PedidoDelUsuario) {
    console.log("Finalizar compra del pedido:", pedido.id_pedido);
  }

  // ------------------------------
  // HELPERS
  // ------------------------------
  onImageError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    img.src = "/assets/images/placeholder-product.png";
  }

  onPagarPedido(idPedido: number) {
    console.log("Botón pagar presionado, pedido:", idPedido);
  }

  formatPrice(n: number): string {
    return n.toLocaleString("es-AR");
  }
}

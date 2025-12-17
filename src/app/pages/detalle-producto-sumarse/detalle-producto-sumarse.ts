import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { VisorImagenesComponent } from '@app/shared/visor-imagenes/visor-imagenes-component';

import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';

// Models
import { Producto } from '@models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '@app/services/pedido/pedido.service';

@Component({
  selector: 'app-detalle-producto-sumarse',
  imports: [
    CurrencyPipe,
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    VisorImagenesComponent
  ],
  templateUrl: './detalle-producto-sumarse.html',
  standalone: true
})
export class DetalleProductoSumarse implements OnInit {
  // 🔧 Services
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productosService = inject(ProductosService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly pedidoService = inject(PedidoService);
  private toastr = inject(ToastrService);

  // 🚀 Signals - Datos principales
  producto = signal<Producto | undefined>(undefined);
  paqueteSeleccionado = signal<PaquetePublicado | undefined>(undefined);
  paquetesRelacionados = signal<PaquetePublicado[]>([]);

  // 🚀 Signals - Estados de UI
  isLoading = signal(true);
  errorMessage = signal('');
  currentImageIndex = signal(0);
  selectedSize = signal('S');
  selectedColor = signal('Rojo');
  quantity = signal(1);
  showFullDescription = signal(false);

  // 🧩 Computed signals
  hasProducto = computed(() => !!this.producto());
  hasPaqueteSeleccionado = computed(() => !!this.paqueteSeleccionado());
  maxQuantity = computed(() => 25);
  minQuantity = computed(() => 1);

  private productoCargado = signal(false);
  private paqueteCargado = signal(false);

  // Información del paquete seleccionado
  participantesActuales = computed(() => {
    const paquete = this.paqueteSeleccionado();
    return paquete?.cant_usuarios_registrados || 0;
  });

  maxParticipantes = computed(() => {
    const paquete = this.paqueteSeleccionado();
    return paquete?.cant_productos || 0;
  });

  faltanParaCerrar = computed(() => {
    return this.maxParticipantes() - this.participantesActuales();
  });

  zonaDelPaquete = computed(() => {
    return this.paqueteSeleccionado()?.zona?.nombre || 'Sin zona';
  });

  estadoDelPaquete = computed(() => {
    return this.paqueteSeleccionado()?.estado?.nombre || 'Sin estado';
  });

  fechaCierre = computed(() => {
    const paquete = this.paqueteSeleccionado();
    if (!paquete?.fecha_fin) return '';

    return new Date(paquete.fecha_fin).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  });
  ngOnInit(): void {
    const productoId = Number(this.route.snapshot.paramMap.get('productoId'));
    const paqueteId = Number(this.route.snapshot.paramMap.get('paqueteId'));

    if (!productoId || !paqueteId) {
      this.errorMessage.set('Parámetros inválidos');
      this.isLoading.set(false);
      return;
    }

    this.loadProducto(productoId);
    this.loadPaqueteSeleccionado(paqueteId);
    this.loadPaquetesRelacionados();
  }

  // 🧠 Control centralizado del loading
  private finalizarCarga(): void {
    if (this.productoCargado() && this.paqueteCargado()) {
      this.isLoading.set(false);
    }
  }

  // 📦 Producto
  private loadProducto(id: number): void {
    this.productosService.getProductoDetalle(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('🟢 PRODUCTO DETALLE RECIBIDO:', response);

          // ⚠️ IMPORTANTE: el producto viene dentro de response
          this.producto.set(response.producto);

          this.productoCargado.set(true);
          this.finalizarCarga();
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar el producto');
          this.isLoading.set(false);
        }
      });
  }

  // 📦 Paquete + validación producto
  private loadPaqueteSeleccionado(id: number): void {
    this.paquetePublicadoService.getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          const paquete = paquetes.find(p => p.id_paquete_publicado === id);

          if (!paquete) {
            this.errorMessage.set('Paquete no encontrado');
            this.isLoading.set(false);
            return;
          }

          this.paqueteSeleccionado.set(paquete);
          this.paqueteCargado.set(true);
          this.finalizarCarga();
        },
        error: () => {
          this.errorMessage.set('No se pudo cargar el paquete');
          this.isLoading.set(false);
        }
      });
  }

  private loadPaquetesRelacionados(): void {
    console.log('🔄 Cargando paquetes relacionados...');

    this.paquetePublicadoService.getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes relacionados cargados:', paquetes.length);
          // Filtrar solo paquetes abiertos
          const paquetesAbiertos = paquetes.filter(
            p => p.estado?.nombre?.toLowerCase() === 'abierto' ||
              p.estado?.nombre?.toLowerCase() === 'activo'
          );
          this.paquetesRelacionados.set(paquetesAbiertos.slice(0, 4)); // Solo 4
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes relacionados:', error);
          this.paquetesRelacionados.set([]);
        }
      });
  }

  // 🎨 MÉTODOS DE SELECCIÓN
  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  selectColor(color: string): void {
    this.selectedColor.set(color);
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSize() === size;
  }

  isColorSelected(color: string): boolean {
    return this.selectedColor() === color;
  }

  // 🔢 MÉTODOS DE CANTIDAD
  changeQuantity(delta: number): void {
    const newQuantity = this.quantity() + delta;
    const min = this.minQuantity();
    const max = this.maxQuantity();

    if (newQuantity >= min && newQuantity <= max) {
      this.quantity.set(newQuantity);
    }
  }

  // 🛒 ACCIONES
  addToCart(): void {
    const producto = this.producto();
    const paquete = this.paqueteSeleccionado();

    if (!producto || !paquete) {
      this.toastr.error('Producto o paquete no disponible');
      return;
    }

    if (!producto.id_producto) {
      this.toastr.error('Producto inválido');
      return;
    }

    const body = {
      productoId: producto.id_producto, // ✅ ahora es number seguro
      cantidad: this.quantity(),
      variante: this.selectedSize()
    };

    this.pedidoService
      .sumarseAlPaquete(paquete.id_paquete_publicado!, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Te sumaste al paquete con éxito');
          this.router.navigate(['mis-pedidos']);
        },
        error: (err) => {
          console.error('❌ Error al sumarse:', err);
          this.toastr.error('No se pudo crear el pedido');
        }
      });
  }
  
  goBack(): void {
    const paqueteId = this.paqueteSeleccionado()?.id_paquete_publicado;

    if (paqueteId) {
      this.router.navigate(['detalleSeleccionProducto', this.producto()?.id_producto]);
    } else {
      this.router.navigate(['paquetes']);
    }
  }

  navegarAPaquete(paqueteId?: number): void {
    if (!paqueteId) {
      console.error('❌ ID de paquete inválido');
      return;
    }

    const productoId = this.producto()?.id_producto;

    if (productoId) {
      this.toastr.info('Página en construcción. Pronto podrás ver los detalles del paquete <3.');
      // Recargar datos
      this.loadPaqueteSeleccionado(paqueteId);
    }
  }

  toggleDescription(): void {
    this.showFullDescription.set(!this.showFullDescription());
  }

  // 🎨 MÉTODOS DE ESTILO
  getSizeButtonClass(size: string): string {
    return `px-4 py-2 border-2 rounded-lg hover:shadow-secondary-dark hover:bg-white transition-all ${this.isSizeSelected(size)
      ? 'border-secondary-dark text-secondary-dark shadow-md shadow-secondary-dark'
      : 'border-gray-300 text-gray-700 hover:text-secondary-dark'
      }`;
  }

  getColorButtonClass(color: string): string {
    return `border-2 rounded-lg hover:shadow-secondary-dark transition-colors ${this.isColorSelected(color)
      ? 'border-secondary-dark shadow-md shadow-secondary-dark'
      : 'border-gray-300'
      }`;
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600';

    const estadoLower = estado.toLowerCase();

    const clases: Record<string, string> = {
      'abierto': 'text-primary',
      'activo': 'text-primary',
      'cerrado': 'text-red-600',
      'próximo a cerrar': 'text-secondary-dark',
      'pendiente': 'text-yellow-600'
    };

    return clases[estadoLower] || 'text-gray-600';
  }

  getEstadoBadgeClass(estado?: string): string {
    if (!estado) return 'w-3 h-3 bg-gray-400 rounded-full';

    const estadoLower = estado.toLowerCase();

    const clases: Record<string, string> = {
      'abierto': 'w-3 h-3 bg-primary rounded-full',
      'activo': 'w-3 h-3 bg-primary rounded-full',
      'cerrado': 'w-3 h-3 bg-red-500 rounded-full',
      'próximo a cerrar': 'w-3 h-3 bg-yellow-500 rounded-full',
      'pendiente': 'w-3 h-3 bg-yellow-400 rounded-full'
    };

    return clases[estadoLower] || 'w-3 h-3 bg-gray-400 rounded-full';
  }

  // 🖼️ MANEJO DE IMÁGENES
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }

  // 💰 FORMATO DE PRECIO
  formatPrice(price?: number): string {
    if (!price) return '$0';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }
}
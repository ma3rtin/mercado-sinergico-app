import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// Components
import { VisorImagenesComponent } from '@app/shared/visor-imagenes/visor-imagenes-component';
import { BreadcrumbComponent } from '@app/shared/breadcrumb/breadcrumb-component';
import { IconComponent } from '@app/shared/icono/icono';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { SelectorVariantesComponent, VariantesSeleccionadas } from '@app/shared/selector-variantes/selector-variantes'; // Models
import { Producto } from '@models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastService } from '@app/services/toast/toast.service';


@Component({
  selector: 'app-detalle-producto-sumarse',
  imports: [
    CommonModule,
    FormsModule,
    VisorImagenesComponent,
    IconComponent,
    PaqueteCard,
    SelectorVariantesComponent // 🆕
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
    private toast = inject(ToastService);

  // 🚀 Signals - Datos principales
  producto = signal<Producto | undefined>(undefined);
  paqueteSeleccionado = signal<PaquetePublicado | undefined>(undefined);
  paquetesRelacionados = signal<PaquetePublicado[]>([]);

  // 🚀 Signals - Estados de UI
  isLoading = signal(true);
  errorMessage = signal('');
  currentImageIndex = signal(0);
  quantity = signal(1);
  showFullDescription = signal(false);

  // 🆕 NUEVO: Signals para variantes
  variantesSeleccionadas = signal<VariantesSeleccionadas>({});
  variantesValidas = signal(false);

  private productoCargado = signal(false);
  private paqueteCargado = signal(false);

  // 🧩 Computed signals
  hasProducto = computed(() => !!this.producto());
  hasPaqueteSeleccionado = computed(() => !!this.paqueteSeleccionado());
  maxQuantity = computed(() => 25);
  minQuantity = computed(() => 1);

  // 🆕 NUEVO: Computed para verificar si el producto tiene variantes
  productoTieneVariantes = computed(() => {
    const prod = this.producto();
    return !!(prod?.plantilla?.caracteristicas && prod.plantilla.caracteristicas.length > 0);
  });

  // 🆕 NUEVO: Computed para habilitar/deshabilitar botón de sumarse
  puedeAgregarAlCarrito = computed(() => {
    // Si el producto no tiene variantes, siempre puede agregar
    if (!this.productoTieneVariantes()) {
      return true;
    }

    // Si tiene variantes, debe tener todas las variantes seleccionadas
    return this.variantesValidas();
  });

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
    const paqueteId = Number(this.route.snapshot.paramMap.get('paqueteId'));
    if (!paqueteId) return;

    console.log('🔄 Cargando paquetes relacionados desde backend...');

    this.paquetePublicadoService.getRelacionados(paqueteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes relacionados cargados:', paquetes.length);
          this.paquetesRelacionados.set(paquetes);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes relacionados:', error);
          this.paquetesRelacionados.set([]);
        }
      });
  }

  // 🆕 NUEVO: Handlers para eventos del selector de variantes
  onVariantesChange(variantes: VariantesSeleccionadas): void {
    console.log('🎨 Variantes seleccionadas:', variantes);
    this.variantesSeleccionadas.set(variantes);
  }

  onVariantesValidoChange(valido: boolean): void {
    console.log('✅ Variantes válidas:', valido);
    this.variantesValidas.set(valido);
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

  // 🛒 ACCIÓN PRINCIPAL: Sumarse al paquete
  addToCart(): void {
    const producto = this.producto();
    const paquete = this.paqueteSeleccionado();

    if (!producto || !paquete) {
      this.toast.error('Producto o paquete no disponible');
      return;
    }

    if (!producto.id_producto) {
      this.toast.error('Producto inválido');
      return;
    }

    // 🆕 VALIDAR VARIANTES
    if (this.productoTieneVariantes() && !this.variantesValidas()) {
      this.toast.error('Debes seleccionar todas las variantes del producto');
      return;
    }

    // 🆕 CONSTRUIR BODY CON VARIANTES
    const body = {
      productoId: producto.id_producto,
      cantidad: this.quantity(),
      variantes: this.productoTieneVariantes()
        ? this.variantesSeleccionadas()
        : undefined // Si no tiene variantes, no enviar el campo
    };

    console.log('🛒 Body del pedido:', body);

    // 🚨 TODO: BACKEND - Conectar con el endpoint real
    // El backend debe aceptar el campo "variantes" en el body
    // Endpoint esperado: POST /api/pedidos/sumarse-paquete
    this.pedidoService
      .sumarseAlPaquete(paquete.id_paquete_publicado!, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Te sumaste al paquete con éxito');
          this.router.navigate(['mis-pedidos']);
        },
        error: (err) => {
          console.error('❌ Error al sumarse:', err);
          this.toast.error(err.error?.message || 'No se pudo crear el pedido');
        }
      });
  }

  goBack(): void {
    const paqueteId = this.paqueteSeleccionado()?.id_paquete_publicado;

    if (paqueteId) {
      this.router.navigate(['producto', this.producto()?.id_producto]);
    } else {
      this.router.navigate(['paquetes']);
    }
  }

  // 🎯 Navegación a productos del paquete
  onPaqueteClick(paqueteId: number): void {
    console.log('🔗 Navegando a paquete:', paqueteId);
    this.router.navigate(['paquete/', paqueteId, 'productos']);
  }

  toggleDescription(): void {
    this.showFullDescription.set(!this.showFullDescription());
  }

  // 🎨 MÉTODOS DE ESTILO
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

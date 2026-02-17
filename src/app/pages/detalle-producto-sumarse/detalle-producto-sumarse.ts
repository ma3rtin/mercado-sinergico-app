import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// Components
import { VisorImagenesComponent } from '@app/shared/visor-imagenes/visor-imagenes-component';
import { IconComponent } from '@app/shared/icono/icono';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { SelectorVariantesComponent, VariantesSeleccionadas } from '@app/shared/selector-variantes/selector-variantes';

// Models
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
    SelectorVariantesComponent,
  ],
  templateUrl: './detalle-producto-sumarse.html',
  standalone: true
})
export class DetalleProductoSumarse implements OnInit {

  // 🔧 Services
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);   // ✅ igual que productos-del-paquete
  private readonly productosService = inject(ProductosService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly pedidoService = inject(PedidoService);
  private readonly toast = inject(ToastService);

  // ✅ igual que productos-del-paquete
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // IDs guardados para reutilizar sin volver a leer la ruta
  private currentPaqueteId = signal<number>(0);
  private currentProductoId = signal<number>(0);

  // 🚀 Signals
  producto = signal<Producto | undefined>(undefined);
  paqueteSeleccionado = signal<PaquetePublicado | undefined>(undefined);
  paquetesRelacionados = signal<PaquetePublicado[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  quantity = signal(1);
  showFullDescription = signal(false);
  variantesSeleccionadas = signal<VariantesSeleccionadas>({});
  variantesValidas = signal(false);


  private productoCargado = signal(false);
  private paqueteCargado = signal(false);

  // 🧩 Computed
  hasProducto = computed(() => !!this.producto());
  hasPaqueteSeleccionado = computed(() => !!this.paqueteSeleccionado());
  maxQuantity = computed(() => 25);
  minQuantity = computed(() => 1);

  productoTieneVariantes = computed(() => {
    const prod = this.producto();
    return !!(prod?.plantilla?.caracteristicas && prod.plantilla.caracteristicas.length > 0);
  });

  puedeAgregarAlCarrito = computed(() => {
    if (!this.productoTieneVariantes()) return true;
    return this.variantesValidas();
  });

  participantesActuales = computed(() => this.paqueteSeleccionado()?.cant_usuarios_registrados || 0);
  maxParticipantes = computed(() => this.paqueteSeleccionado()?.cant_productos || 0);
  faltanParaCerrar = computed(() => this.maxParticipantes() - this.participantesActuales());
  zonaDelPaquete = computed(() => this.paqueteSeleccionado()?.zona?.nombre || 'Sin zona');
  estadoDelPaquete = computed(() => this.paqueteSeleccionado()?.estado?.nombre || 'Sin estado');

  fechaCierre = computed(() => {
    const paquete = this.paqueteSeleccionado();
    if (!paquete?.fecha_fin) return '';
    return new Date(paquete.fecha_fin).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    });
  });

  ngOnInit(): void {
    // ✅ CLAVE: igual que productos-del-paquete que SÍ funciona
    if (!this.isBrowser) return;

    // ✅ paramMap observable, NO snapshot
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const productoId = Number(params.get('productoId'));
        const paqueteId = Number(params.get('paqueteId'));

        console.log('🔢 IDs desde paramMap:', { productoId, paqueteId });

        if (!productoId || !paqueteId || isNaN(productoId) || isNaN(paqueteId)) {
          console.error('❌ Parámetros inválidos:', { productoId, paqueteId });
          this.errorMessage.set('Parámetros inválidos');
          this.isLoading.set(false);
          return;
        }

        // Guardar IDs
        this.currentProductoId.set(productoId);
        this.currentPaqueteId.set(paqueteId);

        // Resetear estado antes de cargar
        this.productoCargado.set(false);
        this.paqueteCargado.set(false);
        this.isLoading.set(true);
        this.errorMessage.set('');
        this.producto.set(undefined);
        this.paqueteSeleccionado.set(undefined);

        this.loadProducto(productoId);
        this.loadPaqueteSeleccionado(paqueteId);
        this.loadPaquetesRelacionados(paqueteId); // ✅ recibe el ID como parámetro
      });
  }

  private finalizarCarga(): void {
    if (this.productoCargado() && this.paqueteCargado()) {
      console.log('✅ Carga finalizada');
      this.isLoading.set(false);
    }
  }

  private loadProducto(id: number): void {
    console.log('📦 Cargando producto ID:', id);

    this.productosService.getProductoDetalle(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('🟢 Producto cargado:', response);
          this.producto.set(response.producto);
          this.productoCargado.set(true);
          this.finalizarCarga();
        },
        error: (error) => {
          console.error('❌ Error cargando producto:', error);
          this.errorMessage.set('No se pudo cargar el producto');
          this.isLoading.set(false);
        }
      });
  }

  private loadPaqueteSeleccionado(id: number): void {
    console.log('📦 Cargando paquete ID:', id);

    this.paquetePublicadoService.getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          const paquete = paquetes.find(p => p.id_paquete_publicado === id);

          if (!paquete) {
            console.error('❌ Paquete no encontrado con ID:', id);
            this.errorMessage.set('Paquete no encontrado');
            this.isLoading.set(false);
            return;
          }

          console.log('✅ Paquete encontrado:', paquete);
          this.paqueteSeleccionado.set(paquete);
          this.paqueteCargado.set(true);
          this.finalizarCarga();
        },
        error: (error) => {
          console.error('❌ Error cargando paquete:', error);
          this.errorMessage.set('No se pudo cargar el paquete');
          this.isLoading.set(false);
        }
      });
  }

  // ✅ Recibe paqueteId como parámetro (no snapshot)
  private loadPaquetesRelacionados(paqueteId: number): void {
    this.paquetePublicadoService.getRelacionados(paqueteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          this.paquetesRelacionados.set(paquetes);
        },
        error: () => {
          this.paquetesRelacionados.set([]);
        }
      });
  }

  onVariantesChange(variantes: VariantesSeleccionadas): void {
    this.variantesSeleccionadas.set(variantes);
  }

  onVariantesValidoChange(valido: boolean): void {
    this.variantesValidas.set(valido);
  }

  changeQuantity(delta: number): void {
    const newQuantity = this.quantity() + delta;
    if (newQuantity >= this.minQuantity() && newQuantity <= this.maxQuantity()) {
      this.quantity.set(newQuantity);
    }
  }

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

    if (this.productoTieneVariantes() && !this.variantesValidas()) {
      this.toast.error('Debes seleccionar todas las variantes del producto');
      return;
    }

    const body = {
      productoId: producto.id_producto,
      cantidad: this.quantity(),
      variantes: this.productoTieneVariantes() ? this.variantesSeleccionadas() : undefined
    };

    this.pedidoService
      .sumarseAlPaquete(paquete.id_paquete_publicado!, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Te sumaste al paquete con éxito');
          this.router.navigate(['/mis-pedidos']);
        },
        error: (err) => {
          console.error('❌ Error al sumarse:', err);
          this.toast.error(err.error?.message || 'No se pudo crear el pedido');
        }
      });
  }

  goBack(): void {
    const productoId = this.currentProductoId();
    if (productoId) {
      this.router.navigate(['/producto', productoId]);
    } else {
      this.router.navigate(['/paquetes']);
    }
  }

  onPaqueteClick(paqueteId: number): void {
    this.router.navigate(['/paquete', paqueteId, 'productos']);
  }

  toggleDescription(): void {
    this.showFullDescription.set(!this.showFullDescription());
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600';
    const clases: Record<string, string> = {
      'abierto': 'text-primary', 'activo': 'text-primary',
      'cerrado': 'text-red-600', 'próximo a cerrar': 'text-secondary-dark',
      'pendiente': 'text-yellow-600'
    };
    return clases[estado.toLowerCase()] || 'text-gray-600';
  }

  getEstadoBadgeClass(estado?: string): string {
    if (!estado) return 'w-3 h-3 bg-gray-400 rounded-full';
    const clases: Record<string, string> = {
      'abierto': 'w-3 h-3 bg-primary rounded-full', 'activo': 'w-3 h-3 bg-primary rounded-full',
      'cerrado': 'w-3 h-3 bg-red-500 rounded-full', 'próximo a cerrar': 'w-3 h-3 bg-yellow-500 rounded-full',
      'pendiente': 'w-3 h-3 bg-yellow-400 rounded-full'
    };
    return clases[estado.toLowerCase()] || 'w-3 h-3 bg-gray-400 rounded-full';
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }

  formatPrice(price?: number): string {
    if (!price) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0
    }).format(price);
  }
}

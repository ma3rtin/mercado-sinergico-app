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
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { LoaderComponent } from '@app/shared/loader/loader';
import { BackButtonComponent } from '@app/shared/back-button/back-button';

// Models
import { Producto } from '@models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PedidoService } from '@app/services/pedido/pedido.service';
import { ToastService } from '@app/services/toast/toast.service';
import { TipoBadgeComponent } from '@app/tipo-badge/tipo-badge';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { decodeId, getProductSlugUrl, getPaqueteSlugUrl } from '@app/shared/utils/obfuscator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalle-producto-sumarse',
  imports: [
    CommonModule,
    FormsModule,
    VisorImagenesComponent,
    IconComponent,
    PaqueteCard,
    SelectorVariantesComponent,
    ButtonComponent,
    TipoBadgeComponent,
    LoaderComponent,
    BackButtonComponent
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
  private readonly usuarioService = inject(UsuarioService);

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
  varianteIdSeleccionada = signal<number | null>(null);

  private productoCargado = signal(false);
  private paqueteCargado = signal(false);

  // 🧩 Computed
  hasProducto = computed(() => !!this.producto());
  hasPaqueteSeleccionado = computed(() => !!this.paqueteSeleccionado());

  // 🧭 Navegación dinámica
  fromProducto = signal<boolean>(false);
  labelVolver = computed(() => this.fromProducto() ? 'Volver al producto' : 'Volver al paquete');

  // --- LÓGICA DE STOCK Y DISPONIBILIDAD REFACTORIZADA ---

  // 1. Cupos del Paquete (Capacidad de la campaña)
  cuposTotalesPaquete = computed(() => this.paqueteSeleccionado()?.cant_productos || 0);
  cuposReservadosPaquete = computed(() => this.paqueteSeleccionado()?.cant_productos_reservados || 0);
  cuposRestantesPaquete = computed(() => Math.max(0, this.cuposTotalesPaquete() - this.cuposReservadosPaquete()));

  // 2. Información de la Variante Seleccionada
  varianteSeleccionada = computed(() => {
    const id = this.varianteIdSeleccionada();
    if (!id) return null;
    return this.producto()?.variantes?.find(v => v.id === id) || null;
  });

  // 3. Stock Físico (null significa SINÉRGICO/Ilimitado)
  stockFisicoVariante = computed(() => this.varianteSeleccionada()?.stockFisico ?? null);

  // 4. Disponibilidad Real (El "Cuello de Botella")
  disponibilidadRealParaUsuario = computed(() => {
    const cupos = this.cuposRestantesPaquete();
    const stock = this.stockFisicoVariante();

    // Si el paquete está lleno, disponibilidad es 0
    if (cupos <= 0) return 0;

    // Si no hay variante seleccionada o es SINÉRGICO (null), el límite es el cupo del paquete
    if (stock === null) return cupos;

    // Si es ENÉRGICO, el límite es el menor entre cupo y stock físico
    return Math.min(cupos, stock);
  });

  maxQuantity = computed(() => this.disponibilidadRealParaUsuario());
  minQuantity = computed(() => 1);

  // --- ESTADOS DE UI ---

  productoTieneVariantes = computed(() => {
    const variantes = this.producto()?.variantes || [];
    return variantes.some(v => v.activo !== false);
  });

  puedeAgregarAlCarrito = computed(() => {
    return this.paqueteEstaActivo() && 
           this.disponibilidadRealParaUsuario() > 0 && 
           (!this.productoTieneVariantes() || this.variantesValidas());
  });

  tipoPaquete = computed(() => this.paqueteSeleccionado()?.tipo || null);

  // Progreso de Campaña (Sinergico)
  participantesActuales = computed(() => this.paqueteSeleccionado()?.cant_usuarios_registrados || 0);
  faltanParaCerrar = computed(() => Math.max(0, this.cuposTotalesPaquete() - this.participantesActuales()));

  // Motivo del límite (para feedback al usuario)
  motivoLimite = computed(() => {
    const cupos = this.cuposRestantesPaquete();
    const stock = this.stockFisicoVariante();
    
    if (cupos <= 0) return 'PAQUETE_LLENO';
    if (stock !== null && stock < cupos) return 'STOCK_FISICO_LIMITADO';
    return 'CUPO_PAQUETE_LIMITADO';
  });

  zonaDelPaquete = computed(() => this.paqueteSeleccionado()?.zona?.nombre || 'Sin zona');
  estadoDelPaquete = computed(() => this.paqueteSeleccionado()?.estado?.nombre || 'Sin estado');

  mostrarAyudaVariantes = computed(() =>
    this.paqueteEstaActivo() &&
    this.productoTieneVariantes() &&
    !this.variantesValidas()
  );

  paqueteEstaActivo = computed(() => {
    const estado = this.paqueteSeleccionado()?.estado?.nombre;
    return estado?.toLowerCase() === 'activo';
  });

  fechaCierre = computed(() => {
    const paquete = this.paqueteSeleccionado();
    if (!paquete?.fecha_fin) return '';
    return new Date(paquete.fecha_fin).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: '2-digit'
    });
  });

  // 🏷️ Marca y Categoría
  categoriaNombre = computed(() => {
    const producto = this.producto();
    if (!producto?.categoria) return '';
    return typeof producto.categoria === 'string'
      ? producto.categoria
      : producto.categoria?.nombre ?? '';
  });

  marcaNombre = computed(() => {
    const producto = this.producto();
    if (!producto?.marca) return '';
    return typeof producto.marca === 'string'
      ? producto.marca
      : producto.marca?.nombre ?? '';
  });

  // 💰 Precios y Ahorro
  precioBase = computed(() => this.producto()?.precio || 0);

  porcentajeAhorro = computed(() => this.paqueteSeleccionado()?.descuento || 0);

  precioFinal = computed(() => {
    const base = this.precioBase();
    const descuento = this.porcentajeAhorro();
    if (descuento <= 0) return base;
    return base * (1 - descuento / 100);
  });

  ngOnInit(): void {
    // ✅ CLAVE: igual que productos-del-paquete que SÍ funciona
    if (!this.isBrowser) return;

    // 🧭 Detectar origen de navegación (ej. si viene de la vista de producto)
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(queryParams => {
        this.fromProducto.set(queryParams.get('from') === 'producto');
      });

    // ✅ paramMap observable, NO snapshot
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const rawProductoId = params.get('productoId');
        const rawPaqueteId = params.get('paqueteId');

        let productoId: number | null = null;
        let paqueteId: number | null = null;

        if (rawProductoId) {
          const match = rawProductoId.match(/-p([a-z0-9]+)$/);
          productoId = match ? decodeId(match[1]) : Number(rawProductoId);
        }

        if (rawPaqueteId) {
          const match = rawPaqueteId.match(/-p([a-z0-9]+)$/);
          paqueteId = match ? decodeId(match[1]) : Number(rawPaqueteId);
        }

        console.log('🔢 Parámetros desde paramMap:', { rawProductoId, rawPaqueteId, decodedProductoId: productoId, decodedPaqueteId: paqueteId });

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
        this.loadPaquetesDelProducto(productoId);
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

          // El producto YA trae variantes
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

  private loadPaquetesDelProducto(productoId: number): void {
    this.paquetePublicadoService
      .getByProductId(productoId)
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


  onVarianteIdChange(id: number | null) {
    this.varianteIdSeleccionada.set(id);
  }

  onVariantesChange(variantes: VariantesSeleccionadas): void {
    this.variantesSeleccionadas.set(variantes);
  }

  onVariantesValidoChange(valido: boolean): void {
    this.variantesValidas.set(valido);
  }

  changeQuantity(delta: number): void {
    const newQuantity = this.quantity() + delta;
    const max = this.maxQuantity();
    
    if (newQuantity < this.minQuantity()) return;
    
    if (newQuantity > max) {
      this.toast.warning(`Solo hay ${max} unidades disponibles por el momento`);
      this.quantity.set(max);
      return;
    }
    
    this.quantity.set(newQuantity);
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

    if (this.productoTieneVariantes() && !this.varianteIdSeleccionada()) {
      this.toast.error('Debe seleccionar una variante válida');
      return;
    }

    const body = {
      productoId: producto.id_producto,
      varianteId: this.varianteIdSeleccionada(),
      cantidad: this.quantity()
    };

    console.log('🧪 Body enviado:', body);

    // 🌟 Verificar que el perfil esté completo antes de permitir sumarse a un paquete/pedido
    this.usuarioService.getPerfil().subscribe({
      next: () => {
        if (!this.usuarioService.perfilCompleto()) {
          Swal.fire({
            title: '¡Faltan datos obligatorios!',
            html: '<p class="text-gray-600 mb-4">Para poder sumarte a un paquete y realizar pedidos, primero debes completar los campos obligatorios en tu perfil (teléfono, fecha de nacimiento y dirección de entrega).</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Completar perfil',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: 'var(--brand-secondary)', // Azul
            cancelButtonColor: 'var(--error)', // Rojo
            customClass: {
              confirmButton: 'px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md',
              cancelButton: 'px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md'
            }
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/perfil']);
            }
          });
          return;
        }

        // Si el perfil está completo, procedemos a realizar la acción
        this.procederSumarAlPaquete(paquete.id_paquete_publicado!, body);
      },
      error: (err) => {
        console.error('❌ Error al validar perfil antes de comprar:', err);
        this.toast.error('No se pudo verificar tu información de perfil. Intentá nuevamente.');
      }
    });
  }

  private procederSumarAlPaquete(paqueteId: number, body: any): void {
    this.pedidoService
      .sumarseAlPaquete(paqueteId, body)
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
    if (this.fromProducto()) {
      const prod = this.producto();
      const prodId = this.currentProductoId();
      if (prod) {
        const slugUrl = getProductSlugUrl(prod);
        this.router.navigate(['/producto', slugUrl]);
      } else if (prodId) {
        this.router.navigate(['/producto', prodId]);
      } else {
        this.router.navigate(['/productos']);
      }
    } else {
      const paquete = this.paqueteSeleccionado();
      const paqueteId = this.currentPaqueteId();

      if (paquete) {
        const slugUrl = getPaqueteSlugUrl(paquete);
        this.router.navigate(['/paquete', slugUrl, 'productos']);
      } else if (paqueteId) {
        this.router.navigate(['/paquete', paqueteId, 'productos']);
      } else {
        this.router.navigate(['/paquetes']);
      }
    }
  }

  onPaqueteClick(paqueteId: number): void {
    const paquete = this.paquetesRelacionados().find(p => p.id_paquete_publicado === paqueteId);
    if (paquete) {
      const slugUrl = getPaqueteSlugUrl(paquete);
      this.router.navigate(['/paquete', slugUrl, 'productos']);
    } else {
      this.router.navigate(['/paquete', paqueteId, 'productos']);
    }
  }

  toggleDescription(): void {
    this.showFullDescription.set(!this.showFullDescription());
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600';
    const clases: Record<string, string> = {
      'abierto': 'text-primary', 'activo': 'text-primary',
      'cerrado': 'text-error', 'próximo a cerrar': 'text-secondary-dark',
      'pendiente': 'text-warning'
    };
    return clases[estado.toLowerCase()] || 'text-gray-600';
  }

  getEstadoBadgeClass(estado?: string): string {
    if (!estado) return 'w-3 h-3 bg-gray-400 rounded-full';
    const clases: Record<string, string> = {
      'abierto': 'w-3 h-3 bg-primary rounded-full', 'activo': 'w-3 h-3 bg-primary rounded-full',
      'cerrado': 'w-3 h-3 bg-error rounded-full', 'próximo a cerrar': 'w-3 h-3 bg-warning rounded-full',
      'pendiente': 'w-3 h-3 bg-warning rounded-full'
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

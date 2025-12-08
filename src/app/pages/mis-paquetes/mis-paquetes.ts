import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

// Models
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

// Services
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { ToastrService } from 'ngx-toastr';

// Components
import { BreadcrumbComponent } from '@app/shared/breadcrumb-component/breadcrumb-component';
import { PaqueteUsuarioCardComponent } from '@app/shared/paquete-usuario-card/paquete-usuario-card';
import { BuscadorComponent, ConfigBuscador, OpcionSelect } from "@app/shared/buscador/buscador";

// Interfaces locales
interface ProductoEnPedido extends Producto {
  cantidad: number;
  variante?: string;
}

interface PaqueteDelUsuario extends PaquetePublicado {
  expandido?: boolean;
  productosEnPedido?: ProductoEnPedido[];
  precioSubtotal?: number;
  descuentoAplicado?: number;
  precioFinal?: number;
  tiempoRestante?: string;
}

@Component({
  selector: 'app-mis-paquetes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    PaqueteUsuarioCardComponent,
    BuscadorComponent
  ],
  templateUrl: './mis-paquetes.html'
})
export class MisPaquetesComponent implements OnInit {
  // 🔧 Services
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly marcaService = inject(MarcaService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly productoService = inject(ProductosService);
  private readonly toastr = inject(ToastrService);

  // 🚀 Signals
  paquetesDelUsuario = signal<PaqueteDelUsuario[]>([]);
  paquetesFiltrados = signal<PaqueteDelUsuario[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);

  // 📊 Configuración del buscador
  configBuscador: ConfigBuscador<PaquetePublicado> = {
    obtenerDatos: () => this.paquetePublicadoService.getPaquetesDelUsuario(),
    
    filtrar: (paquetes: PaquetePublicado[], termino: string) => {
      const t = termino.toLowerCase();
      return paquetes.filter(p =>
        p.paqueteBase?.nombre?.toLowerCase().includes(t) ||
        p.paqueteBase?.descripcion?.toLowerCase().includes(t) ||
        p.estado?.nombre?.toLowerCase().includes(t)
      );
    },
    
    mapear: (paquete: PaquetePublicado): OpcionSelect => ({
      id: paquete.id_paquete_publicado || 0,
      etiqueta: `${paquete.paqueteBase?.nombre} (${paquete.estado?.nombre})`,
      grupo: paquete.estado?.nombre || 'Sin estado'
    }),
    
    debounceMs: 300
  };

  // 📊 Enums públicos
  public readonly TipoPaquete = TipoPaquete;

  // 🧩 Computed signals
  tienePaquetes = computed(() => this.paquetesDelUsuario().length > 0);
  totalPaquetes = computed(() => this.paquetesDelUsuario().length);

  ngOnInit(): void {
    this.cargarDatos();
  }

  // 📥 CARGA DE DATOS
  public cargarDatos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    Promise.all([
      this.cargarCategorias(),
      this.cargarMarcas(),
      this.cargarMisPaquetes()
    ]).catch((error) => {
      console.error('❌ Error general al cargar datos:', error);
      this.errorMessage.set('Error al cargar los datos. Por favor, intentá de nuevo.');
      this.isLoading.set(false);
    });
  }

  private cargarMarcas(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.marcaService.getMarcas()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (marcas) => {
            console.log('✅ Marcas cargadas:', marcas.length);
            this.marcas.set(marcas);
            resolve();
          },
          error: (error) => {
            console.error('❌ Error cargando marcas:', error);
            this.marcas.set([]);
            reject(error);
          }
        });
    });
  }

  private cargarCategorias(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.categoriaService.getCategorias()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (categorias) => {
            console.log('✅ Categorías cargadas:', categorias.length);
            this.categorias.set(categorias);
            resolve();
          },
          error: (error) => {
            console.error('❌ Error cargando categorías:', error);
            this.categorias.set([]);
            reject(error);
          }
        });
    });
  }

  private cargarMisPaquetes(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Cargando todos los paquetes...');

      this.paquetePublicadoService.getPaquetesDelUsuario()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: async (paquetes) => {
            console.log('✅ Total de paquetes recibidos:', paquetes.length);

            if (paquetes.length > 0) {
              const estados = paquetes.map(p => p.estado?.nombre).filter(Boolean);
              console.log('📊 Estados disponibles:', [...new Set(estados)]);
            }

            const paquetesFiltrados = paquetes;

            console.log('✅ Paquetes después de filtrar:', paquetesFiltrados.length);

            if (paquetesFiltrados.length === 0) {
              console.warn('⚠️ No hay paquetes que mostrar.');
              this.paquetesDelUsuario.set([]);
              this.paquetesFiltrados.set([]);
              this.isLoading.set(false);
              resolve();
              return;
            }

            const paquetesDelUsuario: PaqueteDelUsuario[] = await Promise.all(
              paquetesFiltrados.map(p => this.enriquecerPaquete(p))
            );

            console.log('✅ Paquetes enriquecidos:', paquetesDelUsuario.length);
            this.paquetesDelUsuario.set(paquetesDelUsuario);
            this.paquetesFiltrados.set(paquetesDelUsuario);
            this.isLoading.set(false);
            resolve();
          },
          error: (error) => {
            console.error('❌ Error cargando paquetes:', error);
            this.errorMessage.set('Error al cargar tus paquetes. Verifica la consola.');
            this.isLoading.set(false);
            this.paquetesDelUsuario.set([]);
            this.paquetesFiltrados.set([]);
            reject(error);
          }
        });
    });
  }

  // 🧮 Enriquecer paquete
  private async enriquecerPaquete(paquete: PaquetePublicado): Promise<PaqueteDelUsuario> {
    const paqueteEnriquecido: PaqueteDelUsuario = {
      ...paquete,
      expandido: false,
      productosEnPedido: [],
      precioSubtotal: 0,
      descuentoAplicado: 0,
      precioFinal: 0,
      tiempoRestante: this.getTiempoRestante(paquete.fecha_fin)
    };

    try {
      const productos = await this.productoService
        .getProductos()
        .toPromise();

      if (productos && productos.length > 0) {
        paqueteEnriquecido.productosEnPedido = productos.slice(0, 5).map(p => ({
          ...p,
          cantidad: 1
        }));

        paqueteEnriquecido.precioSubtotal = this.calcularSubtotal(paqueteEnriquecido.productosEnPedido);
        paqueteEnriquecido.descuentoAplicado = this.calcularDescuento(paquete.cant_usuarios_registrados || 0);
        paqueteEnriquecido.precioFinal = paqueteEnriquecido.precioSubtotal *
          (1 - paqueteEnriquecido.descuentoAplicado / 100);
      }
    } catch (error) {
      console.warn('⚠️ Error cargando productos para paquete', paquete.id_paquete_publicado, error);
    }

    return paqueteEnriquecido;
  }

  // 🔍 Manejador de búsqueda
  onBuscadorCambio(opcionSeleccionada: any): void {
    if (!opcionSeleccionada) {
      // Si se limpió, mostrar todos
      this.paquetesFiltrados.set(this.paquetesDelUsuario());
      return;
    }

    // Filtrar paquetes que coincidan con la selección
    const filtrados = this.paquetesDelUsuario().filter(p =>
      p.id_paquete_publicado === opcionSeleccionada.id
    );

    this.paquetesFiltrados.set(filtrados);
  }

  // 🧮 CÁLCULOS
  private calcularSubtotal(productos: ProductoEnPedido[]): number {
    return productos.reduce((total, p) => total + (p.precio * p.cantidad), 0);
  }

  private calcularDescuento(cantidadParticipantes: number): number {
    if (cantidadParticipantes >= 50) return 20;
    if (cantidadParticipantes >= 30) return 15;
    if (cantidadParticipantes >= 20) return 10;
    if (cantidadParticipantes >= 10) return 5;
    return 0;
  }

  private recalcularPrecios(paquete: PaqueteDelUsuario): void {
    if (paquete.productosEnPedido) {
      paquete.precioSubtotal = this.calcularSubtotal(paquete.productosEnPedido);
      paquete.precioFinal = paquete.precioSubtotal * (1 - (paquete.descuentoAplicado || 0) / 100);
    }
  }

  // 🎯 ACCIONES DE UI
  toggleExpansion(paquete: PaqueteDelUsuario): void {
    paquete.expandido = !paquete.expandido;
  }

  aumentarCantidad(paquete: PaqueteDelUsuario, producto: ProductoEnPedido): void {
    producto.cantidad++;
    this.recalcularPrecios(paquete);
  }

  disminuirCantidad(paquete: PaqueteDelUsuario, producto: ProductoEnPedido): void {
    if (producto.cantidad > 1) {
      producto.cantidad--;
      this.recalcularPrecios(paquete);
    }
  }

  // 🔄 ACCIONES DE NEGOCIO
  actualizarPedido(paquete: PaqueteDelUsuario): void {
    if (!paquete.productosEnPedido || paquete.productosEnPedido.length === 0) {
      this.toastr.warning('No hay productos para actualizar');
      return;
    }

    console.log('🔄 Actualizando pedido del paquete:', paquete.id_paquete_publicado);
    this.toastr.success('Pedido actualizado exitosamente 🎉');
  }

  salirDelPaquete(paquete: PaqueteDelUsuario): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará tu participación en "${paquete.paqueteBase?.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: 'rgba(170, 58, 58, 1)',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const paquetes = this.paquetesDelUsuario().filter(
          p => p.id_paquete_publicado !== paquete.id_paquete_publicado
        );
        this.paquetesDelUsuario.set(paquetes);
        this.paquetesFiltrados.set(paquetes);
        this.toastr.success('Has salido del paquete exitosamente');
      }
    });
  }

  navegarAPaquetes(): void {
    this.router.navigate(['/paquetes-publicados']);
  }

  // 🎨 HELPERS VISUALES
  getTiempoRestante(fechaFin: Date): string {
    const ahora = new Date();
    const fin = new Date(fechaFin);
    const diff = fin.getTime() - ahora.getTime();

    if (diff <= 0) return 'Cerrado';

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }
}
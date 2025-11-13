import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
// Models
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { TipoPaquete } from '@app/models/Enums';

// Services
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
// Components
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';

// Interfaces locales
interface ProductoSeleccionado {
  id_producto: number;
  nombre: string;
  variante?: string;
  precio: number;
  cantidad: number;
  imagen_url?: string;
}

interface PaqueteUsuario extends PaquetePublicado {
  expandido: boolean;
  productosSeleccionados: ProductoSeleccionado[];
  precioTotal: number;
  descuento: number;
  precioFinal: number;
}

@Component({
  selector: 'app-mis-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './mis-paquetes.html'
})
export class MisPaquetesComponent implements OnInit {
  // 🔧 Services
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly marcaService = inject(MarcaService);
  private readonly categoriaService = inject(CategoriaService);
  private toastr = inject(ToastrService);
  // 🚀 Signals
  paquetes = signal<PaqueteUsuario[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);

  // 📊 Enums públicos para el template
  public readonly TipoPaquete = TipoPaquete;

  // 🧩 Computed signals
  tienePaquetes = computed(() => this.paquetes().length > 0);
  totalPaquetes = computed(() => this.paquetes().length);

  ngOnInit(): void {
    this.cargarMisPaquetes();
    this.cargarCategorias();
    this.cargarMarcas();
  }

  // 📥 CARGA DE DATOS
  cargarMisPaquetes(): void {
    console.log('🔄 Cargando paquetes del usuario...');
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paquetePublicadoService.getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes cargados:', paquetes.length);
          
          // TODO: Filtrar solo los paquetes donde el usuario está registrado
          // Cuando tengas el servicio de pedidos/usuario, filtrar aquí
          // Por ahora traemos todos los paquetes
          
          const paquetesUsuario: PaqueteUsuario[] = paquetes.map(p => ({
            ...p,
            expandido: false,
            productosSeleccionados: this.generarProductosDelPaquete(p),
            precioTotal: this.calcularPrecioTotal(p),
            descuento: this.calcularDescuento(p),
            precioFinal: 0 // Se calculará después
          }));

          // Calcular precio final para cada paquete
          paquetesUsuario.forEach(p => {
            p.precioFinal = p.precioTotal * (1 - p.descuento / 100);
          });

          this.paquetes.set(paquetesUsuario);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes del usuario:', error);
          this.errorMessage.set('Error al cargar tus paquetes. Por favor, intentá de nuevo.');
          this.isLoading.set(false);
          this.paquetes.set([]);
        }
      });
  }

  // 🧮 CÁLCULOS
  private generarProductosDelPaquete(paquete: PaquetePublicado): ProductoSeleccionado[] {
    // TODO: Cuando tengas el endpoint de pedidos del usuario, traer los productos reales
    // Por ahora retornamos un array vacío o productos mock
    
    // MOCK temporal - eliminar cuando tengas el servicio real
    if (paquete.paqueteBase?.nombre) {
      return [
        {
          id_producto: 1,
          nombre: paquete.paqueteBase.nombre,
          variante: 'M',
          precio: 5000,
          cantidad: 2,
          imagen_url: paquete.imagen_url || paquete.paqueteBase.imagen_url
        }
      ];
    }
    
    return [];
  }

  private calcularPrecioTotal(paquete: PaquetePublicado): number {
    // TODO: Calcular desde los productos reales del pedido
    return paquete.monto_total || 10000;
  }

  private calcularDescuento(paquete: PaquetePublicado): number {
    // TODO: Calcular descuento basado en cantidad de participantes
    const participantes = paquete.cant_usuarios_registrados || 0;
    
    if (participantes >= 50) return 20;
    if (participantes >= 30) return 15;
    if (participantes >= 20) return 10;
    if (participantes >= 10) return 5;
    
    return 0;
  }

  private recalcularPrecios(paquete: PaqueteUsuario): void {
    paquete.precioTotal = paquete.productosSeleccionados.reduce(
      (total, p) => total + (p.precio * p.cantidad),
      0
    );
    paquete.precioFinal = paquete.precioTotal * (1 - paquete.descuento / 100);
  }

  // 🎯 ACCIONES DE UI
  toggleExpansion(paquete: PaqueteUsuario): void {
    const paquetes = this.paquetes();
    const index = paquetes.findIndex(p => p.id_paquete_publicado === paquete.id_paquete_publicado);
    
    if (index !== -1) {
      paquetes[index].expandido = !paquetes[index].expandido;
      this.paquetes.set([...paquetes]); // Trigger reactivity
    }
  }

  aumentarCantidad(paquete: PaqueteUsuario, producto: ProductoSeleccionado): void {
    producto.cantidad++;
    this.recalcularPrecios(paquete);
    this.paquetes.set([...this.paquetes()]); // Trigger reactivity
  }

  disminuirCantidad(paquete: PaqueteUsuario, producto: ProductoSeleccionado): void {
    if (producto.cantidad > 0) {
      producto.cantidad--;
      this.recalcularPrecios(paquete);
      this.paquetes.set([...this.paquetes()]); // Trigger reactivity
    }
  }

  // 🔄 ACCIONES DE NEGOCIO
  actualizarPedido(paquete: PaqueteUsuario): void {
    console.log('🔄 Actualizando pedido del paquete:', paquete.id_paquete_publicado);
    console.log('Productos:', paquete.productosSeleccionados);
    
          this.toastr.success('Pedido actualizado exitosamente'); // Temporal
  }

  salirDelPaquete(paquete: PaqueteUsuario): void {
    //sweetalert2 confirmación
    Swal.fire({
      title: '¿Estás seguro que querés salir del paquete?',
      text: `Se eliminará tu participación en el paquete "${paquete.paqueteBase?.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: 'rgba(170, 58, 58, 1)',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Lógica para salir del paquete
            const paquetes = this.paquetes().filter(
      p => p.id_paquete_publicado !== paquete.id_paquete_publicado
    );
    this.paquetes.set(paquetes);
      }
    })
    
    //if (!confirm(`¿Estás seguro que querés salir del paquete "${paquete.paqueteBase?.nombre}"?`)) {
      //return;
    //}
    
    // TODO: Implementar lógica de salida del paquete
    // this.pedidoService.salirDelPaquete(paquete.id_paquete_publicado).subscribe(...)
    
    // Remover del array local

  }

/*  irAlPaquete(paquete: PaqueteUsuario): void {
    if (!paquete.id_paquete_publicado) {
      console.error('❌ ID de paquete inválido');
      return;
    }
    this.router.navigate(['detalleProductoSumarse/', paquete.id_paquete_publicado]);
  }
*/
  navegarAPaquetes(): void {
    this.router.navigate(['paquetes-publicados']);
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

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600 bg-gray-100 border-gray-200';

    const e = String(estado).toLowerCase();

    const clases: Record<string, string> = {
      'abierto': 'text-green-700 bg-green-50 border-green-200',
      'activo': 'text-green-700 bg-green-50 border-green-200',
      'pendiente': 'text-yellow-700 bg-yellow-50 border-yellow-200',
      'cerrado': 'text-red-700 bg-red-50 border-red-200',
      'finalizado': 'text-red-700 bg-red-50 border-red-200',
      'completo': 'text-blue-700 bg-blue-50 border-blue-200'
    };

    // Búsqueda por palabra clave
    for (const [key, value] of Object.entries(clases)) {
      if (e.includes(key)) return value;
    }

    return 'text-gray-700 bg-gray-50 border-gray-200';
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete): TipoPaquete | '' {
    if (!tipo) return '';
    
    const t = String(tipo).toLowerCase();
    
    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;
    
    return TipoPaquete.POR_DEFINIR;
  }

  cargarMarcas(): void {
    this.marcaService.getMarcas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (marcas) => {
          this.marcas.set(marcas);
        },
        error: (error) => {
          console.error('❌ Error cargando marcas:', error);
          this.marcas.set([]);
        }
      });
  }
  cargarCategorias(): void {
    this.categoriaService.getCategorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categorias) => {
          this.categorias.set(categorias);
        },
        error: (error) => {
          console.error('❌ Error cargando categorías:', error);
          this.categorias.set([]);
        }
      });
  }
  getMarcaNombre(idMarca: number | undefined ): string {
    const marca = this.marcas().find(m => m.id_marca === idMarca);
    return marca ? marca.nombre : 'Desconocida';
  }
  getCategoriaNombre(idCategoria: number | undefined): string {
    const categoria = this.categorias().find(c => c.id_categoria === idCategoria);
    return categoria ? categoria.nombre : 'Desconocida';
  }

  


  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  // 🖼️ MANEJO DE IMÁGENES
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }
}
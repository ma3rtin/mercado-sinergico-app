import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
//frontend\src\app\models\Enums.ts
import { TipoPaquete } from '@app/models/Enums';

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paquetes.html'
})
export class PaquetesComponent implements OnInit {
  // 🎯 Datos principales
  paquetes: PaquetePublicado[] = [];
  paquetesFiltrados: PaquetePublicado[] = [];
  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  tipoPaqueteSeleccionado: TipoPaquete[] = [];
  public TipoPaquete = TipoPaquete;
  // 🔄 Estados de UI
  isLoading: boolean = true;
  errorMessage: string = '';
  private isBrowser: boolean;

  // 🎨 Filtros
  categoriaSeleccionada: string = '';
  marcaSeleccionada: string = '';
  ordenSeleccionado: string = 'recientes';
  estadoSeleccionado: string = ''; // 'Abierto' | 'Pendiente' | 'Cerrado' | ''


  constructor(
    private paquetePublicadoService: PaquetePublicadoService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {

    if (this.isBrowser) {
      this.traerCategorias();
      this.traerMarcas();
      this.loadPaquetes();
    }
  }

  // 📥 CARGA DE DATOS
  private loadPaquetes(): void {
    console.log('🔄 Cargando paquetes publicados...');
    this.isLoading = true;
    this.errorMessage = '';

    this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        console.log('✅ Paquetes cargados:', paquetes.length);
        // DEBUG: inspeccionar estructura real del primer elemento
        if (paquetes && paquetes.length > 0) {
          console.log('Ejemplo paquete devuelto por backend:', paquetes[0]);
        } else {
          console.log('No se recibieron paquetes del backend');
        }
        
  // MAPEO: normalizar el tipo que viene del backend (ej: "SINERGICO") al valor del enum frontend ("Sinérgico")
    const mapBackendTipoToFrontend = (t?: string): TipoPaquete | undefined => {
    if (!t) return undefined;
    const tn = String(t).toUpperCase();
    if (tn.includes('SIN')) return TipoPaquete.SINERGICO;
    if (tn.includes('ENER')) return TipoPaquete.ENERGICO;
    return TipoPaquete.POR_DEFINIR;
  };

  const paquetesMapped = paquetes.map(p => ({
    ...p,
    // p.tipoPaquete puede venir como 'SINERGICO' o como null/undefined
    tipoPaquete: mapBackendTipoToFrontend((p as any).tipoPaquete as unknown as string)
  }));
        this.paquetes = paquetesMapped;
        this.aplicarFiltros();
        this.isLoading = false;
      },

      error: (error) => {
        console.error('❌ Error cargando paquetes:', error);
        this.isLoading = false;

        if (error.name === 'TimeoutError') {
          this.errorMessage = 'El servidor no respondió a tiempo. Por favor, intentá de nuevo.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verificá que el backend esté corriendo.';
        } else {
          this.errorMessage = 'Error al cargar los paquetes. Por favor, intentá de nuevo.';
        }

        this.paquetes = [];
        this.paquetesFiltrados = [];
      }
    });
  }

  traerCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        console.log('✅ Categorias cargadas:', categorias.length);
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('❌ Error cargando categorias:', error);
      }
    });
  }
  traerMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (marcas) => {
        console.log('✅ Marcas cargadas:', marcas.length);
        this.marcas = marcas;
      },
      error: (error) => {
        console.error('❌ Error cargando marcas:', error);
      }
    });
  }
  recargarPaquetes(): void {
    this.loadPaquetes();
  }

  // 🎯 FILTROS Y ORDENAMIENTO
  aplicarFiltros(): void {
    let resultado = [...this.paquetes];

    // Filtrar por categoría
    if (this.categoriaSeleccionada) {
      resultado = resultado.filter(p =>
        this.categorias.some(c =>
          c.id_categoria === p.paqueteBase?.categoria_id &&
          c.nombre === this.categoriaSeleccionada
        )
      );
    }

    // Filtrar por marca
    if (this.marcaSeleccionada) {
      resultado = resultado.filter(p =>
        this.marcas.some(m =>
          m.id_marca === p.paqueteBase?.marcaId &&
          m.nombre === this.marcaSeleccionada
        )
      );
    }

    // Filtrar por tipo de paquete (solo si backend proporciona tipoPaquete y hay filtros seleccionados)
    if (this.tipoPaqueteSeleccionado && this.tipoPaqueteSeleccionado.length > 0) {
      resultado = resultado.filter(p =>
        !!p.tipoPaquete && this.tipoPaqueteSeleccionado.includes(p.tipoPaquete as any)
      );
    }

    // Filtrar por estado
    if (this.estadoSeleccionado) {
      resultado = resultado.filter(p =>
        p.estado?.nombre === this.estadoSeleccionado
      );
    }

    // Aplicar ordenamiento
    resultado = this.ordenarPaquetes(resultado);

    this.paquetesFiltrados = resultado;
  }

  private ordenarPaquetes(paquetes: PaquetePublicado[]): PaquetePublicado[] {
    switch (this.ordenSeleccionado) {
      case 'a-z':
        return paquetes.sort((a, b) =>
          (a.paqueteBase?.nombre || '').localeCompare(b.paqueteBase?.nombre || '')
        );

      case 'z-a':
        return paquetes.sort((a, b) =>
          (b.paqueteBase?.nombre || '').localeCompare(a.paqueteBase?.nombre || '')
        );

      case 'recien-abiertos':
        return paquetes.filter(p => p.estado?.nombre === 'Abierto')
          .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime());

      case 'por-cerrar':
        return paquetes.filter(p => p.estado?.nombre === 'Abierto')
          .sort((a, b) => new Date(a.fecha_fin).getTime() - new Date(b.fecha_fin).getTime());

      case 'recientes':
      default:
        return paquetes.sort((a, b) =>
          (b.id_paquete_publicado || 0) - (a.id_paquete_publicado || 0)
        );
    }
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada = '';
    this.marcaSeleccionada = '';
    this.ordenSeleccionado = 'recientes';
    this.tipoPaqueteSeleccionado = [];
    this.estadoSeleccionado = '';
    this.aplicarFiltros();
  }

  // 🎨 HELPERS VISUALES
  getEstadoTextoClass(estado?: string): string {
    if (!estado) return 'text-gray-600';

    const e = String(estado).toLowerCase();
    // Mapear nombres que puede devolver el backend a clases visuales
    if (e.includes('public') || e.includes('abierto')) return 'text-green-600 font-italic' ; // publicado / abierto -> verde
    if (e.includes('borrad') || e.includes('pend')) return 'text-yellow-600'; // borrador / pendiente -> amarillo
    if (e.includes('finaliz') || e.includes('cerr')) return 'text-red-600'; // finalizado / cerrado -> rojo
    if (e.includes('complet') || e.includes('completo')) return 'text-green-600';

    return 'text-gray-600';
  }

 // Añadir helper para togglear tipos desde checkboxes
  toggleTipoPaquete(tipo: TipoPaquete, checked: boolean) {
    const idx = this.tipoPaqueteSeleccionado.indexOf(tipo);
    if (checked && idx === -1) {
      this.tipoPaqueteSeleccionado.push(tipo);
    } else if (!checked && idx !== -1) {
      this.tipoPaqueteSeleccionado.splice(idx, 1);
    }
    this.aplicarFiltros();
  }

  // Devuelve el TipoPaquete (enum) normalizado para uso en template
  getTipoPaqueteIcono(tipo?: string | TipoPaquete): TipoPaquete | '' {
    if (!tipo) return '';
    const t = String(tipo).toLowerCase();
    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;
    return TipoPaquete.POR_DEFINIR;
  }

  getMarcaTag(paquete: PaquetePublicado): string {
    return this.marcas.find(m => m.id_marca === paquete.paqueteBase?.marcaId)?.nombre || 'Sin Marca';
  }

  getProductos(paquete: PaquetePublicado): string {
    const actual = paquete.cant_productos_reservados || 0; //Chequear luego que cantidad de productos fue reservada
    const maximo = paquete.cant_productos || 155; // TODO: Traer del backend
    return `${actual}/${maximo}`;
  }
  getParticipantes(paquete: PaquetePublicado): string {
    const actual = paquete.cant_usuarios_registrados || 0;
    return `${actual}`;
  }

  

  // 🧭 NAVEGACIÓN
  navegarAPaquete(id?: number): void {
    if (!id) {
      console.error('ID de paquete inválido');
      return;
    }
    // TODO: Ajustar ruta según tu routing
    this.router.navigate(['/paquete-detalle', id]);
  }

  // 🖼️ MANEJO DE IMÁGENES
  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }
}
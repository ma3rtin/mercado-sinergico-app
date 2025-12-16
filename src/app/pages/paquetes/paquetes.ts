import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';

// Interfaces
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { OpcionSelect, ConfigBuscador } from '@app/shared/buscador/buscador';
import { ConfigFiltros, FiltrosAplicados, OpcionFiltro } from '@app/shared/filtros/filtros';
import { TipoPaquete } from '@app/models/Enums';

// Services
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';

// Components
import { BuscadorComponent } from '@app/shared/buscador/buscador';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { FiltrosComponent } from '@app/shared/filtros/filtros';

@Component({
  selector: 'app-paquetes-publicos',
  standalone: true,
  imports: [
    CommonModule,
    BuscadorComponent,
    PaqueteCard,
    FiltrosComponent
  ],
  templateUrl: './paquetes.html',
})
export class PaquetesPublicosComponent implements OnInit {
  private isBrowser: boolean;

  // 📦 Signals
  paquetesOriginales = signal<PaquetePublicado[]>([]);
  paquetesFiltrados = signal<PaquetePublicado[]>([]);
  paqueteSeleccionado = signal<PaquetePublicado | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // 🔍 Configuración del buscador
  configBuscador = signal<ConfigBuscador<PaquetePublicado>>({
    obtenerDatos: (): Observable<PaquetePublicado[]> => {
      return this.paquetePublicadoService.getPaquetes();
    },
    
    filtrar: (datos: PaquetePublicado[], termino: string): PaquetePublicado[] => {
      const terminoLower = termino.toLowerCase();
      return datos.filter((paquete) => {
        const nombreBase = paquete.paqueteBase?.nombre?.toLowerCase() || '';
        const descripcionBase = paquete.paqueteBase?.descripcion?.toLowerCase() || '';
        const marcaNombre = paquete.paqueteBase?.marca?.nombre?.toLowerCase() || '';
        const categoriaNombre = paquete.paqueteBase?.categoria?.nombre?.toLowerCase() || '';
        const zonaNombre = paquete.zona?.nombre?.toLowerCase() || '';
        const estadoNombre = paquete.estado?.nombre?.toLowerCase() || '';

        return (
          nombreBase.includes(terminoLower) ||
          descripcionBase.includes(terminoLower) ||
          marcaNombre.includes(terminoLower) ||
          categoriaNombre.includes(terminoLower) ||
          zonaNombre.includes(terminoLower) ||
          estadoNombre.includes(terminoLower)
        );
      });
    },

    mapear: (paquete: PaquetePublicado): OpcionSelect => ({
      id: paquete.id_paquete_publicado || 0,
      etiqueta: paquete.paqueteBase?.nombre || 'Paquete sin nombre',
      grupo: paquete.paqueteBase?.categoria?.nombre || 'Sin categoría',
      deshabilitado: paquete.estado?.nombre === 'Eliminado' || paquete.estado?.nombre === 'Cerrado',
    }),

    campoTexto: 'nombre',
    debounceMs: 300,
  });

  // 🎯 CONFIGURACIÓN DE FILTROS PARA PAQUETES
  configFiltrosPaquetes = computed<ConfigFiltros>(() => ({
    // 📊 Servicios para obtener datos
    obtenerCategorias: () => this.categoriaService.getCategorias().pipe(
      map(categorias => categorias.map(cat => ({
        id: cat.id_categoria,
        nombre: cat.nombre,
        valor: cat.id_categoria
      } as OpcionFiltro)))
    ),
    
    obtenerMarcas: () => this.marcaService.getMarcas().pipe(
      map(marcas => marcas.map(marca => ({
        id: marca.id_marca,
        nombre: marca.nombre,
        valor: marca.id_marca
      } as OpcionFiltro)))
    ),
    
    // 🎨 Filtros a mostrar (solo para paquetes)
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarTipoPaquete: true,
    mostrarRangoPrecio: false, // No hay precio en paquetes
    mostrarOrdenamiento: true,
    mostrarEstados: true,
    
    // 📋 Opciones de Tipo de Paquete
    opcionesTipoPaquete: [
      { id: 1, nombre: '⚡ Sinérgico', valor: TipoPaquete.SINERGICO },
      { id: 2, nombre: '🔋 Energético', valor: TipoPaquete.ENERGICO },
    ],
    
    // 📋 Opciones de Ordenamiento
    opcionesOrdenamiento: [
      { id: 1, nombre: 'Más recientes', valor: 'recientes' },
      { id: 2, nombre: 'A-Z', valor: 'a-z' },
      { id: 3, nombre: 'Z-A', valor: 'z-a' },
      { id: 4, nombre: 'Más participantes', valor: 'mas-participantes' },
    ],
    
    // 📋 Opciones de Estados
    opcionesEstados: [
      { id: 1, nombre: '⏰ Por cerrar pronto', valor: 'por-cerrar' },
      { id: 2, nombre: '✨ Recién abiertos', valor: 'recien-abiertos' },
      { id: 3, nombre: '🔥 Más populares', valor: 'populares' },
    ],
    
    // 🎯 Textos personalizados
    tituloCategoria: 'Categorías',
    tituloMarca: 'Marcas',
    tituloTipoPaquete: 'Tipo de Paquete',
    tituloOrdenamiento: 'Ordenar por',
    tituloEstados: 'Estado del paquete',
  }));

  // 📊 Computed: Estadísticas
  totalPaquetes = computed(() => this.paquetesOriginales().length);
  paquetesMostrados = computed(() => {
    const seleccionado = this.paqueteSeleccionado();
    if (seleccionado) return 1;
    return this.paquetesFiltrados().length;
  });

  constructor(
    private paquetePublicadoService: PaquetePublicadoService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private router: Router,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.cargarPaquetes();
    }
  }

  // 📥 Cargar paquetes desde el servicio
  private cargarPaquetes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paquetePublicadoService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          console.log('✅ Paquetes cargados:', paquetes);
          
          // Filtrar paquetes eliminados por defecto
          const paquetesActivos = paquetes.filter(
            (p) => p.estado?.nombre !== 'Eliminado'
          );

          this.paquetesOriginales.set(paquetesActivos);
          this.paquetesFiltrados.set(paquetesActivos);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes:', error);
          this.isLoading.set(false);

          let mensaje = 'Error al cargar los paquetes. Por favor, intentá nuevamente.';
          
          if (error.name === 'TimeoutError') {
            mensaje = 'El servidor tardó demasiado en responder. Verificá tu conexión.';
          } else if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor. Verificá tu conexión a Internet.';
          } else if (error.status === 404) {
            mensaje = 'No se encontraron paquetes disponibles.';
          } else if (error.status >= 500) {
            mensaje = 'Error en el servidor. Intentá nuevamente más tarde.';
          }

          this.errorMessage.set(mensaje);
          this.paquetesOriginales.set([]);
          this.paquetesFiltrados.set([]);
        },
      });
  }

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    console.log('🎯 Filtros recibidos:', filtros);
    
    let resultado = [...this.paquetesOriginales()];
    
    // Filtrar por categorías
    if (filtros.categorias.length > 0) {
      resultado = resultado.filter(p => 
        filtros.categorias.includes(p.paqueteBase?.categoria_id || 0)
      );
    }
    
    // Filtrar por marcas
    if (filtros.marcas.length > 0) {
      resultado = resultado.filter(p => 
        filtros.marcas.includes(p.paqueteBase?.marcaId || 0)
      );
    }
    
    // Filtrar por tipo de paquete
    if (filtros.tiposPaquete.length > 0) {
      resultado = resultado.filter(p => 
        filtros.tiposPaquete.includes(p.tipoPaquete || '')
      );
    }
    
    // Filtrar por estados especiales
    if (filtros.estados.length > 0) {
      filtros.estados.forEach(estado => {
        if (estado === 'por-cerrar') {
          const hoy = new Date();
          const dentroDe5Dias = new Date(hoy);
          dentroDe5Dias.setDate(hoy.getDate() + 5);
          
          resultado = resultado.filter(p => {
            const fechaFin = new Date(p.fecha_fin);
            return fechaFin >= hoy && fechaFin <= dentroDe5Dias;
          });
        }
        
        if (estado === 'recien-abiertos') {
          const hoy = new Date();
          const hace7Dias = new Date(hoy);
          hace7Dias.setDate(hoy.getDate() - 7);
          
          resultado = resultado.filter(p => {
            const fechaInicio = new Date(p.fecha_inicio);
            return fechaInicio >= hace7Dias;
          });
        }
        
        if (estado === 'populares') {
          resultado = resultado.filter(p => 
            (p.cant_usuarios_registrados || 0) >= 10
          );
        }
      });
    }
    
    // Ordenar
    if (filtros.ordenamiento) {
      resultado = this.ordenarPaquetes(resultado, filtros.ordenamiento);
    }
    
    this.paquetesFiltrados.set(resultado);
  }

  private ordenarPaquetes(paquetes: PaquetePublicado[], orden: string): PaquetePublicado[] {
    switch (orden) {
      case 'a-z':
        return [...paquetes].sort((a, b) => 
          (a.paqueteBase?.nombre || '').localeCompare(b.paqueteBase?.nombre || '')
        );
      case 'z-a':
        return [...paquetes].sort((a, b) => 
          (b.paqueteBase?.nombre || '').localeCompare(a.paqueteBase?.nombre || '')
        );
      case 'mas-participantes':
        return [...paquetes].sort((a, b) => 
          (b.cant_usuarios_registrados || 0) - (a.cant_usuarios_registrados || 0)
        );
      case 'recientes':
      default:
        return [...paquetes].sort((a, b) => 
          (b.id_paquete_publicado || 0) - (a.id_paquete_publicado || 0)
        );
    }
  }

  limpiarFiltros(): void {
    this.paquetesFiltrados.set(this.paquetesOriginales());
  }

  // 🔄 Recargar paquetes
  recargarPaquetes(): void {
    this.paqueteSeleccionado.set(null);
    this.cargarPaquetes();
  }

  // 🔍 Manejar selección del buscador
  alSeleccionarPaquete(paquete: PaquetePublicado): void {
    console.log('🔍 Paquete seleccionado:', paquete);
    this.paqueteSeleccionado.set(paquete);
  }

  // 🧹 Limpiar búsqueda
  limpiarBusqueda(): void {
    this.paqueteSeleccionado.set(null);
  }

  // 🧭 Navegar al detalle del paquete
  navegarAPaqueteDetalle(idPaquete: number): void {
    console.log('🧭 Navegando a paquete:', idPaquete);
    this.router.navigate(['/productos-del-paquete', idPaquete]);
  }

  // 🖼️ Imagen fallback
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }
}
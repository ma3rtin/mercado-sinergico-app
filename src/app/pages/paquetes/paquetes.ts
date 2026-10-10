import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  signal,
  computed,
  afterNextRender,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { getPaqueteSlugUrl, slugify } from '@app/shared/utils/obfuscator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, forkJoin, catchError, of } from 'rxjs';

// Interfaces
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { ConfigFiltros, FiltrosAplicados, OpcionFiltro } from '@app/shared/filtros/filtros';
import { TipoPaquete } from '@app/models/Enums';
import { Zona } from '@app/models/ZonasInterfaces/Zona';

// Services
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { ZonaService } from '@app/services/zona/zona.service';
import { UsuarioService } from '@app/services/usuario/usuario.service';

// Components
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { FiltrosComponent } from '@app/shared/filtros/filtros';
import { IconComponent } from '@app/shared/icono/icono';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';

import { DelayedSkeleton } from '@app/shared/skeleton/delayed-skeleton';
import { ErrorState } from '@app/shared/error-state/error-state';

@Component({
  selector: 'app-paquetes-publicos',
  standalone: true,
  imports: [
    CommonModule,
    PaqueteCard,
    FiltrosComponent,
    IconComponent,
    PaginationComponent,
    CatalogoWrapperComponent,
    DelayedSkeleton,
    ErrorState
  ],
  templateUrl: './paquetes.html',
})
export class PaquetesPublicosComponent implements OnInit {
  private isBrowser: boolean;

  // 📦 Signals
  paquetesOriginales = signal<PaquetePublicado[]>([]);
  paquetesFiltrados = signal<PaquetePublicado[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  todasLasZonas = signal<Zona[]>([]);
  todasLasCategorias = signal<any[]>([]);
  todasLasMarcas = signal<any[]>([]);
  totalPaquetesCount = signal<number>(0);
  zonasSeleccionadasActivas = signal<(string | number)[]>([]);

  // 📊 Computed: Zonas seleccionadas formateadas
  textoZonasFiltradas = computed(() => {
    const activas = this.zonasSeleccionadasActivas();
    if (activas.length === 0) return '';

    const todas = this.todasLasZonas();
    const nombres = activas
      .map(id => todas.find(z => z.id_zona == id)?.nombre)
      .filter(nombre => !!nombre);

    if (nombres.length === 0) return '';
    if (nombres.length === 1) return nombres[0];
    if (nombres.length === 2) return `${nombres[0]} y ${nombres[1]}`;
    return nombres.join(', ');
  });

  // 📄 SIGNALS DE PAGINACIÓN
  paginaActual = signal<number>(1);
  itemsPorPagina = signal<number>(12);

  // 📊 COMPUTED: Paquetes paginados (ahora paginados en backend)
  paquetesPaginados = computed(() => {
    return this.paquetesOriginales();
  });

  // 📊 COMPUTED: Total de items para la paginación
  totalItemsPaginacion = computed(() => {
    return this.totalPaquetesCount();
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

    obtenerZonas: () => this.zonaService.getZonas().pipe(
      map(zonas => zonas.map(zona => ({
        id: zona.id_zona,
        nombre: zona.nombre,
        valor: zona.id_zona
      } as OpcionFiltro)))
    ),

    // 🎨 Filtros a mostrar (solo para paquetes)
    mostrarCategoria: true,
    mostrarMarca: true,
    mostrarZona: true,
    mostrarTipoPaquete: true,
    mostrarRangoPrecio: false,
    mostrarOrdenamiento: false, // Ahora está arriba a la derecha
    mostrarEstados: true,

    // 📋 Opciones de Tipo de Paquete
    opcionesTipoPaquete: [
      {
        id: 1,
        nombre: 'Sinérgico',
        icon: 'zap',
        valor: TipoPaquete.SINERGICO
      },
      {
        id: 2,
        nombre: 'Enérgico',
        icon: 'trendingUp',
        valor: TipoPaquete.ENERGICO
      },
    ],

    opcionesOrdenamiento: [
      {
        id: 1,
        nombre: 'Más recientes',
        icon: 'calendar',
        valor: 'recientes'
      },
      {
        id: 2,
        nombre: 'A-Z',
        icon: 'arrowDown',
        valor: 'a-z'
      },
      {
        id: 3,
        nombre: 'Z-A',
        icon: 'arrowUp',
        valor: 'z-a'
      },
      {
        id: 4,
        nombre: 'Más participantes',
        icon: 'users',
        valor: 'mas-participantes'
      },
    ],

    opcionesEstados: [
      {
        id: 1,
        nombre: 'Por cerrar pronto',
        icon: 'clock',
        valor: 'por-cerrar'
      },
      {
        id: 2,
        nombre: 'Recién abiertos',
        icon: 'calendar',
        valor: 'recien-abiertos'
      },
      {
        id: 3,
        nombre: 'Más populares',
        icon: 'star',
        valor: 'populares'
      },
    ],

    // 🎯 Textos personalizados
    tituloCategoria: 'Categorías',
    tituloMarca: 'Marcas',
    tituloZona: 'Zonas',
    tituloTipoPaquete: 'Tipo de Paquete',
    tituloOrdenamiento: 'Ordenar por',
    tituloEstados: 'Estado del paquete',
  }));

  // 📊 Computed: Estadísticas
  totalPaquetes = computed(() => this.totalPaquetesCount());
  paquetesMostrados = computed(() => this.paquetesOriginales().length);

  valoresFiltrosIniciales = computed<Partial<FiltrosAplicados>>(() => {
    const perfil = this.usuarioService.perfilUsuario();
    const zonas = perfil?.direccion?.localidad?.zonas || [];
    if (zonas.length > 0 && zonas[0].id_zona) {
      return {
        zonas: [zonas[0].id_zona]
      };
    }
    return {};
  });

  constructor(
    private paquetePublicadoService: PaquetePublicadoService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private zonaService: ZonaService,
    private usuarioService: UsuarioService,
    private router: Router,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // ✅ Solo ejecutar en el navegador, después del primer render
    afterNextRender(() => {
      this.inicializarPagina();
    });
  }

  ngOnInit(): void {
    // Ya no necesitamos hacer nada aquí
  }

  private inicializarPagina(): void {
    this.isLoading.set(true);

    forkJoin({
      categorias: this.categoriaService.getCategorias().pipe(catchError(() => of([]))),
      marcas: this.marcaService.getMarcas().pipe(catchError(() => of([]))),
      zonas: this.zonaService.getZonas().pipe(catchError(() => of([])))
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.todasLasCategorias.set(res.categorias);
        this.todasLasMarcas.set(res.marcas);
        this.todasLasZonas.set(res.zonas);

        this.route.queryParams.pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(params => {
          this.procesarQueryParams(params);
        });
      },
      error: (err) => {
        console.error('❌ Error inicializando catálogos de paquetes:', err);
        this.errorMessage.set('Error al inicializar la sección.');
        this.isLoading.set(false);
      }
    });
  }

  private procesarQueryParams(params: any): void {
    let page = parseInt(params['page'], 10);
    let limit = parseInt(params['limit'], 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 12;

    this.paginaActual.set(page);
    this.itemsPorPagina.set(limit);

    const filtros: FiltrosAplicados = {
      categorias: [],
      marcas: [],
      zonas: [],
      tiposPaquete: [],
      ordenamiento: params['orden'] || 'recientes',
      rangoPrecio: { min: null, max: null },
      estados: []
    };

    if (params['categorias']) {
      const slugs = params['categorias'].split(',');
      slugs.forEach((slug: string) => {
        const cat = this.todasLasCategorias().find(c => slugify(c.nombre) === slug);
        if (cat) filtros.categorias.push(cat.id_categoria);
      });
    }

    if (params['marcas']) {
      const slugs = params['marcas'].split(',');
      slugs.forEach((slug: string) => {
        const m = this.todasLasMarcas().find(marca => slugify(marca.nombre) === slug);
        if (m) filtros.marcas.push(m.id_marca);
      });
    }

    if (params['zonas']) {
      const slugs = params['zonas'].split(',');
      slugs.forEach((slug: string) => {
        const z = this.todasLasZonas().find(zona => slugify(zona.nombre) === slug);
        if (z) filtros.zonas.push(z.id_zona);
      });
      this.zonasSeleccionadasActivas.set(filtros.zonas);
    }

    if (params['tiposPaquete']) {
      filtros.tiposPaquete = params['tiposPaquete'].split(',');
    }

    if (params['estados']) {
      filtros.estados = params['estados'].split(',');
    }

    this.filtrosActuales = filtros;

    if (params['orden']) {
      this.ordenSeleccionado.set(params['orden']);
    }

    this.loadPaquetesPaginados();
  }

  private loadPaquetesPaginados(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paquetePublicadoService.getPaquetesPaginados(
      this.paginaActual(),
      this.itemsPorPagina(),
      this.filtrosActuales,
      false
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.paquetesOriginales.set(res.paquetes);
        this.totalPaquetesCount.set(res.total);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Error cargando paquetes paginados:', err);
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar paquetes.');
        this.paquetesOriginales.set([]);
        this.totalPaquetesCount.set(0);
      }
    });
  }

  private actualizarUrl(page: number): void {
    const queryParams: any = {
      page: page.toString(),
      limit: this.itemsPorPagina().toString(),
      categorias: null,
      marcas: null,
      zonas: null,
      tiposPaquete: null,
      estados: null,
      orden: null
    };

    const filtros = this.filtrosActuales;
    if (filtros) {
      if (filtros.categorias && filtros.categorias.length > 0) {
        const slugs = filtros.categorias
          .map(id => this.todasLasCategorias().find(c => c.id_categoria === id))
          .map(c => c ? slugify(c.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.categorias = slugs.join(',');
      }

      if (filtros.marcas && filtros.marcas.length > 0) {
        const slugs = filtros.marcas
          .map(id => this.todasLasMarcas().find(m => m.id_marca === id))
          .map(m => m ? slugify(m.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.marcas = slugs.join(',');
      }

      if (filtros.zonas && filtros.zonas.length > 0) {
        const slugs = filtros.zonas
          .map(id => this.todasLasZonas().find(z => z.id_zona === id))
          .map(z => z ? slugify(z.nombre) : '')
          .filter(s => s !== '');
        if (slugs.length > 0) queryParams.zonas = slugs.join(',');
      }

      if (filtros.tiposPaquete && filtros.tiposPaquete.length > 0) {
        queryParams.tiposPaquete = filtros.tiposPaquete.join(',');
      }

      if (filtros.estados && filtros.estados.length > 0) {
        queryParams.estados = filtros.estados.join(',');
      }
    }

    if (this.ordenSeleccionado()) {
      queryParams.orden = this.ordenSeleccionado();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  ordenSeleccionado = signal<string>('recientes');

  // 🎯 APLICAR FILTROS
  aplicarFiltros(filtros: FiltrosAplicados): void {
    console.log('🎯 Filtros recibidos:', filtros);
    this.filtrosActuales = filtros;
    this.actualizarUrl(1);
  }

  private filtrosActuales: FiltrosAplicados | null = null;

  // Al cambiar el orden desde el select
  cambiarOrden(event: Event): void {
    const orden = (event.target as HTMLSelectElement).value;
    this.ordenSeleccionado.set(orden);
    this.actualizarUrl(1);
  }

  limpiarFiltros(): void {
    this.filtrosActuales = null;
    this.actualizarUrl(1);
  }

  // 🔄 Recargar paquetes
  recargarPaquetes(): void {
    this.loadPaquetesPaginados();
  }

  // 📄 MÉTODOS DE PAGINACIÓN
  onPageChange(page: number): void {
    this.actualizarUrl(page);
    console.log(`📄 Cambiando a página ${page}`);
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPorPagina.set(itemsPerPage);
    this.actualizarUrl(1);
    console.log(`🔢 Mostrando ${itemsPerPage} items por página`);
  }

  // 🧭 Navegar al detalle del paquete
  navegarAPaqueteDetalle(idPaquete: number): void {
    console.log('🧭 Navegando a paquete:', idPaquete);
    const paquete = this.paquetesOriginales().find(p => p.id_paquete_publicado === idPaquete);
    if (paquete) {
      const slugUrl = getPaqueteSlugUrl(paquete);
      this.router.navigate(['/paquete', slugUrl, 'productos']);
    } else {
      this.router.navigate(['/paquete', idPaquete, 'productos']);
    }
  }

  // 🖼️ Imagen fallback
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }
}

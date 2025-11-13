import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  effect,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { TipoPaquete } from '@app/models/Enums';

@Component({
  selector: 'app-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paquetes.html',
})
export class PaquetesComponent implements OnInit {
  private isBrowser: boolean;

  // ⚡ Signals reactivas
  paquetes = signal<PaquetePublicado[]>([]);
  paquetesFiltrados = signal<PaquetePublicado[]>([]);
  categorias = signal<Categoria[]>([]);
  marcas = signal<Marca[]>([]);
  tipoPaqueteSeleccionado = signal<TipoPaquete[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  categoriaSeleccionada = signal<string>('');
  marcaSeleccionada = signal<string>('');
  ordenSeleccionado = signal<string>('recientes');
  estadoSeleccionado = signal<string>('');
  TipoPaquete = TipoPaquete;

  constructor(
    private paquetePublicadoService: PaquetePublicadoService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private router: Router,
    private destroyRef: DestroyRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // 👀 Efecto reactivo automático al cambiar filtros
    effect(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.traerCategorias();
      this.traerMarcas();
      this.loadPaquetes();
    }
  }

  // 📥 Carga de paquetes
  private loadPaquetes(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paquetePublicadoService
      .getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paquetes) => {
          const mapBackendTipoToFrontend = (t?: string): TipoPaquete | undefined => {
            if (!t) return undefined;
            const tn = String(t).toUpperCase();
            if (tn.includes('SIN')) return TipoPaquete.SINERGICO;
            if (tn.includes('ENER')) return TipoPaquete.ENERGICO;
            return TipoPaquete.POR_DEFINIR;
          };

          const paquetesMapped = paquetes.map((p) => ({
            ...p,
            tipoPaquete: mapBackendTipoToFrontend((p as any).tipoPaquete as string),
          }));

          this.paquetes.set(paquetesMapped);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes:', error);
          this.isLoading.set(false);

          let mensaje = 'Error al cargar los paquetes.';
          if (error.name === 'TimeoutError') {
            mensaje = 'El servidor no respondió a tiempo. Intentá nuevamente.';
          } else if (error.status === 0) {
            mensaje = 'No se pudo conectar con el servidor.';
          }
          this.errorMessage.set(mensaje);
          this.paquetes.set([]);
          this.paquetesFiltrados.set([]);
        },
      });
  }

  traerCategorias(): void {
    this.categoriaService
      .getCategorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: (e) => console.error('❌ Error cargando categorías', e),
      });
  }

  traerMarcas(): void {
    this.marcaService
      .getMarcas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (marcas) => this.marcas.set(marcas),
        error: (e) => console.error('❌ Error cargando marcas', e),
      });
  }

  recargarPaquetes(): void {
    this.loadPaquetes();
  }

  // 🎯 FILTROS Y ORDENAMIENTO
  aplicarFiltros(): void {
    let resultado = [...this.paquetes()];

    const categoriaSel = this.categoriaSeleccionada();
    const marcaSel = this.marcaSeleccionada();
    const tipoSel = this.tipoPaqueteSeleccionado();
    const estadoSel = this.estadoSeleccionado();
    const ordenSel = this.ordenSeleccionado();

    if (categoriaSel) {
      resultado = resultado.filter((p) =>
        this.categorias().some(
          (c) =>
            c.id_categoria === p.paqueteBase?.categoria_id &&
            c.nombre === categoriaSel
        )
      );
    }

    if (marcaSel) {
      resultado = resultado.filter((p) =>
        this.marcas().some(
          (m) =>
            m.id_marca === p.paqueteBase?.marcaId &&
            m.nombre === marcaSel
        )
      );
    }

    if (tipoSel.length > 0) {
      resultado = resultado.filter(
        (p) => !!p.tipoPaquete && tipoSel.includes(p.tipoPaquete)
      );
    }

    if (estadoSel) {
      resultado = resultado.filter((p) => p.estado?.nombre === estadoSel);
    }

    this.paquetesFiltrados.set(this.ordenarPaquetes(resultado, ordenSel));
  }

  private ordenarPaquetes(paquetes: PaquetePublicado[], orden: string): PaquetePublicado[] {
    switch (orden) {
      case 'a-z':
        return paquetes.sort((a, b) =>
          (a.paqueteBase?.nombre || '').localeCompare(b.paqueteBase?.nombre || '')
        );
      case 'z-a':
        return paquetes.sort((a, b) =>
          (b.paqueteBase?.nombre || '').localeCompare(a.paqueteBase?.nombre || '')
        );
      case 'recien-abiertos':
        return paquetes
          .filter((p) => p.estado?.nombre === 'Abierto')
          .sort(
            (a, b) =>
              new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
          );
      case 'por-cerrar':
        return paquetes
          .filter((p) => p.estado?.nombre === 'Abierto')
          .sort(
            (a, b) =>
              new Date(a.fecha_fin).getTime() - new Date(b.fecha_fin).getTime()
          );
      case 'recientes':
      default:
        return paquetes.sort(
          (a, b) => (b.id_paquete_publicado || 0) - (a.id_paquete_publicado || 0)
        );
    }
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionada.set('');
    this.marcaSeleccionada.set('');
    this.ordenSeleccionado.set('recientes');
    this.tipoPaqueteSeleccionado.set([]);
    this.estadoSeleccionado.set('');
  }

  toggleTipoPaquete(tipo: TipoPaquete, checked: boolean) {
    const seleccionados = [...this.tipoPaqueteSeleccionado()];
    const idx = seleccionados.indexOf(tipo);

    if (checked && idx === -1) seleccionados.push(tipo);
    else if (!checked && idx !== -1) seleccionados.splice(idx, 1);

    this.tipoPaqueteSeleccionado.set(seleccionados);
  }

  // 🧭 NAVEGACIÓN
  navegarAPaquete(id?: number): void {
    if (id) this.router.navigate(['/paquete-detalle', id]);
  }

  // 🖼️ Imagen fallback
  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }

  // 🎨 Helpers visuales
  getEstadoTextoClass(estado?: string): string {
    if (!estado) return 'text-gray-600';
    const e = estado.toLowerCase();
    if (e.includes('public') || e.includes('abierto')) return 'text-green-600 italic';
    if (e.includes('borrad') || e.includes('pend')) return 'text-yellow-600';
    if (e.includes('finaliz') || e.includes('cerr')) return 'text-red-600';
    if (e.includes('complet')) return 'text-green-600';
    return 'text-gray-600';
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete): TipoPaquete | '' {
    if (!tipo) return '';
    const t = String(tipo).toLowerCase();
    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;
    return TipoPaquete.POR_DEFINIR;
  }

  getMarcaTag(paquete: PaquetePublicado): string {
    return (
      this.marcas().find(
        (m) => m.id_marca === paquete.paqueteBase?.marcaId
      )?.nombre || 'Sin Marca'
    );
  }

  getProductos(paquete: PaquetePublicado): string {
    const actual = paquete.cant_productos_reservados || 0;
    const maximo = paquete.cant_productos || 155;
    return `${actual}/${maximo}`;
  }

  getParticipantes(paquete: PaquetePublicado): string {
    return `${paquete.cant_usuarios_registrados || 0}`;
  }
}

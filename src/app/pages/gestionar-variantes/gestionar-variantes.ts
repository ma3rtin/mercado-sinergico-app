// ============================================
// GESTIONAR-VARIANTES.COMPONENT.TS
// Gestión completa de variantes de productos
// ============================================
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@app/services/toast/toast.service';

// Interfaces y Services
import {
  VarianteService,
  ProductoVariantesResponse,
  ProductoVariante,
  ActualizarVarianteDTO,
} from '@app/services/variantes/variante.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { TipoPaquete } from '@app/models/Enums';

import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { LoaderComponent } from '@app/shared/loader/loader';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

import Swal from 'sweetalert2';

// ============================================
// INTERFACES
// ============================================
interface VarianteExtendida extends ProductoVariante {
  stockOriginal?: number | null;
  activoOriginal?: boolean;
  hasChanges?: boolean;
  seleccionada?: boolean;
  imagenFile?: File | null;
  imagenPreview?: string | ArrayBuffer | null;
  imagenOriginal?: string | null;
}

@Component({
  selector: 'app-gestionar-variantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    IconComponent,
    PaginationComponent,
    LoaderComponent,
    BackButtonComponent,
    LoadingOverlay,
  ],
  templateUrl: './gestionar-variantes.html',
})
export class GestionarVariantesComponent implements OnInit {
  // ============================================
  // INYECCIONES
  // ============================================
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private varianteService = inject(VarianteService);
  private productoService = inject(ProductosService);
  private toastr = inject(ToastService);

  // ============================================
  // SIGNALS
  // ============================================
  productoId = signal<number | null>(null);
  productoInfo = signal<ProductoVariantesResponse | null>(null);
  variantes = signal<VarianteExtendida[]>([]);
  precioBaseProducto = signal<number>(0);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  // 🔍 BÚSQUEDA Y FILTROS
  searchTerm = signal<string>('');
  filtroStock = signal<'todas' | 'con' | 'sin'>('todas');
  filtroEstado = signal<'todas' | 'activas' | 'inactivas'>('todas');

  // 📄 PAGINACIÓN
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  // ✅ SELECCIÓN MÚLTIPLE
  lastSelectedId = signal<number | null>(null);

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  esProductoEnergico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.ENERGICO;
  });

  esProductoSinergico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.SINERGICO;
  });

  tieneVariantes = computed(() => {
    return (this.variantesFiltradas()?.length || 0) > 0;
  });

  stockTotal = computed(() => {
    if (!this.esProductoEnergico()) return null;
    return this.variantes().reduce(
      (total, v) => total + (v.stockFisico || 0),
      0,
    );
  });

  hasChanges = computed(() => {
    return this.variantes().some((v) => v.hasChanges);
  });

  variantesActivas = computed(() => {
    return this.variantes().filter((v) => v.activo);
  });

  variantesInactivas = computed(() => {
    return this.variantes().filter((v) => !v.activo);
  });

  // 🆕 COMPUTED PARA BÚSQUEDA Y FILTROS
  variantesFiltradas = computed(() => {
    let variantes = this.variantes();
    const termino = this.searchTerm().toLowerCase().trim();
    const filtroStk = this.filtroStock();
    const filtroEst = this.filtroEstado();

    // Búsqueda por texto (descripción o SKU)
    if (termino) {
      variantes = variantes.filter((v) => {
        const descripcion = this.getVarianteDescripcion(v).toLowerCase();
        const sku = (v.sku || '').toLowerCase();
        return descripcion.includes(termino) || sku.includes(termino);
      });
    }

    // Filtro por stock (solo para enérgicos)
    if (filtroStk !== 'todas' && this.esProductoEnergico()) {
      variantes = variantes.filter((v) => {
        const tieneStock = (v.stockFisico || 0) > 0;
        return filtroStk === 'con' ? tieneStock : !tieneStock;
      });
    }

    // Filtro por estado
    if (filtroEst !== 'todas') {
      variantes = variantes.filter((v) => {
        return filtroEst === 'activas' ? v.activo : !v.activo;
      });
    }

    return variantes;
  });

  paginatedVariantes = computed(() => {
    const all = this.variantesFiltradas();
    const page = this.currentPage();
    const limit = this.itemsPerPage();
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  });

  // 🆕 SELECCIÓN MÚLTIPLE
  variantesSeleccionadas = computed(() => {
    return this.variantes().filter((v) => v.seleccionada);
  });

  cantidadSeleccionadas = computed(() => {
    return this.variantesSeleccionadas().length;
  });

  todasSeleccionadas = computed(() => {
    const filtradas = this.variantesFiltradas();
    if (filtradas.length === 0) return false;
    return filtradas.every((v) => v.seleccionada);
  });

  algunaSeleccionada = computed(() => {
    const filtradas = this.variantesFiltradas();
    return filtradas.some((v) => v.seleccionada) && !this.todasSeleccionadas();
  });

  resultadosBusqueda = computed(() => {
    return this.variantesFiltradas().length;
  });

  // ============================================
  // LIFECYCLE
  // ============================================

  constructor() {
    effect(() => {
      this.searchTerm();
      this.filtroEstado();
      this.filtroStock();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.toastr.error('ID de producto no proporcionado');
      this.router.navigate(['/admin/administrar-productos']);
      return;
    }

    this.productoId.set(parseInt(id, 10));
    this.cargarDatosProducto();
    this.cargarVariantes();
  }

  onPageChange(page: number): void {
    if (this.isSaving()) return;
    this.currentPage.set(page);
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  /**
   * Cargar datos básicos del producto (precio base)
   */
  private cargarDatosProducto(): void {
    this.productoService
      .getProductoById(this.productoId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (producto) => {
          this.precioBaseProducto.set(producto.precio || 0);
        },
        error: (err) => {
          console.error('❌ Error cargando producto:', err);
          this.toastr.error('Error al cargar datos del producto');
        },
      });
  }

  /**
   * Cargar todas las variantes del producto
   */
  private cargarVariantes(): void {
    this.isLoading.set(true);

    this.varianteService
      .getVariantesByProducto(this.productoId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productoInfo.set(response);

          // Añadir metadata para tracking de cambios
          const variantesConMetadata: VarianteExtendida[] =
            response.variantes.map((v) => ({
              ...v,
              stockOriginal: v.stockFisico ?? null,
              activoOriginal: v.activo ?? true,
              hasChanges: false,
              seleccionada: false,
            }));

          this.variantes.set(variantesConMetadata);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('❌ Error cargando variantes:', err);
          this.toastr.error('Error al cargar las variantes del producto');
          this.isLoading.set(false);
          this.router.navigate(['/admin/administrar-productos']);
        },
      });
  }

  // ============================================
  // 🔍 BÚSQUEDA Y FILTROS
  // ============================================

  /**
   * Actualizar término de búsqueda
   */
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  /**
   * Limpiar búsqueda
   */
  limpiarBusqueda(): void {
    this.searchTerm.set('');
  }

  /**
   * Cambiar filtro de stock
   */
  cambiarFiltroStock(filtro: 'todas' | 'con' | 'sin'): void {
    this.filtroStock.set(filtro);
  }

  /**
   * Cambiar filtro de estado
   */
  cambiarFiltroEstado(filtro: 'todas' | 'activas' | 'inactivas'): void {
    this.filtroEstado.set(filtro);
  }

  /**
   * Resetear todos los filtros
   */
  resetearFiltros(): void {
    this.searchTerm.set('');
    this.filtroStock.set('todas');
    this.filtroEstado.set('todas');
  }

  /**
   * Verificar si hay filtros activos
   */
  hayFiltrosActivos = computed(() => {
    return (
      this.searchTerm().trim() !== '' ||
      this.filtroStock() !== 'todas' ||
      this.filtroEstado() !== 'todas'
    );
  });

  // ============================================
  // ✅ SELECCIÓN MÚLTIPLE
  // ============================================

  /**
   * Toggle selección de una variante con soporte para Shift
   */
  toggleSeleccion(varianteId: number, event: MouseEvent): void {
    if (this.isSaving()) return;
    const variantesPaginadas = this.paginatedVariantes();
    const indiceActual = variantesPaginadas.findIndex(v => v.id === varianteId);
    if (indiceActual === -1) return;

    // Si se presiona Shift y hay una última selección
    if (event.shiftKey && this.lastSelectedId() !== null) {
      const indiceAnterior = variantesPaginadas.findIndex(v => v.id === this.lastSelectedId());
      if (indiceAnterior !== -1) {
        const inicio = Math.min(indiceAnterior, indiceActual);
        const fin = Math.max(indiceAnterior, indiceActual);

        const idsEnRango = variantesPaginadas
          .slice(inicio, fin + 1)
          .map((v) => v.id);

        this.variantes.update((current) =>
          current.map((v) =>
            idsEnRango.includes(v.id) ? { ...v, seleccionada: true } : v
          )
        );
      }
    } else {
      // Toggle simple
      this.variantes.update((current) =>
        current.map((v) =>
          v.id === varianteId ? { ...v, seleccionada: !v.seleccionada } : v
        )
      );
    }

    this.lastSelectedId.set(varianteId);
  }

  /**
   * Seleccionar/Deseleccionar todas las variantes filtradas
   */
  toggleTodasLasSelecciones(): void {
    if (this.isSaving()) return;
    const todasSeleccionadas = this.todasSeleccionadas();
    const filtradas = this.variantesFiltradas();

    const idsFiltradas = filtradas.map((v) => v.id);

    this.variantes.update((current) =>
      current.map((v) =>
        idsFiltradas.includes(v.id) ? { ...v, seleccionada: !todasSeleccionadas } : v
      )
    );
  }

  /**
   * Deseleccionar todas
   */
  deseleccionarTodas(): void {
    if (this.isSaving()) return;
    this.variantes.update((current) =>
      current.map((v) => ({ ...v, seleccionada: false })),
    );
    this.lastSelectedId.set(null);
  }

  // ============================================
  // 📦 ACCIONES MASIVAS - STOCK (selección)
  // ============================================

  /**
   * Aplicar stock a todas las seleccionadas
   */
  aplicarStockASeleccionadas(): void {
    if (this.isSaving()) return;
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    Swal.fire({
      title: 'Aplicar stock',
      input: 'number',
      inputLabel: `Stock para ${seleccionadas.length} variante(s) seleccionada(s)`,
      inputPlaceholder: 'Ej: 10',
      inputAttributes: {
        min: '0',
        step: '1',
      },
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--brand-secondary)',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'Ingresá una cantidad válida';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const stockNuevo = parseInt(result.value);

        const idsSeleccionados = seleccionadas.map((v) => v.id);

        this.variantes.update((current) =>
          current.map((v) =>
            idsSeleccionados.includes(v.id)
              ? { ...v, stockFisico: stockNuevo, hasChanges: true }
              : v
          )
        );

        this.toastr.success(
          `Stock de ${stockNuevo} aplicado a ${seleccionadas.length} variante(s)`,
        );
        this.deseleccionarTodas();
      }
    });
  }

  // ============================================
  // EDICIÓN DE VARIANTES
  // ============================================

  /**
   * Actualizar stock de una variante
   */
  onStockChange(varianteId: number, nuevoStock: number): void {
    if (this.isSaving()) return;
    if (nuevoStock < 0) {
      nuevoStock = 0;
    }

    this.variantes.update((current) =>
      current.map((v) => {
        if (v.id === varianteId) {
          const updated = { ...v, stockFisico: nuevoStock };
          return { ...updated, hasChanges: this.hasVarianteChanges(updated) };
        }
        return v;
      })
    );
  }

  /**
   * Toggle activo/inactivo de una variante
   */
  toggleVarianteActiva(varianteId: number): void {
    if (this.isSaving()) return;
    this.variantes.update((current) =>
      current.map((v) => {
        if (v.id === varianteId) {
          const updated = { ...v, activo: !v.activo };
          return { ...updated, hasChanges: this.hasVarianteChanges(updated) };
        }
        return v;
      })
    );
  }

  /**
   * Verificar si una variante tiene cambios sin guardar.
   * Solo compara stockFisico (Energético) y activo.
   */
  private hasVarianteChanges(variante: VarianteExtendida): boolean {
    const esEnergico = this.esProductoEnergico();

    return (
      (esEnergico && variante.stockFisico !== variante.stockOriginal) ||
      variante.activo !== variante.activoOriginal
    );
  }

  // ============================================
  // GUARDADO Y RESETEO
  // ============================================

  /**
   * Guardar todos los cambios usando un único llamado bulk
   */
  guardarCambios(): void {
    if (this.isSaving()) return;
    const variantesConCambios = this.variantes().filter((v) => v.hasChanges);

    if (variantesConCambios.length === 0) {
      this.toastr.info('No hay cambios para guardar');
      return;
    }

    Swal.fire({
      title: '¿Guardar cambios?',
      html: `Se actualizarán <strong>${variantesConCambios.length}</strong> variante(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--brand-secondary)',
      cancelButtonColor: 'var(--error)',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGuardado();
      }
    });
  }

  /**
   * Ejecutar el guardado bulk de cambios.
   * Si se pasa `soloIds`, se guardan únicamente esas variantes (aunque haya
   * otras con hasChanges pendiente por fuera del subconjunto); si no, se
   * guardan todas las que tengan cambios.
   */
  private ejecutarGuardado(
    onTerminar?: (exitoTotal: boolean) => void,
    soloIds?: number[],
  ): void {
    this.isSaving.set(true);

    const variantesConCambios = this.variantes().filter(
      (v) => v.hasChanges && (!soloIds || soloIds.includes(v.id)),
    );
    if (variantesConCambios.length === 0) {
      this.isSaving.set(false);
      return;
    }

    const conImagen = variantesConCambios.filter((v) => v.imagenFile);
    const sinImagen = variantesConCambios.filter((v) => !v.imagenFile);

    let totalOperaciones = conImagen.length + (sinImagen.length > 0 ? 1 : 0);
    let completadas = 0;
    let guardadas = 0;
    let errores = 0;
    let variantesFalladas: VarianteExtendida[] = [];

    const alCompletarOperacion = (exito: boolean, cant: number) => {
      completadas++;
      if (exito) {
        guardadas += cant;
      } else {
        errores += cant;
      }

      if (completadas === totalOperaciones) {
        this.finalizarGuardado(guardadas, errores, variantesFalladas);
        onTerminar?.(errores === 0);
      }
    };

    // 1. Guardar las individuales con imagen
    conImagen.forEach((variante) => {
      const dto: ActualizarVarianteDTO = {
        activo: variante.activo,
      };
      if (this.esProductoEnergico()) {
        dto.stockFisico = variante.stockFisico;
      }

      this.varianteService
        .actualizarVariante(variante.id, dto, variante.imagenFile)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (varianteActualizada) => {
            // Actualizar valores originales
            this.variantes.update((current) =>
              current.map((v) =>
                v.id === variante.id
                  ? {
                      ...v,
                      stockOriginal: v.stockFisico ?? null,
                      activoOriginal: v.activo ?? true,
                      imagenOriginal: varianteActualizada.imagen_url ?? v.imagenOriginal,
                      hasChanges: false,
                      imagenFile: null,
                      imagenPreview: null,
                    }
                  : v
              )
            );
            alCompletarOperacion(true, 1);
          },
          error: (err) => {
            console.error('❌ Error guardando variante:', err);
            variantesFalladas.push(variante);
            alCompletarOperacion(false, 1);
          },
        });
    });

    // 2. Guardar en bulk las que no tienen imagen
    if (sinImagen.length > 0) {
      const bulkItems = sinImagen.map((v) => {
        const item: any = {
          id: v.id,
          activo: v.activo,
        };
        if (this.esProductoEnergico()) {
          item.stockFisico = v.stockFisico;
        }
        return item;
      });

      this.varianteService
        .actualizarVarianteBulk(this.productoId() ?? 0, { variantes: bulkItems })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Actualizar valores originales para todas las de sin imagen
            this.variantes.update((current) =>
              current.map((v) => {
                const itemModificado = sinImagen.find((si) => si.id === v.id);
                if (itemModificado) {
                  return {
                    ...v,
                    stockOriginal: v.stockFisico ?? null,
                    activoOriginal: v.activo ?? true,
                    hasChanges: false,
                    imagenFile: null,
                    imagenPreview: null,
                  };
                }
                return v;
              })
            );
            alCompletarOperacion(true, sinImagen.length);
          },
          error: (err) => {
            console.error('❌ Error guardando variantes en bulk:', err);
            variantesFalladas.push(...sinImagen);
            alCompletarOperacion(false, sinImagen.length);
          },
        });
    }
  }

  private finalizarGuardado(
    guardadas: number,
    errores: number,
    variantesFalladas: VarianteExtendida[],
  ): void {
    this.isSaving.set(false);

    if (errores === 0) {
      const msg = guardadas === 1
        ? '1 variante actualizada con éxito'
        : `${guardadas} variantes actualizadas con éxito`;
      this.toastr.success(msg);
      return;
    }

    if (guardadas > 0) {
      this.toastr.warning(`${guardadas} guardadas, ${errores} con errores`);
    } else {
      this.toastr.error('Error al guardar las variantes');
    }

    const detalle = variantesFalladas.length > 0
      ? variantesFalladas
          .map((v) => {
            const descripcion = this.escapeHtml(this.getVarianteDescripcion(v));
            const sku = v.sku ? ` (${this.escapeHtml(v.sku)})` : '';
            return `${descripcion}${sku}`;
          })
          .join('<br/>')
      : 'No se pudieron identificar las variantes con error.';

    Swal.fire({
      title: 'Guardado con errores',
      html: `
        <p>${errores} variante(s) no se pudieron guardar:</p>
        <div style="margin-top:12px;padding:12px 16px;background:#fef2f2;border:1px solid #fee2e2;border-radius:12px;text-align:left;font-size:13px;font-weight:600;color:#7f1d1d;max-height:220px;overflow-y:auto;">
          ${detalle}
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: 'var(--brand-secondary)',
    });
  }

  /**
   * Resetear todos los cambios
   */
  resetearCambios(): void {
    if (this.isSaving()) return;
    Swal.fire({
      title: '¿Descartar cambios?',
      text: 'Se perderán todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.variantes.update((current) =>
          current.map((v) => ({
            ...v,
            stockFisico: v.stockOriginal ?? 0,
            activo: v.activoOriginal ?? true,
            hasChanges: false,
          })),
        );
        this.toastr.info('Cambios descartados');
      }
    });
  }

  // ============================================
  // ELIMINACIÓN
  // ============================================

  /**
   * Eliminar una variante
   */
  eliminarVariante(varianteId: number): void {
    if (this.isSaving()) return;
    const variante = this.variantes().find(v => v.id === varianteId);
    if (!variante) return;

    Swal.fire({
      title: '¿Eliminar variante?',
      text: `Se eliminará permanentemente la variante: ${this.getVarianteDescripcion(variante)}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.varianteService
          .eliminarVariante(variante.id!)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.variantes.update((current) =>
                current.filter((v) => v.id !== variante.id),
              );
              this.toastr.success('Variante eliminada correctamente');
            },
            error: (err: any) => {
              console.error('❌ Error eliminando variante:', err);
              this.toastr.error('Error al intentar eliminar la variante');
            },
          });
      }
    });
  }

  // ============================================
  // ACCIONES MASIVAS
  // ============================================

  /**
   * Aplicar el mismo stock a todas las variantes activas
   */
  aplicarStockATodas(): void {
    if (this.isSaving()) return;
    Swal.fire({
      title: 'Aplicar stock a todas',
      input: 'number',
      inputLabel: 'Cantidad de stock para todas las variantes activas',
      inputPlaceholder: 'Ej: 10',
      inputAttributes: {
        min: '0',
        step: '1',
      },
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--brand-secondary)',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'Ingresá una cantidad válida';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const stockNuevo = parseInt(result.value);

        this.variantes.update((current) =>
          current.map((v) => {
            if (!v.activo) return v;
            const updated = { ...v, stockFisico: stockNuevo };
            return { ...updated, hasChanges: this.hasVarianteChanges(updated) };
          })
        );

        this.toastr.success(
          `Stock de ${stockNuevo} aplicado a todas las variantes activas`,
        );
      }
    });
  }

  /**
   * Activar todas las variantes
   */
  activarTodas(): void {
    if (this.isSaving()) return;
    Swal.fire({
      title: '¿Activar todas las variantes?',
      text: 'Todas las variantes quedarán disponibles',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--success)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, activar todas',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicarEstadoMasivo(true);
      }
    });
  }

  /**
   * Desactivar todas las variantes
   */
  desactivarTodas(): void {
    if (this.isSaving()) return;
    Swal.fire({
      title: '¿Desactivar todas las variantes?',
      text: 'Las variantes quedarán pausadas (no eliminadas)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--warning)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, desactivar todas',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicarEstadoMasivo(false);
      }
    });
  }

  /**
   * Activar las variantes seleccionadas (solo el subconjunto tildado)
   */
  activarSeleccionadas(): void {
    if (this.isSaving()) return;
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    Swal.fire({
      title: '¿Activar variantes seleccionadas?',
      html: `Se activarán <strong>${seleccionadas.length}</strong> variante(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--success)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicarEstadoMasivo(
          true,
          seleccionadas.map((v) => v.id),
          (exito) => {
            if (exito) this.deseleccionarTodas();
          },
        );
      }
    });
  }

  /**
   * Desactivar las variantes seleccionadas (solo el subconjunto tildado)
   */
  desactivarSeleccionadas(): void {
    if (this.isSaving()) return;
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    Swal.fire({
      title: '¿Desactivar variantes seleccionadas?',
      html: `Se desactivarán <strong>${seleccionadas.length}</strong> variante(s)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--warning)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicarEstadoMasivo(
          false,
          seleccionadas.map((v) => v.id),
          (exito) => {
            if (exito) this.deseleccionarTodas();
          },
        );
      }
    });
  }

  /**
   * Eliminar las variantes seleccionadas (solo el subconjunto tildado)
   */
  eliminarSeleccionadas(): void {
    if (this.isSaving()) return;
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    Swal.fire({
      title: '¿Eliminar variantes seleccionadas?',
      html: `Se eliminarán permanentemente <strong>${seleccionadas.length}</strong> variante(s)<br/><br/>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarEliminacionSeleccionadas(seleccionadas);
      }
    });
  }

  /**
   * Ejecutar la eliminación de las variantes seleccionadas.
   * Las que fallan se conservan en la selección para poder reintentar.
   */
  private ejecutarEliminacionSeleccionadas(seleccionadas: VarianteExtendida[]): void {
    this.isSaving.set(true);

    const ids = seleccionadas.map((v) => v.id);
    let eliminadas = 0;
    let errores = 0;
    let completadas = 0;

    const alTerminar = () => {
      if (completadas < ids.length) return;

      this.isSaving.set(false);
      this.lastSelectedId.set(null);

      if (errores === 0) {
        this.toastr.success(
          eliminadas === 1
            ? '1 variante eliminada con éxito'
            : `${eliminadas} variantes eliminadas con éxito`,
        );
      } else if (eliminadas > 0) {
        this.toastr.warning(`${eliminadas} eliminadas, ${errores} con errores`);
      } else {
        this.toastr.error('Error al eliminar las variantes seleccionadas');
      }
    };

    seleccionadas.forEach((variante) => {
      this.varianteService
        .eliminarVariante(variante.id!)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.variantes.update((current) =>
              current.filter((v) => v.id !== variante.id),
            );
            eliminadas++;
            completadas++;
            alTerminar();
          },
          error: (err) => {
            console.error('❌ Error eliminando variante:', err);
            errores++;
            completadas++;
            alTerminar();
          },
        });
    });
  }

  /**
   * Aplicar el estado (activar/desactivar) a las variantes indicadas y
   * persistirlo automáticamente contra el backend.
   * Si no se reciben ids, se aplica a todas las variantes.
   * La confirmación ya fue dada por el SweetAlert2, por lo que el guardado
   * no vuelve a pedir confirmación manual.
   */
  private aplicarEstadoMasivo(
    activo: boolean,
    ids: number[] | null = null,
    onTerminar?: (exitoTotal: boolean) => void,
  ): void {
    const idsObjetivo = ids ?? this.variantes().map((v) => v.id);

    this.variantes.update((current) =>
      current.map((v) =>
        idsObjetivo.includes(v.id)
          ? { ...v, activo, hasChanges: this.hasVarianteChanges({ ...v, activo }) }
          : v,
      ),
    );

    // Solo mira/guarda cambios dentro del subconjunto objetivo: así una edición
    // pendiente en otra variante (fuera de la selección) no se cuela en este guardado.
    const cambiosEnObjetivo = this.variantes().filter(
      (v) => idsObjetivo.includes(v.id) && v.hasChanges,
    );

    if (cambiosEnObjetivo.length > 0) {
      this.ejecutarGuardado(onTerminar, ids ?? undefined);
    } else {
      const texto = ids
        ? `Las variantes seleccionadas ya están ${activo ? 'activadas' : 'desactivadas'}`
        : `Todas las variantes ya están ${activo ? 'activadas' : 'desactivadas'}`;
      this.toastr.info(texto);
      onTerminar?.(true);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Obtener descripción de una variante
   */
  getVarianteDescripcion(variante: ProductoVariante): string {
    return this.varianteService.getVarianteDescripcion(variante);
  }

  /**
   * Escapa caracteres especiales de HTML antes de interpolar texto dentro de
   * un Swal.fire({ html }), que no escapa automáticamente (a diferencia de `text`).
   */
  private escapeHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Volver a la lista de productos
   * La confirmación de "¿Salir sin guardar?" la cubre el CanDeactivate guard
   */
  volver(): void {
    if (this.isSaving()) return;
    this.router.navigate(['/admin/administrar-productos']);
  }
}

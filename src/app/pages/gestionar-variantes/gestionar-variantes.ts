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

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';

import Swal from 'sweetalert2';

// ============================================
// INTERFACES
// ============================================
interface VarianteExtendida extends ProductoVariante {
  stockOriginal?: number | null;
  precioExtraOriginal?: number;
  activoOriginal?: boolean;
  imagenOriginal?: string | null;
  hasChanges?: boolean;
  imagenFile?: File | null;
  imagenPreview?: string | null;
  seleccionada?: boolean; // 🆕 Para selección múltiple
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
  filtroImagen = signal<'todas' | 'con' | 'sin'>('todas');
  filtroStock = signal<'todas' | 'con' | 'sin'>('todas');
  filtroEstado = signal<'todas' | 'activas' | 'inactivas'>('todas');

  // ✅ SELECCIÓN MÚLTIPLE
  lastSelectedIndex = signal<number | null>(null);

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  esProductoEnergetico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.ENERGICO;
  });

  esProductoSinergico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.SINERGICO;
  });

  tieneVariantes = computed(() => {
    return (this.variantesFiltradas()?.length || 0) > 0;
  });

  stockTotal = computed(() => {
    if (!this.esProductoEnergetico()) return null;
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
    const filtroImg = this.filtroImagen();
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

    // Filtro por imagen
    if (filtroImg !== 'todas') {
      variantes = variantes.filter((v) => {
        const tieneImg = this.tieneImagen(v);
        return filtroImg === 'con' ? tieneImg : !tieneImg;
      });
    }

    // Filtro por stock (solo para energéticos)
    if (filtroStk !== 'todas' && this.esProductoEnergetico()) {
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
          console.log('✅ Precio base del producto:', producto.precio);
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
          console.log(
            'tipo producto:',
            this.productoInfo()?.producto.tipo,
            'enum:',
            TipoPaquete.ENERGICO,
            'comparacion:',
            this.productoInfo()?.producto.tipo === TipoPaquete.ENERGICO,
          );
          // Añadir metadata para tracking de cambios
          const variantesConMetadata: VarianteExtendida[] =
            response.variantes.map((v) => ({
              ...v,
              stockOriginal: v.stockFisico ?? null,
              precioExtraOriginal: v.precioExtra || 0,
              activoOriginal: v.activo ?? true,
              imagenOriginal: v.imagen_url ?? null,
              hasChanges: false,
              imagenFile: null,
              imagenPreview: null,
              seleccionada: false,
            }));

          this.variantes.set(variantesConMetadata);
          this.isLoading.set(false);

          console.log('✅ Variantes cargadas:', response);
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
   * Cambiar filtro de imagen
   */
  cambiarFiltroImagen(filtro: 'todas' | 'con' | 'sin'): void {
    this.filtroImagen.set(filtro);
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
    this.filtroImagen.set('todas');
    this.filtroStock.set('todas');
    this.filtroEstado.set('todas');
  }

  /**
   * Verificar si hay filtros activos
   */
  hayFiltrosActivos = computed(() => {
    return (
      this.searchTerm().trim() !== '' ||
      this.filtroImagen() !== 'todas' ||
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
  toggleSeleccion(index: number, event: MouseEvent): void {
    const variantesFiltradas = this.variantesFiltradas();
    const variante = variantesFiltradas[index];
    if (!variante) return;

    // Si se presiona Shift y hay una última selección
    if (event.shiftKey && this.lastSelectedIndex() !== null) {
      const inicio = Math.min(this.lastSelectedIndex()!, index);
      const fin = Math.max(this.lastSelectedIndex()!, index);

      this.variantes.update((current) => {
        const updated = [...current];
        const idsEnRango = variantesFiltradas
          .slice(inicio, fin + 1)
          .map((v) => v.id);

        updated.forEach((v) => {
          if (idsEnRango.includes(v.id)) {
            v.seleccionada = true;
          }
        });

        return updated;
      });
    } else {
      // Toggle simple
      this.variantes.update((current) => {
        const updated = [...current];
        const varianteEncontrada = updated.find((v) => v.id === variante.id);
        if (varianteEncontrada) {
          varianteEncontrada.seleccionada = !varianteEncontrada.seleccionada;
        }
        return updated;
      });
    }

    this.lastSelectedIndex.set(index);
  }

  /**
   * Seleccionar/Deseleccionar todas las variantes filtradas
   */
  toggleTodasLasSelecciones(): void {
    const todasSeleccionadas = this.todasSeleccionadas();
    const variantesFiltradas = this.variantesFiltradas();

    this.variantes.update((current) => {
      const updated = [...current];
      const idsFiltradas = variantesFiltradas.map((v) => v.id);

      updated.forEach((v) => {
        if (idsFiltradas.includes(v.id)) {
          v.seleccionada = !todasSeleccionadas;
        }
      });

      return updated;
    });
  }

  /**
   * Deseleccionar todas
   */
  deseleccionarTodas(): void {
    this.variantes.update((current) =>
      current.map((v) => ({ ...v, seleccionada: false })),
    );
    this.lastSelectedIndex.set(null);
  }

  // ============================================
  // 🖼️ ACCIONES MASIVAS - IMÁGENES
  // ============================================

  /**
   * Aplicar imagen a todas las seleccionadas
   */
  aplicarImagenASeleccionadas(): void {
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    // Crear input file dinámico
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;

      const file = target.files[0];

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toastr.error('La imagen no puede superar los 5MB');
        return;
      }

      // Generar preview y aplicar a todas las seleccionadas
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const preview = event.target?.result as string;

        this.variantes.update((current) => {
          const updated = [...current];
          const idsSeleccionados = seleccionadas.map((v) => v.id);

          updated.forEach((v) => {
            if (idsSeleccionados.includes(v.id)) {
              v.imagenFile = file;
              v.imagenPreview = preview;
              v.hasChanges = true;
            }
          });

          return updated;
        });

        this.toastr.success(
          `Imagen aplicada a ${seleccionadas.length} variante(s)`,
        );
        this.deseleccionarTodas();
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }

  // ============================================
  // 💰 ACCIONES MASIVAS - PRECIO EXTRA
  // ============================================

  /**
   * Aplicar precio extra a todas las seleccionadas
   */
  aplicarPrecioExtraASeleccionadas(): void {
    const seleccionadas = this.variantesSeleccionadas();

    if (seleccionadas.length === 0) {
      this.toastr.warning('No hay variantes seleccionadas');
      return;
    }

    Swal.fire({
      title: 'Aplicar precio extra',
      input: 'number',
      inputLabel: `Precio extra para ${seleccionadas.length} variante(s) seleccionada(s)`,
      inputPlaceholder: 'Ej: 500',
      inputAttributes: {
        min: '0',
        step: '0.01',
      },
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#71A8D9',
      inputValidator: (value) => {
        if (!value || parseFloat(value) < 0) {
          return 'Ingresá un precio válido';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const precioNuevo = parseFloat(result.value);

        this.variantes.update((current) => {
          const updated = [...current];
          const idsSeleccionados = seleccionadas.map((v) => v.id);

          updated.forEach((v) => {
            if (idsSeleccionados.includes(v.id)) {
              v.precioExtra = precioNuevo;
              v.hasChanges = true;
            }
          });

          return updated;
        });

        this.toastr.success(
          `Precio extra de $${precioNuevo} aplicado a ${seleccionadas.length} variante(s)`,
        );
        this.deseleccionarTodas();
      }
    });
  }

  // ============================================
  // 📦 ACCIONES MASIVAS - STOCK
  // ============================================

  /**
   * Aplicar stock a todas las seleccionadas
   */
  aplicarStockASeleccionadas(): void {
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
      confirmButtonColor: '#71A8D9',
      inputValidator: (value) => {
        if (!value || parseInt(value) < 0) {
          return 'Ingresá una cantidad válida';
        }
        return null;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const stockNuevo = parseInt(result.value);

        this.variantes.update((current) => {
          const updated = [...current];
          const idsSeleccionados = seleccionadas.map((v) => v.id);

          updated.forEach((v) => {
            if (idsSeleccionados.includes(v.id)) {
              v.stockFisico = stockNuevo;
              v.hasChanges = true;
            }
          });

          return updated;
        });

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
  onStockChange(index: number, nuevoStock: number): void {
    if (nuevoStock < 0) {
      nuevoStock = 0;
    }

    this.variantes.update((current) => {
      const updated = [...current];
      const variante = updated[index];

      variante.stockFisico = nuevoStock;
      variante.hasChanges = this.hasVarianteChanges(variante);

      return updated;
    });
  }

  /**
   * Actualizar precio extra de una variante
   */
  onPrecioExtraChange(index: number, nuevoPrecio: number): void {
    if (nuevoPrecio < 0) {
      nuevoPrecio = 0;
    }

    this.variantes.update((current) => {
      const updated = [...current];
      const variante = updated[index];

      variante.precioExtra = nuevoPrecio;
      variante.hasChanges = this.hasVarianteChanges(variante);

      return updated;
    });
  }

  /**
   * Toggle activo/inactivo de una variante
   */
  toggleVarianteActiva(index: number): void {
    this.variantes.update((current) => {
      const updated = [...current];
      const variante = updated[index];

      variante.activo = !variante.activo;
      variante.hasChanges = this.hasVarianteChanges(variante);

      return updated;
    });
  }

  /**
   * Verificar si una variante tiene cambios sin guardar
   */
  private hasVarianteChanges(variante: VarianteExtendida): boolean {
    const esEnergetico = this.esProductoEnergetico();

    return (
      (esEnergetico && variante.stockFisico !== variante.stockOriginal) ||
      variante.precioExtra !== variante.precioExtraOriginal ||
      variante.activo !== variante.activoOriginal ||
      variante.imagenFile !== null
    );
  }

  // ============================================
  // MANEJO DE IMÁGENES
  // ============================================

  /**
   * Manejar selección de imagen
   */
  onImagenSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.toastr.error('La imagen no puede superar los 5MB');
      return;
    }

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.variantes.update((current) => {
        const updated = [...current];
        const variante = updated[index];

        variante.imagenFile = file;
        variante.imagenPreview = e.target?.result as string;
        variante.hasChanges = true;

        return updated;
      });
    };

    reader.readAsDataURL(file);

    // Resetear input para permitir seleccionar el mismo archivo
    input.value = '';
  }

  /**
   * Eliminar imagen seleccionada
   */
  removeImagen(index: number): void {
    this.variantes.update((current) => {
      const updated = [...current];
      const variante = updated[index];

      variante.imagenFile = null;
      variante.imagenPreview = null;
      variante.hasChanges = this.hasVarianteChanges(variante);

      return updated;
    });
  }

  /**
   * Verificar si la variante tiene imagen
   */
  tieneImagen(variante: VarianteExtendida): boolean {
    return !!(variante.imagenPreview || variante.imagenOriginal);
  }

  /**
   * Obtener URL de imagen de la variante
   */
  getVarianteImagen(variante: VarianteExtendida): string {
    if (variante.imagenPreview) {
      return variante.imagenPreview;
    }
    if (variante.imagenOriginal) {
      return variante.imagenOriginal;
    }
    return '/assets/images/placeholder-variant.png';
  }

  // ============================================
  // GUARDADO Y RESETEO
  // ============================================

  /**
   * Guardar todos los cambios
   */
  guardarCambios(): void {
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
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: '#B92905',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGuardado();
      }
    });
  }

  /**
   * Ejecutar el guardado de cambios
   */
  private ejecutarGuardado(): void {
    this.isSaving.set(true);

    const variantesConCambios = this.variantes().filter((v) => v.hasChanges);
    let guardadas = 0;
    let errores = 0;

    variantesConCambios.forEach((variante) => {
      const dto: ActualizarVarianteDTO = {
        precioExtra: variante.precioExtra,
        activo: variante.activo,
      };

      if (this.esProductoEnergetico()) {
        dto.stockFisico = variante.stockFisico;
      }

      this.varianteService
        .actualizarVariante(variante.id, dto, variante.imagenFile)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (varianteActualizada) => {
            guardadas++;

            // Actualizar valores originales (incluyendo imagen_url devuelta por el backend)
            this.variantes.update((current) =>
              current.map((v) =>
                v.id === variante.id
                  ? {
                    ...v,
                    stockOriginal: v.stockFisico ?? null,
                    precioExtraOriginal: v.precioExtra ?? 0,
                    activoOriginal: v.activo ?? true,
                    imagenOriginal: varianteActualizada.imagen_url ?? v.imagenOriginal,
                    hasChanges: false,
                    imagenFile: null,
                    imagenPreview: null,
                  }
                  : v,
              ),
            );

            if (guardadas + errores === variantesConCambios.length) {
              this.finalizarGuardado(guardadas, errores);
            }
          },
          error: (err) => {
            errores++;
            console.error('❌ Error guardando variante:', err);

            if (guardadas + errores === variantesConCambios.length) {
              this.finalizarGuardado(guardadas, errores);
            }
          },
        });
    });
  }

  /**
   * Finalizar proceso de guardado
   */
  private finalizarGuardado(guardadas: number, errores: number): void {
    this.isSaving.set(false);

    if (errores === 0) {
      this.toastr.success(
        ` ${guardadas} variante(s) actualizada(s) correctamente`,
      );
    } else if (guardadas > 0) {
      this.toastr.warning(` ${guardadas} guardada(s), ${errores} con errores`);
    } else {
      this.toastr.error(' Error al guardar las variantes');
    }
  }

  /**
   * Resetear todos los cambios
   */
  resetearCambios(): void {
    Swal.fire({
      title: '¿Descartar cambios?',
      text: 'Se perderán todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B92905',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.variantes.update((current) =>
          current.map((v) => ({
            ...v,
            stockFisico: v.stockOriginal ?? 0,
            precioExtra: v.precioExtraOriginal ?? 0,
            activo: v.activoOriginal ?? true,
            hasChanges: false,
            imagenFile: null,
            imagenPreview: null,
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
  eliminarVariante(index: number): void {
    const variante = this.variantes()[index];

    Swal.fire({
      title: '¿Eliminar variante?',
      html: `<p>Se eliminará la variante:</p><strong>${this.getVarianteDescripcion(variante)}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B92905',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.varianteService
          .eliminarVariante(variante.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.variantes.update((current) =>
                current.filter((_, i) => i !== index),
              );
              this.toastr.success('Variante eliminada correctamente');
            },
            error: (err) => {
              console.error('❌ Error eliminando variante:', err);
              this.toastr.error(
                err.error?.message || 'Error al eliminar la variante',
              );
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
      confirmButtonColor: '#71A8D9',
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
          current.map((v) =>
            v.activo
              ? {
                ...v,
                stockFisico: stockNuevo,
                hasChanges: true,
              }
              : v,
          ),
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
    Swal.fire({
      title: '¿Activar todas las variantes?',
      text: 'Todas las variantes quedarán disponibles',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2D7A3E',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, activar todas',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.variantes.update((current) =>
          current.map((v) => ({
            ...v,
            activo: true,
            hasChanges: this.hasVarianteChanges({ ...v, activo: true }),
          })),
        );
        this.toastr.success('Todas las variantes activadas');
      }
    });
  }

  /**
   * Desactivar todas las variantes
   */
  desactivarTodas(): void {
    Swal.fire({
      title: '¿Desactivar todas las variantes?',
      text: 'Las variantes quedarán pausadas (no eliminadas)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D28509',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, desactivar todas',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.variantes.update((current) =>
          current.map((v) => ({
            ...v,
            activo: false,
            hasChanges: this.hasVarianteChanges({ ...v, activo: false }),
          })),
        );
        this.toastr.warning('Todas las variantes desactivadas');
      }
    });
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
   * Calcular precio final de una variante
   */
  calcularPrecioFinal(variante: ProductoVariante): number {
    const precioBase = this.precioBaseProducto();
    const extra = variante.precioExtra || 0;
    return precioBase + extra;
  }

  /**
   * Generar reporte de variantes
   */
  generarReporte(): void {
    const producto = this.productoInfo()?.producto;
    if (!producto) return;

    const reporte = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo,
        precioBase: this.precioBaseProducto(),
      },
      stockTotal: this.stockTotal(),
      cantidadVariantes: this.variantes().length,
      variantesActivas: this.variantesActivas().length,
      variantesInactivas: this.variantesInactivas().length,
      variantes: this.variantes().map((v) => ({
        id: v.id,
        descripcion: this.getVarianteDescripcion(v),
        sku: v.sku,
        stockFisico: v.stockFisico,
        precioExtra: v.precioExtra,
        precioFinal: this.calcularPrecioFinal(v),
        activo: v.activo,
        hasChanges: v.hasChanges,
      })),
    };

    // Convertir a JSON y descargar
    const dataStr = JSON.stringify(reporte, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `reporte-variantes-${producto.id}-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.toastr.success('Reporte descargado');
  }

  /**
   * Volver a la lista de productos
   */
  volver(): void {
    if (this.hasChanges()) {
      Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Hay cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#B92905',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/admin/administrar-productos']);
        }
      });
    } else {
      this.router.navigate(['/admin/administrar-productos']);
    }
  }
}

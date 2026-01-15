// ============================================
// GESTIONAR-VARIANTES.COMPONENT.TS
// ============================================
import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Interfaces y Services
import { VarianteService, ProductoVariantesResponse, ProductoVariante, ActualizarStockVariantesDTO } from '@app/services/variantes/variante.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { ToastService } from '@app/services/toast/toast.service';
import { TipoPaquete } from '@app/models/Enums';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
//import { InputComponent } from '@app/shared/input/input-component';

import Swal from 'sweetalert2';

interface VarianteConStock extends ProductoVariante {
  stockAnterior?: number;
  hasChanges?: boolean;
}

@Component({
  selector: 'app-gestionar-variantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
  ],
  templateUrl: './gestionar-variantes.html'
})
export class GestionarVariantesComponent implements OnInit {
  // 🧩 Inyecciones
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private varianteService = inject(VarianteService);
  private productoService = inject(ProductosService);
  private toast = inject(ToastService);

  // 🎯 Signals
  productoId = signal<number | null>(null);
  productoInfo = signal<ProductoVariantesResponse | null>(null);
  variantes = signal<VarianteConStock[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  modoEdicion = signal<'tabla' | 'tarjetas'>('tabla');

  // 📊 Computed
  esProductoEnergetico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.ENERGICO;
  });

  esProductoSinergico = computed(() => {
    return this.productoInfo()?.producto.tipo === TipoPaquete.SINERGICO;
  });

  tieneVariantes = computed(() => {
    return (this.variantes()?.length || 0) > 0;
  });

  stockTotal = computed(() => {
    if (!this.esProductoEnergetico()) return null;
    return this.variantes().reduce((total, v) => total + (v.stockAnterior || 0), 0);
  });

  hasChanges = computed(() => {
    return this.variantes().some(v => v.hasChanges);
  });

  variantesActivas = computed(() => {
    return this.variantes().filter(v => v.activo);
  });

  variantesInactivas = computed(() => {
    return this.variantes().filter(v => !v.activo);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.toast.error('ID de producto no proporcionado');
      this.router.navigate(['/admin/administrar-productos']);
      return;
    }

    this.productoId.set(parseInt(id, 10));
    this.cargarVariantes();
  }

  private cargarVariantes(): void {
    this.isLoading.set(true);

    this.varianteService.getVariantesByProducto(this.productoId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.productoInfo.set(response);

          // Añadir metadata para tracking de cambios
          const variantesConMetadata: VarianteConStock[] = response.variantes.map(v => ({
            ...v,
            stockAnterior: v.stockFisico || 0,
            hasChanges: false
          }));

          this.variantes.set(variantesConMetadata);
          this.isLoading.set(false);

          console.log('✅ Variantes cargadas:', response);
        },
        error: (err) => {
          console.error('❌ Error cargando variantes:', err);
          this.toast.error('Error al cargar las variantes del producto');
          this.isLoading.set(false);
          this.router.navigate(['/admin/administrar-productos']);
        }
      });
  }

  // 📝 Actualizar stock de una variante
  onStockChange(varianteIndex: number, nuevoStock: number): void {
    this.variantes.update(current => {
      const updated = [...current];
      const variante = updated[varianteIndex];

      // Validar que el stock no sea negativo
      if (nuevoStock < 0) {
        nuevoStock = 0;
      }

      variante.stockAnterior = nuevoStock;
      variante.hasChanges = nuevoStock !== variante.stockAnterior;

      return updated;
    });
  }

  // 💰 Actualizar precio extra de una variante
  onPrecioExtraChange(varianteIndex: number, nuevoPrecio: number): void {
    this.variantes.update(current => {
      const updated = [...current];
      updated[varianteIndex].precioExtra = nuevoPrecio;
      return updated;
    });
  }

  // 🔄 Activar/Desactivar variante
  toggleVarianteActiva(varianteIndex: number): void {
    this.variantes.update(current => {
      const updated = [...current];
      updated[varianteIndex].activo = !updated[varianteIndex].activo;
      return updated;
    });
  }

  // 💾 Guardar todos los cambios
  guardarCambios(): void {
    const variantesConCambios = this.variantes().filter(v => v.hasChanges);

    if (variantesConCambios.length === 0) {
      this.toast.info('No hay cambios para guardar');
      return;
    }

    Swal.fire({
      title: '¿Guardar cambios?',
      html: `Se actualizarán <strong>${variantesConCambios.length}</strong> variante(s)`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarGuardado();
      }
    });
  }

  private ejecutarGuardado(): void {
    this.isSaving.set(true);

    const dto: ActualizarStockVariantesDTO = {
      variantes: this.variantes()
        .filter(v => v.hasChanges)
        .map(v => ({
          id: v.id,
          stockFisico: v.stockFisico || 0
        }))
    };

    this.varianteService.actualizarStockBulk(this.productoId()!, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSaving.set(false);
          this.toast.success('Stock actualizado correctamente ✅');

          // Actualizar stockAnterior y resetear hasChanges
          this.variantes.update(current =>
            current.map(v => ({
              ...v,
              stockAnterior: v.stockFisico || 0,
              hasChanges: false
            }))
          );

          console.log('✅ Stock guardado:', response);
        },
        error: (err) => {
          this.isSaving.set(false);
          console.error('❌ Error guardando stock:', err);
          this.toast.error(err.error?.message || 'Error al guardar el stock');
        }
      });
  }

  // 🔄 Resetear cambios
  resetearCambios(): void {
    Swal.fire({
      title: '¿Descartar cambios?',
      text: 'Se perderán todos los cambios no guardados',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.variantes.update(current =>
          current.map(v => ({
            ...v,
            stockFisico: v.stockAnterior || 0,
            hasChanges: false
          }))
        );
        this.toast.info('Cambios descartados');
      }
    });
  }

  // 🎨 Cambiar modo de visualización
  cambiarModo(modo: 'tabla' | 'tarjetas'): void {
    this.modoEdicion.set(modo);
  }

  // 🧮 Helpers
  getVarianteDescripcion(variante: ProductoVariante): string {
    return this.varianteService.getVarianteDescripcion(variante);
  }
  calcularPrecioFinal(variante: ProductoVariante): number {
    return this.varianteService.calcularPrecioFinal(variante.precioExtra??0, variante);
  }

  // 📊 Generar reporte
  generarReporte(): void {
    const producto = this.productoInfo()?.producto;
    if (!producto) return;

    const reporte = {
      producto: {
        id: producto.id,
        nombre: producto.nombre,
        tipo: producto.tipo
      },
      stockTotal: this.stockTotal(),
      cantidadVariantes: this.variantes().length,
      variantesActivas: this.variantesActivas().length,
      variantesInactivas: this.variantesInactivas().length,
      variantes: this.variantes().map(v => ({
        descripcion: this.getVarianteDescripcion(v),
        sku: v.sku,
        stockFisico: v.stockFisico,
        precioExtra: v.precioExtra,
        precioFinal: this.calcularPrecioFinal(v),
        activo: v.activo
      }))
    };

    console.log('📊 Reporte generado:', reporte);

    // Aquí podrías implementar la descarga como CSV o PDF
    this.toast.info('Reporte generado en consola (implementar descarga)');
  }

  // 🔙 Volver
  volver(): void {
    if (this.hasChanges()) {
      Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Hay cambios sin guardar que se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/admin/administrar-productos']);
        }
      });
    } else {
      this.router.navigate(['/admin/administrar-productos']);
    }
  }

  // 🎯 Aplicar stock a todas las variantes (bulk)
  aplicarStockATodas(): void {
    Swal.fire({
      title: 'Aplicar stock a todas',
      input: 'number',
      inputLabel: 'Cantidad de stock para todas las variantes',
      inputPlaceholder: 'Ej: 10',
      inputAttributes: {
        min: '0',
        step: '1'
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
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const stockNuevo = parseInt(result.value);
        this.variantes.update(current =>
          current.map(v => ({
            ...v,
            stockFisico: stockNuevo,
            hasChanges: true
          }))
        );
        this.toast.success(`Stock de ${stockNuevo} aplicado a todas las variantes`);
      }
    });
  }
}


import { Component, DestroyRef, OnInit, inject, signal, computed, viewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router } from '@angular/router';
import { TipoPaquete } from '@app/models/Enums';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ToastService } from '@app/services/toast/toast.service';
import { AdminCreateWrapperComponent } from '@app/shared/admin-create-wrapper/admin-create-wrapper';
import {
  SelectorTipoCardComponent,
  SelectorTipoCardContenido
} from '@app/shared/selector-tipo-card/selector-tipo-card';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { SelectComponent, SelectOption } from '@app/shared/select/select-component';
import { IconComponent } from '@app/shared/icono/icono';
import { InputComponent } from '@app/shared/input/input-component';
import { SelectCategoriaMarca } from '@app/shared/select-categoria-marca/select-categoria-marca';
import { MapOptionsPipe } from '@app/shared/pipes/map-options.pipe';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { SubidorImagenes } from '@app/subidor-imagenes/subidor-imagenes';
import { LoaderComponent } from '@app/shared/loader/loader';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-paquete',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminCreateWrapperComponent,
    SelectorTipoCardComponent,
    BackButtonComponent,
    SelectComponent,
    IconComponent,
    InputComponent,
    SelectCategoriaMarca,
    MapOptionsPipe,
    ButtonComponent,
    SubidorImagenes,
    LoaderComponent,
    LoadingOverlay,
  ],
  templateUrl: './crear-paquete.html',
})
export class CrearPaqueteComponent implements OnInit {
  readonly TipoPaquete = TipoPaquete;
  readonly tipoCardContenido: SelectorTipoCardContenido = {
    energico: {
      titulo: 'Enérgico',
      subtitulo: 'Con stock físico',
      descripcion: 'El stock se controla físicamente. Ideal para productos con inventario real.',
      items: [
        'Control de inventario preciso',
        'Evita sobreventa',
        'Stock compartido entre paquetes'
      ]
    },
    sinergico: {
      titulo: 'Sinérgico',
      subtitulo: 'Bajo pedido',
      descripcion: 'Sin control de stock físico. Se produce o gestiona bajo pedido.',
      items: [
        'Sin límites de inventario',
        'Ideal para productos custom',
        'Pedidos bajo demanda'
      ]
    }
  };

  // Mapeo para asegurar consistencia con el backend
  readonly tipoMap: Record<TipoPaquete, string> = {
    [TipoPaquete.SINERGICO]: 'SINERGICO',
    [TipoPaquete.ENERGICO]: 'ENERGICO',
  };

  // 🧩 Inyecciones
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);
  private paqueteBaseService = inject(PaqueteBaseService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
  private router = inject(Router);

  // 🧩 ViewChildren (APIs públicas de componentes compartidos)
  private subidorImagenes = viewChild(SubidorImagenes);
  private marcaSelector = viewChild<SelectCategoriaMarca>('marcaSelector');
  private categoriaSelector = viewChild<SelectCategoriaMarca>('categoriaSelector');

  // 🧠 Estado del formulario
  paqueteForm!: FormGroup;
  productoBuscado = new FormControl<number | null>(null);

  formSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  creandoPaquete = signal<boolean>(false);
  creandoMarca = signal<boolean>(false);
  creandoCategoria = signal<boolean>(false);

  overlayTitulo = signal<string>('');
  overlayMensajes = signal<string[]>([]);

  tipoPaquete = signal<TipoPaquete>(TipoPaquete.SINERGICO);

  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);
  todosLosProductos = signal<Producto[]>([]);
  productosSeleccionados = signal<Producto[]>([]);

  // 🎯 Computed
  tipoLabel = computed(() =>
    this.tipoPaquete() === TipoPaquete.SINERGICO ? 'Sinérgico' : 'Enérgico'
  );

  hasMainImage = computed(() => this.subidorImagenes()?.hasMainImage() ?? false);

  productosInvalid = computed(
    () => this.formSubmitted() && this.productosSeleccionados().length === 0
  );

  productosOptions = computed<SelectOption[]>(() => {
    const seleccionadosIds = new Set(this.productosSeleccionados().map((p) => p.id_producto));
    const tipoActual = this.tipoPaquete();

    return this.todosLosProductos()
      .filter((p) => !seleccionadosIds.has(p.id_producto) && p.tipo === tipoActual)
      .map((p) => ({
        value: p.id_producto!,
        label: `${p.nombre} - $${p.precio}`
      }));
  });

  ngOnInit(): void {
    this.initializeForm();
    this.isLoading.set(true);
    this.cargarMarcas();
    this.cargarCategorias();
    this.cargarTodosLosProductos();
  }

  private initializeForm(): void {
    this.paqueteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      marca_id: [null as number | null],
      categoria_id: [null as number | null, Validators.required],
      tipo: [TipoPaquete.SINERGICO as TipoPaquete]
    });
  }

  // 🔄 Cargar datos base
  private cargarMarcas(): void {
    this.marcaService.getMarcas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.marcas.set(data);
        this.checkInitialLoad();
      },
      error: () => {
        this.toast.error('Error cargando marcas');
        this.checkInitialLoad();
      },
    });
  }

  private cargarCategorias(): void {
    this.categoriaService.getCategorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.checkInitialLoad();
      },
      error: () => {
        this.toast.error('Error cargando categorías');
        this.checkInitialLoad();
      },
    });
  }

  private cargarTodosLosProductos(): void {
    this.productoService.getProductos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.todosLosProductos.set(data);
        const compatibles = data.filter((p) => p.tipo === this.tipoPaquete()).length;
        console.log(`[CrearPaquete][Productos] Productos recibidos: ${data.length} | Tipo actual: ${this.tipoPaquete()} | Compatibles: ${compatibles}`);
        this.checkInitialLoad();
      },
      error: () => {
        this.toast.error('Error cargando productos');
        this.checkInitialLoad();
      },
    });
  }

  private checkInitialLoad(): void {
    if (this.marcas().length > 0 || this.categorias().length > 0 || this.todosLosProductos().length > 0) {
      this.isLoading.set(false);
    }
  }

  // 🏷️ Marca / Categoría (misma interacción que Crear Producto)
  crearMarca(nombre: string): void {
    this.creandoMarca.set(true);
    this.marcaService.createMarca(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nueva: Marca) => {
          this.marcas.update((prev) => [...prev, nueva]);
          this.paqueteForm.patchValue({ marca_id: nueva.id_marca });
          this.toast.success(`Marca "${nombre}" creada exitosamente`);
          this.creandoMarca.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al crear la marca');
          this.creandoMarca.set(false);
        }
      });
  }

  editarMarca(event: { id: number; nombre: string }): void {
    this.marcaService.updateMarca(event.id, event.nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizada: Marca) => {
          this.marcas.update((prev) => prev.map((m) => (m.id_marca === event.id ? actualizada : m)));
          this.toast.success(`Marca actualizada a "${event.nombre}"`);
          this.marcaSelector()?.finishEditSuccess(actualizada.nombre);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al actualizar la marca');
          this.marcaSelector()?.finishEditError();
        }
      });
  }

  crearCategoria(nombre: string): void {
    this.creandoCategoria.set(true);
    this.categoriaService.createCategoria(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nueva: Categoria) => {
          this.categorias.update((prev) => [...prev, nueva]);
          this.paqueteForm.patchValue({ categoria_id: nueva.id_categoria });
          this.toast.success(`Categoría "${nombre}" creada exitosamente`);
          this.creandoCategoria.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al crear la categoría');
          this.creandoCategoria.set(false);
        }
      });
  }

  editarCategoria(event: { id: number; nombre: string }): void {
    this.categoriaService.updateCategoria(event.id, event.nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizada: Categoria) => {
          const id = actualizada.id_categoria || event.id;
          this.categorias.update((prev) => prev.map((c) => (c.id_categoria === id ? actualizada : c)));
          if (this.paqueteForm.get('categoria_id')?.value === id) {
            this.paqueteForm.patchValue({ categoria_id: id });
          }
          this.toast.success(`Categoría actualizada a "${actualizada.nombre}"`);
          this.categoriaSelector()?.finishEditSuccess(actualizada.nombre);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al editar la categoría');
          this.categoriaSelector()?.finishEditError();
        }
      });
  }

  // 🎯 Cambio de tipo Enérgico/Sinérgico
  onTipoPaqueteChange(nuevoTipo: TipoPaquete): void {
    const tipoAnterior = this.tipoPaquete();
    const productosActuales = this.productosSeleccionados();

    console.log(`[CrearPaquete][Tipo] Cambio solicitado: ${tipoAnterior} -> ${nuevoTipo} | Productos seleccionados: ${productosActuales.length}`);

    if (productosActuales.length === 0) {
      this.aplicarTipo(nuevoTipo);
      return;
    }

    const productosIncompatibles = productosActuales.filter((p) => p.tipo !== nuevoTipo);

    if (productosIncompatibles.length > 0) {
      Swal.fire({
        title: '¿Cambiar tipo de paquete?',
        html: `
          <p class="mb-4 text-sm text-gray-600">Al cambiar a <b>${nuevoTipo}</b>, se removerán <b>${productosIncompatibles.length}</b> producto(s) que no coinciden con el nuevo tipo.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--brand-secondary)',
        cancelButtonColor: 'var(--text-muted)',
        confirmButtonText: 'Sí, cambiar y limpiar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          console.log(`[CrearPaquete][Tipo] Productos incompatibles removidos: [${productosIncompatibles.map((p) => p.id_producto).join(', ')}]`);
          this.aplicarTipo(nuevoTipo);
          this.toast.info('Se han removido los productos incompatibles.');
        }
      });
    } else {
      this.aplicarTipo(nuevoTipo);
    }
  }

  private aplicarTipo(nuevoTipo: TipoPaquete): void {
    this.tipoPaquete.set(nuevoTipo);
    this.paqueteForm.patchValue({ tipo: nuevoTipo });
    this.productosSeleccionados.update((prev) => prev.filter((p) => p.tipo === nuevoTipo));
  }

  // 🛒 Selección de productos
  onSelectProducto(id: number | null): void {
    if (!id) return;

    console.log(`[CrearPaquete][Productos] ID seleccionado: ${id}`);

    const prod = this.todosLosProductos().find((p) => p.id_producto === id);
    if (!prod) return;

    if (prod.tipo !== this.tipoPaquete()) {
      console.log(`[CrearPaquete][Productos] Producto ${id} incompatible con tipo ${this.tipoPaquete()}, ignorado`);
      this.limpiarBuscador();
      return;
    }

    if (this.productosSeleccionados().some((p) => p.id_producto === id)) {
      console.log(`[CrearPaquete][Productos] Producto ${id} ya estaba seleccionado, ignorado`);
      this.limpiarBuscador();
      return;
    }

    this.productosSeleccionados.update((prev) => [...prev, prod]);
    console.log(`[CrearPaquete][Productos] Total seleccionados: ${this.productosSeleccionados().length}`);
    this.limpiarBuscador();
  }

  eliminarProducto(index: number): void {
    this.productosSeleccionados.update((prev) => prev.filter((_, i) => i !== index));
    console.log(`[CrearPaquete][Productos] Producto eliminado. Total: ${this.productosSeleccionados().length}`);
  }

  /** Reset determinístico del buscador (sin setTimeout). */
  private limpiarBuscador(): void {
    this.productoBuscado.reset();
  }

  // 🧾 Crear paquete
  crearPaquete(): void {
    this.formSubmitted.set(true);
    this.paqueteForm.markAllAsTouched();

    if (this.paqueteForm.invalid) {
      this.toast.error('Por favor completá todos los campos requeridos', 'Error de Validación');
      this.scrollToFirstError();
      return;
    }

    if (this.productosSeleccionados().length === 0) {
      this.toast.error('Debés agregar al menos un producto al paquete.', 'Error de Validación');
      return;
    }

    const slotPrincipal = this.subidorImagenes()?.getSlots()[0];
    const imagenFile = slotPrincipal?.file ?? null;

    if (!this.hasMainImage() || !imagenFile) {
      this.toast.error('La imagen de portada es obligatoria.', 'Error de Validación');
      return;
    }

    // Nota: no existe compresión de imágenes en el frontend; SubidorImagenes valida
    // tipo y tamaño (<=20MB) y envía el archivo original.
    console.log(`[CrearPaquete][Imagen] Archivo original: ${imagenFile.name} | tipo: ${imagenFile.type} | tamaño: ${imagenFile.size} bytes`);

    const formValue = this.paqueteForm.value;
    console.log(
      `[CrearPaquete][Submit] nombre="${formValue.nombre}" | descripcion.length=${(formValue.descripcion ?? '').length}` +
      ` | categoria_id=${formValue.categoria_id} | marca_id=${formValue.marca_id ?? 'sin marca'}` +
      ` | tipo=${this.tipoMap[this.tipoPaquete()]}` +
      ` | productos=${this.productosSeleccionados().length} [${this.productosSeleccionados().map((p) => p.id_producto).join(', ')}]` +
      ` | imagen presente (${imagenFile.size} bytes)`
    );

    this.creandoPaquete.set(true);
    this.overlayTitulo.set('Creando paquete...');
    this.overlayMensajes.set(['Subiendo imagen...', 'Creando paquete base...', 'Asociando productos...']);
    const formData = new FormData();
    formData.append('nombre', (formValue.nombre ?? '').trim());
    formData.append('descripcion', (formValue.descripcion ?? '').trim());
    formData.append('categoria_id', String(formValue.categoria_id));
    formData.append('tipo', this.tipoMap[this.tipoPaquete()]);
    if (formValue.marca_id) {
      formData.append('marcaId', String(formValue.marca_id));
    }
    this.productosSeleccionados().forEach((p) => formData.append('productos', String(p.id_producto)));
    formData.append('imagen', imagenFile);

    this.paqueteBaseService
      .createPaquete(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('¡Paquete creado con éxito!', 'Éxito');
          this.resetForm();
          this.router.navigate(['/admin/administrar-paquetes']);
        },
        error: (err) => {
          console.error(`[CrearPaquete][API][ERROR] status=${err.status} | message=${err.error?.message ?? err.message}${err.error?.error ? ` | error=${err.error.error}` : ''}`);
          this.toast.error(err.error?.message || 'Error al crear el paquete.', 'Fallo');
          this.creandoPaquete.set(false);
        },
        complete: () => this.creandoPaquete.set(false),
      });
  }

  // 🔄 Reset formulario
  public resetForm(): void {
    this.paqueteForm.reset();
    this.paqueteForm.patchValue({ tipo: TipoPaquete.SINERGICO });
    this.tipoPaquete.set(TipoPaquete.SINERGICO);

    this.productosSeleccionados.set([]);
    this.limpiarBuscador();
    this.subidorImagenes()?.reset();

    this.formSubmitted.set(false);
    this.creandoPaquete.set(false);
  }

  // ⚠️ Helpers de validación (mismo patrón que Crear Producto)
  isFieldInvalid(fieldName: string): boolean {
    const control = this.paqueteForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.paqueteForm.get(fieldName);
    if (!control?.errors) return '';
    const errors = control.errors;
    const fieldLabel = this.getFieldLabel(fieldName);
    if (errors['required']) return `${fieldLabel} es requerido`;
    if (errors['minlength']) return `${fieldLabel} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `${fieldLabel} no puede superar los ${errors['maxlength'].requiredLength} caracteres`;
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'El nombre',
      descripcion: 'La descripción',
      categoria_id: 'La categoría',
      marca_id: 'La marca',
      tipo: 'El tipo'
    };
    return labels[fieldName] || fieldName;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.border-error, .text-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}

import { Router } from '@angular/router';
import { Component, inject, OnInit, signal, DestroyRef, computed, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoPaquete } from '@app/models/Enums';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Interfaces
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';

// Validators
import { mayorQueCero } from '@app/shared/validators/mayor-que-cero.validator';

// Services
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { ToastService } from '@app/services/toast/toast.service';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { InputComponent } from '@app/shared/input/input-component';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { IconComponent } from '@app/shared/icono/icono';
import { AdminCreateWrapperComponent } from '@app/shared/admin-create-wrapper/admin-create-wrapper';
import { SelectorTipoCardComponent, SelectorTipoCardContenido } from '@app/shared/selector-tipo-card/selector-tipo-card';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { SelectCategoriaMarca } from '@app/shared/select-categoria-marca/select-categoria-marca';
import { MapOptionsPipe } from '@app/shared/pipes/map-options.pipe';
import { SubidorImagenes } from '@app/subidor-imagenes/subidor-imagenes';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CrearPlantillaModalComponent,
    IconComponent,
    SelectorTipoCardComponent,
    AdminCreateWrapperComponent,
    BackButtonComponent,
    SelectCategoriaMarca,
    MapOptionsPipe,
    SubidorImagenes,
    LoadingOverlay,
  ],
  templateUrl: './crear-producto.html',
})
export class CrearProductoComponent implements OnInit {
  @ViewChild('marcaSelector') private marcaSelector!: SelectCategoriaMarca;
  @ViewChild('categoriaSelector') private categoriaSelector!: SelectCategoriaMarca;

  private subidorImagenes = viewChild(SubidorImagenes);

  private fb = inject(FormBuilder);
  public router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private plantillaService = inject(PlantillaService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
  private toast = inject(ToastService);

  creandoMarca = signal(false);
  creandoCategoria = signal(false);

  readonly TipoPaquete = TipoPaquete;
  readonly tipoCardContenido: SelectorTipoCardContenido = {
    energico: {
      titulo: 'Enérgico',
      subtitulo: 'Con stock físico',
      descripcion: 'El stock se controla físicamente. Ideal para productos con inventario real.',
      items: ['Control de inventario preciso', 'Evita sobreventa', 'Stock compartido entre paquetes']
    },
    sinergico: {
      titulo: 'Sinérgico',
      subtitulo: 'Bajo pedido',
      descripcion: 'Sin control de stock físico. Se produce o gestiona bajo pedido.',
      items: ['Sin límites de inventario', 'Ideal para productos custom', 'Pedidos bajo demanda']
    }
  };

  readonly tipoMap: Record<TipoPaquete, string> = {
    [TipoPaquete.SINERGICO]: 'SINERGICO',
    [TipoPaquete.ENERGICO]: 'ENERGICO',
  };

  productForm!: FormGroup;

  plantillas = signal<Plantilla[]>([]);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);
  selectedTemplate = signal<Plantilla | null>(null);
  selectedAttributes = signal<{ [key: string]: string[] }>({});
  selectedAttributesTouched = signal<{ [key: string]: boolean }>({});
  isLoading = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  isCreateModalOpen = signal<boolean>(false);
  tipoProducto = signal<TipoPaquete>(TipoPaquete.SINERGICO);
  mostrarSeleccionTipo = signal<boolean>(false);
  tipoSeleccionadoManual = signal<boolean>(true);

  plantillaToEdit?: Plantilla;

  puedeGenerarVariantes = computed(() => this.selectedTemplate() !== null);
  hasMainImage = computed(() => this.subidorImagenes()?.hasMainImage() ?? false);

  mostrarStock = computed(() => {
    const tipo = this.tipoProducto();
    const tienePlantilla = !!this.selectedTemplate();
    if (tipo === TipoPaquete.SINERGICO) return false;
    if (tipo === TipoPaquete.ENERGICO && tienePlantilla) return false;
    return true;
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormListeners();
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      precio: [null, [Validators.required, Validators.min(0), Validators.max(99999999)]],
      stock: [null, [Validators.min(0), Validators.max(1000000)]],
      categoria_id: [null, Validators.required],
      marca_id: [null, Validators.required],
      altura: [null, [mayorQueCero, Validators.max(10000)]],
      ancho: [null, [mayorQueCero, Validators.max(10000)]],
      profundidad: [null, [mayorQueCero, Validators.max(10000)]],
      peso: [null, [mayorQueCero, Validators.max(10000)]],
      plantillaId: [null],
      tipo: [TipoPaquete.SINERGICO]
    });
  }

  cambiarTipoProducto(tipo: TipoPaquete): void {
    this.tipoProducto.set(tipo);
    this.tipoSeleccionadoManual.set(true);
    this.productForm.patchValue({ tipo });
    if (tipo === TipoPaquete.SINERGICO) {
      this.productForm.patchValue({ stock: null });
    }
  }

  navegarAGestionarVariantes(productoId: number): void {
    this.router.navigate(['/admin/gestionar-variantes', productoId]);
  }

  private setupFormListeners(): void {
    this.productForm.get('precio')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(precio => {
        if (precio < 0) {
          this.productForm.patchValue({ precio: 0 }, { emitEvent: false });
        }
      });
  }

  private loadInitialData(): void {
    this.plantillaService.getPlantillas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plantillas) => this.plantillas.set(plantillas),
        error: () => this.toast.error('Error cargando plantillas')
      });

    this.marcaService.getMarcas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (marcas) => this.marcas.set(marcas),
        error: () => this.toast.error('Error cargando marcas')
      });

    this.categoriaService.getCategorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categorias) => this.categorias.set(categorias),
        error: () => this.toast.error('Error cargando categorías')
      });
  }

  crearMarca(nombre: string): void {
    this.creandoMarca.set(true);
    this.marcaService.createMarca(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nueva: Marca) => {
          this.marcas.update(prev => [...prev, nueva]);
          this.productForm.patchValue({ marca_id: nueva.id_marca });
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
          this.marcas.update(prev => prev.map(m => m.id_marca === event.id ? actualizada : m));
          this.toast.success(`Marca actualizada a "${event.nombre}"`);
          this.marcaSelector?.finishEditSuccess(actualizada.nombre);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al actualizar la marca');
          this.marcaSelector?.finishEditError();
        }
      });
  }

  crearCategoria(nombre: string): void {
    this.creandoCategoria.set(true);
    this.categoriaService.createCategoria(nombre)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nueva: Categoria) => {
          this.categorias.update(prev => [...prev, nueva]);
          this.productForm.patchValue({ categoria_id: nueva.id_categoria });
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
          this.categorias.update(prev => prev.map(c => c.id_categoria === id ? actualizada : c));
          if (this.productForm.get('categoria_id')?.value === id) {
            this.productForm.patchValue({ categoria_id: id });
          }
          this.toast.success(`Categoría actualizada a "${actualizada.nombre}"`);
          this.categoriaSelector?.finishEditSuccess(actualizada.nombre);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al editar la categoría');
          this.categoriaSelector?.finishEditError();
        }
      });
  }

  // 🎨 Selección de plantilla
  selectTemplate(template: Plantilla): void {
    if (this.selectedTemplate()?.id !== template.id) {
      this.selectedTemplate.set(template);

      const atributosIniciales: { [key: string]: string[] } = {};
      template.caracteristicas.forEach(car => {
        atributosIniciales[car.nombre] = car.opciones.map(op => op.nombre);
      });
      this.selectedAttributes.set(atributosIniciales);

      const touched: { [key: string]: boolean } = {};
      template.caracteristicas.forEach(car => { touched[car.nombre] = true; });
      this.selectedAttributesTouched.set(touched);
    }

    this.productForm.patchValue({ plantillaId: template.id });
    if (this.tipoProducto() === TipoPaquete.ENERGICO) {
      this.productForm.patchValue({ stock: null });
    }
  }

  onAttributeChange(attributeName: string, value: string, checked: boolean): void {
    this.selectedAttributesTouched.update(current => ({ ...current, [attributeName]: true }));
    this.selectedAttributes.update(current => {
      const updated = { ...current };
      if (!updated[attributeName]) updated[attributeName] = [];
      if (checked) {
        if (!updated[attributeName].includes(value)) {
          updated[attributeName] = [...updated[attributeName], value];
        }
      } else {
        updated[attributeName] = updated[attributeName].filter(v => v !== value);
      }
      return updated;
    });
  }

  isAttributeSelected(attributeName: string, value: string): boolean {
    return this.selectedAttributes()[attributeName]?.includes(value) ?? false;
  }

  // 🚀 Submit
  onSubmit() {
    this.formSubmitted.set(true);
    if (this.productForm.invalid) { this.toast.error('Por favor completá todos los campos requeridos'); this.scrollToFirstError(); return; }
    if (!this.hasMainImage()) { this.toast.error('Debés cargar al menos la imagen principal del producto'); return; }
    if (this.selectedTemplate() && !this.tipoSeleccionadoManual()) { this.toast.error('Debés seleccionar el tipo de producto (Enérgico o Sinérgico)'); this.mostrarSeleccionTipo.set(true); return; }
    if (this.selectedTemplate()) {
      const faltanAtributos = this.selectedTemplate()!.caracteristicas.some(car => (this.selectedAttributes()[car.nombre] || []).length === 0);
      if (faltanAtributos) { this.toast.error('Debés seleccionar al menos una opción de cada característica'); return; }
    }

    this.isLoading.set(true);
    const formData = new FormData();
    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (key === 'tipo') return;
      if (value !== null && value !== undefined && value !== '') formData.append(key, value.toString());
    });
    const tipoBackend = this.tipoMap[this.tipoProducto()];
    if (tipoBackend) formData.append('tipo', tipoBackend);

    if (this.selectedTemplate()) {
      formData.append('opcionesDisponibles', JSON.stringify(this.prepararAtributosParaBackend()));
    }

    const slots = this.subidorImagenes()?.getSlots() || [];
    if (slots[0].file) formData.append('icono', slots[0].file);
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].file) formData.append('imagenes', slots[i].file as Blob);
    }

    this.productoService.createProduct(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
           const productoId = response.id_producto;
           if (this.selectedTemplate() && productoId) {
             this.isLoading.set(false);
             Swal.fire({
               title: '¡Producto creado!',
               html: `<p class="mb-4">El producto y sus variantes se crearon correctamente.</p><p class="text-sm text-gray-600"><strong>${response.variantes?.length || 0}</strong> variantes generadas.</p><p class="text-sm text-gray-600 mt-2">¿Querés configurar las variantes ahora?</p>`,
               icon: 'success', showCancelButton: true,
               confirmButtonColor: 'var(--brand-secondary)', cancelButtonColor: 'var(--text-muted)',
               confirmButtonText: 'Sí, configurar', cancelButtonText: 'Más tarde'
             }).then((result) => {
               if (result.isConfirmed) this.navegarAGestionarVariantes(productoId);
               else this.router.navigate(['/admin/administrar-productos']);
             });
           } else {
            this.isLoading.set(false);
            this.toast.success('Producto creado exitosamente 🚀');
            this.router.navigate(['/admin/administrar-productos']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toast.error(err.error?.message || 'Error creando producto');
        }
      });
  }

  private prepararAtributosParaBackend(): Record<number, number[]> {
    const plantilla = this.selectedTemplate();
    if (!plantilla) return {};
    const resultado: Record<number, number[]> = {};
    plantilla.caracteristicas.forEach(caracteristica => {
      const opcionesSeleccionadas = this.selectedAttributes()[caracteristica.nombre] || [];
      const opcionesIds = caracteristica.opciones
        .filter(opcion => opcionesSeleccionadas.includes(opcion.nombre))
        .map(opcion => opcion.id)
        .filter((id): id is number => id !== undefined);
      if (opcionesIds.length > 0 && caracteristica.id !== undefined) {
        resultado[caracteristica.id] = opcionesIds;
      }
    });
    return resultado;
  }

  public resetForm(): void {
    this.productForm.reset();
    this.selectedTemplate.set(null);
    this.selectedAttributes.set({});
    this.selectedAttributesTouched.set({});
    this.subidorImagenes()?.reset();
    this.tipoSeleccionadoManual.set(true);
    this.formSubmitted.set(false);
    this.router.navigate(['/admin/administrar-productos']);
  }

  openCreateModal(): void { this.isCreateModalOpen.set(true); this.plantillaToEdit = undefined; }
  closeCreateModal(): void { this.isCreateModalOpen.set(false); this.plantillaToEdit = undefined; }
  onPlantillaCreated(plantilla: Plantilla): void {
    this.plantillas.update(current => [...current, plantilla]);
    this.selectTemplate(plantilla);
    this.closeCreateModal();
  }

  deseleccionarPlantilla(): void {
    Swal.fire({
      title: '¿Deseleccionar plantilla?', text: 'El producto quedará sin plantilla asociada',
      icon: 'question', showCancelButton: true,
      confirmButtonColor: 'var(--brand-secondary)', cancelButtonColor: 'var(--error)',
      confirmButtonText: 'Sí, deseleccionar', cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedTemplate.set(null);
        this.selectedAttributes.set({});
        this.selectedAttributesTouched.set({});
        this.tipoSeleccionadoManual.set(true);
        this.productForm.patchValue({ plantillaId: null });
        this.toast.info('Plantilla deseleccionada');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (!control?.errors) return '';
    const errors = control.errors;
    const fieldLabel = this.getFieldLabel(fieldName);
    if (errors['required']) return `${fieldLabel} es requerido`;
    if (errors['minlength']) return `${fieldLabel} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `${fieldLabel} no puede superar los ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return errors['min'].min === 0 ? `${fieldLabel} debe ser mayor a 0` : `${fieldLabel} debe ser mayor o igual a ${errors['min'].min}`;
    if (errors['max']) return `${fieldLabel} debe ser menor o igual a ${errors['max'].max}`;
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'El nombre', descripcion: 'La descripción', precio: 'El precio', stock: 'El stock',
      categoria_id: 'La categoría', marca_id: 'La marca',
      altura: 'La altura', ancho: 'El ancho', profundidad: 'La profundidad', peso: 'El peso'
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

import { Router } from '@angular/router';
import { Component, inject, OnInit, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoPaquete } from '@app/models/Enums';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Interfaces
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';

// Services
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { VarianteService } from '@app/services/variantes/variante.service';
import { ToastService } from '@app/services/toast/toast.service';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { InputComponent } from '@app/shared/input/input-component';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { IconComponent } from '@app/shared/icono/icono';

import Swal from 'sweetalert2';

interface ImageSlot {
  file: File | null;
  preview: string | null;
}

@Component({
  selector: 'app-crear-producto',
  templateUrl: './crear-producto.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    CrearPlantillaModalComponent,
    IconComponent
  ],
  standalone: true
})
export class CrearProductoComponent implements OnInit {
  // 🧩 Inyecciones modernas
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private plantillaService = inject(PlantillaService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
  private varianteService = inject(VarianteService); // 👈 NUEVO
  private toast = inject(ToastService);

  readonly TipoPaquete = TipoPaquete;
  readonly TipoPaqueteLabel: Record<TipoPaquete, string> = {
    [TipoPaquete.SINERGICO]: 'Sinérgico',
    [TipoPaquete.ENERGICO]: 'Enérgico',
    [TipoPaquete.POR_DEFINIR]: 'Por Definir',
  };

  // 📝 Form
  productForm!: FormGroup;

  // 🎯 Signals
  plantillas = signal<Plantilla[]>([]);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);
  selectedTemplate = signal<Plantilla | null>(null);
  selectedAttributes = signal<{ [key: string]: string[] }>({});
  selectedAttributesTouched = signal<{ [key: string]: boolean }>({});
  imageSlots = signal<ImageSlot[]>(
    Array(8).fill(null).map(() => ({ file: null, preview: null }))
  );
  isLoading = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  isCreateModalOpen = signal<boolean>(false);
  tipoProducto = signal<TipoPaquete>(TipoPaquete.POR_DEFINIR);
  mostrarSeleccionTipo = signal<boolean>(false);

  // 🎭 Estados
  draggedIndex: number | null = null;
  plantillaToEdit?: Plantilla;

  // 📊 Computed
  puedeGenerarVariantes = computed(() => {
    return this.selectedTemplate() !== null &&
           this.tipoProducto() !== TipoPaquete.POR_DEFINIR;
  });

  mostrarStock = computed(() => {
    const tipo = this.tipoProducto();
    const tienePlantilla = !!this.selectedTemplate();

    // ❌ Sinérgico → no stock
    if (tipo === TipoPaquete.SINERGICO) return false;

    // ❌ Energético + plantilla → stock por variantes
    if (tipo === TipoPaquete.ENERGICO && tienePlantilla) return false;

    // ✅ Energético sin plantilla → mostrar stock
    return true;
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormListeners();
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      precio: [null, [Validators.required, Validators.min(0)]],
      stock: [null, [Validators.min(0)]],
      categoria_id: [null, Validators.required],
      marca_id: [null, Validators.required],
      altura: [null, [Validators.min(0)]],
      ancho: [null, [Validators.min(0)]],
      profundidad: [null, [Validators.min(0)]],
      peso: [null, [Validators.min(0)]],
      plantillaId: [null],
      tipo: [TipoPaquete.POR_DEFINIR]
    });
  }

  // 🎯 Cambiar tipo de producto
  cambiarTipoProducto(tipo: TipoPaquete): void {
    this.tipoProducto.set(tipo);
    this.productForm.patchValue({ tipo });

    // Si es sinérgico, el stock siempre es null
    if (tipo === TipoPaquete.SINERGICO) {
      this.productForm.patchValue({ stock: null });
    }

    console.log(`✅ Tipo de producto cambiado a: ${tipo}`);
  }

  // 🎯 Navegar a gestionar variantes
  navegarAGestionarVariantes(productoId: number): void {
    this.router.navigate(['/admin/gestionar-variantes', productoId]);
  }

  // 👂 Escuchar cambios del formulario
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
        next: (plantillas) => {
          this.plantillas.set(plantillas);
          console.log('✅ Plantillas cargadas:', plantillas.length);
        },
        error: (err) => {
          console.error('❌ Error plantillas:', err);
          this.toast.error('Error cargando plantillas');
        }
      });

    this.marcaService.getMarcas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (marcas) => {
          this.marcas.set(marcas);
          console.log('✅ Marcas cargadas:', marcas.length);
        },
        error: (err) => {
          console.error('❌ Error marcas:', err);
          this.toast.error('Error cargando marcas');
        }
      });

    this.categoriaService.getCategorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categorias) => {
          this.categorias.set(categorias);
          console.log('✅ Categorías cargadas:', categorias.length);
        },
        error: (err) => {
          console.error('❌ Error categorías:', err);
          this.toast.error('Error cargando categorías');
        }
      });
  }

  // 🎨 Selección de plantilla
  selectTemplate(template: Plantilla): void {
    if (this.selectedTemplate()?.id !== template.id) {
      this.selectedTemplate.set(template);
      this.selectedAttributes.set({});
      this.selectedAttributesTouched.set({});
    }

    this.productForm.patchValue({ plantillaId: template.id });

    // ❌ Si es energético y tiene plantilla → stock por variantes
    if (this.tipoProducto() === TipoPaquete.ENERGICO) {
      this.productForm.patchValue({ stock: null });
    }
  }

  onAttributeChange(attributeName: string, value: string, checked: boolean): void {
    this.selectedAttributesTouched.update(current => ({
      ...current,
      [attributeName]: true
    }));

    this.selectedAttributes.update(current => {
      const updated = { ...current };
      if (!updated[attributeName]) {
        updated[attributeName] = [];
      }

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
    if (!this.selectedAttributesTouched()[attributeName]) {
      return true;
    }
    return this.selectedAttributes()[attributeName]?.includes(value) ?? false;
  }

  // 📸 Manejo de imágenes
  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.toast.error('Solo se permiten archivos de imagen');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('La imagen no puede superar los 5MB');
        return;
      }

      this.imageSlots.update(slots => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], file };
        return newSlots;
      });

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSlots.update(slots => {
          const newSlots = [...slots];
          newSlots[index] = { ...newSlots[index], preview: e.target.result };
          return newSlots;
        });
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeImage(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.imageSlots.update(slots => {
      const newSlots = [...slots];
      newSlots[index] = { file: null, preview: null };
      return newSlots;
    });
  }

  hasImages(): boolean {
    return this.imageSlots().some(slot => slot.file !== null);
  }

  hasMainImage(): boolean {
    return this.imageSlots()[0].file !== null;
  }

  // 🎯 Drag & Drop
  onDragStart(index: number, event: DragEvent) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(targetIndex: number, event: DragEvent) {
    event.preventDefault();

    if (this.draggedIndex === null || this.draggedIndex === targetIndex) {
      this.draggedIndex = null;
      return;
    }

    this.imageSlots.update(slots => {
      const newSlots = [...slots];
      const temp = newSlots[this.draggedIndex!];
      newSlots[this.draggedIndex!] = newSlots[targetIndex];
      newSlots[targetIndex] = temp;
      return newSlots;
    });

    this.draggedIndex = null;
  }

  onDragEnd() {
    this.draggedIndex = null;
  }

  // 🚀 Submit principal
  onSubmit() {
    this.formSubmitted.set(true);

    // ✅ Validar formulario
    if (this.productForm.invalid) {
      this.toast.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    // ✅ Validar imagen principal
    if (!this.hasMainImage()) {
      this.toast.error('Debés cargar al menos la imagen principal del producto');
      return;
    }

    // ✅ Validar tipo de producto si tiene plantilla
    if (this.selectedTemplate() && this.tipoProducto() === TipoPaquete.POR_DEFINIR) {
      this.toast.error('Debés seleccionar el tipo de producto (Energético o Sinérgico)');
      this.mostrarSeleccionTipo.set(true);
      return;
    }

    // ✅ Validar atributos seleccionados si hay plantilla
    if (this.selectedTemplate()) {
      const caracteristicas = this.selectedTemplate()!.caracteristicas;
      const atributosSeleccionados = this.selectedAttributes();

      const faltanAtributos = caracteristicas.some(car => {
        const seleccionados = atributosSeleccionados[car.nombre] || [];
        return seleccionados.length === 0;
      });

      if (faltanAtributos) {
        this.toast.error('Debés seleccionar al menos una opción de cada característica');
        return;
      }
    }

    this.isLoading.set(true);

    // 📦 Preparar FormData
    const formData = new FormData();

    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (key === 'tipo') return;
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // 🔁 Mapear tipo de frontend → enum backend
    const tipoMap: Record<string, string> = {
      'Sinérgico': 'SINERGICO',
      'Enérgico': 'ENERGETICO',
      'Por Definir': 'POR_DEFINIR',
    };

    const tipoBackend = tipoMap[this.tipoProducto()];
    if (tipoBackend) {
      formData.append('tipo', tipoBackend);
    }

    // 📸 Agregar imágenes
    const slots = this.imageSlots();
    if (slots[0].file) {
      formData.append('icono', slots[0].file);
    }

    for (let i = 1; i < slots.length; i++) {
      if (slots[i].file) {
        formData.append('imagenes', slots[i].file as Blob);
      }
    }

    // 🚀 Crear producto
    this.productoService.createProduct(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const productoId = response.id_producto;

          // 🎨 Si tiene plantilla, generar variantes
          if (this.selectedTemplate() && productoId) {
            this.generarVariantesDelProducto(productoId);
          } else {
            // Sin plantilla, terminar aquí
            this.isLoading.set(false);
            this.toast.success('Producto creado exitosamente 🚀');
            this.router.navigate(['/admin/administrar-productos']);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error creando producto', err);
          this.toast.error(err.error?.message || 'Error creando producto');
        }
      });
  }

  // 🎨 Generar variantes después de crear el producto
  private generarVariantesDelProducto(productoId: number): void {
    const atributosParaBackend = this.prepararAtributosParaBackend();

     console.log('🎨 Generando variantes para producto:', productoId);
  console.log('🎨 Atributos preparados:', atributosParaBackend);
  console.log('🎨 Tipo de datos:', typeof atributosParaBackend);
  console.log('🎨 JSON stringify:', JSON.stringify(atributosParaBackend));

    // Validar que haya atributos
    if (Object.keys(atributosParaBackend).length === 0) {
      this.isLoading.set(false);

      this.toast.error('No se encontraron atributos para generar variantes');
      return;
    }

    // Llamar al endpoint POST /api/productos/:id/variantes/generar
    this.varianteService.generarVariantes({
      productoId,
      opcionesDisponibles: atributosParaBackend
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          console.log('✅ Variantes generadas:', response);

          // Mostrar confirmación con SweetAlert
          Swal.fire({
            title: '¡Producto creado!',
            html: `
              <p class="mb-4">El producto se creó correctamente.</p>
              <p class="text-sm text-gray-600">
                <strong>${response.variantes?.length || 0}</strong> variantes generadas.
              </p>
              <p class="text-sm text-gray-600 mt-2">¿Querés configurar el stock ahora?</p>
            `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#71A8D9',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, configurar stock',
            cancelButtonText: 'Más tarde'
          }).then((result) => {
            if (result.isConfirmed) {
              this.navegarAGestionarVariantes(productoId);
            } else {
              this.router.navigate(['/admin/administrar-productos']);
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('❌ Error generando variantes:', err);
              console.error('❌ Error COMPLETO:', err);
        console.error('❌ Error message:', err.error?.message);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error statusText:', err.statusText);
        console.error('❌ Error body completo:', err.error);

          // El producto se creó, pero las variantes fallaron
          Swal.fire({
            title: 'Producto creado',
            html: `
              <p class="mb-2">El producto se creó correctamente.</p>
              <p class="text-sm text-red-600">
                ⚠️ Pero hubo un error al generar las variantes:
                <br><strong>${err.error?.message || 'Error desconocido'}</strong>
              </p>
              <p class="text-sm text-gray-600 mt-2">
                Podés intentar generar las variantes manualmente más tarde.
              </p>
            `,
            icon: 'warning',
            confirmButtonColor: '#71A8D9',
            confirmButtonText: 'Entendido'
          }).then(() => {
            this.router.navigate(['/admin/administrar-productos']);
          });
        }
      });
  }

  // 🎨 Preparar atributos en el formato que espera el backend
  private prepararAtributosParaBackend(): Record<number, number[]> {
    const plantilla = this.selectedTemplate();
    if (!plantilla) return {};

    const resultado: Record<number, number[]> = {};
console.log('🎨 Plantilla:', plantilla);
  console.log('🎨 Características:', plantilla.caracteristicas);
  console.log('🎨 Selected Attributes:', this.selectedAttributes());
    plantilla.caracteristicas.forEach(caracteristica => {
      const opcionesSeleccionadas = this.selectedAttributes()[caracteristica.nombre] || [];

      console.log(`🔍 Característica: ${caracteristica.nombre} (ID: ${caracteristica.id})`);
    console.log('  ↳ Opciones seleccionadas:', opcionesSeleccionadas);
    console.log('  ↳ Opciones disponibles:', caracteristica.opciones);
      // Filtrar opciones que existen en la plantilla
      const opcionesIds = caracteristica.opciones
        .filter(opcion => opcionesSeleccionadas.includes(opcion.nombre))
        .map(opcion => opcion.id)
        .filter((id): id is number => id !== undefined);

      if (opcionesIds.length > 0 && caracteristica.id !== undefined) {
        resultado[caracteristica.id] = opcionesIds;
      }
    });

    console.log('🎨 Selected Template:', plantilla);
    console.log('🎨 Selected Attributes:', this.selectedAttributes());
    console.log('🎨 Prepared Attributes:', resultado);
    console.log('📊 Resultado final:', resultado);
  console.log('📊 Número de características con opciones:', Object.keys(resultado).length);

    return resultado;
  }

  // 🧹 Reset formulario
  public resetForm(): void {
    this.productForm.reset();
    this.selectedTemplate.set(null);
    this.selectedAttributes.set({});
    this.selectedAttributesTouched.set({});
    this.imageSlots.set(Array(8).fill(null).map(() => ({ file: null, preview: null })));
    this.formSubmitted.set(false);
    this.router.navigate(['/admin/administrar-productos']);
  }

  // 🎯 Modal
  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.plantillaToEdit = undefined;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.plantillaToEdit = undefined;
  }

  onPlantillaCreated(plantilla: Plantilla): void {
    this.plantillas.update(current => [...current, plantilla]);
    this.selectTemplate(plantilla);
    this.closeCreateModal();
  }

  deseleccionarPlantilla(): void {
    Swal.fire({
      title: '¿Deseleccionar plantilla?',
      text: 'El producto quedará sin plantilla asociada',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, deseleccionar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.selectedTemplate.set(null);
        this.selectedAttributes.set({});
        this.selectedAttributesTouched.set({});
        this.productForm.patchValue({ plantillaId: null });
        this.toast.info('Plantilla deseleccionada');
      }
    });
  }

  // 🧹 Helpers para validación
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
    if (errors['min']) return `${fieldLabel} debe ser mayor o igual a ${errors['min'].min}`;

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'El nombre',
      precio: 'El precio',
      stock: 'El stock',
      categoria_id: 'La categoría',
      marca_id: 'La marca',
      altura: 'La altura',
      ancho: 'El ancho',
      profundidad: 'La profundidad',
      peso: 'El peso'
    };
    return labels[fieldName] || fieldName;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.border-red-500, .text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

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

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { InputComponent } from '@app/shared/input/input-component'; // 👈 NUEVO
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';

import Swal from 'sweetalert2';
import { ToastService } from '@app/services/toast/toast.service';
import { IconComponent } from '@app/shared/icono/icono';

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
    InputComponent, // 👈 NUEVO - Agregar aquí
    CrearPlantillaModalComponent,
    IconComponent
],
  standalone: true
})
export class CrearProductoComponent implements OnInit {
  // 🧩 Inyecciones modernas
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef); // 👈 NUEVO
  private plantillaService = inject(PlantillaService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
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

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.setupFormListeners(); // 👈 NUEVO
  }
  // 🎯 Agregar este computed
puedeGenerarVariantes = computed(() => {
  return this.selectedTemplate() !== null &&
         this.tipoProducto() !== TipoPaquete.POR_DEFINIR;
});

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
  // 🎯 Método para cambiar el tipo de producto
cambiarTipoProducto(tipo: TipoPaquete): void {
  this.tipoProducto.set(tipo);
  this.productForm.patchValue({ tipo });

  // Si es sinérgico, el stock siempre es null
  if (tipo === TipoPaquete.SINERGICO) {
    this.productForm.patchValue({ stock: null });
  }

  console.log(`✅ Tipo de producto cambiado a: ${tipo}`);
}

// 🎯 Método para navegar a gestionar variantes después de crear
navegarAGestionarVariantes(productoId: number): void {
  this.router.navigate(['/admin/gestionar-variantes', productoId]);
}
  // 🎯 Computed para mostrar/ocultar campo stock
mostrarStock = computed(() => {
  const tipo = this.tipoProducto();
  const tienePlantilla = !!this.selectedTemplate();

  // ❌ Sinérgico → no stock
  if (tipo === TipoPaquete.SINERGICO) return false;

  // ❌ Energético + plantilla → stock por variantes
  if (tipo === TipoPaquete.ENERGICO && tienePlantilla) return false;

  // ✅ Energético sin plantilla
  return true;
});

  // 👂 Escuchar cambios del formulario con DestroyRef
  private setupFormListeners(): void {
    // Validación automática del precio (no negativo)
    this.productForm.get('precio')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(precio => {
        if (precio < 0) {
          this.productForm.patchValue({ precio: 0 }, { emitEvent: false });
        }
      });

    // Log de cambios (solo para debug)
    this.productForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // console.log('Form changed:', values);
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

  // 🚀 Submit
  onSubmit() {
  this.formSubmitted.set(true);

  if (this.productForm.invalid) {
    this.toast.error('Por favor completá todos los campos requeridos');
    this.scrollToFirstError();
    return;
  }

  if (!this.hasMainImage()) {
    this.toast.error('Debés cargar al menos la imagen principal del producto');
    return;
  }

  // Validar tipo de producto si tiene plantilla
  if (this.selectedTemplate() && this.tipoProducto() === TipoPaquete.POR_DEFINIR) {
    this.toast.error('Debés seleccionar el tipo de producto (Energético o Sinérgico)');
    this.mostrarSeleccionTipo.set(true);
    return;
  }

  this.isLoading.set(true);

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


  const slots = this.imageSlots();
  if (slots[0].file) {
    formData.append('icono', slots[0].file);
  }

  for (let i = 1; i < slots.length; i++) {
    if (slots[i].file) {
      formData.append('imagenes', slots[i].file as Blob);
    }
  }

  this.productoService.createProduct(formData)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.toast.success('Producto creado exitosamente 🚀');

        // Si tiene plantilla, redirigir a gestionar variantes
        if (this.selectedTemplate()) {
          Swal.fire({
            title: '¡Producto creado!',
            html: `
              <p class="mb-4">El producto se creó correctamente.</p>
              <p class="text-sm text-gray-600">¿Querés configurar las variantes ahora?</p>
            `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#71A8D9',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, configurar variantes',
            cancelButtonText: 'Más tarde'
          }).then((result) => {
            if (result.isConfirmed) {
              this.navegarAGestionarVariantes(response.id_producto??0);
            } else {
              this.router.navigate(['/admin/administrar-productos']);
            }
          });
        } else {
          // Sin plantilla, volver a la lista
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

  // 🧹 Helpers para validación (ya no son necesarios con InputComponent, pero los dejamos por compatibilidad)
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
}

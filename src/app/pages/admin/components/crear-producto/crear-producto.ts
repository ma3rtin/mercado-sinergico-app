import { Router } from '@angular/router';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

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
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';

// SweetAlert2
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
    CrearPlantillaModalComponent
  ],
  standalone: true
})
export class CrearProductoComponent implements OnInit {
  productForm!: FormGroup;
  private toastr = inject(ToastrService);
  private router = inject(Router);

  // ✅ SIGNALS - Datos para select
  plantillas = signal<Plantilla[]>([]);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);

  // ✅ SIGNALS - Estado del componente
  selectedTemplate = signal<Plantilla | null>(null);
  selectedAttributes = signal<{ [key: string]: string[] }>({});
  selectedAttributesTouched = signal<{ [key: string]: boolean }>({});

  // ✅ SIGNALS - Sistema de slots de imágenes
  imageSlots = signal<ImageSlot[]>(
    Array(8).fill(null).map(() => ({ file: null, preview: null }))
  );

  // ✅ SIGNALS - Flags de estado
  isLoading = signal<boolean>(false);
  formSubmitted = signal<boolean>(false);
  isCreateModalOpen = signal<boolean>(false);

  // Variables normales (no necesitan ser signals)
  shouldCreateTemplate = 'false';
  draggedIndex: number | null = null;
  plantillaToEdit?: Plantilla;

  constructor(
    private fb: FormBuilder,
    private plantillaService: PlantillaService,
    private marcaService: MarcaService,
    private categoriaService: CategoriaService,
    private productoService: ProductosService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
  }

  initializeForm(): void {
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
      plantillaId: [null]
    });
  }

  loadInitialData(): void {
    this.plantillaService.getPlantillas().subscribe({
      next: (plantillas) => {
        this.plantillas.set(plantillas);
        console.log('✅ Plantillas cargadas:', plantillas);
      },
      error: (err) => {
        console.error('❌ Error plantillas:', err);
        this.toastr.error('Error cargando plantillas');
      }
    });

    this.marcaService.getMarcas().subscribe({
      next: (marcas) => {
        this.marcas.set(marcas);
        console.log('✅ Marcas cargadas:', marcas);
      },
      error: (err) => {
        console.error('❌ Error marcas:', err);
        this.toastr.error('Error cargando marcas');
      }
    });

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => {
        this.categorias.set(categorias);
        console.log('✅ Categorías cargadas:', categorias);
      },
      error: (err) => {
        console.error('❌ Error categorías:', err);
        this.toastr.error('Error cargando categorías');
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
    this.productForm.patchValue({
      plantillaId: template.id
    });
  }

  // 🏷️ Manejo de atributos
  onAttributeChange(attributeName: string, value: string, checked: boolean): void {
    // Marcar como touched
    this.selectedAttributesTouched.update(current => ({
      ...current,
      [attributeName]: true
    }));

    // Actualizar atributos seleccionados
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

  // 📸 Sistema mejorado de manejo de imágenes
  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Solo se permiten archivos de imagen');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('La imagen no puede superar los 5MB');
        return;
      }

      // Actualizar el slot con el archivo
      this.imageSlots.update(slots => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], file };
        return newSlots;
      });

      // Generar preview
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

    // Resetear el input
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

  // 🎯 Drag & Drop para reordenar
  onDragStart(index: number, event: DragEvent) {
    this.draggedIndex.set(index);
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

    // Intercambiar los slots
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
    this.draggedIndex.set(null);
  }

  // 🚀 Submit
  onSubmit() {
    this.formSubmitted.set(true);

    if (this.productForm.invalid) {
      this.toastr.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    if (!this.hasMainImage()) {
      this.toastr.error('Debés cargar al menos la imagen principal del producto');
      return;
    }

    this.isLoading.set(true);

    const formData = new FormData();

    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Agregar imagen principal (icono)
    const slots = this.imageSlots();
    if (slots[0].file) {
      formData.append('icono', slots[0].file);
    }

    // Agregar imágenes adicionales
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].file) {
        formData.append('imagenes', slots[i].file as Blob);
      }
    }

    this.productoService.createProduct(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success('Producto creado exitosamente 🚀');
        this.resetForm();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error creando producto', err);
        this.toastr.error(err.error?.message || 'Error creando producto');
      }
    });
  }

  // 🧹 Reset
  public resetForm(): void {
    this.productForm.reset();
    this.selectedTemplate.set(null);
    this.selectedAttributes.set({});
    this.selectedAttributesTouched.set({});
    this.imageSlots.set(Array(8).fill(null).map(() => ({ file: null, preview: null })));
    this.shouldCreateTemplate = 'false';
    this.formSubmitted.set(false);
    this.router.navigate(['/administrar-productos']);
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

  // 🎮 Validación
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

  // 📋 Debug
  logFormStatus(): void {
    console.log('Form Status:', this.productForm.status);
    console.log('Form Values:', this.productForm.value);
    console.log('Form Errors:', this.getFormErrors());
    console.log('Selected Template:', this.selectedTemplate());
    console.log('Selected Attributes:', this.selectedAttributes());
    console.log('Image Slots:', this.imageSlots());
  }

  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.productForm.controls).forEach(key => {
      const controlErrors = this.productForm.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  loadTestData(): void {
    this.productForm.patchValue({
      nombre: 'Casco de Prueba',
      descripcion: 'Descripción de prueba para el casco',
      precio: 1500,
      stock: 10,
      altura: 15,
      ancho: 20,
      profundidad: 25,
      peso: 1.5
    });
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
        this.toastr.info('Plantilla deseleccionada');
      }
    });
  }
}

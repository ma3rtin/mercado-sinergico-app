import { Router } from '@angular/router';
// crear-producto.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

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
//
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
  
  // Datos para select
  plantillas: Plantilla[] = [];
  marcas: Marca[] = [];
  categorias: Categoria[] = [];

  // Estado del componente
  selectedTemplate: Plantilla | null = null;
  selectedAttributes: { [key: string]: string[] } = {};
  selectedAttributesTouched: { [key: string]: boolean } = {};
  
  // NUEVO: Sistema de slots de imágenes
  imageSlots: ImageSlot[] = Array(8).fill(null).map(() => ({ file: null, preview: null }));
  
  isLoading = false;
  shouldCreateTemplate = 'false';
  formSubmitted = false; // NUEVO: para mostrar errores solo después del submit

  // Drag & Drop
  draggedIndex: number | null = null;

  // Modal
  isCreateModalOpen = false;
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
    this.plantillaService.getPlantillas().subscribe((plantillas) => {
      this.plantillas = plantillas;
    });

    this.marcaService.getMarcas().subscribe((marcas) => {
      this.marcas = marcas;
    });

    this.categoriaService.getCategorias().subscribe((categorias) => {
      this.categorias = categorias;
    });
  }

  // 🎨 Selección de plantilla
  selectTemplate(template: Plantilla): void {
    if (this.selectedTemplate?.id !== template.id) {
      this.selectedTemplate = template;
      this.selectedAttributes = {};
      this.selectedAttributesTouched = {};
    }
    this.productForm.patchValue({
      plantillaId: template.id
    });
  }

  // 🏷️ Manejo de atributos
  onAttributeChange(attributeName: string, value: string, checked: boolean): void {
    this.selectedAttributesTouched[attributeName] = true;

    if (!this.selectedAttributes[attributeName]) {
      this.selectedAttributes[attributeName] = [];
    }

    if (checked) {
      if (!this.selectedAttributes[attributeName].includes(value)) {
        this.selectedAttributes[attributeName].push(value);
      }
    } else {
      this.selectedAttributes[attributeName] =
        this.selectedAttributes[attributeName].filter(v => v !== value);
    }
  }

  isAttributeSelected(attributeName: string, value: string): boolean {
    if (!this.selectedAttributesTouched[attributeName]) {
      return true;
    }
    return this.selectedAttributes[attributeName]?.includes(value) ?? false;
  }

  // 📸 NUEVO: Sistema mejorado de manejo de imágenes
  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('La imagen no puede superar los 5MB');
        return;
      }

      // Guardar el archivo y generar preview
      this.imageSlots[index].file = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSlots[index].preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    
    // Resetear el input para permitir seleccionar el mismo archivo
    input.value = '';
  }

  removeImage(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.imageSlots[index] = { file: null, preview: null };
  }

  hasImages(): boolean {
    return this.imageSlots.some(slot => slot.file !== null);
  }

  hasMainImage(): boolean {
    return this.imageSlots[0].file !== null;
  }

  // 🎯 NUEVO: Drag & Drop para reordenar
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

    // Intercambiar los slots
    const temp = this.imageSlots[this.draggedIndex];
    this.imageSlots[this.draggedIndex] = this.imageSlots[targetIndex];
    this.imageSlots[targetIndex] = temp;
    
    this.draggedIndex = null;
  }

  onDragEnd() {
    this.draggedIndex = null;
  }

  // 🚀 Envío del formulario
  onSubmit() {
    this.formSubmitted = true;

    // Validar campos requeridos
    if (this.productForm.invalid) {
      this.toastr.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    // Validar imagen principal
    if (!this.hasMainImage()) {
      this.toastr.error('Debés cargar al menos la imagen principal del producto');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();

    // Agregar campos básicos
    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Agregar imagen principal (icono)
    if (this.imageSlots[0].file) {
      formData.append('icono', this.imageSlots[0].file);
    }

    // Agregar imágenes adicionales
    for (let i = 1; i < this.imageSlots.length; i++) {
      if (this.imageSlots[i].file) {//Le agregué as Blob
        formData.append('imagenes', this.imageSlots[i].file as Blob);
      }
    }

    this.productoService.createProduct(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Producto creado exitosamente 🚀');
        this.resetForm();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error creando producto', err);
        this.toastr.error(err.error?.message || 'Error creando producto');
      }
    });
  }

  // 🧹 Resetear formulario
  public resetForm(): void {
    this.productForm.reset();
    this.selectedTemplate = null;
    this.selectedAttributes = {};
    this.selectedAttributesTouched = {};
    this.imageSlots = Array(8).fill(null).map(() => ({ file: null, preview: null }));
    this.shouldCreateTemplate = 'false';
    this.formSubmitted = false;
          this.router.navigate(['/administrar-productos']);
  }

  // 🎯 Modal
  openCreateModal(): void {
    this.isCreateModalOpen = true;
    this.plantillaToEdit = undefined;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.plantillaToEdit = undefined;
  }

  onPlantillaCreated(plantilla: Plantilla): void {
    this.plantillas.push(plantilla);
    this.selectTemplate(plantilla);
    this.closeCreateModal();
  }

  // 🎮 Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted));
  }

  getErrorMessage(fieldName: string): string {
    const control = this.productForm.get(fieldName);
    if (!control?.errors) return '';

    const errors = control.errors;
    const fieldLabel = this.getFieldLabel(fieldName);

    if (errors['required']) {
      return `${fieldLabel} es requerido`;
    }
    if (errors['minlength']) {
      return `${fieldLabel} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }
    if (errors['min']) {
      return `${fieldLabel} debe ser mayor o igual a ${errors['min'].min}`;
    }
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

  // 🎮 Getters útiles
  get isFormValid(): boolean {
    return this.productForm.valid && this.hasMainImage();
  }

  // 📋 Debug
  logFormStatus(): void {
    console.log('Form Status:', this.productForm.status);
    console.log('Form Values:', this.productForm.value);
    console.log('Form Errors:', this.getFormErrors());
    console.log('Selected Template:', this.selectedTemplate);
    console.log('Selected Attributes:', this.selectedAttributes);
    console.log('Image Slots:', this.imageSlots);
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
  // Agregar este método:
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
      this.selectedTemplate = null;
      this.selectedAttributes = {};
      this.selectedAttributesTouched = {};
      this.productForm.patchValue({ plantillaId: null });
      this.toastr.info('Plantilla deseleccionada');
    }
  });
}
}
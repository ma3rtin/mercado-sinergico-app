import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';

// Services
import { ProductosService } from '@app/services/producto/producto.service';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';

// Components
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';

interface ImageSlot {
  file: File | null;
  preview: string | null;
  existingUrl?: string; // URL de la imagen existente en el servidor
  isExisting?: boolean; // Flag para saber si es una imagen ya guardada
}

@Component({
  selector: 'app-editar-producto',
  templateUrl: './editar-producto.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonComponent,
    CrearPlantillaModalComponent
  ],
  standalone: true
})
export class EditarProductoComponent implements OnInit {
  productForm!: FormGroup;
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Datos para select
  plantillas: Plantilla[] = [];
  marcas: Marca[] = [];
  categorias: Categoria[] = [];

  // Estado del componente
  selectedTemplate: Plantilla | null = null;
  selectedAttributes: { [key: string]: string[] } = {};
  selectedAttributesTouched: { [key: string]: boolean } = {};
  
  // Sistema de slots de imágenes
  imageSlots: ImageSlot[] = Array(8).fill(null).map(() => ({ 
    file: null, 
    preview: null,
    isExisting: false
  }));
  
  isLoading = false;
  formSubmitted = false;
  productoId: number | null = null;
  productoOriginal: Producto | null = null;

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
    this.loadProductoToEdit();
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

  loadProductoToEdit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.toastr.error('ID de producto no encontrado');
      this.router.navigate(['/administrar-productos']);
      return;
    }

    this.productoId = Number(id);
    this.isLoading = true;

    this.productoService.getProductoById(this.productoId).subscribe({
      next: (producto) => {
        this.productoOriginal = producto;
        this.populateForm(producto);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.toastr.error('Error al cargar el producto');
        this.router.navigate(['/administrar-productos']);
        this.isLoading = false;
      }
    });
  }

  populateForm(producto: Producto): void {
    // Llenar el formulario con los datos del producto
    this.productForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      categoria_id: producto.categoria?.id_categoria,
      marca_id: producto.marca?.id_marca,
      altura: producto.altura,
      ancho: producto.ancho,
      profundidad: producto.profundidad,
      peso: producto.peso,
      plantillaId: producto.plantilla?.id
    });

    // Cargar plantilla si existe
    if (producto.plantilla) {
      const plantilla = this.plantillas.find(p => p.id === producto.plantilla?.id);
      if (plantilla) {
        this.selectTemplate(plantilla);
      }
    }

    // Cargar imágenes existentes
    if (producto.imagen_url) {
      this.imageSlots[0] = {
        file: null,
        preview: producto.imagen_url,
        existingUrl: producto.imagen_url,
        isExisting: true
      };
    }

    // Cargar imágenes adicionales si existen
    if (producto.imagenes && Array.isArray(producto.imagenes)) {
      producto.imagenes.forEach((imagen, index) => {
        if (index < 7) { // Máximo 7 imágenes adicionales
          this.imageSlots[index + 1] = {
            file: null,
            preview: imagen.url || imagen.url,
            existingUrl: imagen.url || imagen.url,
            isExisting: true
          };
        }
      });
    }
  }

  // Selección de plantilla
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

  // Manejo de atributos
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

  // Manejo de imágenes
  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Solo se permiten archivos de imagen');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('La imagen no puede superar los 5MB');
        return;
      }

      this.imageSlots[index].file = file;
      this.imageSlots[index].isExisting = false;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageSlots[index].preview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
    
    input.value = '';
  }

  removeImage(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.imageSlots[index] = { file: null, preview: null, isExisting: false };
  }

  hasImages(): boolean {
    return this.imageSlots.some(slot => slot.file !== null || slot.isExisting);
  }

  hasMainImage(): boolean {
    return this.imageSlots[0].file !== null || this.imageSlots[0].isExisting === true;
  }

  // Drag & Drop
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

    const temp = this.imageSlots[this.draggedIndex];
    this.imageSlots[this.draggedIndex] = this.imageSlots[targetIndex];
    this.imageSlots[targetIndex] = temp;
    
    this.draggedIndex = null;
  }

  onDragEnd() {
    this.draggedIndex = null;
  }

  // Envío del formulario
  onSubmit() {
    this.formSubmitted = true;

    if (this.productForm.invalid) {
      this.toastr.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    if (!this.hasMainImage()) {
      this.toastr.error('Debés tener al menos la imagen principal del producto');
      return;
    }

    if (!this.productoId) {
      this.toastr.error('ID de producto no encontrado');
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

    // Agregar imagen principal solo si es nueva
    if (this.imageSlots[0].file) {
      formData.append('icono', this.imageSlots[0].file);
    }

    // Agregar imágenes adicionales solo si son nuevas
    for (let i = 1; i < this.imageSlots.length; i++) {
      if (this.imageSlots[i].file) {
        formData.append('imagenes', this.imageSlots[i].file as Blob);
      }
    }

    this.productoService.updateProducto(this.productoId, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('Producto actualizado exitosamente 🎉');
        this.router.navigate(['administrar-productos']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error actualizando producto', err);
        this.toastr.error(err.error?.message || 'Error actualizando producto');
      }
    });
  }

  // Cancelar edición
  cancelEdit(): void {
    this.router.navigate(['/administrar-productos']);
  }

  // Modal
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

  // Helpers para validación
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

  get isFormValid(): boolean {
    return this.productForm.valid && this.hasMainImage();
  }
}
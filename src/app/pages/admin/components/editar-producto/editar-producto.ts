import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  existingUrl?: string;
  isExisting?: boolean;
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
  // Injections
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plantillaService = inject(PlantillaService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);

  // Form
  productForm!: FormGroup;

  // Signals - Datos para selects
  plantillas = signal<Plantilla[]>([]);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);

  // Signals - Estado del producto
  productoId = signal<number | null>(null);
  productoOriginal = signal<Producto | null>(null);

  // Signals - Plantilla y atributos
  selectedTemplate = signal<Plantilla | null>(null);
  selectedAttributes = signal<{ [key: string]: string[] }>({});
  selectedAttributesTouched = signal<{ [key: string]: boolean }>({});

  // Signals - Imágenes
  imageSlots = signal<ImageSlot[]>(
    Array(8).fill(null).map(() => ({
      file: null,
      preview: null,
      isExisting: false
    }))
  );

  // Signals - Estado UI
  isLoading = signal(false);
  formSubmitted = signal(false);
  draggedIndex = signal<number | null>(null);
  isCreateModalOpen = signal(false);
  plantillaToEdit = signal<Plantilla | undefined>(undefined);

  // Computed signals
  hasImages = computed(() =>
    this.imageSlots().some(slot => slot.file !== null || slot.isExisting)
  );

  hasMainImage = computed(() => {
    const mainSlot = this.imageSlots()[0];
    return mainSlot.file !== null || mainSlot.isExisting === true;
  });

  isFormValid = computed(() =>
    this.productForm?.valid && this.hasMainImage()
  );

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
    this.plantillaService.getPlantillas().subscribe({
      next: (plantillas) => this.plantillas.set(plantillas),
      error: (error) => {
        console.error('Error cargando plantillas:', error);
        this.toastr.error('Error al cargar plantillas');
      }
    });

    this.marcaService.getMarcas().subscribe({
      next: (marcas) => this.marcas.set(marcas),
      error: (error) => {
        console.error('Error cargando marcas:', error);
        this.toastr.error('Error al cargar marcas');
      }
    });

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.toastr.error('Error al cargar categorías');
      }
    });
  }

  loadProductoToEdit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toastr.error('ID de producto no encontrado');
      this.router.navigate(['admin/administrar-productos']);
      return;
    }

    this.productoId.set(Number(id));
    this.isLoading.set(true);

    this.productoService.getProductoById(this.productoId()!).subscribe({
      next: (producto) => {
        this.productoOriginal.set(producto);
        this.populateForm(producto);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.toastr.error('Error al cargar el producto');
        this.router.navigate(['admin/administrar-productos']);
        this.isLoading.set(false);
      }
    });
  }

  populateForm(producto: Producto): void {
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
      const plantilla = this.plantillas().find(p => p.id === producto.plantilla?.id);
      if (plantilla) {
        this.selectTemplate(plantilla);
      }
    }

    // Cargar imágenes
    this.loadProductImages(producto);
  }

  loadProductImages(producto: Producto): void {
    const newSlots: ImageSlot[] = Array(8).fill(null).map(() => ({
      file: null,
      preview: null,
      isExisting: false
    }));

    // Imagen principal
    if (producto.imagen_url) {
      newSlots[0] = {
        file: null,
        preview: producto.imagen_url,
        existingUrl: producto.imagen_url,
        isExisting: true
      };
    }

    // Imágenes adicionales
    if (producto.imagenes && Array.isArray(producto.imagenes)) {
      producto.imagenes.forEach((imagen, index) => {
        if (index < 7) {
          const imageUrl = imagen.url || imagen.url;
          newSlots[index + 1] = {
            file: null,
            preview: imageUrl,
            existingUrl: imageUrl,
            isExisting: true
          };
        }
      });
    }

    this.imageSlots.set(newSlots);
  }

  // Selección de plantilla
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

  // Manejo de atributos
  onAttributeChange(attributeName: string, value: string, checked: boolean): void {
    const touched = { ...this.selectedAttributesTouched() };
    touched[attributeName] = true;
    this.selectedAttributesTouched.set(touched);

    const attributes = { ...this.selectedAttributes() };
    if (!attributes[attributeName]) {
      attributes[attributeName] = [];
    }

    if (checked) {
      if (!attributes[attributeName].includes(value)) {
        attributes[attributeName] = [...attributes[attributeName], value];
      }
    } else {
      attributes[attributeName] = attributes[attributeName].filter(v => v !== value);
    }

    this.selectedAttributes.set(attributes);
  }

  isAttributeSelected(attributeName: string, value: string): boolean {
    if (!this.selectedAttributesTouched()[attributeName]) {
      return true;
    }
    return this.selectedAttributes()[attributeName]?.includes(value) ?? false;
  }

  // Manejo de imágenes
  onFileSelected(event: Event, index: number): void {
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

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newSlots = [...this.imageSlots()];
        newSlots[index] = {
          file,
          preview: e.target.result,
          existingUrl: undefined,
          isExisting: false
        };
        this.imageSlots.set(newSlots);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeImage(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const newSlots = [...this.imageSlots()];
    newSlots[index] = {
      file: null,
      preview: null,
      existingUrl: undefined,
      isExisting: false
    };
    this.imageSlots.set(newSlots);
  }

  // Drag & Drop
  onDragStart(index: number, event: DragEvent): void {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(targetIndex: number, event: DragEvent): void {
    event.preventDefault();
    const dragIndex = this.draggedIndex();

    if (dragIndex === null || dragIndex === targetIndex) {
      this.draggedIndex.set(null);
      return;
    }

    const newSlots = [...this.imageSlots()];
    const temp = newSlots[dragIndex];
    newSlots[dragIndex] = newSlots[targetIndex];
    newSlots[targetIndex] = temp;

    this.imageSlots.set(newSlots);
    this.draggedIndex.set(null);
  }

  onDragEnd(): void {
    this.draggedIndex.set(null);
  }

  // Envío del formulario
  onSubmit(): void {
    this.formSubmitted.set(true);

    if (this.productForm.invalid) {
      this.toastr.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    if (!this.hasMainImage()) {
      this.toastr.error('Debés tener al menos la imagen principal del producto');
      return;
    }

    const id = this.productoId();
    if (!id) {
      this.toastr.error('ID de producto no encontrado');
      return;
    }

    this.isLoading.set(true);
    const formData = this.buildFormData();

    this.productoService.updateProducto(id, formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success('Producto actualizado exitosamente 🎉');
        this.router.navigate(['admin/administrar-productos']);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error actualizando producto', err);
        this.toastr.error(err.error?.message || 'Error actualizando producto');
      }
    });
  }

  private buildFormData(): FormData {
    const formData = new FormData();

    // Agregar campos básicos
    Object.entries(this.productForm.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    const slots = this.imageSlots();

    // Imagen principal solo si es nueva
    if (slots[0].file) {
      formData.append('icono', slots[0].file);
    }

    // Imágenes adicionales solo si son nuevas
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].file) {
        formData.append('imagenes', slots[i].file as Blob);
      }
    }

    return formData;
  }

  // Cancelar edición
  cancelEdit(): void {
    this.router.navigate(['admin/administrar-productos']);
  }

  // Modal
  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.plantillaToEdit.set(undefined);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.plantillaToEdit.set(undefined);
  }

  onPlantillaCreated(plantilla: Plantilla): void {
    this.plantillas.update(plantillas => [...plantillas, plantilla]);
    this.selectTemplate(plantilla);
    this.closeCreateModal();
  }

  // Helpers para validación
  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm?.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.formSubmitted()));
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
}

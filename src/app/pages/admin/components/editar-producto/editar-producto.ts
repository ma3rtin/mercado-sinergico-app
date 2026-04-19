import {
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoPaquete } from '@app/models/Enums';

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
import { VarianteService } from '@app/services/variantes/variante.service';
import { ToastService } from '@app/services/toast/toast.service';

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { InputComponent } from '@app/shared/input/input-component';
import { IconComponent } from '@app/shared/icono/icono';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

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
    InputComponent,
    IconComponent,
    CrearPlantillaModalComponent,
    AdminBackButtonComponent,
  ],
  standalone: true,
})
export class EditarProductoComponent implements OnInit {
  // Injections
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private plantillaService = inject(PlantillaService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
  private varianteService = inject(VarianteService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly TipoPaquete = TipoPaquete;
  readonly tipoMap: Record<TipoPaquete, string> = {
    [TipoPaquete.SINERGICO]: 'SINERGICO',
    [TipoPaquete.ENERGICO]: 'Enérgico',
    [TipoPaquete.POR_DEFINIR]: 'POR_DEFINIR',
  };

  // Form
  productForm!: FormGroup;

  // Signals - Datos para selects
  plantillas = signal<Plantilla[]>([]);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);

  // Signals - Estado del producto
  productoId = signal<number | null>(null);
  productoOriginal = signal<Producto | null>(null);
  tipoProducto = signal<TipoPaquete>(TipoPaquete.POR_DEFINIR);

  // Signals - Plantilla y atributos
  selectedTemplate = signal<Plantilla | null>(null);
  selectedAttributes = signal<{ [key: string]: string[] }>({});
  selectedAttributesTouched = signal<{ [key: string]: boolean }>({});

  // Signals - Imágenes
  imageSlots = signal<ImageSlot[]>(
    Array(8)
      .fill(null)
      .map(() => ({
        file: null,
        preview: null,
        isExisting: false,
      })),
  );

  // Signals - Estado UI
  isLoading = signal(false);
  formSubmitted = signal(false);
  draggedIndex = signal<number | null>(null);
  isCreateModalOpen = signal(false);
  plantillaToEdit = signal<Plantilla | undefined>(undefined);

  // Computed signals
  hasImages = computed(() =>
    this.imageSlots().some((slot) => slot.file !== null || slot.isExisting),
  );

  hasMainImage = computed(() => {
    const mainSlot = this.imageSlots()[0];
    return mainSlot.file !== null || mainSlot.isExisting === true;
  });

  isFormValid = computed(() => this.productForm?.valid && this.hasMainImage());

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
      plantillaId: [null],
    });
  }

  loadInitialData(): void {
    this.plantillaService.getPlantillas().subscribe({
      next: (plantillas) => this.plantillas.set(plantillas),
      error: (error) => {
        console.error('Error cargando plantillas:', error);
        this.toast.error('Error al cargar plantillas');
      },
    });

    this.marcaService.getMarcas().subscribe({
      next: (marcas) => this.marcas.set(marcas),
      error: (error) => {
        console.error('Error cargando marcas:', error);
        this.toast.error('Error al cargar marcas');
      },
    });

    this.categoriaService.getCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.toast.error('Error al cargar categorías');
      },
    });
  }

  // ============================================
  // HELPERS PARA MANEJAR MARCA Y CATEGORÍA
  // ============================================

  private getMarcaId(producto: Producto): number | undefined {
    if (typeof producto.marca === 'object' && producto.marca?.id_marca) {
      return producto.marca.id_marca;
    }
    return producto.marca_id;
  }

  private getCategoriaId(producto: Producto): number | undefined {
    if (
      typeof producto.categoria === 'object' &&
      producto.categoria?.id_categoria
    ) {
      return producto.categoria.id_categoria;
    }
    return producto.categoria_id;
  }

  private getImagenUrl(producto: Producto): string {
    return producto.imagen_url || producto.imagen || '/assets/placeholder.png';
  }

  // ============================================
  // TIPO DE PRODUCTO
  // ============================================

  cambiarTipoProducto(tipo: TipoPaquete): void {
    this.tipoProducto.set(tipo);

    if (tipo === TipoPaquete.SINERGICO) {
      this.productForm.patchValue({ stock: null });
    }

    console.log(`✅ Tipo de producto cambiado a: ${tipo}`);
  }

  navegarAGestionarVariantes(productoId: number): void {
    this.router.navigate(['/admin/gestionar-variantes', productoId]);
  }

  // ============================================
  // CARGAR PRODUCTO A EDITAR
  // ============================================

  loadProductoToEdit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.toast.error('ID de producto no encontrado');
      this.router.navigate(['admin/administrar-productos']);
      return;
    }

    this.productoId.set(Number(id));
    this.isLoading.set(true);

    this.productoService.getProductoById(this.productoId()!).subscribe({
      next: (producto) => {
        console.log('📦 Producto cargado para editar:', producto);

        this.productoOriginal.set(producto);
        this.populateForm(producto);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.toast.error('Error al cargar el producto');
        this.router.navigate(['admin/administrar-productos']);
        this.isLoading.set(false);
      },
    });
  }

  populateForm(producto: Producto): void {
    console.log('🔄 Poblando formulario con:', producto);
    console.log('  ↳ Tipo:', producto.tipo);
    console.log('  ↳ Marca:', producto.marca);
    console.log('  ↳ Categoría:', producto.categoria);
    console.log('  ↳ Plantilla:', producto.plantilla);

    // ✅ 1. Cargar tipo de producto
    if (producto.tipo) {
      const tipoEnum = producto.tipo as TipoPaquete;
      this.tipoProducto.set(tipoEnum);
      console.log('✅ Tipo cargado:', tipoEnum);
    }

    // ✅ 2. Cargar datos básicos del formulario
    this.productForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,

      // ✅ Manejar marca (string u objeto)
      marca_id: this.getMarcaId(producto),

      // ✅ Manejar categoría (string u objeto)
      categoria_id: this.getCategoriaId(producto),

      altura: producto.altura,
      ancho: producto.ancho,
      profundidad: producto.profundidad,
      peso: producto.peso,
      plantillaId: producto.plantilla?.id,
    });

    // ✅ 3. Cargar plantilla si existe
    if (producto.plantilla) {
      // Esperar a que las plantillas se carguen
      setTimeout(() => {
        const plantilla = this.plantillas().find(
          (p) => p.id === producto.plantilla?.id,
        );

        if (plantilla) {
          console.log('✅ Plantilla encontrada y seleccionada:', plantilla);
          this.selectTemplate(plantilla);
        } else {
          console.warn('⚠️ Plantilla no encontrada en la lista');
        }
      }, 500);
    }

    // ✅ 4. Cargar imágenes
    this.loadProductImages(producto);
  }

  loadProductImages(producto: Producto): void {
    const newSlots: ImageSlot[] = Array(8)
      .fill(null)
      .map(() => ({
        file: null,
        preview: null,
        isExisting: false,
      }));

    // Imagen principal
    const imagenPrincipal = this.getImagenUrl(producto);
    if (imagenPrincipal && imagenPrincipal !== '/assets/placeholder.png') {
      newSlots[0] = {
        file: null,
        preview: imagenPrincipal,
        existingUrl: imagenPrincipal,
        isExisting: true,
      };
    }

    // Imágenes adicionales
    if (producto.imagenes && Array.isArray(producto.imagenes)) {
      producto.imagenes.forEach((imagen, index) => {
        if (index < 7) {
          const imageUrl = (imagen as any).url || (imagen as any).imagen_url;
          if (imageUrl) {
            newSlots[index + 1] = {
              file: null,
              preview: imageUrl,
              existingUrl: imageUrl,
              isExisting: true,
            };
          }
        }
      });
    }

    this.imageSlots.set(newSlots);
    console.log(
      '✅ Imágenes cargadas:',
      newSlots.filter((s) => s.preview),
    );
  }

  // ============================================
  // SELECCIÓN DE PLANTILLA
  // ============================================

  selectTemplate(template: Plantilla): void {
    if (this.selectedTemplate()?.id !== template.id) {
      this.selectedTemplate.set(template);

      // 🔥 Inicializar TODOS los atributos seleccionados
      const atributosIniciales: { [key: string]: string[] } = {};

      template.caracteristicas.forEach((car) => {
        atributosIniciales[car.nombre] = car.opciones.map((op) => op.nombre);
      });

      this.selectedAttributes.set(atributosIniciales);

      // Marcar como tocados
      const touched: { [key: string]: boolean } = {};
      template.caracteristicas.forEach((car) => {
        touched[car.nombre] = true;
      });

      this.selectedAttributesTouched.set(touched);
    }

    this.productForm.patchValue({ plantillaId: template.id });

    if (this.tipoProducto() === TipoPaquete.ENERGICO) {
      this.productForm.patchValue({ stock: null });
    }
  }

  // ============================================
  // MANEJO DE ATRIBUTOS
  // ============================================

  onAttributeChange(
    attributeName: string,
    value: string,
    checked: boolean,
  ): void {
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
      attributes[attributeName] = attributes[attributeName].filter(
        (v) => v !== value,
      );
    }

    this.selectedAttributes.set(attributes);
  }

  isAttributeSelected(attributeName: string, value: string): boolean {
    return this.selectedAttributes()[attributeName]?.includes(value) ?? false;
  }

  // ============================================
  // MANEJO DE IMÁGENES
  // ============================================

  onFileSelected(event: Event, index: number): void {
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

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newSlots = [...this.imageSlots()];
        newSlots[index] = {
          file,
          preview: e.target.result,
          existingUrl: undefined,
          isExisting: false,
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
      isExisting: false,
    };
    this.imageSlots.set(newSlots);
  }

  // ============================================
  // DRAG & DROP
  // ============================================

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

  // ============================================
  // ENVÍO DEL FORMULARIO
  // ============================================

  onSubmit(): void {
    this.formSubmitted.set(true);

    if (this.productForm.invalid) {
      this.toast.error('Por favor completá todos los campos requeridos');
      this.scrollToFirstError();
      return;
    }

    if (!this.hasMainImage()) {
      this.toast.error('Debés tener al menos la imagen principal del producto');
      return;
    }

    const id = this.productoId();
    if (!id) {
      this.toast.error('ID de producto no encontrado');
      return;
    }

    this.isLoading.set(true);
    const formData = this.buildFormData();

    // Agregar tipo de producto
    const tipoBackend = this.tipoMap[this.tipoProducto()];
    if (tipoBackend) {
      formData.append('tipo', tipoBackend);
    }

    this.productoService.updateProducto(id, formData).subscribe({
      next: () => {
        // 🎨 Si tiene plantilla, generar variantes
        // Solo generar variantes si antes NO tenía plantilla
        if (!this.productoOriginal()?.plantilla && this.selectedTemplate()) {
          this.generarVariantesDelProducto(id);
        } else {
          this.isLoading.set(false);
          this.toast.success('Producto actualizado correctamente 🚀');
          this.router.navigate(['/admin/administrar-productos']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error actualizando producto', err);
        this.toast.error(err.error?.message || 'Error actualizando producto');
      },
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

  // ============================================
  // CANCELAR EDICIÓN
  // ============================================

  cancelEdit(): void {
    this.router.navigate(['admin/administrar-productos']);
  }

  // ============================================
  // MODAL
  // ============================================

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.plantillaToEdit.set(undefined);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.plantillaToEdit.set(undefined);
  }

  onPlantillaCreated(plantilla: Plantilla): void {
    this.plantillas.update((plantillas) => [...plantillas, plantilla]);
    this.selectTemplate(plantilla);
    this.closeCreateModal();
  }

  // ============================================
  // HELPERS PARA VALIDACIÓN
  // ============================================

  isFieldInvalid(fieldName: string): boolean {
    const control = this.productForm?.get(fieldName);
    return !!(
      control &&
      control.invalid &&
      (control.touched || this.formSubmitted())
    );
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
    this.varianteService
      .generarVariantes({
        productoId,
        opcionesDisponibles: atributosParaBackend,
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
                <p class="text-sm text-gray-600 mt-2">¿Querés configurar la/s variante/s ahora?</p>
              `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#2E608C',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Sí, configurar',
            cancelButtonText: 'Más tarde',
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
                <p class="text-sm text-error">
                  ⚠️ Pero hubo un error al generar las variantes:
                  <br><strong>${err.error?.message || 'Error desconocido'}</strong>
                </p>
                <p class="text-sm text-gray-600 mt-2">
                  Podés intentar generar las variantes manualmente más tarde.
                </p>
              `,
            icon: 'warning',
            confirmButtonColor: '#2E608C',
            confirmButtonText: 'Entendido',
          }).then(() => {
            this.router.navigate(['/admin/administrar-productos']);
          });
        },
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
    plantilla.caracteristicas.forEach((caracteristica) => {
      const opcionesSeleccionadas =
        this.selectedAttributes()[caracteristica.nombre] || [];

      console.log(
        `🔍 Característica: ${caracteristica.nombre} (ID: ${caracteristica.id})`,
      );
      console.log('  ↳ Opciones seleccionadas:', opcionesSeleccionadas);
      console.log('  ↳ Opciones disponibles:', caracteristica.opciones);
      // Filtrar opciones que existen en la plantilla
      const opcionesIds = caracteristica.opciones
        .filter((opcion) => opcionesSeleccionadas.includes(opcion.nombre))
        .map((opcion) => opcion.id)
        .filter((id): id is number => id !== undefined);

      if (opcionesIds.length > 0 && caracteristica.id !== undefined) {
        resultado[caracteristica.id] = opcionesIds;
      }
    });

    console.log('🎨 Selected Template:', plantilla);
    console.log('🎨 Selected Attributes:', this.selectedAttributes());
    console.log('🎨 Prepared Attributes:', resultado);
    console.log('📊 Resultado final:', resultado);
    console.log(
      '📊 Número de características con opciones:',
      Object.keys(resultado).length,
    );

    return resultado;
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
      peso: 'El peso',
    };
    return labels[fieldName] || fieldName;
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector(
        '.border-error, .text-error',
      );
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

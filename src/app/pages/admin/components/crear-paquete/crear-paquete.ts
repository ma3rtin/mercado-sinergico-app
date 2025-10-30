import {
  Component,
  ElementRef,
  OnInit,
  AfterViewChecked,
  ViewChild,
  HostListener,
  inject,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { MarcaService } from '@app/services/producto/marca.service';
import { CategoriaService } from '@app/services/producto/categoria.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';

@Component({
  selector: 'app-crear-paquete',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './crear-paquete.html',
})
export class CrearPaqueteComponent implements OnInit, AfterViewChecked {
  nombre = '';
  descripcion = '';
  marcaSeleccionada: number | null = null;
  categoriaSeleccionada: number | null = null;

  marcas: Marca[] = [];
  categorias: Categoria[] = [];

  imagenSeleccionada: File | null = null;
  imagenError: string | null = null;

  busquedaProducto = '';
  resultadosBusqueda: Producto[] = [];
  productosSeleccionados: Producto[] = [];

  page = 0;
  limit = 10;
  cargando = false;
  finResultados = false;
  sinResultados = false;
  creandoPaquete = false;

  @ViewChild('sentinel', { static: false })
  sentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer', { static: false })
  scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('inputBusqueda', { static: false })
  inputBusqueda?: ElementRef<HTMLInputElement>;
  @ViewChild('paqueteForm') paqueteForm!: NgForm;

  private observer?: IntersectionObserver;
  private lazyInitialized = false;
  private toastr = inject(ToastrService);
  private paqueteBaseService = inject(PaqueteBaseService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);

  constructor() {}

  ngOnInit(): void {
    this.cargarMarcas();
    this.cargarCategorias();
  }

  ngAfterViewChecked(): void {
    if (
      !this.lazyInitialized &&
      this.resultadosBusqueda.length > 0 &&
      this.sentinel &&
      this.scrollContainer
    ) {
      this.configurarLazyLoading();
      this.lazyInitialized = true;
    }
  }

  cargarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => (this.marcas = data),
      error: (err: any) => console.error('Error al obtener marcas:', err),
    });
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: Categoria[]) => (this.categorias = data),
      error: (err: any) => console.error('Error al obtener categorías:', err),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const maxSize = 200 * 1024; // 200 KB

    if (!file.type.startsWith('image/')) {
      this.imagenError = 'Solo se permiten archivos de imagen.';
      this.imagenSeleccionada = null;
      return;
    }

    if (file.size > maxSize) {
      this.imagenError = 'La imagen debe pesar menos de 200 KB.';
      this.imagenSeleccionada = null;
      return;
    }

    this.imagenError = null;
    this.imagenSeleccionada = file;
  }

buscarProductos(reset = true): void {
  const query = this.busquedaProducto.trim(); // puede estar vacío

  // si ya terminó o está cargando, salimos
  if (this.cargando || this.finResultados) return;

  // si es un nuevo inicio de búsqueda (por texto o foco inicial)
  if (reset) {
    this.page = 0;
    this.resultadosBusqueda = [];
    this.finResultados = false;
    this.lazyInitialized = false;
    this.observer?.disconnect();
  }

  this.cargando = true;

  // ✅ si query está vacío, igualmente trae todos los productos paginados
  this.productoService
    .getProductosFiltrados(query, this.page * this.limit, this.limit)
    .subscribe({
      next: (data: Producto[]) => {
        const idsSeleccionados = new Set(
          this.productosSeleccionados.map((p) => p.id_producto!)
        );

        const nuevos = data.filter(
          (p: Producto) => !idsSeleccionados.has(p.id_producto!)
        );

        if (nuevos.length < this.limit) this.finResultados = true;

        this.resultadosBusqueda.push(...nuevos);
        this.page++;
        this.cargando = false;

        // si no se encontró nada
        this.sinResultados =
          this.resultadosBusqueda.length === 0 && !this.cargando;
      },
      error: (err: any) => {
        console.error('Error al buscar productos:', err);
        this.cargando = false;
        this.toastr.error(
          'Error al buscar productos: ' +
            (err.error?.message || 'Error de red')
        );
      },
    });
}

// ✅ cuando se hace clic o focus en el input
reabrirBusqueda(): void {
  // Si no hay resultados cargados, muestra los primeros productos
  if (this.resultadosBusqueda.length === 0) {
    this.buscarProductos(true);
  }
  // Si ya hay texto escrito (busca con filtro)
  else if (this.busquedaProducto.trim().length > 0) {
    this.buscarProductos(true);
  }
}


  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (
      this.inputBusqueda?.nativeElement.contains(target) ||
      this.scrollContainer?.nativeElement.contains(target)
    ) {
      return;
    }

    this.resultadosBusqueda = [];
    this.sinResultados = false;
  }

  private configurarLazyLoading(): void {
    const sentinelEl = this.sentinel?.nativeElement;
    const scrollEl = this.scrollContainer?.nativeElement;

    if (!sentinelEl || !scrollEl) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !this.finResultados &&
          !this.cargando
        ) {
          this.buscarProductos(false);
        }
      },
      { root: scrollEl, rootMargin: '0px 0px 100px 0px', threshold: 0.1 }
    );

    this.observer.observe(sentinelEl);
  }

  agregarProducto(producto: Producto): void {
    this.productosSeleccionados.push(producto);
    this.resultadosBusqueda = this.resultadosBusqueda.filter(
      (p) => p.id_producto !== producto.id_producto
    );

    this.busquedaProducto = '';
    this.resultadosBusqueda = [];
    this.sinResultados = false;

    this.inputBusqueda?.nativeElement.blur();
  }

  eliminarProducto(index: number): void {
    const productoEliminado = this.productosSeleccionados[index];
    this.productosSeleccionados.splice(index, 1);

    const busquedaActual = this.busquedaProducto.trim().toLowerCase();
    if (
      busquedaActual &&
      productoEliminado.nombre.toLowerCase().includes(busquedaActual)
    ) {
      this.resultadosBusqueda.unshift(productoEliminado);
      this.sinResultados = false;
    }
  }

  crearPaquete(): void {
    if (!this.nombre || this.nombre.trim().length < 3) {
      this.toastr.error(
        'El nombre es obligatorio y debe tener al menos 3 caracteres.',
        'Error de Validación'
      );
      return;
    }
    if (!this.descripcion || this.descripcion.trim().length === 0) {
      this.toastr.error(
        'La descripción es obligatoria.',
        'Error de Validación'
      );
      return;
    }
    if (
      this.categoriaSeleccionada === null ||
      this.categoriaSeleccionada === undefined
    ) {
      this.toastr.error(
        'Debés seleccionar una categoría.',
        'Error de Validación'
      );
      return;
    }
    if (this.productosSeleccionados.length === 0) {
      this.toastr.error(
        'Debés agregar al menos un producto al paquete.',
        'Error de Validación'
      );
      return;
    }

    if (!this.imagenSeleccionada) {
      this.toastr.error(
        'La imagen de portada es obligatoria.',
        'Error de Validación'
      );
      return;
    }

    this.creandoPaquete = true;

    const formData = new FormData();

    formData.append('nombre', this.nombre);
    formData.append('descripcion', this.descripcion);
    formData.append('categoria_id', this.categoriaSeleccionada!.toString());

    if (this.marcaSeleccionada) {
      formData.append('marcaId', this.marcaSeleccionada.toString());
    }

    this.productosSeleccionados.forEach((producto) => {
      formData.append('productos', producto.id_producto!.toString());
    });

    formData.append('imagen', this.imagenSeleccionada);

    this.paqueteBaseService.createPaquete(formData).subscribe({
      next: () => {
        this.toastr.success('Paquete base creado con éxito!', 'Éxito');
        this.resetForm();
      },
      error: (err) => {
        const errorMessage =
          err.error?.message ||
          'Ocurrió un error al crear el paquete. Revisa la consola.';
        this.toastr.error(errorMessage, 'Fallo');
        console.error('Error del servidor al crear paquete:', err);
      },
      complete: () => {
        this.creandoPaquete = false;
      },
    });
  }

  public resetForm(): void {
    this.paqueteForm?.resetForm({
      nombre: '',
      descripcion: '',
      marcaSeleccionada: null,
      categoriaSeleccionada: null,
      busquedaProducto: '',
    });

    this.productosSeleccionados = [];
    this.imagenSeleccionada = null;
    this.imagenError = null;
    this.resultadosBusqueda = [];
    this.finResultados = false;
    this.sinResultados = false;

    const inputElement = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }
}
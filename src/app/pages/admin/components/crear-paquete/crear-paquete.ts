import {
  Component,
  ElementRef,
  OnInit,
  AfterViewChecked,
  ViewChild,
  HostListener,
  DestroyRef,
  effect,
  signal,
  inject,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';


@Component({
  selector: 'app-crear-paquete',
  standalone: true,
  imports: [FormsModule, HttpClientModule, AdminCreateWrapperComponent, SelectorTipoCardComponent, AdminBackButtonComponent],
  templateUrl: './crear-paquete.html',
})
export class CrearPaqueteComponent implements OnInit, AfterViewChecked {
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

  // 🧠 Signals principales
  nombre = signal<string>('');
  descripcion = signal<string>('');
  tipoPaquete = signal<TipoPaquete>(TipoPaquete.SINERGICO);
  marcaSeleccionada = signal<number | null>(null);
  categoriaSeleccionada = signal<number | null>(null);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);

  imagenSeleccionada = signal<File | null>(null);
  imagenError = signal<string | null>(null);

  busquedaProducto = signal<string>('');
  resultadosBusqueda = signal<Producto[]>([]);
  productosSeleccionados = signal<Producto[]>([]);

  page = signal<number>(0);
  limit = 10;
  cargando = signal<boolean>(false);
  finResultados = signal<boolean>(false);
  sinResultados = signal<boolean>(false);
  creandoPaquete = signal<boolean>(false);

  // 🧩 ViewChilds
  @ViewChild('sentinel', { static: false }) sentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLElement>;
  @ViewChild('inputBusqueda', { static: false }) inputBusqueda?: ElementRef<HTMLInputElement>;
  @ViewChild('paqueteForm') paqueteForm!: NgForm;

  private observer?: IntersectionObserver;
  private lazyInitialized = false;
   private toast = inject(ToastService);

  constructor(
    private paqueteBaseService: PaqueteBaseService,
    private marcaService: MarcaService,
    private categoriaService: CategoriaService,
    private productoService: ProductosService,
    private destroyRef: DestroyRef,
    private router: Router
  ) {
    // 🔄 Efecto opcional: reacciona cuando cambia el texto de búsqueda
    effect(() => {
      const query = this.busquedaProducto().trim();
      if (query.length > 2) this.buscarProductos(true);
    });
  }

  ngOnInit(): void {
    this.cargarMarcas();
    this.cargarCategorias();
  }

  ngAfterViewChecked(): void {
    if (!this.lazyInitialized && this.resultadosBusqueda().length > 0 && this.sentinel && this.scrollContainer) {
      this.configurarLazyLoading();
      this.lazyInitialized = true;
    }
  }

  // 🔄 Cargar datos base
  private cargarMarcas(): void {
    this.marcaService.getMarcas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.marcas.set(data),
      error: (err) => console.error('Error al obtener marcas:', err),
    });
  }

  onTipoPaqueteChange(tipo: TipoPaquete): void {
    this.tipoPaquete.set(tipo);
  }

  private cargarCategorias(): void {
    this.categoriaService.getCategorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.categorias.set(data),
      error: (err) => console.error('Error al obtener categorías:', err),
    });
  }

  // 📸 Manejo de imagen
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const maxSize = 200 * 1024;

    if (!file.type.startsWith('image/')) {
      this.imagenError.set('Solo se permiten archivos de imagen.');
      this.imagenSeleccionada.set(null);
      return;
    }
    if (file.size > maxSize) {
      this.imagenError.set('La imagen debe pesar menos de 200 KB.');
      this.imagenSeleccionada.set(null);
      return;
    }

    this.imagenError.set(null);
    this.imagenSeleccionada.set(file);
  }

  // 🔍 Buscar productos
  buscarProductos(reset = true): void {
    const query = this.busquedaProducto().trim();
    if (this.cargando() || (!reset && this.finResultados())) return;

    if (reset) {
      this.page.set(0);
      this.resultadosBusqueda.set([]);
      this.finResultados.set(false);
      this.lazyInitialized = false;
      this.observer?.disconnect();
    }

    this.cargando.set(true);

    this.productoService
      .getProductosFiltrados(query, this.page() * this.limit, this.limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const idsSeleccionados = new Set(this.productosSeleccionados().map((p) => p.id_producto!));
          const nuevos = data.filter((p) => !idsSeleccionados.has(p.id_producto!));
          if (nuevos.length < this.limit) this.finResultados.set(true);

          this.resultadosBusqueda.set([...this.resultadosBusqueda(), ...nuevos]);
          this.page.update((p) => p + 1);
          this.cargando.set(false);
          this.sinResultados.set(this.resultadosBusqueda().length === 0 && !this.cargando());
        },
        error: (err) => {
          console.error('Error al buscar productos:', err);
          this.cargando.set(false);
          this.toast.error('Error al buscar productos: ' + (err.error?.message || 'Error de red'));
        },
      });
  }

  reabrirBusqueda(): void {
    if (this.resultadosBusqueda().length === 0 || this.busquedaProducto().trim().length > 0) {
      this.buscarProductos(true);
    }
  }

  // 🧠 Lazy loading
  private configurarLazyLoading(): void {
    const sentinelEl = this.sentinel?.nativeElement;
    const scrollEl = this.scrollContainer?.nativeElement;
    if (!sentinelEl || !scrollEl) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.finResultados() && !this.cargando()) {
          this.buscarProductos(false);
        }
      },
      { root: scrollEl, rootMargin: '0px 0px 100px 0px', threshold: 0.1 }
    );

    this.observer.observe(sentinelEl);
  }

  // 📦 Gestión de productos
  agregarProducto(producto: Producto): void {
    this.productosSeleccionados.set([...this.productosSeleccionados(), producto]);
    this.resultadosBusqueda.set(this.resultadosBusqueda().filter((p) => p.id_producto !== producto.id_producto));

    this.busquedaProducto.set('');
    this.resultadosBusqueda.set([]);
    this.sinResultados.set(false);
    this.inputBusqueda?.nativeElement.blur();
  }

  eliminarProducto(index: number): void {
    const actual = [...this.productosSeleccionados()];
    const eliminado = actual[index];
    actual.splice(index, 1);
    this.productosSeleccionados.set(actual);

    const query = this.busquedaProducto().trim().toLowerCase();
    if (query && eliminado.nombre.toLowerCase().includes(query)) {
      this.resultadosBusqueda.set([eliminado, ...this.resultadosBusqueda()]);
      this.sinResultados.set(false);
    }
  }

  // 🧾 Crear paquete
  crearPaquete(): void {
    if (!this.nombre() || this.nombre().trim().length < 3) {
      this.toast.error('El nombre debe tener al menos 3 caracteres.', 'Error de Validación');
      return;
    }
    if (!this.descripcion() || this.descripcion().trim().length === 0) {
      this.toast.error('La descripción es obligatoria.', 'Error de Validación');
      return;
    }
    if (!this.categoriaSeleccionada()) {
      this.toast.error('Debés seleccionar una categoría.', 'Error de Validación');
      return;
    }
    if (this.productosSeleccionados().length === 0) {
      this.toast.error('Debés agregar al menos un producto al paquete.', 'Error de Validación');
      return;
    }
    if (!this.imagenSeleccionada()) {
      this.toast.error('La imagen de portada es obligatoria.', 'Error de Validación');
      return;
    }

    this.creandoPaquete.set(true);
    const formData = new FormData();
    formData.append('nombre', this.nombre());
    formData.append('descripcion', this.descripcion());
    formData.append('categoria_id', this.categoriaSeleccionada()!.toString());
    formData.append('tipo', this.tipoPaquete());
    if (this.marcaSeleccionada()) {
      formData.append('marcaId', this.marcaSeleccionada()!.toString());
    }
    this.productosSeleccionados().forEach((p) => formData.append('productos', p.id_producto!.toString()));
    formData.append('imagen', this.imagenSeleccionada()!);

    this.paqueteBaseService
      .createPaquete(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('¡Paquete creado con éxito!', 'Éxito');
          this.resetForm();
          this.router.navigate(['admin/perfil']);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al crear el paquete.', 'Fallo');
          console.error('Error del servidor al crear paquete:', err);
        },
        complete: () => this.creandoPaquete.set(false),
      });
  }

  // 🔄 Reset formulario
  public resetForm(): void {
    this.paqueteForm?.resetForm({
      nombre: '',
      descripcion: '',
      marcaSeleccionada: null,
      categoriaSeleccionada: null,
      busquedaProducto: '',
    });

    this.productosSeleccionados.set([]);
    this.imagenSeleccionada.set(null);
    this.imagenError.set(null);
    this.resultadosBusqueda.set([]);
    this.finResultados.set(false);
    this.sinResultados.set(false);

    const inputElement = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (inputElement) inputElement.value = '';
  }

  // 📤 Click fuera
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.inputBusqueda?.nativeElement.contains(target) || this.scrollContainer?.nativeElement.contains(target))
      return;
    this.resultadosBusqueda.set([]);
    this.sinResultados.set(false);
  }
}

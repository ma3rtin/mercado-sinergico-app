import {
  Component,
  ElementRef,
  OnInit,
  AfterViewChecked,
  ViewChild,
  DestroyRef,
  signal,
  inject,
  computed,
} from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

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
import { SelectorTipoCardComponent, SelectorTipoCardContenido } from '@app/shared/selector-tipo-card/selector-tipo-card';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { InputComponent } from '@app/shared/input/input-component';
import { SelectComponent, SelectOption } from '@app/shared/select/select-component';
import { LoaderComponent } from '@app/shared/loader/loader';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-paquete-base',
  standalone: true,
  imports: [
    FormsModule,
    AdminCreateWrapperComponent,
    ButtonComponent,
    IconComponent,
    BackButtonComponent,
    InputComponent,
    SelectComponent,
    SelectorTipoCardComponent,
    LoaderComponent,
    LoadingOverlay,
  ],
  templateUrl: './editar-paquete-base.html',
})
export class EditarPaqueteBaseComponent implements OnInit, AfterViewChecked {
  private baseService = inject(PaqueteBaseService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private productoService = inject(ProductosService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly TipoPaquete = TipoPaquete;
  readonly tipoCardContenido: SelectorTipoCardContenido = {
    energico: {
      titulo: 'Enérgico',
      subtitulo: 'Con stock físico',
      descripcion: 'El stock se controla físicamente.',
      items: ['Control preciso', 'Evita sobreventa']
    },
    sinergico: {
      titulo: 'Sinérgico',
      subtitulo: 'Bajo pedido',
      descripcion: 'Se gestiona bajo pedido.',
      items: ['Sin límites', 'Ideal para custom']
    }
  };

  // Mapeo para asegurar consistencia con el backend
  readonly tipoMap: Record<TipoPaquete, string> = {
    [TipoPaquete.SINERGICO]: 'SINERGICO',
    [TipoPaquete.ENERGICO]: 'ENERGICO',
  };

  idPaquete = signal<number | null>(null);
  nombre = signal<string>('');
  descripcion = signal<string>('');
  tipoPaquete = signal<TipoPaquete>(TipoPaquete.SINERGICO);
  marcaSeleccionada = signal<number | null>(null);
  categoriaSeleccionada = signal<number | null>(null);
  marcas = signal<Marca[]>([]);
  categorias = signal<Categoria[]>([]);
  productosSeleccionados = signal<Producto[]>([]);

  imagenUrl = signal<string | null>(null);
  imagenSeleccionada = signal<File | null>(null);
  imagenError = signal<string | null>(null);

  busquedaProducto = signal<string>('');
  resultadosBusqueda = signal<Producto[]>([]);
  isLoading = signal(true);
  guardando = signal(false);

  selectedProductoId = signal<number | null>(null);
  productosOptions = computed<SelectOption[]>(() => {
    const seleccionadosIds = new Set(this.productosSeleccionados().map((p) => p.id_producto));
    const tipoActual = this.tipoPaquete();

    return this.resultadosBusqueda()
      .filter(p => !seleccionadosIds.has(p.id_producto) && p.tipo === tipoActual)
      .map(p => ({
        value: p.id_producto,
        label: p.nombre
      }));
  });

  @ViewChild('inputBusqueda') inputBusqueda?: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  constructor() { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.idPaquete.set(Number(id));
      this.cargarDatos();
    }
    this.cargarListas();
  }

  ngAfterViewChecked(): void { }

  cargarListas(): void {
    this.marcaService.getMarcas().subscribe(data => this.marcas.set(data));
    this.categoriaService.getCategorias().subscribe(data => this.categorias.set(data));
    this.productoService.getProductos().subscribe(data => this.resultadosBusqueda.set(data));
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    // Simulado hasta tener getPaqueteById en baseService
    this.baseService.getPaquetes().subscribe(paquetes => {
      const p = paquetes.find(x => x.id_paquete_base === this.idPaquete());
      if (p) {
        this.nombre.set(p.nombre);
        this.descripcion.set(p.descripcion);
        this.categoriaSeleccionada.set(p.categoria_id);
        this.marcaSeleccionada.set(p.marcaId || null);
        this.imagenUrl.set(p.imagen_url);
        this.tipoPaquete.set(p.tipo || TipoPaquete.SINERGICO);

        // Cargar productos del paquete
        this.baseService.getProductosByPaqueteBase(p.id_paquete_base!).subscribe(prods => {
          this.productosSeleccionados.set(prods);
          this.isLoading.set(false);
        });
      }
    });
  }

  onTipoPaqueteChange(nuevoTipo: TipoPaquete): void {
    const productosActuales = this.productosSeleccionados();

    if (productosActuales.length === 0) {
      this.tipoPaquete.set(nuevoTipo);
      return;
    }

    const productosIncompatibles = productosActuales.filter(p => p.tipo !== nuevoTipo);

    if (productosIncompatibles.length > 0) {
      Swal.fire({
        title: '¿Cambiar tipo de paquete?',
        html: `
          <p class="mb-4 text-sm text-gray-600">Al cambiar a <b>${nuevoTipo}</b>, se removerán <b>${productosIncompatibles.length}</b> producto(s) incompatibles.</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--brand-secondary)',
        cancelButtonColor: 'var(--text-muted)',
        confirmButtonText: 'Sí, cambiar y limpiar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          this.tipoPaquete.set(nuevoTipo);
          this.productosSeleccionados.set(productosActuales.filter(p => p.tipo === nuevoTipo));
          this.toast.info('Se han removido los productos incompatibles.');
        }
        // El componente selector mantendrá visualmente el estado anterior si no se hace el .set()
      });
    } else {
      this.tipoPaquete.set(nuevoTipo);
    }
  }

  agregarProducto(p: Producto): void {
    this.productosSeleccionados.update(prods => [...prods, p]);
  }

  onSelectProducto(id: number | null): void {
    if (!id) return;
    const prod = this.resultadosBusqueda().find(p => p.id_producto === id);
    if (prod) {
      this.agregarProducto(prod);
    }
    // Limpiar selección para permitir agregar otro
    setTimeout(() => this.selectedProductoId.set(null), 50);
  }

  eliminarProducto(index: number): void {
    this.productosSeleccionados.update(prods => {
      const n = [...prods];
      n.splice(index, 1);
      return n;
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.imagenSeleccionada.set(file);
  }

  guardar(): void {
    const id = this.idPaquete();
    if (!id) {
      this.toast.error('ID de paquete no válido.');
      return;
    }

    this.guardando.set(true);

    const paqueteActualizado = {
      id_paquete_base: id,
      nombre: this.nombre(),
      descripcion: this.descripcion(),
      imagen_url: this.imagenUrl() ?? '',
      categoria_id: this.categoriaSeleccionada()!,
      marcaId: this.marcaSeleccionada()!,
      tipo: this.tipoPaquete(),
    };

    const productosIds = this.productosSeleccionados()
      .map(p => p.id_producto)
      .filter((pid): pid is number => pid !== undefined);

    this.baseService.updatePaquete(paqueteActualizado).pipe(
      switchMap(() => this.baseService.agregarProductos(id, productosIds))
    ).subscribe({
      next: () => {
        this.toast.success('Paquete y productos actualizados. Los cambios ya se reflejan en la publicación activa.');
        this.router.navigate(['/admin/administrar-paquetes']);
      },
      error: (err) => {
        console.error('❌ Error al actualizar paquete:', err);
        this.toast.error('Error al actualizar. Verificá los datos e intentá de nuevo.');
        this.guardando.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/administrar-paquetes']);
  }
}

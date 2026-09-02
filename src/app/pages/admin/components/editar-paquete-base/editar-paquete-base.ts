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
import { throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
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
  productosQuitadosPorTipo = signal<Producto[]>([]);

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
    this.baseService.getPaquetes().subscribe({
      next: paquetes => {
        const p = paquetes.find(x => x.id_paquete_base === this.idPaquete());
        if (!p) {
          this.isLoading.set(false);
          this.toast.error('No encontramos ese paquete. Puede que lo hayan eliminado.');
          this.router.navigate(['/admin/administrar-paquetes']);
          return;
        }

        this.nombre.set(p.nombre);
        this.descripcion.set(p.descripcion);
        this.categoriaSeleccionada.set(p.categoria_id);
        this.marcaSeleccionada.set(p.marcaId || null);
        this.imagenUrl.set(p.imagen_url);
        this.tipoPaquete.set(p.tipo || TipoPaquete.SINERGICO);

        // Cargar productos del paquete
        this.baseService.getProductosByPaqueteBase(p.id_paquete_base!).subscribe({
          next: prods => {
            const tipoActual = this.tipoPaquete();
            const incompatibles = prods.filter(prod => prod.tipo !== tipoActual);
            const compatibles = prods.filter(prod => prod.tipo === tipoActual);

            this.productosSeleccionados.set(compatibles);
            this.productosQuitadosPorTipo.set(incompatibles);

            if (incompatibles.length > 0) {
              const nombres = incompatibles.map(prod => prod.nombre).join(', ');
              this.toast.warning(
                `Este paquete tiene ${incompatibles.length} producto(s) que no son compatibles con su tipo y se quitarán cuando guardes: ${nombres}`
              );
            }

            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('❌ Error al cargar productos del paquete:', err);
            this.isLoading.set(false);
            this.toast.error('No pudimos cargar los productos del paquete. Recargá la página.');
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al cargar paquetes:', err);
        this.isLoading.set(false);
        this.toast.error('No pudimos cargar el paquete. Recargá la página.');
      }
    });
  }

  onTipoPaqueteChange(nuevoTipo: TipoPaquete): void {
    const productosActuales = this.productosSeleccionados();

    if (productosActuales.length === 0) {
      this.aplicarTipo(nuevoTipo);
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
          this.productosSeleccionados.set(productosActuales.filter(p => p.tipo === nuevoTipo));
          this.aplicarTipo(nuevoTipo);
          this.toast.info('Se han removido los productos incompatibles.');
        }
        // El componente selector mantendrá visualmente el estado anterior si no se hace el .set()
      });
    } else {
      this.aplicarTipo(nuevoTipo);
    }
  }

  // Los que se descartaron al cargar vuelven si el tipo nuevo los hace compatibles:
  // sólo se habían sacado por no coincidir con el tipo anterior.
  private aplicarTipo(nuevoTipo: TipoPaquete): void {
    const recuperables = this.productosQuitadosPorTipo().filter(p => p.tipo === nuevoTipo);

    if (recuperables.length > 0) {
      this.productosQuitadosPorTipo.update(prods => prods.filter(p => p.tipo !== nuevoTipo));
      this.productosSeleccionados.update(prods => [...prods, ...recuperables]);
    }

    this.tipoPaquete.set(nuevoTipo);
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

    const aQuitar = this.productosQuitadosPorTipo();
    if (aQuitar.length === 0) {
      this.guardarPaquete(id);
      return;
    }

    const nombres = aQuitar.map(p => p.nombre).join(', ');
    Swal.fire({
      title: '¿Guardar y quitar productos?',
      html: `
        <p class="mb-4 text-sm text-gray-600">Se quitarán del paquete <b>${aQuitar.length}</b> producto(s) incompatibles con su tipo: <b>${nombres}</b>.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--brand-secondary)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, guardar y quitar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then(result => {
      if (result.isConfirmed) this.guardarPaquete(id);
    });
  }

  private guardarPaquete(id: number): void {
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

    // Los productos van primero: el back valida el tipo del paquete contra los
    // productos ya vinculados, así que actualizar los datos antes deja el update
    // rebotando contra la lista vieja.
    this.baseService.agregarProductos(id, productosIds).pipe(
      catchError(err => throwError(() => ({ paso: 'productos' as const, err }))),
      switchMap(() =>
        this.baseService.updatePaquete(paqueteActualizado).pipe(
          catchError(err => throwError(() => ({ paso: 'update' as const, err })))
        )
      )
    ).subscribe({
      next: () => {
        this.productosQuitadosPorTipo.set([]);
        this.toast.success('Paquete y productos actualizados. Los cambios ya se reflejan en la publicación activa.');
        this.router.navigate(['/admin/administrar-paquetes']);
      },
      error: ({ paso, err }: { paso: 'productos' | 'update'; err: unknown }) => {
        const esUpdate = paso === 'update';
        console.error(
          esUpdate
            ? '❌ Error al actualizar datos del paquete:'
            : '❌ Error al sincronizar productos del paquete:',
          err
        );
        this.toast.error(
          esUpdate
            ? 'Actualizamos los productos, pero no pudimos guardar los datos del paquete. Revisá los campos e intentá de nuevo.'
            : 'No pudimos actualizar la lista de productos del paquete. Verificá que no haya productos incompatibles.'
        );
        this.guardando.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/administrar-paquetes']);
  }
}

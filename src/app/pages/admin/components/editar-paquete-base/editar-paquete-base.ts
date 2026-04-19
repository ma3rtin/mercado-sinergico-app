import {
  Component,
  ElementRef,
  OnInit,
  AfterViewChecked,
  ViewChild,
  DestroyRef,
  effect,
  signal,
  inject,
} from '@angular/core';
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
import { SelectorTipoCardContenido } from '@app/shared/selector-tipo-card/selector-tipo-card';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

@Component({
  selector: 'app-editar-paquete-base',
  standalone: true,
  imports: [FormsModule, AdminCreateWrapperComponent, ButtonComponent, IconComponent, AdminBackButtonComponent],
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

  @ViewChild('inputBusqueda') inputBusqueda?: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      if (this.busquedaProducto().trim().length > 2) this.buscarProductos();
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.idPaquete.set(Number(id));
      this.cargarDatos();
    }
    this.cargarListas();
  }

  ngAfterViewChecked(): void {}

  cargarListas(): void {
    this.marcaService.getMarcas().subscribe(data => this.marcas.set(data));
    this.categoriaService.getCategorias().subscribe(data => this.categorias.set(data));
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

  buscarProductos(): void {
    this.productoService.getProductosFiltrados(this.busquedaProducto(), 0, 10).subscribe(data => {
      this.resultadosBusqueda.set(data.filter(p => !this.productosSeleccionados().some(s => s.id_producto === p.id_producto)));
    });
  }

  agregarProducto(p: Producto): void {
    this.productosSeleccionados.update(prods => [...prods, p]);
    this.busquedaProducto.set('');
    this.resultadosBusqueda.set([]);
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
    console.log('💾 Guardando cambios en paquete base:', this.idPaquete());
    this.guardando.set(true);
    // TODO: El service requiere updatePaquete con FormData para la imagen
    const paqueteActualizado = {
      id_paquete_base: this.idPaquete()!,
      nombre: this.nombre(),
      descripcion: this.descripcion(),
      categoria_id: this.categoriaSeleccionada()!,
      marcaId: this.marcaSeleccionada()!,
      tipo: this.tipoPaquete(),
      productos: this.productosSeleccionados().map(p => p.id_producto!)
    };

    // @ts-ignore
    this.baseService.updatePaquete(paqueteActualizado).subscribe({
      next: () => {
        console.log('✅ Paquete actualizado con éxito');
        this.toast.success('Paquete actualizado');
        this.router.navigate(['/admin/administrar-paquetes']);
      },
      error: (err) => {
        console.error('❌ Error al actualizar paquete:', err);
        this.toast.error('Error al actualizar');
        this.guardando.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/administrar-paquetes']);
  }
}

import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { VisorImagenesComponent } from '@app/shared/visor-imagenes-component/visor-imagenes-component';
import { BreadcrumbComponent } from '@app/shared/breadcrumb-component/breadcrumb-component';
@Component({
  selector: 'app-producto-detalle-seleccion-component',
  imports: [CommonModule, VisorImagenesComponent, BreadcrumbComponent],
  templateUrl: './producto-detalle-seleccion-component.html',
  standalone: true
})
export class ProductoDetalleSeleccionComponent implements OnInit {
  // 🚀 Signals
  producto = signal<Producto | undefined>(undefined);
  paquetes = signal<PaquetePublicado[]>([]);
  isLoading = signal(true);
  
  // 📊 Computed signals
  caracteristicas = computed(() => {
    const prod = this.producto();
    if (!prod) return [];

    const resultado: Array<{label: string, value: string}> = [];

    if (prod.peso) {
      resultado.push({
        label: 'Peso',
        value: `${prod.peso} kg`
      });
    }

    if (prod.altura || prod.ancho || prod.profundidad) {
      resultado.push({
        label: 'Dimensiones',
        value: `${prod.altura || '?'} x ${prod.ancho || '?'} x ${prod.profundidad || '?'} cm`
      });
    }

    if (prod.stock !== undefined) {
      resultado.push({
        label: 'Stock disponible',
        value: `${prod.stock} unidades`
      });
    }

    if (prod.marca) {
      resultado.push({
        label: 'Marca',
        value: prod.marca.nombre
      });
    }

    if (prod.categoria) {
      resultado.push({
        label: 'Categoría',
        value: prod.categoria.nombre
      });
    }

    return resultado;
  });
  
  // ✅ Computed para saber si hay stock
  tieneStock = computed(() => {
    const prod = this.producto();
    return prod?.stock !== undefined && prod.stock > 0;
  });

  // 🔧 Services inyectados correctamente
  private readonly productosService = inject(ProductosService);
  private readonly paquetePublicadoService = inject(PaquetePublicadoService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef); // ✅ Agregado DestroyRef
  readonly router = inject(Router);

  ngOnInit(): void {
    this.loadProducto();
    this.loadPaquetes();
  }

  private loadProducto(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (!id || isNaN(id)) {
      console.error('❌ ID de producto inválido');
      this.isLoading.set(false);
      return;
    }

    this.productosService.getProductoById(id)
      .pipe(takeUntilDestroyed(this.destroyRef)) // ✅ Pasar destroyRef como parámetro
      .subscribe({
        next: (producto) => {
          console.log('✅ Producto cargado:', producto);
          this.producto.set(producto);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ Error cargando producto:', error);
          this.isLoading.set(false);
        }
      });
  }

  private loadPaquetes(): void {
    this.paquetePublicadoService.getPaquetes()
      .pipe(takeUntilDestroyed(this.destroyRef)) // ✅ Pasar destroyRef como parámetro
      .subscribe({
        next: (paquetes: PaquetePublicado[]) => { // ✅ Tipo correcto
          console.log('✅ Paquetes cargados:', paquetes);
          this.paquetes.set(paquetes); // ✅ Actualizar el signal
        },
        error: (error) => {
          console.error('❌ Error cargando paquetes:', error);
          this.paquetes.set([]); // ✅ Array vacío en caso de error
        }
      });
  }

  // 🧭 NAVEGACIÓN
  navegarAProducto(id: number): void {
    if (!id) {
      console.error('❌ ID inválido');
      return;
    }
    this.router.navigate(['detalleProductoSumarse', id]);
  }

  seleccionarPaquete(id: number): void {
    if (!id) {
      console.error('❌ ID de paquete inválido');
      return;
    }
    this.router.navigate(['detalleProductoSumarse', this.producto()?.id_producto, id]);
  }

  // 🎨 HELPERS VISUALES
  getPaqueteStatusClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    
    const clases: Record<string, string> = {
      'abierto': 'bg-blue-500',
      'activo': 'bg-blue-500',
      'pendiente': 'bg-orange-500',
      'cerrado': 'bg-red-500',
      'completo': 'bg-green-500'
    };
    
    return clases[estadoLower] || 'bg-gray-500';
  }

  getEstadoTextClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    
    const clases: Record<string, string> = {
      'abierto': 'text-blue-600',
      'activo': 'text-blue-600',
      'pendiente': 'text-orange-600',
      'cerrado': 'text-red-600',
      'completo': 'text-green-600'
    };
    
    return clases[estadoLower] || 'text-gray-600';
  }

  formatPrice(price?: number): string {
    if (!price) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  onPaqueteImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target.src.includes('placeholder')) return;
    target.src = '/assets/images/placeholder-product.png';
  }
}
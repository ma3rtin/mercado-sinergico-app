import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductosService } from '@app/services/producto/producto.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { VisorImagenesComponent } from '@app/shared/visor-imagenes-component/visor-imagenes-component';
 // ...existing code...
@Component({
  selector: 'app-producto-detalle-seleccion-component',
  imports: [CommonModule, VisorImagenesComponent],
  templateUrl: './producto-detalle-seleccion-component.html',
  styleUrl: './producto-detalle-seleccion-component.css',
  standalone: true
})
export class ProductoDetalleSeleccionComponent implements OnInit {
  router = inject(Router);
  producto?: Producto;
  paquetes: PaquetePublicado[] = [];
  isLoading: boolean = true;

  constructor(
    private productosService: ProductosService,
    private route: ActivatedRoute,
    //private paquetePublicadoService: PaquetePublicadoService
  ) { }

  ngOnInit(): void {
    this.loadProducto();
    this.loadPaquetes();
  }

  private loadProducto(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.productosService.getProductoById(id).subscribe({
        next: (producto) => {
          this.producto = producto;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando producto:', error);
          this.isLoading = false;
        }
      });
    }
  }

  private loadPaquetes(): void {
 /*   this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        this.paquetes = paquetes;
      },
      error: (error) => {
        console.error('Error cargando paquetes:', error);
      }
    });
    */
  }

  navegarAProducto(id: number): void {
    this.router.navigate(['detalleProductoSumarse/', id]);
  }

  onPaqueteImageError(event: any): void {
    if (event.target.src.includes('placeholder')) {
      return;
    }
    event.target.src = '/assets/images/placeholder-product.png';
  }

  getPaqueteStatusClass(estado: string): string {
    switch (estado) {
      case 'Abierto':
        return 'bg-blue-500';
      case 'Pendiente':
        return 'bg-orange-500';
      case 'Cerrado':
        return 'bg-red-500';
      case 'Completo':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  getEstadoTextClass(estado: string): string {
    switch (estado) {
      case 'Abierto':
        return 'text-blue-600';
      case 'Pendiente':
        return 'text-orange-600';
      case 'Cerrado':
        return 'text-red-600';
      case 'Completo':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }

  seleccionarPaquete(id: number): void {
    this.router.navigate(['detalleProductoSumarse/', id]);
  }

  // Helper para mostrar características del producto
  getCaracteristicas(): Array<{label: string, value: string}> {
    if (!this.producto) return [];

    const caracteristicas = [];

    if (this.producto.peso) {
      caracteristicas.push({
        label: 'Peso',
        value: `${this.producto.peso} kg`
      });
    }

    if (this.producto.altura || this.producto.ancho || this.producto.profundidad) {
      caracteristicas.push({
        label: 'Dimensiones',
        value: `${this.producto.altura || '?'} x ${this.producto.ancho || '?'} x ${this.producto.profundidad || '?'} cm`
      });
    }

    if (this.producto.stock !== undefined) {
      caracteristicas.push({
        label: 'Stock disponible',
        value: `${this.producto.stock} unidades`
      });
    }

    if (this.producto.marca) {
      caracteristicas.push({
        label: 'Marca',
        value: this.producto.marca.nombre
      });
    }

    if (this.producto.categoria) {
      caracteristicas.push({
        label: 'Categoría',
        value: this.producto.categoria.nombre
      });
    }

    return caracteristicas;
  }

  formatPrice(price?: number): string {
    if (!price) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }
}

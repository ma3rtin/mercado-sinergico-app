import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { ProductosService } from '@app/services/producto/producto.service';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { TipoPaquete } from '@app/models/Enums';

import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';

//src\app\models\Producto-Paquete\Marca.ts
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
interface ProductoSeleccionado {
  id_producto: number;
  nombre: string;
  variante?: string;
  precio: number;
  cantidad: number;
  imagen_url?: string;
}

interface PaqueteUsuario extends PaquetePublicado {
  expandido: boolean;
  productosSeleccionados: ProductoSeleccionado[];
  precioTotal: number;
  descuento: number;
  precioFinal: number;
}

@Component({
  selector: 'app-mis-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './mis-paquetes.html'
})
export class MisPaquetesComponent implements OnInit {
  private paquetePublicadoService = inject(PaquetePublicadoService);
  public router = inject(Router);

  paquetes: PaqueteUsuario[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  public TipoPaquete = TipoPaquete;

  ngOnInit(): void {
    this.cargarMisPaquetes();
  }

  cargarMisPaquetes(): void {
    this.isLoading = true;
    this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        // Convertir a PaqueteUsuario y agregar datos mockup
        this.paquetes = paquetes.map(p => ({
          ...p,
          expandido: false,
          productosSeleccionados: this.generarProductosMock(p),
          precioTotal: 15000,
          descuento: 15,
          precioFinal: 12750
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando paquetes del usuario:', error);
        this.errorMessage = 'Error al cargar tus paquetes';
        this.isLoading = false;
      }
    });
  }

  // Mock temporal - reemplazar con datos reales
  private generarProductosMock(paquete: PaquetePublicado): ProductoSeleccionado[] {
    return [
      {
        id_producto: 1,
        nombre: 'Cascos Moto LS2 Rebatible Negro',
        variante: 'S',
        precio: 5000,
        cantidad: 8,
        imagen_url: paquete.imagen_url
      },
      {
        id_producto: 2,
        nombre: 'Cascos Moto LS2 Rebatible Negro',
        variante: 'XL',
        precio: 5200,
        cantidad: 2,
        imagen_url: paquete.imagen_url
      },
      {
        id_producto: 3,
        nombre: 'Cascos Moto LS2 Rebatible Negro',
        variante: 'XS',
        precio: 4800,
        cantidad: 5,
        imagen_url: paquete.imagen_url
      }
    ];
  }

  toggleExpansion(paquete: PaqueteUsuario): void {
    paquete.expandido = !paquete.expandido;
  }

  aumentarCantidad(paquete: PaqueteUsuario, producto: ProductoSeleccionado): void {
    producto.cantidad++;
    this.recalcularPrecios(paquete);
  }

  disminuirCantidad(paquete: PaqueteUsuario, producto: ProductoSeleccionado): void {
    if (producto.cantidad > 0) {
      producto.cantidad--;
      this.recalcularPrecios(paquete);
    }
  }

  private recalcularPrecios(paquete: PaqueteUsuario): void {
    paquete.precioTotal = paquete.productosSeleccionados.reduce(
      (total, p) => total + (p.precio * p.cantidad), 0
    );
    paquete.precioFinal = paquete.precioTotal * (1 - paquete.descuento / 100);
  }

  actualizarPedido(paquete: PaqueteUsuario): void {
    console.log('Actualizando pedido:', paquete);
    // Aquí iría la lógica para actualizar el pedido en el backend
  }

  salirDelPaquete(paquete: PaqueteUsuario): void {
    console.log('Saliendo del paquete:', paquete);
    // Aquí iría la lógica para eliminar al usuario del paquete
  }

  irAlPaquete(paquete: PaqueteUsuario): void {
    this.router.navigate(['/paquete-detalle', paquete.id_paquete_publicado]);
  }

  getTiempoRestante(fechaFin: Date): string {
    const ahora = new Date();
    const fin = new Date(fechaFin);
    const diff = fin.getTime() - ahora.getTime();

    if (diff <= 0) return 'Cerrado';

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  }

  getEstadoClass(estado?: string): string {
    if (!estado) return 'text-gray-600 bg-gray-100';
    
    const e = String(estado).toLowerCase();
    if (e.includes('abierto')) return 'text-green-700 bg-green-50 border-green-200';
    if (e.includes('pend')) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    if (e.includes('cerr')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  }

  getTipoPaqueteIcono(tipo?: string | TipoPaquete): TipoPaquete | '' {
    if (!tipo) return '';
    const t = String(tipo).toLowerCase();
    if (t.includes('sin')) return TipoPaquete.SINERGICO;
    if (t.includes('ener')) return TipoPaquete.ENERGICO;
    return TipoPaquete.POR_DEFINIR;
  }

  getMarcaNombre(paquete: PaqueteUsuario): string {
    return 'Marca 1';
  }

  getCategoriaNombre(paquete: PaqueteUsuario): string {
    return 'Nombre 1'
  }
}
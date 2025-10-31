import { PaqueteRelacionado } from './interfaces/PaqueteRelacionado';
import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
//import { VisorImagenesComponent } from '../../shared/visor-imagenes-component/visor-imagenes-component';
import { Producto } from '@models/ProductosInterfaces/Producto';


@Component({
  selector: 'app-detalle-producto-sumarse',
  imports: [CurrencyPipe, CommonModule],
  templateUrl: './detalle-producto-sumarse.html',
  styleUrl: './detalle-producto-sumarse.css'
})
export class DetalleProductoSumarse {
  // Datos del producto

  router = inject(Router);
  producto: Producto = {
    id_producto: 1,
    nombre: 'Casco',
    descripcion: 'Descripción del casco',
    precio: 1000,
    imagen_url: '/api/placeholder/300/200',
    marca_id: 1,
    altura: 100,
    ancho: 100,
    profundidad: 100,
    peso: 100,
    stock: 100,
    plantillaId: 1,
    categoria_id: 1,
    marca: { id_marca: 1, nombre: 'Marca 1', productos: [], paquetes: [] },
    categoria: { id_categoria: 1, nombre: 'Categoria 1', productos: [], paquetes: [] },
    plantilla: { id: 1, nombre: 'Plantilla 1', caracteristicas: [] },
    paquetes: [],
    imagenes: []
  };


  // Paquete seleccionado
  paqueteSeleccionado: PaqueteRelacionado = {
    id: 1,
    nombre: 'Paquete cascos HJC',
    estado: 'Abierto',
    participantes: 10,
    maxParticipantes: 50,
    faltanParaCerrar: 40,
    fechaCierre: '20.12.32',
    compradoresInvolucrados: 7,
    zona: 'Zona Norte',
    imagen: '/api/placeholder/300/200'
  };

  // Paquetes relacionados
  paquetesRelacionados: PaqueteRelacionado[] = [
    {
      id: 1,
      nombre: 'Paquete cascos HJC',
      estado: 'Abierto',
      participantes: 60,
      maxParticipantes: 155,
      zona: 'Zona Norte',
      imagen: '/api/placeholder/300/200'
    },
    {
      id: 2,
      nombre: 'Paquete cascos HJC',
      estado: 'Abierto',
      participantes: 60,
      maxParticipantes: 155,
      zona: 'Zona Norte',
      imagen: '/api/placeholder/300/200'
    },
    {
      id: 3,
      nombre: 'Paquete cascos HJC',
      estado: 'Abierto',
      participantes: 60,
      maxParticipantes: 155,
      zona: 'Zona Norte',
      imagen: '/api/placeholder/300/200'
    },
    {
      id: 4,
      nombre: 'Paquete cascos HJC',
      estado: 'Abierto',
      participantes: 60,
      maxParticipantes: 155,
      zona: 'Zona Norte',
      imagen: '/api/placeholder/300/200'
    }
  ];

  // Estado del componente
  currentImageIndex: number = 0;
  selectedSize: string = 'S';
  selectedColor: string = 'Rojo';
  quantity: number = 1;
  showFullDescription: boolean = false;

  // Métodos para selecciones
  selectSize(size: string): void {
    this.selectedSize = size;
  }

  selectColor(color: string): void {
    this.selectedColor = color;
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSize === size;
  }

  isColorSelected(color: string): boolean {
    return this.selectedColor === color;
  }

  // Métodos para cantidad
  changeQuantity(delta: number): void {
    const newQuantity = this.quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 25) {
      this.quantity = newQuantity;
    }
  }

  // Métodos de acciones
  addToCart(): void {
    console.log('Producto agregado al carrito:', {
      producto: this.producto.nombre,
      talle: this.selectedSize,
      color: this.selectedColor,
      cantidad: this.quantity,
      paquete: this.paqueteSeleccionado.nombre
    });
    // aca va la logica del carrito
  }


  goBack(): void {
    console.log('Volver al paquete');
    this.router.navigate(['productos']);//paquetes
  }

  toggleDescription(): void {
    this.showFullDescription = !this.showFullDescription;
  }

  getSizeButtonClass(size: string): string {
    return `px-4 py-2 border-2 rounded-lg hover:shadow-secondary-dark hover:bg-white     ${this.isSizeSelected(size)
        ? 'border-secondary-dark text-secondary-dark  hover:text-secondary-dark shadow-md shadow-secondary-dark'
        : 'border-gray-300 text-gray-700 hover:text-secondary-dark'
      }`;
  }

  getColorButtonClass(color: string): string {
    return `border-2 rounded-lg hover:shadow-secondary-dark  transition-colors ${this.isColorSelected(color) ? 'border-secondary-dark shadow-md shadow-secondary-dark' : 'border-gray-300'
      }`;
  }

  getEstadoClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'abierto':
        return 'text-primary';
      case 'cerrado':
        return 'text-red-600';
      case 'próximo a cerrar':
        return 'text-secondary-dark';
      default:
        return 'text-gray-600';
    }
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'abierto':
        return 'w-3 h-3 bg-primary rounded-full';
      case 'cerrado':
        return 'w-3 h-3 bg-red-500 rounded-full';
      case 'próximo a cerrar':
        return 'w-3 h-3 bg-yellow-500 rounded-full';
      default:
        return 'w-3 h-3 bg-gray-400 rounded-full';
    }
  }

  // Método para manejar errores de imágenes
  onImageError(event: any): void {
    event.target.src = '/assets/images/placeholder-product.png'; // Imagen por defecto
  }
}

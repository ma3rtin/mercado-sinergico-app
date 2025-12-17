import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

@Component({
  selector: 'app-visor-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visor-imagenes-component.html',
})
export class VisorImagenesComponent implements OnInit {
  @Input() producto!: Producto;
  @Input() altText: string = 'Imagen del producto';
  
  allImages: string[] = [];
  currentImageIndex: number = 0;

  ngOnInit(): void {
    this.loadImages();
  }

  ngOnChanges(): void {
    this.loadImages();
  }

  private loadImages(): void {
    this.allImages = [];
    
    // Primero agregamos la imagen principal si existe
    if (this.producto?.imagen_url) {
      this.allImages.push(this.producto.imagen_url);
    }
    
    // Luego agregamos las imágenes adicionales
    if (this.producto?.imagenes && this.producto.imagenes.length > 0) {
      const additionalImages = this.producto.imagenes.map(img => img.url);
      this.allImages.push(...additionalImages);
    }

    // Si no hay imágenes, agregar placeholder
    if (this.allImages.length === 0) {
      this.allImages.push('/assets/images/placeholder-product.png');
    }

    // Resetear índice si es necesario
    if (this.currentImageIndex >= this.allImages.length) {
      this.currentImageIndex = 0;
    }
  }

  getCurrentImage(): string {
    return this.allImages[this.currentImageIndex] || '/assets/images/placeholder-product.png';
  }

  changeMainImage(index: number): void {
    if (index >= 0 && index < this.allImages.length) {
      this.currentImageIndex = index;
    }
  }

  nextImage(): void {
    if (this.allImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.allImages.length;
    }
  }

  previousImage(): void {
    if (this.allImages.length > 1) {
      this.currentImageIndex = 
        this.currentImageIndex === 0 
          ? this.allImages.length - 1 
          : this.currentImageIndex - 1;
    }
  }

  isThumbnailActive(index: number): boolean {
    return index === this.currentImageIndex;
  }

  onImageError(event: any): void {
    console.error('Error cargando imagen:', event.target.src);
    event.target.src = '/assets/images/placeholder-product.png';
  }

  onThumbnailError(event: any): void {
    console.error('Error cargando miniatura:', event.target.src);
    event.target.src = 'https://via.placeholder.com/100x100/6b7280/ffffff?text=N/A';
  }

  hasMultipleImages(): boolean {
    return this.allImages.length > 1;
  }

  getTotalImages(): number {
    return this.allImages.length;
  }
}
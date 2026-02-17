import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

@Component({
  selector: 'app-visor-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visor-imagenes-component.html',
})
export class VisorImagenesComponent implements OnChanges {
  @Input() producto!: Producto;
  @Input() altText: string = 'Imagen del producto';

  allImages: string[] = [];
  currentImageIndex: number = 0;

  // ✅ Solo OnChanges, no OnInit + OnChanges (evita doble ejecución)
  ngOnChanges(): void {
    this.loadImages();
  }

  private loadImages(): void {
    const urls = new Set<string>(); // ✅ Set evita duplicados automáticamente

    // Prioridad 1: imagen_url principal
    if (this.producto?.imagen_url) {
      urls.add(this.producto.imagen_url);
    }

    // Prioridad 2: array imagenes[] - solo agregar si la URL no está ya
    if (this.producto?.imagenes?.length > 0) {
      for (const img of this.producto.imagenes) {
        const url = img.url;
        if (url) urls.add(url);
      }
    }

    this.allImages = urls.size > 0
      ? Array.from(urls)
      : ['/assets/images/placeholder-product.png'];

    // Resetear índice si queda fuera de rango
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

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }

  // ✅ Usa placeholder local, no via.placeholder.com
  onThumbnailError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }

  hasMultipleImages(): boolean {
    return this.allImages.length > 1;
  }

  getTotalImages(): number {
    return this.allImages.length;
  }
}

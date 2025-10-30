import { Component, Input, ElementRef, ViewChild, OnChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlechaCarrusel } from '@app/shared/flecha-carrusel/flecha-carrusel';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, FlechaCarrusel, PaqueteCard],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
})
export class Carrusel implements OnChanges, AfterViewInit {
  @Input() items: any[] = [];
  @Input() tipo: 'paquete' | 'producto' = 'paquete';

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  translateX = 0;
  readonly cardWidth = 310;
  readonly gap = 40;
  readonly visibleCards = 3;
  maxScroll = 0;
  currentIndex = 0;

  ngOnChanges(): void {
    const totalCards = this.items?.length || 0;
    this.maxScroll = -((totalCards - this.visibleCards) * (this.cardWidth + this.gap));
  }

  ngAfterViewInit(): void {
    this.updateCurrentIndex();
  }

  scrollLeft(): void {
    if (this.translateX < 0) {
      this.translateX = Math.min(this.translateX + (this.cardWidth + this.gap), 0);
      this.updateCurrentIndex();
    }
  }

  scrollRight(): void {
    if (this.translateX > this.maxScroll) {
      this.translateX = Math.max(this.translateX - (this.cardWidth + this.gap), this.maxScroll);
      this.updateCurrentIndex();
    }
  }

  onScroll(): void {
    this.updateCurrentIndex();
  }

  private updateCurrentIndex(): void {
    const total = this.items.length;
    if (!total) return;

    const progress = Math.abs(this.translateX / (this.cardWidth + this.gap));
    this.currentIndex = Math.round(progress);
  }
}

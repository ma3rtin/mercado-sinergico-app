import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  input,
  Signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlechaCarrusel } from '@app/shared/flecha-carrusel/flecha-carrusel';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { PaqueteCardView } from '@app/models/PaquetesInterfaces/PaqueteCardView';

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, FlechaCarrusel, PaqueteCard],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrusel implements AfterViewInit {
  items = input.required<PaqueteCardView[]>();
  tipo = input<string>();

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  translateX = 0;
  readonly cardWidth = 310;
  readonly gap = 40;
  readonly visibleCards = 3;
  maxScroll = 0;
  currentIndex = 0;

  constructor() {
    console.log('🚀 Carrusel constructor');

    // ✅ Ahora items() devuelve directamente el array
    effect(() => {
      const arr = this.items();
      const totalCards = arr?.length || 0;
      this.maxScroll = -(
        (totalCards - this.visibleCards) * (this.cardWidth + this.gap)
      );
      console.log('📊 Carrusel effect:', { totalCards, maxScroll: this.maxScroll });
    });
  }

  ngAfterViewInit(): void {
    this.updateCurrentIndex();
  }

  scrollLeft(): void {
    if (this.translateX < 0) {
      this.translateX = Math.min(
        this.translateX + (this.cardWidth + this.gap),
        0
      );
      this.updateCurrentIndex();
    }
  }

  scrollRight(): void {
    if (this.translateX > this.maxScroll) {
      this.translateX = Math.max(
        this.translateX - (this.cardWidth + this.gap),
        this.maxScroll
      );
      this.updateCurrentIndex();
    }
  }

  private updateCurrentIndex(): void {
    const total = this.items().length;
    if (!total) return;

    const progress = Math.abs(this.translateX / (this.cardWidth + this.gap));
    this.currentIndex = Math.round(progress);
  }
}

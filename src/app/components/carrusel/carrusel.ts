// ============================================
// CARRUSEL COMPONENT - Recibe PaquetePublicado
// ============================================
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  input,
  effect,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlechaCarrusel } from '@app/shared/flecha-carrusel/flecha-carrusel';
import { PaqueteCard } from '@app/shared/paquete-card/paquete-card';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrusel',
  standalone: true,
  imports: [CommonModule, FlechaCarrusel, PaqueteCard],
  templateUrl: './carrusel.html',
  styleUrl: './carrusel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Carrusel implements AfterViewInit {
  // 📥 Inputs - Recibe directamente PaquetePublicado[]
  items = input.required<PaquetePublicado[]>();
  tipo = input<string>();

  // 📤 Outputs
  paqueteSelected = output<number>();

  @ViewChild('carousel') carousel!: ElementRef<HTMLDivElement>;

  // 🎯 Estado interno
  translateX = 0;
  readonly cardWidth = 320;
  readonly gap = 16;
  readonly visibleCards = 3;
  maxScroll = 0;
  currentIndex = 0;

  constructor(private router: Router) {
    effect(() => {
      const arr = this.items();
      const totalCards = arr?.length || 0;
      this.maxScroll = -(
        (totalCards - this.visibleCards) * (this.cardWidth + this.gap)
      );
      console.log('📊 Carrusel actualizado:', { totalCards, maxScroll: this.maxScroll });
    });
  }

  ngAfterViewInit(): void {
    this.updateCurrentIndex();
  }

  // 🔄 Métodos de scroll
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

  // 🔗 Manejo del click de la card
  onPaqueteClick(id: number): void {
    console.log('🔗 Paquete clickeado:', id);
    this.paqueteSelected.emit(id);
    this.router.navigate(['/paquete-detalle', id]);
  }
}
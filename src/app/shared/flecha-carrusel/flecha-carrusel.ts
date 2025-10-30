import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flecha-carrusel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flecha-carrusel.html',
  styleUrl: './flecha-carrusel.css',
})
export class FlechaCarrusel {
  @Input() direction: 'left' | 'right' = 'left';
  @Input() disabled = false;
  @Output() arrowClick = new EventEmitter<void>();

get positionClasses() {
  return this.direction === 'left'
    ? 'left-12 sm:left-4 md:left-6 lg:left-10'
    : 'right-12 sm:right-4 md:right-6 lg:right-10';
}

  get iconPath() {
    return this.direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';
  }
}

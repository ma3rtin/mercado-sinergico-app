import { Component, Input, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-md mt-6">
      <svg class="w-20 h-20 text-error mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
        </path>
      </svg>
      <h3 class="text-xl font-bold text-gray-800 mb-2">
        {{ titulo }}
      </h3>
      <p class="text-gray-600 mb-6 text-center max-w-md">
        {{ mensaje }}
      </p>
      @if (mostrarBoton) {
        <button (click)="reintentar.emit()" class="bg-brand-secondary hover:bg-brand-secondary text-white px-6 py-3 rounded-lg font-medium transition-colors">
          {{ textoBoton }}
        </button>
      }
    </div>
  `
})
export class ErrorState {
  @Input({ required: false }) titulo = 'Error al cargar';
  @Input({ required: false }) mensaje = 'Ha ocurrido un error inesperado.';
  @Input({ required: false }) mostrarBoton = true;
  @Input({ required: false }) textoBoton = 'Reintentar';

  readonly reintentar = new EventEmitter<void>();
}

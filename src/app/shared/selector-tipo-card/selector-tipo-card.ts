import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { TipoPaquete } from '@app/models/Enums';
import { IconComponent } from '@app/shared/icono/icono';

export interface TipoCardContenido {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  items: string[];
}

export interface SelectorTipoCardContenido {
  energetico: TipoCardContenido;
  sinergico: TipoCardContenido;
}

@Component({
  selector: 'app-selector-tipo-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './selector-tipo-card.html',
})
export class SelectorTipoCardComponent {
  readonly TipoPaquete = TipoPaquete;

  selectedType = input.required<TipoPaquete>();
  contenido = input.required<SelectorTipoCardContenido>();

  typeChange = output<TipoPaquete>();

  onSelect(type: TipoPaquete): void {
    this.typeChange.emit(type);
  }

  isSelected(type: TipoPaquete): boolean {
    return this.selectedType() === type;
  }
}

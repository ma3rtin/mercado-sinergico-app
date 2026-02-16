import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalogo-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogo-wrapper.html'
})

export class CatalogoWrapperComponent {
  titulo = input.required<string>();
  subtitulo = input<string | null>(null);
}
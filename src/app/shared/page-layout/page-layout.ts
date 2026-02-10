import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-layout.html'
})

export class PageLayoutComponent {
  titulo = input.required<string>();
  subtitulo = input<string | null>(null);
}
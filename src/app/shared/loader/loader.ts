import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
})
export class LoaderComponent {
  mensaje = input<string>('Cargando...');
  size = input<'sm' | 'md' | 'lg'>('md');
  padding = input<string>('py-20');
}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';

export type TooltipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './info-tooltip.html',
  styleUrl: './info-tooltip.css'
})
export class InfoTooltipComponent {
  /** Nombre del icono (ej. 'info', 'help-circle', 'zap') */
  @Input() iconName: string = 'info';
  
  /** Tamaño del icono en px */
  @Input() iconSize: string = '16';
  
  /** Clases de Tailwind para el icono y su contenedor (borde y color de texto) */
  @Input() iconClass: string = 'text-gray-500 border-gray-400';
  
  /** Título principal del tooltip (Opcional) */
  @Input() title?: string;
  
  /** Título principal del tooltip de manera segura (evita mostrar el tooltip por defecto del navegador) */
  @Input() tooltipTitle?: string;

  get activeTitle(): string | undefined {
    return this.tooltipTitle || this.title;
  }
  
  /** Color/Clase del título (ej. 'text-amber-400') */
  @Input() titleClass: string = 'text-white';
  
  /** Descripción del tooltip */
  @Input() description: string = '';
  
  /** Posición del tooltip con respecto al icono */
  @Input() position: TooltipPosition = 'bottom-right';

  /** Si es true, renderiza el icono de forma simple, sin contenedor circular, fondo ni bordes */
  @Input() simple: boolean = false;

  /** Si es true, el componente no dibuja ningún ícono nativo y en su lugar usa el contenido proyectado como trigger */
  @Input() customTrigger: boolean = false;

  getContentPositionClass(): string {
    switch (this.position) {
      case 'bottom-right': return 'right-0 top-10 origin-top-right';
      case 'bottom-left': return 'left-0 top-10 origin-top-left';
      case 'bottom-center': return 'left-1/2 -translate-x-1/2 top-10 origin-top';
      case 'top-right': return 'right-0 bottom-10 origin-bottom-right';
      case 'top-left': return 'left-0 bottom-10 origin-bottom-left';
      case 'top-center': return 'left-1/2 -translate-x-1/2 bottom-10 origin-bottom';
      default: return 'right-0 top-10 origin-top-right';
    }
  }
}

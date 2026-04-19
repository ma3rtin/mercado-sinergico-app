// status-color.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusColor',
  standalone: true
})
export class StatusColorPipe implements PipeTransform {
  transform(estado: string): string {

    switch (estado) {
      case 'Abierto':
        return 'text-primary';
      case 'Pendiente':
        return 'text-secondary-dark';
      case 'En Preparación':
        return 'text-brand-secondary';
      case 'Enviado':
        return 'text-purple-600';
      case 'Entregado':
        return 'text-success';
      case 'Cancelado':
        return 'text-error';
      case 'Cerrado':
        return 'text-error';
      case 'Completo':
        return 'text-success';
      default:
        return 'text-gray-600';
    }
  }
}

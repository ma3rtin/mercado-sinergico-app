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
        return 'text-blue-600';
      case 'Enviado':
        return 'text-purple-600';
      case 'Entregado':
        return 'text-green-600';
      case 'Cancelado':
        return 'text-red-500';
      case 'Cerrado':
        return 'text-red-600';
      case 'Completo':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }
}

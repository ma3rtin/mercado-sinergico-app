import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusColor',
  standalone: true
})
export class StatusColorPipe implements PipeTransform {
  transform(estado: string): string {
    switch (estado) {
      // Estados de paquete
      case 'Activo':
        return 'text-status-active-text';
      case 'Completo':
        return 'text-status-info-text';
      case 'Confirmado':
        return 'text-brand-secondary';
      case 'Entregado':
        return 'text-success';
      case 'Cancelado':
        return 'text-error';
      // Estados de pedido
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

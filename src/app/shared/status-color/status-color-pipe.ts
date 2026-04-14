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
        return 'text-status-pending-text';
      case 'Pagado':
        return 'text-status-active-text';
      case 'Reembolsado':
        return 'text-text-secondary';
      case 'En preparación':
        return 'text-blue-600';
      case 'En camino':
        return 'text-purple-600';
      case 'Recibido':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }
}

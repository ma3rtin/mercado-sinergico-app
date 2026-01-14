import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { IconComponent } from '@app/shared/icono/icono';
import { TipoPaquete } from '@app/models/Enums';

@Component({
  selector: 'app-paquete-banner',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './paquete-banner.html',
})
export class PaqueteBannerComponent {
  // 🎯 INPUT
  paquete = input.required<PaquetePublicado>();

  // 📊 COMPUTED PROPERTIES

  // URL de la imagen con fallback
  imagenUrl = computed(() => {
    return (
      this.paquete()?.paqueteBase?.imagen_url ||
      this.paquete()?.imagen_url ||
      '/assets/images/placeholder-product.png'
    );
  });

  // Nombre del paquete
  nombrePaquete = computed(() => {
    return this.paquete()?.paqueteBase?.nombre || 'Paquete';
  });

  // Descripción del paquete
  descripcionPaquete = computed(() => {
    return this.paquete()?.paqueteBase?.descripcion || '';
  });

  // Estado del paquete
  estadoNombre = computed(() => {
    return this.paquete()?.estado?.nombre || '';
  });

  // Zona del paquete
  zonaNombre = computed(() => {
    return this.paquete()?.zona?.nombre || '';
  });

  // Categoría del paquete
  categoriaNombre = computed(() => {
    return this.paquete()?.paqueteBase?.categoria?.nombre || '';
  });

  // Marca del paquete
  marcaNombre = computed(() => {
    return this.paquete()?.paqueteBase?.marca?.nombre || '';
  });

  // Tipo de paquete
  tipoPaquete = computed(() => {
    return this.paquete()?.tipoPaquete || TipoPaquete.POR_DEFINIR;
  });

  // Icono del tipo de paquete
  iconoTipo = computed(() => {
    const tipo = this.tipoPaquete();
    if (tipo === TipoPaquete.SINERGICO) return 'zap';
    if (tipo === TipoPaquete.ENERGICO) return 'battery';
    return 'package';
  });

  // Texto del tipo de paquete
  textoTipo = computed(() => {
    const tipo = this.tipoPaquete();
    if (tipo === TipoPaquete.SINERGICO) return 'Sinérgico';
    if (tipo === TipoPaquete.ENERGICO) return 'Energético';
    return 'Por Definir';
  });

  // Color del badge de estado
  estadoBadgeClass = computed(() => {
    const estado = this.estadoNombre().toLowerCase();

    if (estado.includes('activo') || estado.includes('abierto')) {
      return 'bg-green-500/90 text-white';
    }
    if (estado.includes('pend')) {
      return 'bg-yellow-500/90 text-white';
    }
    if (estado.includes('cerr')) {
      return 'bg-red-500/90 text-white';
    }
    return 'bg-gray-500/90 text-white';
  });

  // Tiempo restante
  tiempoRestante = computed(() => {
    const fechaFin = this.paquete()?.fecha_fin;
    if (!fechaFin) return null;

    const ahora = new Date();
    const fecha = new Date(fechaFin);
    const diferencia = fecha.getTime() - ahora.getTime();

    if (diferencia <= 0) return 'Finalizado';

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }
    return `${horas}h`;
  });

  // Stock disponible
  stockDisponible = computed(() => {
    const total = this.paquete()?.cant_productos || 0;
    const reservado = this.paquete()?.cant_productos_reservados || 0;
    return Math.max(0, total - reservado);
  });

  // Porcentaje disponible
  porcentajeDisponible = computed(() => {
    const total = this.paquete()?.cant_productos || 0;
    if (total === 0) return 0;
    return (this.stockDisponible() / total) * 100;
  });

  // Clase de la barra de progreso
  progressBarClass = computed(() => {
    const porcentaje = this.porcentajeDisponible();
    if (porcentaje > 50) return 'bg-green-500';
    if (porcentaje > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  });

  // 🎯 MÉTODOS

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (!target.src.includes('placeholder')) {
      target.src = '/assets/images/placeholder-product.png';
    }
  }

  // Determinar si es urgente (menos de 2 días)
  esUrgente = computed(() => {
    const fechaFin = this.paquete()?.fecha_fin;
    if (!fechaFin) return false;

    const hoy = new Date();
    const cierre = new Date(fechaFin);
    const diasDiferencia = (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

    return diasDiferencia > 0 && diasDiferencia <= 2;
  });
}

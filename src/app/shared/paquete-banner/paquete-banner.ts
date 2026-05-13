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
    return this.paquete()?.tipo || TipoPaquete.POR_DEFINIR;
  });

  // Icono del tipo de paquete
  iconoTipo = computed(() => {
    const tipo = this.tipoPaquete();
    if (tipo === TipoPaquete.SINERGICO) return 'users';
    if (tipo === TipoPaquete.ENERGICO) return 'zap';
    return 'package';
  });

  // Texto del tipo de paquete
  textoTipo = computed(() => {
    const tipo = this.tipoPaquete();
    if (tipo === TipoPaquete.SINERGICO) return 'Sinérgico';
    if (tipo === TipoPaquete.ENERGICO) return 'Enérgico';
    return 'Por Definir';
  });

  // Color del badge de tipo
  tipoBadgeClass = computed(() => {
    const tipo = this.tipoPaquete();
    if (tipo === TipoPaquete.SINERGICO) return 'bg-brand-secondary text-white';
    if (tipo === TipoPaquete.ENERGICO) return 'bg-brand-cta text-gray-900';
    return 'bg-white/90 text-gray-900';
  });

  // Color del badge de estado
  estadoBadgeClass = computed(() => {
    const estado = this.estadoNombre().toLowerCase();

    if (estado.includes('activo') || estado.includes('abierto') || estado.includes('disponible')) {
      return 'bg-success text-white';
    }
    if (estado.includes('pend')) {
      return 'bg-warning text-white';
    }
    if (estado.includes('cerr') || estado.includes('finalizado')) {
      return 'bg-error text-white';
    }
    return 'bg-gray-500/90 text-white';
  });

  // Tiempo restante
  tiempoRestante = computed(() => {
    const fechaFin = this.paquete()?.fecha_fin;
    if (!fechaFin) return null;

    const ahora = new Date();
    const fechaStr = fechaFin.toString();
    const fecha = (fechaStr.endsWith('Z') || fechaStr.includes('+'))
      ? new Date(fechaStr)
      : new Date(fechaStr + 'Z');
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
    if (porcentaje > 50) return 'bg-success';
    if (porcentaje > 20) return 'bg-warning';
    return 'bg-error';
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
    const fechaStr = fechaFin.toString();
    const cierre = (fechaStr.endsWith('Z') || fechaStr.includes('+'))
      ? new Date(fechaStr)
      : new Date(fechaStr + 'Z');
    const diasDiferencia = (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);

    return diasDiferencia > 0 && diasDiferencia <= 2;
  });
}

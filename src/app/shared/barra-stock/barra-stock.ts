import { Component, computed, input } from '@angular/core';

/**
 * Calcula el porcentaje de stock consumido (reservado o disponible) de un paquete.
 *
 * - Trata null/undefined como 0 (usa ??, no ||).
 * - Si el total es <= 0 devuelve 0 (nunca NaN ni Infinity).
 * - Aplica Math.round y clamp [0, 100].
 */
export function calcularPorcentajeStock(
  total?: number | null,
  consumido?: number | null
): number {
  const t = total ?? 0;
  const c = consumido ?? 0;
  if (t <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
}

@Component({
  selector: 'app-barra-stock',
  standalone: true,
  templateUrl: './barra-stock.html',
})
export class BarraStock {
  modo = input<'reservado' | 'disponible'>('reservado');
  total = input.required<number | null | undefined>();
  consumido = input.required<number | null | undefined>();
  altura = input<'sm' | 'md'>('sm');
  anchoFijo = input<string | undefined>(undefined);
  colorScheme = input<'auto' | 'fijo'>('auto');
  mostrarPorcentaje = input<boolean>(true);

  /** % del stock consumido en la vista actual (reservado o disponible según modo) */
  protected porcentaje = computed(() => {
    const consumido = calcularPorcentajeStock(this.total(), this.consumido());
    return this.modo() === 'disponible' ? 100 - consumido : consumido;
  });

  protected colorTexto = computed(() => {
    if (this.colorScheme() === 'fijo') return 'text-brand-primary';
    const p = this.porcentaje();
    if (this.modo() === 'disponible') {
      if (p > 50) return 'text-success';
      if (p > 20) return 'text-warning';
      return 'text-error';
    }
    if (p >= 86) return 'text-error';
    if (p >= 61) return 'text-warning';
    if (p >= 31) return 'text-attention-dark';
    return 'text-success';
  });

  protected colorBarra = computed(() => {
    if (this.colorScheme() === 'fijo') return 'bg-brand-primary';
    const p = this.porcentaje();
    if (this.modo() === 'disponible') {
      if (p > 50) return 'bg-success';
      if (p > 20) return 'bg-warning';
      return 'bg-error';
    }
    if (p >= 86) return 'bg-error';
    if (p >= 61) return 'bg-warning';
    if (p >= 31) return 'bg-attention';
    return 'bg-success';
  });

  protected trackClass = computed(() =>
    this.altura() === 'md'
      ? 'bg-bg-app border border-border-default shadow-inner rounded-full overflow-hidden'
      : 'bg-bg-raised rounded-full overflow-hidden'
  );

  protected anchoTrack = computed(() => this.anchoFijo() ?? '100%');
}
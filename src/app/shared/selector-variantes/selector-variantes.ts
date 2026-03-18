import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// Components
import { IconComponent } from '@app/shared/icono/icono';

// Interfaces
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { Caracteristica } from '@app/models/PlantillaInterfaces/Caracteristica';


/**
 * Interface para las variantes seleccionadas
 * Key: caracteristicaId, Value: opcionId
 */
export interface VariantesSeleccionadas {
  [caracteristicaId: number]: number;
}

/**
 * Componente para seleccionar variantes de un producto
 * Diseño inspirado en Mercado Libre
 *
 * @example
 * <app-selector-variantes
 *   [producto]="producto()"
 *   (variantesChange)="onVariantesChange($event)"
 *   (valido)="onValidoChange($event)"
 * />
 */
@Component({
  selector: 'app-selector-variantes',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './selector-variantes.html',
})
export class SelectorVariantesComponent {

  // 🎯 INPUTS
  producto = input.required<Producto>();
  habilitado = input<boolean>(true);

  // 📤 OUTPUTS
  variantesChange = output<VariantesSeleccionadas>();
  valido = output<boolean>();
  varianteSeleccionada = output<number | null>();

  // 🎨 SIGNALS - Estado interno
  seleccionadas = signal<VariantesSeleccionadas>({});
  caracteristicaEnHover = signal<number | null>(null);

  // 🧩 COMPUTED - Datos derivados

  /**
   * Verifica si el producto tiene plantilla con variantes
   */
  tieneVariantes = computed(() => {
    const prod = this.producto();
    return !!(prod.plantilla?.caracteristicas && prod.plantilla.caracteristicas.length > 0);
  });

  /**
   * Obtiene las características de la plantilla
   */
  caracteristicas = computed(() => {
    return this.producto().plantilla?.caracteristicas || [];
  });

  /**
   * Verifica si todas las características requeridas están seleccionadas
   */
  todasSeleccionadas = computed(() => {
    const caracteristicas = this.caracteristicas();
    const seleccionadas = this.seleccionadas();

    if (caracteristicas.length === 0) return true;

    return caracteristicas.every(carac => {
      return seleccionadas[carac.id!] !== undefined;
    });
  });

  /**
   * Obtiene el texto descriptivo de las variantes seleccionadas
   * Ejemplo: "Rojo, Talle M"
   */
  textoVariantesSeleccionadas = computed(() => {
    const caracteristicas = this.caracteristicas();
    const seleccionadas = this.seleccionadas();

    const textos = caracteristicas
      .map(carac => {
        const opcionId = seleccionadas[carac.id!];
        if (!opcionId) return null;

        const opcion = carac.opciones?.find(o => o.id === opcionId);
        return opcion?.nombre;
      })
      .filter(Boolean);

    return textos.length > 0 ? textos.join(', ') : 'Seleccionar variantes';
  });

  /**
   * Cuenta cuántas características faltan seleccionar
   */
  caracteristicasFaltantes = computed(() => {
    const caracteristicas = this.caracteristicas();
    const seleccionadas = this.seleccionadas();

    return caracteristicas.filter(carac =>
      seleccionadas[carac.id!] === undefined
    ).length;
  });

  /**
   * Verifica si hay al menos una opción seleccionada para mostrar botón de limpiar
   */
  hayAlgunaSeleccion = computed(() => {
    return Object.keys(this.seleccionadas()).length > 0;
  });

  /**
   * Verifica si la combinación seleccionada existe realmente 
   * dentro de las variantes devueltas por el Backend
   */
  varianteValida = computed(() => {
    if (!this.todasSeleccionadas()) return true;
    return this.encontrarVarianteId() !== null;
  });

  private encontrarVarianteId(): number | null {
    const seleccionadas = this.seleccionadas();
    const variantes = this.producto().variantes || [];

    console.log('--- ENCONTRAR VARIANTE ---');
    console.log('Seleccionadas:', seleccionadas);
    console.log('Variantes locales:', variantes);

    for (const variante of variantes) {
      const coincide = variante.opciones.every(op =>
        seleccionadas[op.caracteristicaId] === op.opcionId
      );

      if (coincide) {
        return variante.id;
      }
    }

    return null;
  }

  constructor() {
    effect(() => {
      const seleccionadas = this.seleccionadas();
      const todas = this.todasSeleccionadas();
      const valida = this.varianteValida();

      this.variantesChange.emit(seleccionadas);
      this.valido.emit(todas && valida);

      if (todas && valida) {
        const varianteId = this.encontrarVarianteId();
        this.varianteSeleccionada.emit(varianteId);
      } else {
        this.varianteSeleccionada.emit(null);
      }
    });

  }

  // 🎯 MÉTODOS - Selección de variantes

  /**
   * Selecciona una opción para una característica o la deselecciona si ya estaba activa
   */
  seleccionarOpcion(caracteristicaId: number, opcionId: number): void {
    if (!this.habilitado()) return;

    this.seleccionadas.update(current => {
      // Si el usuario hace clic en la opción que YA está seleccionada, la deselecciona
      if (current[caracteristicaId] === opcionId) {
        const next = { ...current };
        delete next[caracteristicaId];
        return next;
      }

      // Si no, la selecciona
      return {
        ...current,
        [caracteristicaId]: opcionId
      };
    });
  }


  /**
   * Verifica si una opción está seleccionada
   */
  estaSeleccionada(caracteristicaId: number, opcionId: number): boolean {
    return this.seleccionadas()[caracteristicaId] === opcionId;
  }

  /**
   * Verifica si una característica tiene alguna opción seleccionada
   */
  tieneSeleccion(caracteristicaId: number): boolean {
    return this.seleccionadas()[caracteristicaId] !== undefined;
  }



  /**
   * Verifica si una opción específica es combinable con el RESTO de las opciones ya seleccionadas.
   * Si no hay ninguna variante activa que contenga esta combinación, devuelve false.
   */
  esOpcionCombinable(caracteristicaId: number, opcionId: number): boolean {
    const seleccionadas = this.seleccionadas();
    const variantes = this.producto().variantes || [];
    if (variantes.length === 0) return true;

    // Simular cómo quedaría la selección incluyendo la opción que estamos evaluando
    const seleccionSimulada = { ...seleccionadas, [caracteristicaId]: opcionId };

    // Comprobar si existe AL MENOS UNA variante en BD que contenga todas estas opciones seleccionadas
    return variantes.some(variante => {
      // Ignoramos variantes desactivadas del todo
      if (variante.activo === false) return false;

      return Object.entries(seleccionSimulada).every(([cId, oId]) => {
        // La variante debe poseer (caracteristicaId === cId AND opcionId === oId)
        return variante.opciones.some(op =>
          op.caracteristicaId === Number(cId) && op.opcionId === oId
        );
      });
    });
  }

  /**
   * Obtiene el nombre de la opción seleccionada para una característica
   */
  getOpcionSeleccionada(caracteristica: Caracteristica): string | null {
    const opcionId = this.seleccionadas()[caracteristica.id!];
    if (!opcionId) return null;

    const opcion = caracteristica.opciones?.find(o => o.id === opcionId);
    return opcion?.nombre || null;
  }

  /**
   * Resetea todas las selecciones
   */
  resetear(): void {
    this.seleccionadas.set({});
  }

  // 🎨 MÉTODOS - Estilos y clases CSS

  /**
   * Obtiene las clases CSS para el botón de opción
   */
  getClasesBotonOpcion(caracteristicaId: number, opcionId: number): string {
    const base = 'relative px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 cursor-pointer';
    const hover = 'hover:border-secondary hover:shadow-sm';

    const seleccionada = this.estaSeleccionada(caracteristicaId, opcionId);

    if (seleccionada) {
      return `${base} border-secondary-dark bg-yellow-50 text-secondary-dark shadow-md`;
    }

    return `${base} ${hover} border-gray-300 text-gray-700 bg-white`;
  }

  /**
   * Obtiene las clases CSS para el contenedor de característica
   */
  getClasesContenedorCaracteristica(caracteristica: Caracteristica): string {
    const base = 'pb-6 border-b border-gray-200 last:border-b-0 last:pb-0';
    const tieneSeleccion = this.tieneSeleccion(caracteristica.id!);

    if (tieneSeleccion) {
      return `${base} opacity-100`;
    }

    return `${base} opacity-90`;
  }

  /**
   * Obtiene el ícono de check para opciones seleccionadas
   */
  mostrarCheckIcon(caracteristicaId: number, opcionId: number): boolean {
    return this.estaSeleccionada(caracteristicaId, opcionId);
  }

  // 🎯 MÉTODOS - Eventos

  onMouseEnterCaracteristica(caracteristicaId: number): void {
    this.caracteristicaEnHover.set(caracteristicaId);
  }

  onMouseLeaveCaracteristica(): void {
    this.caracteristicaEnHover.set(null);
  }
}

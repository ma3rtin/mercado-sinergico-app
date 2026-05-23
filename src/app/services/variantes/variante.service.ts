// ============================================
// INTERFACES DE VARIANTES
// ============================================

import { TipoPaquete } from '@app/models/Enums';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';

/**
 * Opción de una variante con sus datos completos
 */
export interface VarianteOpcion {
  caracteristica: string;
  opcion: string;
  caracteristicaId: number;
  opcionId: number;
}

/**
 * Información básica de un paquete donde está disponible la variante
 */
export interface PaqueteDisponible {
  id: number;
  nombre: string;
}

/**
 * Variante completa de un producto
 */
export interface ProductoVariante {
  id: number;
  sku?: string;
  stockFisico: number | null; // null = sinérgico, número = enérgico
  precioExtra?: number;
  activo: boolean;
  imagen_url?: string | null;
  opciones: VarianteOpcion[];
  paquetesActivos?: PaqueteDisponible[];
}

/**
 * Producto con su información básica y tipo
 */
export interface ProductoVarianteInfo {
  id: number;
  nombre: string;
  tipo: TipoPaquete;
  plantilla?: Plantilla;
}

/**
 * Response completo al obtener variantes de un producto
 */
export interface ProductoVariantesResponse {
  producto: ProductoVarianteInfo;
  variantes: ProductoVariante[];
}

/**
 * DTO para generar variantes automáticamente
 */
export interface GenerarVariantesDTO {
  productoId: number;
  opcionesDisponibles: Record<string, number[]>;
}

/**
 * DTO para actualizar stock de una variante individual
 */
export interface ActualizarStockVarianteDTO {
  id: number;
  stockFisico: number;
}

/**
 * DTO para actualizar stock en bulk
 */
export interface ActualizarStockVariantesDTO {
  variantes: ActualizarStockVarianteDTO[];
}

/**
 * DTO para actualizar cualquier campo de una variante
 */
export interface ActualizarVarianteDTO {
  sku?: string;
  stockFisico?: number | null;
  precioExtra?: number;
  activo?: boolean;
}

/**
 * Distribución del stock de una variante
 */
export interface DistribucionStockVariante {
  variante: string;
  stockFisico: number | null;
  paquetesActivos: PaqueteDisponible[];
}

/**
 * Response del stock global de un producto
 */
export interface StockGlobalResponse {
  nombre: string;
  descripcion: string;
  precio: number;
  marca_id: number;
  categoria_id: number;
  stockTotal: number | null;
  distribucion: DistribucionStockVariante[];
}

// ============================================
// SERVICIO DE VARIANTES
// ============================================

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, retry } from 'rxjs/operators';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class VarianteService extends ApiService {

  /**
   * Obtiene todas las variantes de un producto
   * GET /api/productos/:id/variantes
   */
  getVariantesByProducto(productoId: number): Observable<ProductoVariantesResponse> {
    console.log(`🎨 VarianteService - GET variantes del producto ${productoId}`);

    return this.get<ProductoVariantesResponse>(`productos/${productoId}/variantes`).pipe(
      timeout(15000),
      retry(2),
      map(response => {
        console.log('✅ Variantes recibidas:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error obteniendo variantes:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Genera variantes automáticamente basándose en opciones seleccionadas
   * POST /api/productos/:id/variantes/generar
   */
  /**
 * Genera variantes automáticamente basándose en opciones seleccionadas
 * POST /api/productos/:id/variantes/generar
 */
  generarVariantes(data: GenerarVariantesDTO): Observable<any> {
    console.log(`🎨 VarianteService - POST generar variantes para producto ${data.productoId}`);
    console.log('🎨 Opciones a enviar:', data.opcionesDisponibles);

    // Enviar solo el objeto que el DTO espera
    const payload = {
      productoId: data.productoId,
      opcionesDisponibles: data.opcionesDisponibles
    };

    return this.post<any>(
      `productos/${data.productoId}/generar-variantes`,
      payload
    ).pipe(
      timeout(30000),
      map(response => {
        console.log('✅ Variantes generadas:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error generando variantes:', err);
        console.error('❌ Error completo:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ StatusText:', err.statusText);
        console.error('❌ Error body:', err.error);
        console.error('❌ Message:', err.message);
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza el stock de múltiples variantes en una sola operación
   * PATCH /api/productos/:id/variantes/stock
   */
  actualizarStockBulk(
    productoId: number,
    data: ActualizarStockVariantesDTO
  ): Observable<any> {
    console.log(`🎨 VarianteService - PATCH actualizar stock bulk producto ${productoId}`);

    return this.patch<any>(
      `productos/${productoId}/variantes/stock`,
      data
    ).pipe(
      timeout(15000),
      map(response => {
        console.log('✅ Stock actualizado en bulk:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error actualizando stock en bulk:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualiza una variante específica
   * PATCH /api/variantes/:id
   */
  actualizarVariante(
    varianteId: number,
    data: ActualizarVarianteDTO,
    imagenFile?: File | null
  ): Observable<ProductoVariante> {
    console.log('🔧 Intentando PATCH a:', `productos/variantes/${varianteId}`);
    console.log('🔧 Data a enviar:', data);

    // Si hay imagen, usar FormData (multipart/form-data)
    if (imagenFile) {
      const formData = new FormData();
      formData.append('imagen', imagenFile);
      if (data.sku !== undefined) formData.append('sku', data.sku);
      if (data.precioExtra !== undefined) formData.append('precioExtra', String(data.precioExtra));
      if (data.activo !== undefined) formData.append('activo', String(data.activo));
      if (data.stockFisico !== undefined && data.stockFisico !== null) {
        formData.append('stockFisico', String(data.stockFisico));
      }

      return this.patchFormData<ProductoVariante>(
        `productos/variantes/${varianteId}`,
        formData
      ).pipe(
        timeout(30000),
        map(response => {
          console.log('✅ Variante actualizada con imagen:', response);
          return response;
        }),
        catchError(err => {
          console.error('❌ Error actualizando variante con imagen:', err);
          return throwError(() => err);
        })
      );
    }

    // Sin imagen: enviar JSON normal
    return this.patch<ProductoVariante>(
      `productos/variantes/${varianteId}`,
      data
    ).pipe(
      timeout(10000),
      map(response => {
        console.log('✅ Variante actualizada:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error actualizando variante:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Elimina una variante
   * DELETE /api/variantes/:id
   */
  eliminarVariante(varianteId: number): Observable<any> {
    console.log(`🎨 VarianteService - DELETE variante ${varianteId}`);

    return this.delete<any>(`productos/variantes/${varianteId}`).pipe(
      timeout(10000),
      map(response => {
        console.log('✅ Variante eliminada:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error eliminando variante:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Obtiene el stock global de todas las variantes de un producto
   * GET /api/productos/:id/stock-global
   */
  getStockGlobal(productoId: number): Observable<StockGlobalResponse> {
    console.log(`🎨 VarianteService - GET stock global producto ${productoId}`);

    return this.get<StockGlobalResponse>(`productos/${productoId}/stock-global`).pipe(
      timeout(15000),
      retry(2),
      map(response => {
        console.log('✅ Stock global recibido:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error obteniendo stock global:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Helper: Obtiene el texto descriptivo de una variante
   * Ejemplo: "Negro - Talle M"
   */
  getVarianteDescripcion(variante: ProductoVariante): string {
    return variante.opciones
      .map(opt => opt.opcion)
      .join(' - ');
  }

  /**
   * Helper: Calcula el precio final de una variante
   */
  calcularPrecioFinal(precioBase: number, variante: ProductoVariante): number {
    return precioBase + (variante.precioExtra || 0);
  }

  /**
   * Helper: Verifica si una variante tiene stock disponible
   */
  tieneStockDisponible(variante: ProductoVariante): boolean {
    // Si stockFisico es null, es sinérgico (siempre disponible)
    if (variante.stockFisico === null) return true;

    // Si es enérgico, verificar que haya stock
    return variante.stockFisico > 0;
  }

  /**
   * Helper: Filtra variantes activas con stock
   */
  getVariantesDisponibles(variantes: ProductoVariante[]): ProductoVariante[] {
    return variantes.filter(v =>
      v.activo && this.tieneStockDisponible(v)
    );
  }

  /**
   * Helper: Agrupa variantes por característica
   * Útil para mostrar selectores en el frontend
   */
  agruparPorCaracteristica(variantes: ProductoVariante[]): Map<string, Set<string>> {
    const agrupado = new Map<string, Set<string>>();

    variantes.forEach(variante => {
      variante.opciones.forEach(opcion => {
        if (!agrupado.has(opcion.caracteristica)) {
          agrupado.set(opcion.caracteristica, new Set<string>());
        }
        agrupado.get(opcion.caracteristica)!.add(opcion.opcion);
      });
    });

    return agrupado;
  }

  /**
   * Helper: Encuentra variante por opciones seleccionadas
   * Ejemplo: { "Color": "Negro", "Talle": "M" }
   */
  encontrarVariantePorOpciones(
    variantes: ProductoVariante[],
    opcionesSeleccionadas: Record<string, string>
  ): ProductoVariante | undefined {
    return variantes.find(variante => {
      return Object.entries(opcionesSeleccionadas).every(([caracteristica, opcion]) => {
        return variante.opciones.some(
          vo => vo.caracteristica === caracteristica && vo.opcion === opcion
        );
      });
    });
  }

  /**
   * Helper: Valida si se pueden generar variantes con las opciones dadas
   */
  validarOpcionesParaGenerar(
    plantilla: Plantilla,
    opcionesDisponibles: Record<string, number[]>
  ): { valido: boolean; mensaje?: string } {
    // Verificar que todas las características tengan al menos una opción
    const caracteristicasIds = plantilla.caracteristicas.map(c => c.id!.toString());

    for (const caracId of caracteristicasIds) {
      if (!opcionesDisponibles[caracId] || opcionesDisponibles[caracId].length === 0) {
        const caracteristica = plantilla.caracteristicas.find(c => c.id!.toString() === caracId);
        return {
          valido: false,
          mensaje: `Debes seleccionar al menos una opción para "${caracteristica?.nombre}"`
        };
      }
    }

    // Calcular número de variantes que se generarían
    const numVariantes = Object.values(opcionesDisponibles)
      .reduce((total, opciones) => total * opciones.length, 1);

    if (numVariantes > 100) {
      return {
        valido: false,
        mensaje: `Se generarían ${numVariantes} variantes. El máximo recomendado es 100.`
      };
    }

    return { valido: true };
  }
}

// ============================================
// EJEMPLO DE USO EN UN COMPONENTE
// ============================================

/*
import { Component, OnInit } from '@angular/core';
import { VarianteService, ProductoVariante } from '@app/services/variante/variante.service';

export class InventarioComponent implements OnInit {
  productoId = 1;
  variantes: ProductoVariante[] = [];
  stockGlobal: StockGlobalResponse | null = null;

  constructor(private varianteService: VarianteService) {}

  ngOnInit() {
    this.cargarVariantes();
    this.cargarStockGlobal();
  }

  cargarVariantes() {
    this.varianteService.getVariantesByProducto(this.productoId)
      .subscribe({
        next: (response) => {
          this.variantes = response.variantes;
          console.log('Producto:', response.producto);
        },
        error: (err) => {
          console.error('Error cargando variantes:', err);
        }
      });
  }

  cargarStockGlobal() {
    this.varianteService.getStockGlobal(this.productoId)
      .subscribe({
        next: (response) => {
          this.stockGlobal = response;
          console.log('Stock total:', response.stockTotal);
          console.log('Distribución:', response.distribucion);
        },
        error: (err) => {
          console.error('Error cargando stock global:', err);
        }
      });
  }

  actualizarStockVariante(varianteId: number, nuevoStock: number) {
    this.varianteService.actualizarStockBulk(this.productoId, {
      variantes: [{ id: varianteId, stockFisico: nuevoStock }]
    }).subscribe({
      next: (response) => {
        console.log('Stock actualizado:', response);
        this.cargarVariantes();
        this.cargarStockGlobal();
      },
      error: (err) => {
        console.error('Error actualizando stock:', err);
      }
    });
  }

  generarVariantesAutomaticas(opcionesDisponibles: Record<string, number[]>) {
    const dto: GenerarVariantesDTO = {
      productoId: this.productoId,
      opcionesDisponibles
    };

    this.varianteService.generarVariantes(dto)
      .subscribe({
        next: (response) => {
          console.log('Variantes generadas:', response);
          this.cargarVariantes();
        },
        error: (err) => {
          console.error('Error generando variantes:', err);
        }
      });
  }

  obtenerDescripcion(variante: ProductoVariante): string {
    return this.varianteService.getVarianteDescripcion(variante);
  }

  tieneStock(variante: ProductoVariante): boolean {
    return this.varianteService.tieneStockDisponible(variante);
  }
}
*/

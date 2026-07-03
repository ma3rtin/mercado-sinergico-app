import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, retry, shareReplay } from 'rxjs/operators';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { ApiService } from '../api.service';
import { ProductoDetalleDTO } from '@app/models/DTOs/Producto/productoDetalleDTO';

@Injectable({ providedIn: 'root' })
export class ProductosService extends ApiService {
  private productosCache$?: Observable<Producto[]>;

  getProductos(): Observable<Producto[]> {
    if (this.productosCache$) return this.productosCache$;

    this.productosCache$ = this.get<Producto[]>('productos').pipe(
      timeout(30000),
      retry(2),
      map(response =>
        response.map(p => this.normalizeProducto(p))
      ),
      catchError(err => {
        this.productosCache$ = undefined;
        return throwError(() => err);
      }),
      shareReplay(1)
    );

    return this.productosCache$;
  }

  clearCache(): void {
    this.productosCache$ = undefined;
  }

  getProductoById(id: number): Observable<Producto> {
    return this.get<any>(`productos/${id}`).pipe(
      map(res => {
        const producto = res.producto ?? res;
        return this.normalizeProducto(producto);
      })
    );
  }

  // ✅ Normaliza para que imagen_url esté disponible en detalle-producto-sumarse
  getProductoDetalle(id: number): Observable<ProductoDetalleDTO> {
    return this.get<any>(`productos/${id}`).pipe(
      map(res => {
        console.log('📦 RAW getProductoDetalle:', res);
        // El backend puede devolver { producto: {...} } o el objeto directo
        if (res?.producto) {
          return {
            ...res,
            producto: this.normalizeProducto(res.producto)
          } as ProductoDetalleDTO;
        } else {
          // El objeto ES el producto directamente
          return {
            producto: this.normalizeProducto(res)
          } as ProductoDetalleDTO;
        }
      })
    );
  }

  createProduct(data: FormData): Observable<Producto> {
    return this.post<Producto>('productos', data).pipe(
      timeout(30000),
      map(response => {
        this.clearCache();
        return response;
      }),
      catchError(err => {
        console.error('❌ Error creando producto:', err);
        return throwError(() => err);
      })
    );
  }

  duplicateProduct(id: number): Observable<Producto> {
    return this.post<Producto>(`productos/${id}/duplicate`, {}).pipe(
      timeout(30000),
      map(response => {
        this.clearCache();
        return response;
      }),
      catchError(err => {
        console.error('❌ Error duplicando producto:', err);
        return throwError(() => err);
      })
    );
  }

  updateProducto(productoId: number, data: FormData): Observable<Producto> {
    return this.put<Producto>(`productos/${productoId}`, data).pipe(
      timeout(30000),
      map(response => {
        this.clearCache();
        return response;
      }),
      catchError(err => {
        console.error('❌ Error actualizando producto:', err);
        return throwError(() => err);
      })
    );
  }

  deleteProducto(id: number): Observable<any> {
    return this.delete<any>(`productos/${id}`).pipe(
      timeout(10000),
      map(response => {
        this.clearCache();
        return response;
      }),
      catchError(err => {
        console.error('❌ Error eliminando producto:', err);
        return throwError(() => err);
      })
    );
  }

  getProductosFiltrados(
    search: string,
    offset: number,
    limit: number
  ): Observable<Producto[]> {
    const params = new URLSearchParams({
      search,
      offset: offset.toString(),
      limit: limit.toString(),
    });

    return this.get<Producto[]>(`productos/filtrados?${params}`).pipe(
      timeout(15000),
      retry(1),
      map(response =>
        (response || []).map(p => this.normalizeProducto(p))
      ),
      catchError(err => throwError(() => err))
    );
  }

  private normalizeProducto(producto: any): Producto {
    const rawImagenes = producto.imagenes || producto.ProductoImagen || [];

    // 🖼️ El backend puede devolver imagenes como string[] O como objeto[] { url, id, ... }
    const imagenes = rawImagenes.map((img: any) => {
      if (typeof img === 'string') {
        return { url: img, id: 0, producto_id: 0 };
      }
      return { ...img, url: img.url || img.imagen_url || '' };
    });

    // 🖼️ Buscar imagen_url: primero campo directo, luego primer elemento del array normalizado
    const imagen_url =
      producto.imagen_url ||
      producto.imagen ||
      imagenes[0]?.url ||
      undefined;

    // Normalizar marca
    const rawMarca = producto.marca;
    const marca =
      typeof rawMarca === 'string'
        ? { nombre: rawMarca }
        : rawMarca ?? undefined;

    // Normalizar categoría
    const rawCategoria = producto.categoria;
    const categoria =
      typeof rawCategoria === 'string'
        ? { nombre: rawCategoria }
        : rawCategoria ?? undefined;

    return {
      ...producto,
      id_producto: producto.id_producto || producto.id,
      imagen_url,
      imagenes,
      marca,
      categoria,

      // Normalizar categoria_id: extraer del objeto categoria si no viene como campo directo
      categoria_id:
        producto.categoria_id ??
        (typeof rawCategoria === 'object' && rawCategoria !== null
          ? rawCategoria.id_categoria ?? rawCategoria.id
          : undefined),

      // Normalizar marca_id: extraer del objeto marca si no viene como campo directo
      marca_id:
        producto.marca_id ??
        (typeof rawMarca === 'object' && rawMarca !== null
          ? rawMarca.id_marca ?? rawMarca.id
          : undefined),
    };
  }
}

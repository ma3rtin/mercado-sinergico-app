import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError, retry, shareReplay } from 'rxjs/operators';
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class ProductosService extends ApiService {
  private productosCache$?: Observable<Producto[]>;

  getProductos(): Observable<Producto[]> {
    if (this.productosCache$) return this.productosCache$;

    this.productosCache$ = this.get<Producto[]>('productos').pipe(
      timeout(30000),
      retry(2),
      map(response => {
        console.log('✅ Productos recibidos del backend:', response);
        return response;
      }),
      catchError(err => {
        console.error('❌ Error en getProductos:', err);
        this.productosCache$ = undefined;

        if (err.name === 'TimeoutError') {
          console.error('⏱️ Timeout: El backend no respondió a tiempo');
        }

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
    return this.get<Producto>(`productos/${id}`).pipe(
      timeout(10000),
      catchError(err => {
        console.error('❌ Error obteniendo producto:', err);
        return throwError(() => err);
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
    map((response) => response || []),
    catchError((err) => {
      console.error('❌ Error en getProductosFiltrados:', err);
      return throwError(() => err);
    })
  );
}

}

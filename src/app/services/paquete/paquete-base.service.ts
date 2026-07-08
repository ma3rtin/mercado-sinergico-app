import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
import { ApiService } from '../api.service';
import { Producto } from '@app/models/ProductosInterfaces/Producto';

@Injectable({ providedIn: 'root' })
export class PaqueteBaseService extends ApiService {
  createPaquete(data: FormData): Observable<PaqueteBase> {
    return this.post<PaqueteBase>('paquetes-base', data).pipe(
      timeout(60000),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.createPaquete:', error);
        return throwError(() => error);
      })
    );
  }

  updatePaquete(paquete: PaqueteBase): Observable<PaqueteBase> {
    return this.put<PaqueteBase>(
      `paquetes-base/${paquete.id_paquete_base}`,
      paquete
    ).pipe(
      timeout(60000),
      map((response) => response),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.updatePaquete:', error);
        return throwError(() => error);
      })
    );
  }

  deletePaquete(id: number): Observable<PaqueteBase> {
    return this.delete<PaqueteBase>(`paquetes-base/${id}`).pipe(
      timeout(60000),
      map((response) => response),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.deletePaquete:', error);
        return throwError(() => error);
      })
    );
  }

  agregarProductos(
    paqueteBaseId: number,
    productosId: number[]
  ): Observable<PaqueteBase> {
    return this.post<PaqueteBase>('paquetes-base/agregar-productos', {
      paqueteBaseId,
      productosId,
    }).pipe(
      timeout(60000),
      map((response) => response),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.agregarProductos:', error);
        return throwError(() => error);
      })
    );
  }

  getPaquetes(includeArchived = false): Observable<PaqueteBase[]> {
    const url = includeArchived ? 'paquetes-base?includeArchived=true' : 'paquetes-base';
    return this.get<PaqueteBase[]>(url).pipe(
      timeout(60000),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.getPaquetes:', error);
        return throwError(() => error);
      })
    );
  }

  archivarPaquete(id: number, archivado: boolean): Observable<PaqueteBase> {
    return this.patch<PaqueteBase>(`paquetes-base/${id}/archivar`, { archivado }).pipe(
      timeout(60000),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.archivarPaquete:', error);
        return throwError(() => error);
      })
    );
  }

  getProductosByPaqueteBase(paqueteBaseId: number): Observable<Producto[]> {
    return this.get<Producto[]>(`paquetes-base/${paqueteBaseId}/productos`).pipe(
      timeout(60000),
      catchError((error) => {
        console.error('❌ Error en PaqueteBaseService.getProductosByPaquete:', error);
        return throwError(() => error);
      })
    );
  }

  duplicarPaquete(id: number): Observable<PaqueteBase> {
    return this.post<PaqueteBase>(`paquetes-base/${id}/duplicar`, {}).pipe(
      timeout(60000),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.duplicarPaquete:', error);
        return throwError(() => error);
      })
    );
  }
}

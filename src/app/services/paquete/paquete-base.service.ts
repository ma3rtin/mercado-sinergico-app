import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
import { ApiService } from '../api.service';

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
    return this.post<PaqueteBase>(`paquetes-base/${paqueteBaseId}/productos`, {
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

  getPaquetes(): Observable<PaqueteBase[]> {
    return this.get<PaqueteBase[]>('paquetes-base').pipe(
      timeout(60000),
      catchError((error) => {
        console.error('Error en PaqueteBaseService.getPaquetes:', error);
        return throwError(() => error);
      })
    );
  }
}

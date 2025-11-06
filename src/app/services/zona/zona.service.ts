import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, timeout } from 'rxjs';
import { Zona } from '@app/models/ZonasInterfaces/Zona';
import { environment } from '@environments/environment';

const BASE_URL = `${environment.apiUrl}`;

@Injectable({ providedIn: 'root' })
export class ZonaService {
    private readonly apiUrl = `${BASE_URL}/zonas`;

    constructor(private http: HttpClient) { }

    getZonas(): Observable<Zona[]> {
        return this.http.get<Zona[]>(this.apiUrl).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.getZonas:', error);
                return throwError(() => error);
            })
        );
    }

    getZonaById(id: number): Observable<Zona> {
        return this.http.get<Zona>(`${this.apiUrl}/${id}`).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.getZonaById:', error);
                return throwError(() => error);
            })
        );
    }

    createZona(zona: Zona): Observable<Zona> {
        return this.http.post<Zona>(this.apiUrl, zona).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.createZona:', error);
                return throwError(() => error);
            })
        );
    }

    updateZona(id: number, zona: Zona): Observable<Zona> {
        return this.http.put<Zona>(`${this.apiUrl}/${id}`, zona).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.updateZona:', error);
                return throwError(() => error);
            })
        );
    }

    deleteZona(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.deleteZona:', error);
                return throwError(() => error);
            })
        );
    }

    asignarZonaAProducto(zonaId: number, productoId: number): Observable<Zona> {
        const url = `${this.apiUrl}/${zonaId}/productos/${productoId}`;
        return this.http.put<Zona>(url, {}).pipe(
            timeout(60000),
            catchError((error: HttpErrorResponse) => {
                console.error('Error en ZonaService.asignarZonaAProducto:', error);
                return throwError(() => error);
            })
        );
    }
}

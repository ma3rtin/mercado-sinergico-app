import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@app/services/api.service';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaquetePublicadoService extends ApiService {
    private apiUrl = 'paquetes-publicados';

    constructor() {
        super();
    }
    getPaquetes(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(this.apiUrl);
    }
    getPaqueteById(id: number): Observable<PaquetePublicado> {
        return this.get<PaquetePublicado>(`${this.apiUrl}/${id}`);
    }
    createPaquete(paquete: PaquetePublicado): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(this.apiUrl, paquete);
    }
    updatePaquete(paquete: PaquetePublicado): Observable<PaquetePublicado> {
        return this.put<PaquetePublicado>(`${this.apiUrl}/${paquete.id_paquete_publicado}`, paquete);
    }
    deletePaquete(id: number): Observable<PaquetePublicado> {
        return this.delete<PaquetePublicado>(`${this.apiUrl}/${id}`);
    }
    getPaquetesPorCerrarse(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}/por-cerrarse`);
    }

    getRelacionados(id: number): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}/relacionados/${id}`);
    }

    getPaquetesDelUsuario(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}/mis-pedidos`);
    }

    getByProductId(productoId: number): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(
            `${this.apiUrl}/producto/${productoId}`
        );
    }

    getPaquetesCerrados(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}`).pipe(
            map(paquetes => paquetes.filter(p => p.estado.nombre === 'Cerrado'))
        );
    }

    // Export methods
    exportarFabrica(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${this.apiUrl}/${id}/exportar-fabrica`, {
            responseType: 'blob'
        });
    }

    exportarLogistica(id: number): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/${this.apiUrl}/${id}/exportar-logistica`, {
            responseType: 'blob'
        });
    }
    /** Admin: obtiene TODOS los paquetes publicados (todos los estados) */
    getAllPaquetes(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(this.apiUrl);
    }

    /** Admin: confirma la compra con el fabricante y notifica a los compradores */
    confirmarCompra(id: number): Observable<{ message: string }> {
        return this.post<{ message: string }>(`${this.apiUrl}/${id}/confirmar`, {});
    }

    duplicarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(`${this.apiUrl}/${id}/duplicar`, {});
    }

    completarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(`${this.apiUrl}/${id}/completar`, {});
    }

    cancelarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(`${this.apiUrl}/${id}/cancelar`, {});
    }

    /** Cierra el paquete y lo pasa a "En Preparación" */
    cerrarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(`${this.apiUrl}/${id}/cerrar`, {});
    }
    notificarCompradores(id: number): Observable<{ mensaje: string; notificados: number }> {
        return this.http.post<{ mensaje: string; notificados: number }>(
            `${this.apiUrl}/${id}/notificar`, {}
        );
    }
}


import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Observable } from 'rxjs';
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
        return this.put<PaquetePublicado>(
            `${this.apiUrl}/${paquete.id_paquete_publicado}`,
            paquete
        );
    }

    createPaqueteFormData(formData: FormData): Observable<PaquetePublicado> {
        return this.http.post<PaquetePublicado>(this.buildUrl(this.apiUrl), formData);
    }

    updatePaqueteFormData(id: number, formData: FormData): Observable<PaquetePublicado> {
        return this.http.put<PaquetePublicado>(this.buildUrl(`${this.apiUrl}/${id}`), formData);
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

    getByProductId(productoId: number): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(
            `${this.apiUrl}/producto/${productoId}`
        );
    }

    /** Admin: obtiene TODOS los paquetes publicados */
    getAllPaquetes(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(this.apiUrl);
    }

    /** Admin: Activo → Completo (manual, para casos de borde) */
    completarPaquete(id: number): Observable<{ message: string }> {
        return this.post<{ message: string }>(
            `${this.apiUrl}/${id}/completar`,
            {}
        );
    }

    /** Admin: Completo (o Activo) → Confirmado. Notifica compradores y pasa pedidos a En preparación */
    confirmarCompra(id: number): Observable<{ message: string; notificados: number }> {
        return this.post<{ message: string; notificados: number }>(
            `${this.apiUrl}/${id}/confirmar`,
            {}
        );
    }

    /** Admin: Confirmado → Entregado. Pasa todos los pedidos a Recibido */
    marcarEntregado(id: number): Observable<{ message: string }> {
        return this.post<{ message: string }>(
            `${this.apiUrl}/${id}/entregar`,
            {}
        );
    }

    /** Admin: Marca pedidos seleccionados como En camino y envía email. */
    marcarEnCamino(id: number, pedidoIds: number[] = []): Observable<{ message: string; notificados: number }> {
        return this.post<{ message: string; notificados: number }>(
            `${this.apiUrl}/${id}/marcar-en-camino`,
            { pedidoIds }
        );
    }

    /** Admin/Auto: Cancela el paquete y reembolsa todos los pedidos Pagados */
    cancelarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(
            `${this.apiUrl}/${id}/cancelar`,
            {}
        );
    }

    /** Admin: Envía email de aviso a los compradores activos */
    notificarCompradores(id: number): Observable<{ mensaje: string; notificados: number }> {
        return this.http.post<{ mensaje: string; notificados: number }>(
            this.buildUrl(`${this.apiUrl}/${id}/notificar`),
            {}
        );
    }

    duplicarPaquete(id: number): Observable<PaquetePublicado> {
        return this.post<PaquetePublicado>(
            `${this.apiUrl}/${id}/duplicar`,
            {}
        );
    }

    /** Exportaciones */
    exportarFabrica(id: number): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/${this.apiUrl}/${id}/exportar-fabrica`,
            { responseType: 'blob' }
        );
    }

    exportarLogistica(id: number): Observable<Blob> {
        return this.http.get(
            `${this.baseUrl}/${this.apiUrl}/${id}/exportar-logistica`,
            { responseType: 'blob' }
        );
    }
}

import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
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

    getPaquetesPaginados(
        page: number,
        limit: number,
        filtros?: any,
        includeArchived = false
    ): Observable<{ paquetes: PaquetePublicado[]; total: number }> {
        const params: any = {
            page: page.toString(),
            limit: limit.toString(),
        };
        if (includeArchived) params.includeArchived = 'true';

        if (filtros) {
            if (filtros.categorias && filtros.categorias.length > 0) {
                params.categorias = filtros.categorias.join(',');
            }
            if (filtros.marcas && filtros.marcas.length > 0) {
                params.marcas = filtros.marcas.join(',');
            }
            if (filtros.zonas && filtros.zonas.length > 0) {
                params.zonas = filtros.zonas.join(',');
            }
            if (filtros.tiposPaquete && filtros.tiposPaquete.length > 0) {
                params.tiposPaquete = filtros.tiposPaquete.join(',');
            }
            if (filtros.estados && filtros.estados.length > 0) {
                params.estados = filtros.estados.join(',');
            }
            if (filtros.ordenamiento) {
                params.orden = filtros.ordenamiento;
            }
        }

        return this.http
            .get<PaquetePublicado[]>(this.buildUrl(this.apiUrl), {
                observe: 'response',
                params,
            })
            .pipe(
                timeout(30000),
                map((response: HttpResponse<PaquetePublicado[]>) => {
                    const totalHeader = response.headers.get('X-Total-Count');
                    const total = totalHeader ? parseInt(totalHeader, 10) : 0;
                    const body = response.body || [];
                    return { paquetes: body, total };
                }),
                catchError((err) => {
                    console.error('❌ Error cargando paquetes paginados:', err);
                    return throwError(() => err);
                })
            );
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

    getPaquetesCerrados(): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}/cerrados`);
    }

    getRelacionados(id: number): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(`${this.apiUrl}/relacionados/${id}`);
    }

    getByProductId(productoId: number): Observable<PaquetePublicado[]> {
        return this.get<PaquetePublicado[]>(
            `${this.apiUrl}/producto/${productoId}`
        );
    }

    /**
     * Admin: obtiene TODOS los paquetes publicados.
     * incluirCerrados es necesario porque el listado público esconde los que
     * ya no admiten sumarse (Completo, Confirmado, Entregado, Cancelado).
     */
    getAllPaquetes(includeArchived = false): Observable<PaquetePublicado[]> {
        const params = new URLSearchParams({ incluirCerrados: 'true' });
        if (includeArchived) params.set('includeArchived', 'true');
        return this.get<PaquetePublicado[]>(`${this.apiUrl}?${params.toString()}`);
    }

    /** Admin: obtiene paquetes en estado Completo o Confirmado (requieren acción del admin) */
    getPaquetesCompletos(includeArchived = false): Observable<PaquetePublicado[]> {
        return this.getAllPaquetes(includeArchived).pipe(
            map(paquetes => paquetes.filter(p => {
                const nombre = p.estado?.nombre?.toLowerCase();
                const matchedEstado = nombre === 'completo' || nombre === 'confirmado';
                return matchedEstado && (includeArchived || !p.archivado);
            }))
        );
    }

    /** Admin: obtiene paquetes finalizados (Recibido + Cancelado) */
    getPaquetesFinalizados(includeArchived = false): Observable<PaquetePublicado[]> {
        return this.getAllPaquetes(includeArchived).pipe(
            map(paquetes => paquetes.filter(p => {
                const nombre = p.estado?.nombre?.toLowerCase();
                const matchedEstado = nombre === 'recibido' || nombre === 'cancelado';
                return matchedEstado && (includeArchived || !p.archivado);
            }))
        );
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

    /** Descarta una publicación duplicada sin pedidos (hard delete limpio) */
    descartarDuplicado(id: number): Observable<{ message: string }> {
        return this.post<{ message: string }>(`${this.apiUrl}/${id}/descartar`, {});
    }

    archivarPaquete(id: number, archivado: boolean): Observable<PaquetePublicado> {
        return this.patch<PaquetePublicado>(`${this.apiUrl}/${id}/archivar`, { archivado });
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

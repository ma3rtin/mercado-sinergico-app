import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class PaquetePublicadoService extends ApiService {
    private apiUrl = "paquetes-publicados";
    constructor() {
    super();
    }
    getPaquetes(): Observable<PaquetePublicado[]> {
        return this.http.get<PaquetePublicado[]>(this.apiUrl);
    }
    createPaquete(paquete: PaquetePublicado): Observable<PaquetePublicado> {
        return this.http.post<PaquetePublicado>(this.apiUrl, paquete);
    }
    updatePaquete(paquete: PaquetePublicado): Observable<PaquetePublicado> {
        return this.http.put<PaquetePublicado>(`${this.apiUrl}/${paquete.id_paquete_publicado}`, paquete);
    }
    deletePaquete(id: number): Observable<PaquetePublicado> {
        return this.http.delete<PaquetePublicado>(`${this.apiUrl}/${id}`);
    }
    getPaquetesPorCerrarse(): Observable<PaquetePublicado[]> {
        return this.http.get<PaquetePublicado[]>(`${this.apiUrl}/por-cerrarse`);
    }
}

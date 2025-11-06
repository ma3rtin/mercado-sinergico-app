import { Injectable } from '@angular/core';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
@Injectable({ providedIn: 'root' })
export class PlantillaService extends ApiService {

    private apiUrl = "plantillas";
    constructor() {
    super();
    }

    getPlantillas(): Observable<Plantilla[]> {
        return this.http.get<Plantilla[]>(this.apiUrl);
    }

    asignarPlantillaAProducto(plantillaId: number, productoId: number): Observable<Plantilla> {
        return this.http.put<Plantilla>(`${this.apiUrl}/${plantillaId}/productos/${productoId}`, {});
    }

    getPlantillaById(id: number): Observable<Plantilla> {
        return this.http.get<Plantilla>(`${this.apiUrl}/${id}`);
    }

    crearPlantilla(plantilla: Plantilla): Observable<Plantilla> {
        return this.http.post<Plantilla>(this.apiUrl, plantilla);
    }

    actualizarPlantilla(plantilla: Plantilla): Observable<Plantilla> {
        return this.http.put<Plantilla>(`${this.apiUrl}/${plantilla.id}`, plantilla);
    }

    eliminarPlantilla(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

}

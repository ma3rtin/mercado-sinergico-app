import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { ApiService } from '@app/services/api.service';
@Injectable({ providedIn: 'root' })
export class MarcaService extends ApiService {
    private apiUrl = 'marcas';
    constructor() {
        super();
    }
    getMarcas(): Observable<Marca[]> {
        return this.get<Marca[]>(this.apiUrl);
    }
    getMarcaById(id: number): Observable<Marca> {
        return this.get<Marca>(`${this.apiUrl}/${id}`);
    }
}

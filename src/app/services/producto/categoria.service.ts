import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Categoria } from '@app/models/Producto-Paquete/Categoria';
import { ApiService } from '@app/services/api.service';

@Injectable({ providedIn: 'root' })
export class CategoriaService extends ApiService {
    private endpoint = 'categorias';

    constructor() {
    super();
    }

    getCategorias(): Observable<Categoria[]> {
        return this.get<Categoria[]>(this.endpoint);
    }

    getCategoriaById(id: number): Observable<Categoria> {
        return this.get<Categoria>(`${this.endpoint}/${id}`);
    }
}

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
    //crearcategoria por nombre     this.marcaService.crearcategoria({ nombre }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({

    createCategoria(nombre: string): Observable<Categoria> {
        return this.post<Categoria>(this.endpoint, { nombre });
    }

    getCategorias(): Observable<Categoria[]> {
        return this.get<Categoria[]>(this.endpoint);
    }

    getCategoriaById(id: number): Observable<Categoria> {
        return this.get<Categoria>(`${this.endpoint}/${id}`);
    }
    updateCategoria(id: number, nombre: string): Observable<Categoria> {
        return this.put<Categoria>(`${this.endpoint}/${id}`, { nombre });
    }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Marca } from '@app/models/Producto-Paquete/Marca';
import { ApiService } from '@app/services/api.service';
@Injectable({ providedIn: 'root' })
export class MarcaService extends ApiService {
    private apiUrl = 'marcas';

   
    createMarca(nombre: string): Observable<Marca> {
        return this.post<Marca>(this.apiUrl, { nombre });
    }

    
    getMarcas(): Observable<Marca[]> {
        return this.get<Marca[]>(this.apiUrl);
    }
    getMarcaById(id: number): Observable<Marca> {
        return this.get<Marca>(`${this.apiUrl}/${id}`);
    }
    updateMarca(id: number, nombre: string): Observable<Marca> {
    return this.put<Marca>(`${this.apiUrl}/${id}`, { nombre });
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';

export interface Localidad {
  id_localidad: number;
  nombre: string;
  codigo_postal: number;
}

@Injectable({ providedIn: 'root' })
export class LocalidadService {
  private readonly endpoint = '/localidades';

  constructor(private api: ApiService) {}

  getAll(): Observable<Localidad[]> {
    return this.api.get<Localidad[]>(this.endpoint);
  }

  getById(id: number): Observable<Localidad> {
    return this.api.get<Localidad>(`${this.endpoint}/${id}`);
  }

  create(localidad: Localidad): Observable<Localidad> {
    return this.api.post<Localidad>(this.endpoint, localidad);
  }

  update(id: number, localidad: Localidad): Observable<Localidad> {
    return this.api.put<Localidad>(`${this.endpoint}/${id}`, localidad);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
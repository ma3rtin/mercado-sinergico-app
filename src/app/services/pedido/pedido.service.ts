import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';

@Injectable({ providedIn: 'root' })
export class PedidoService extends ApiService {

    private apiUrl = 'pedidos';

    getPedidos(): Observable<Pedido[]> {
        return this.get<Pedido[]>(this.apiUrl);
    }

    getPedidoById(id: number): Observable<Pedido> {
        return this.get<Pedido>(`${this.apiUrl}/${id}`);
    }

    crearPedido(body: Partial<Pedido>): Observable<Pedido> {
        return this.post<Pedido>(this.apiUrl, body);
    }

    actualizarPedido(id: number, body: Partial<Pedido>): Observable<Pedido> {
        return this.put<Pedido>(`${this.apiUrl}/${id}`, body);
    }

    eliminarPedido(id: number): Observable<void> {
        return this.delete<void>(`${this.apiUrl}/${id}`);
    }
}

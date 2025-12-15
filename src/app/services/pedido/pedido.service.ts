import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PedidoActualizado } from '@app/models/DTOs/Pedido/PedidoActualizadoDTO';

@Injectable({ providedIn: 'root' })
export class PedidoService extends ApiService {

    private apiUrl = 'pedidos';

    getPedidos(): Observable<Pedido[]> {
        return this.get<Pedido[]>(this.apiUrl);
    }

    getPedidoById(id: number): Observable<Pedido> {
        return this.get<Pedido>(`${this.apiUrl}/${id}`);
    }

    crearPedido(paqueteId: number, body: Partial<Pedido>): Observable<Pedido> {
        return this.post<Pedido>(`${this.apiUrl}/${paqueteId}`, body);
    }

    actualizarCantidad(
        pedidoId: number,
        productoId: number,
        body: { cantidad: number; variante?: string | null }
    ): Observable<PedidoActualizado> {
        return this.patch<PedidoActualizado>(
            `${this.apiUrl}/${pedidoId}/producto/${productoId}`,
            body
        );
    }

    eliminarProductoDelPedido(
        pedidoId: number,
        productoId: number
    ): Observable<void> {
        return this.delete<void>(
            `${this.apiUrl}/${pedidoId}/producto/${productoId}`
        );
    }

    salirDelPaquete(paqueteId: number): Observable<void> {
        return this.get<void>(`${this.apiUrl}/bajarse/${paqueteId}`);
    }
}
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PedidoActualizado } from '@app/models/DTOs/Pedido/PedidoActualizadoDTO';
import { SumarseAPedidoDTO } from '@app/models/DTOs/Pedido/SumarseAPedidoDTO';

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
    detalleId: number,
    body: { cantidad: number }
  ): Observable<PedidoActualizado> {
    return this.patch<PedidoActualizado>(
      `${this.apiUrl}/${pedidoId}/detalle/${detalleId}/cantidad`,
      body
    );
  }

  eliminarProductoDelPedido(
    pedidoId: number,
    detalleId: number
  ): Observable<void> {
    return this.delete<void>(
      `${this.apiUrl}/${pedidoId}/detalle/${detalleId}`
    );
  }

  sumarseAlPaquete(
    paqueteId: number,
    body: SumarseAPedidoDTO
  ): Observable<Pedido> {
    return this.post<Pedido>(`${this.apiUrl}/${paqueteId}`, body);
  }

  salirDelPaquete(paqueteId: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/${paqueteId}/bajarse`);
  }

  iniciarCheckout(pedidoId: number): Observable<any> {
    return this.post(`${this.apiUrl}/${pedidoId}/checkout`, {});
  }

  /** Solicita reembolso de un pedido Pagado (solo mientras el paquete está Activo) */
  solicitarReembolso(pedidoId: number): Observable<{ message: string; pedidoId: number }> {
    return this.post<{ message: string; pedidoId: number }>(
      `${this.apiUrl}/${pedidoId}/solicitar-reembolso`,
      {}
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PedidoActualizado } from '@app/models/DTOs/Pedido/PedidoActualizadoDTO';
import { SumarseAPedidoDTO } from '@app/models/DTOs/Pedido/SumarseAPedidoDTO';
import { AnalyticsService } from '@app/services/analytics/analytics.service';

@Injectable({ providedIn: 'root' })
export class PedidoService extends ApiService {
  private apiUrl = 'pedidos';

  constructor(private analytics: AnalyticsService) {
    super();
  }

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
    return this.post<Pedido>(`${this.apiUrl}/${paqueteId}`, body).pipe(
      tap((pedido) => {
        const primerDetalle = pedido.detalles?.[0];
        const paqueteNombre = pedido.paquetePublicado?.paqueteBase?.nombre ?? `Paquete ${paqueteId}`;
        this.analytics.trackAddToCart({
          item_id: primerDetalle?.productoId ?? body.productoId,
          item_name: primerDetalle?.producto?.nombre ?? `Producto ${body.productoId}`,
          item_category: 'Producto en Paquete',
          price: primerDetalle?.precio_unitario ?? 0,
          quantity: body.cantidad,
          item_variant: primerDetalle?.variante ?? undefined,
        });
        this.analytics.trackEvent('join_package', {
          paquete_id: paqueteId,
          paquete_nombre: paqueteNombre,
          pedido_id: pedido.id_pedido,
        });
      })
    );
  }

  salirDelPaquete(paqueteId: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/${paqueteId}/bajarse`);
  }

  iniciarCheckout(pedidoId: number): Observable<any> {
    return this.post(`${this.apiUrl}/${pedidoId}/checkout`, {}).pipe(
      tap((res: any) => {
        const detalles = res?.pedido?.detalles ?? [];
        const items = detalles.map((d: any) => ({
          item_id: d.productoId ?? d.id_producto,
          item_name: d.producto?.nombre ?? `Producto ${d.productoId ?? d.id_producto}`,
          price: d.precio_unitario ?? 0,
          quantity: d.cantidad ?? 1,
          item_variant: d.variante,
        }));
        const value = items.reduce(
          (acc: number, it: any) => acc + (it.price ?? 0) * (it.quantity ?? 1),
          0
        );
        this.analytics.trackBeginCheckout(value, items);
        this.analytics.trackAddPaymentInfo(value, items);
      })
    );
  }

  solicitarReembolso(pedidoId: number): Observable<{ message: string; pedidoId: number }> {
    return this.post<{ message: string; pedidoId: number }>(
      `${this.apiUrl}/${pedidoId}/solicitar-reembolso`,
      {}
    );
  }
}
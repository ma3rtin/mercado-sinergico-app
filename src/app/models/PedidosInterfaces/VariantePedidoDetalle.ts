/** Forma real que devuelve el backend para PedidoDetalle.variante (Prisma: ProductoVariante + ProductoVarianteOpcion). */
export interface OpcionPedidoDetalle {
  id: number;
  caracteristicaId: number;
  opcionId: number;
  caracteristica?: { id: number; nombre: string };
  opcion?: { id: number; nombre: string };
}

export interface VariantePedidoDetalle {
  id: number;
  sku?: string;
  stockFisico?: number | null;
  precioExtra?: number;
  activo?: boolean;
  opciones: OpcionPedidoDetalle[];
}

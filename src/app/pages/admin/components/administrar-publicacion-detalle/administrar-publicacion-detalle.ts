import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { ToastService } from '@app/services/toast/toast.service';
import { LoaderComponent } from '@app/shared/loader/loader';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-administrar-publicacion-detalle',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, FormsModule, BackButtonComponent, LoaderComponent],
  templateUrl: './administrar-publicacion-detalle.html',
})
export class AdministrarPublicacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paqueteService = inject(PaquetePublicadoService);
  private toast = inject(ToastService);

  paquete = signal<PaquetePublicado | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  enviandoMail = signal(false);

  // ── Búsqueda y filtros de pedidos ───────────────────────────
  busquedaPedido = signal('');
  filtrEstadoPedido = signal<number | null>(null);
  pedidoSeleccionado = signal<Pedido | null>(null);

  // ── Señas Computadas ──────────────────────────────────────────

  stockPct = computed(() => {
    const p = this.paquete();
    if (!p?.cant_productos) return 0;
    return Math.min(100, Math.round(((p.cant_productos_reservados ?? 0) / p.cant_productos) * 100));
  });

  diasRestantes = computed(() => {
    const fechaFin = this.paquete()?.fecha_fin;
    if (!fechaFin) return 0;
    return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);
  });

  // ── Estado del paquete ───────────────────────────────────────
  esActivo = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'activo');
  esCompleto = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'completo');
  esConfirmado = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'confirmado');
  esEntregado = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'entregado');
  esCancelado = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'cancelado');

  // ── Permisos de acción ───────────────────────────────────────

  puedeNotificar = computed(() => this.esActivo());
  puedeConfirmar = computed(() => this.esCompleto() || this.esActivo());
  puedeEntregar = computed(() => this.esConfirmado());
  puedeMarcarEnCamino = computed(() => this.esConfirmado());
  puedeCancelar = computed(() => !this.esCancelado() && !this.esEntregado());
  puedeDescargar = computed(() => this.esConfirmado() || this.esEntregado());

  montoTotal = computed(() => {
    const p = this.paquete();
    if (!p?.monto_total) return 0;
    return p.monto_total;
  });

  urgenciaColor = computed(() => {
    const dias = this.diasRestantes();
    if (dias <= 0) return 'text-error';
    if (dias <= 3) return 'text-warning';
    if (dias <= 7) return 'text-brand-cta-hover';
    return 'text-text-secondary';
  });

  urgenciaBg = computed(() => {
    const dias = this.diasRestantes();
    if (dias <= 0) return 'bg-error';
    if (dias <= 3) return 'bg-warning';
    if (dias <= 7) return 'bg-brand-cta';
    return 'bg-brand-secondary';
  });

  pedidosFiltrados = computed(() => {
    const pedidos = this.paquete()?.pedidos ?? [];
    const busqueda = this.busquedaPedido().toLowerCase().trim();
    const estadoFiltro = this.filtrEstadoPedido();
    return pedidos.filter(p => {
      const matchBusqueda = !busqueda ||
        (p.usuario?.nombre ?? '').toLowerCase().includes(busqueda) ||
        (p.usuario?.email ?? '').toLowerCase().includes(busqueda) ||
        String(p.id_pedido ?? '').includes(busqueda);
      const matchEstado = estadoFiltro === null || p.estadoId === estadoFiltro;
      return matchBusqueda && matchEstado;
    });
  });

  /** Pedidos En preparación disponibles para marcar en camino */
  pedidosEnPreparacion = computed(() =>
    (this.paquete()?.pedidos ?? []).filter(p => p.estadoId === 4)
  );

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('ID de paquete inválido.');
      this.loading.set(false);
      return;
    }
    this.loadPaquete(id);
  }

  loadPaquete(id: number) {
    this.loading.set(true);
    this.paqueteService.getPaqueteById(id).subscribe({
      next: (data) => {
        this.paquete.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la publicación.');
        this.loading.set(false);
      }
    });
  }

  // ── Modal detalle pedido ──────────────────────────────────────

  abrirDetallePedido(pedido: Pedido) {
    this.pedidoSeleccionado.set(pedido);
  }

  cerrarDetallePedido() {
    this.pedidoSeleccionado.set(null);
  }


  /** Completo (o Activo) → Confirmado */
  confirmarCompra() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    Swal.fire({
      title: '¿Confirmar compra con fabricante?',
      text: `Se confirmará la compra de "${p.paqueteBase?.nombre ?? 'este paquete'}" con el proveedor. Los pedidos pagados pasarán a preparación.`,
      icon: 'question',
      iconColor: '#2E608C',
      showCancelButton: true,
      confirmButtonText: '📧 Confirmar y notificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
    }).then(result => {
      if (result.isConfirmed) {
        this.enviandoMail.set(true);
        this.paqueteService.confirmarCompra(p.id_paquete_publicado!).subscribe({
          next: (res) => {
            this.enviandoMail.set(false);
            this.toast.success(res.message ?? 'Compra confirmada correctamente');
            this.loadPaquete(p.id_paquete_publicado!);
          },
          error: () => {
            this.enviandoMail.set(false);
            this.toast.error('Error al confirmar la compra. Intentá de nuevo.');
          }
        });
      }
    });
  }

  /** Confirmado → Entregado */
  marcarEntregado() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;

    Swal.fire({
      title: '¿Completar pedido?',
       text: `Se marcará "${p.paqueteBase?.nombre ?? 'este paquete'}" como entregado y podrás descargar los reportes.`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, marcar como entregado',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.paqueteService.marcarEntregado(p.id_paquete_publicado!).subscribe({
        next: () => {
          this.toast.success(`"${p.paqueteBase?.nombre}" marcado como entregado`, 'Paquete entregado');
          this.loadPaquete(p.id_paquete_publicado!);
        },
        error: () => this.toast.error('Error al marcar como entregado.', 'Error')
      });
    });
  }

  /** Ir a la vista de Gestión de Envíos */
  irAGestionEnvios() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    this.router.navigate(['/admin/administrar-publicacion', p.id_paquete_publicado, 'envios']);
  }

  cancelarPaquete() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    Swal.fire({
      title: '¿Cancelar y reembolsar?',
      text: 'Esto devolverá el dinero a todos los compradores. La acción es irreversible.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#B92905',
      confirmButtonText: 'SÍ, CANCELAR',
      cancelButtonText: 'No, volver'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.paqueteService.cancelarPaquete(p.id_paquete_publicado!).subscribe({
        next: () => {
          this.toast.success(`"${p.paqueteBase?.nombre}" cancelado`, 'Reembolso procesado');
          this.loadPaquete(p.id_paquete_publicado!);
        },
        error: () => this.toast.error('Error al intentar cancelar el paquete.', 'Error')
      });
    });
  }

  duplicarPaquete() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    this.paqueteService.duplicarPaquete(p.id_paquete_publicado).subscribe({
      next: (nuevoPaquete) => {
        this.toast.info('Duplicación creada. Revisá y completá los datos antes de guardar.', '¡Revisión requerida!');
        this.router.navigate(['/admin/publicar-paquete'], { queryParams: { duplicadoId: nuevoPaquete.id_paquete_publicado } });
      },
      error: () => this.toast.error('Error al duplicar la publicación')
    });
  }

  notificarCompradores() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    Swal.fire({
      title: '¿Enviar notificación a compradores?',
      text: `Se enviará un recordatorio de cierre a todos los compradores activos de "${p.paqueteBase?.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.paqueteService.notificarCompradores(p.id_paquete_publicado!).subscribe({
        next: (res) => this.toast.success(`Notificación enviada a ${res.notificados} comprador/es.`, '¡Aviso enviado!'),
        error: () => this.toast.error('Error al enviar la notificación.', 'Error')
      });
    });
  }



  // ── Reportes CSV ──────────────────────────────────────────────

  descargarParteProveedor() {
    const p = this.paquete();
    if (!p) return;

    // Pedidos Pagados (2), En preparación (4), En camino (5), Recibido (6)
    const pedidosActivos = (p.pedidos ?? []).filter(ped =>
      ped.estadoId !== null && [2, 4, 5, 6].includes(ped.estadoId!)
    );

    const consolidado = new Map<string, { id: number; nombre: string; marca: string; precio: number; cantidad: number; variante: string }>();

    pedidosActivos.forEach(pedido => {
      pedido.pedidoProductos?.forEach(pp => {
        const key = `${pp.productoId}-${pp.variante ?? ''}`;
        const current = consolidado.get(key) || {
          id: pp.productoId,
          nombre: pp.producto?.nombre ?? 'N/A',
          marca: typeof pp.producto?.marca === 'string' ? pp.producto.marca : (pp.producto?.marca?.nombre ?? 'N/A'),
          precio: pp.producto?.precio ?? 0,
          cantidad: 0,
          variante: pp.variante ?? '-'
        };
        current.cantidad += pp.cantidad;
        consolidado.set(key, current);
      });
    });

    let totalGral = 0;
    const itemRows = Array.from(consolidado.values()).map(info => {
      const subtotal = info.precio * info.cantidad;
      totalGral += subtotal;
      return `${info.id};"${this.scrubForCsv(info.nombre)}";"${this.scrubForCsv(info.variante)}";"${this.scrubForCsv(info.marca)}";${info.precio};${info.cantidad};${subtotal}`;
    });

    const now = new Date().toLocaleString('es-AR');
    const rows = [
      'sep=;',
      '# REPORTES MERCADO SINERGICO #',
      '"Tipo";"REPORTE PARA PROVEEDOR"',
      `"Paquete";"${this.scrubForCsv(p.paqueteBase?.nombre)} (ID: ${p.id_paquete_publicado})"`,
      `"Zona";"${this.scrubForCsv(p.zona?.nombre)}"`,
      `"Fecha Generacion";"${now}"`,
      `"Pedidos Involucrados";"${pedidosActivos.length}"`,
      '',
      '"SKU (ID)";"Producto";"Variante/Modelo";"Marca";"Precio Unit.";"Cant. Total";"Subtotal"',
      ...itemRows,
      '',
      `"";"";"";"";"";"TOTAL A FACTURAR";${totalGral}`
    ];

    this.downloadCsv(rows.join('\n'), `PROVEEDOR-${p.paqueteBase?.nombre?.replace(/\s+/g, '_')}.csv`);
    this.toast.success('Reporte de proveedor generado');
  }

  descargarParteLogistica() {
    const p = this.paquete();
    if (!p) return;

    const pedidosActivos = (p.pedidos ?? []).filter(ped =>
      ped.estadoId !== null && [2, 4, 5, 6].includes(ped.estadoId!)
    );
    const now = new Date().toLocaleString('es-AR');
    let totalRecaudado = 0;

    const buyerRows = pedidosActivos.map(ped => {
      const id = ped.id_pedido ?? 'N/A';
      const nombre = this.scrubForCsv(ped.usuario?.nombre);
      const email = this.scrubForCsv(ped.usuario?.email);
      const total = ped.monto_total ?? 0;
      totalRecaudado += total;
      const estado = this.getEstadoPedidoLabel(ped.estadoId);

      const detalle = this.scrubForCsv((ped.pedidoProductos ?? [])
        .map(pp => `${pp.cantidad}x ${pp.producto?.nombre}${pp.variante ? ' (' + pp.variante + ')' : ''}`)
        .join(' | '));

      return `${id};"${nombre}";"${detalle}";"${email}";${total};"${estado}"`;
    });

    const rows: string[] = [
      'sep=;',
      '# REPORTES MERCADO SINERGICO #',
      '"Tipo";"HOJA DE RUTA / LOGISTICA"',
      `"Paquete";"${this.scrubForCsv(p.paqueteBase?.nombre)} (ID: ${p.id_paquete_publicado})"`,
      `"Zona";"${this.scrubForCsv(p.zona?.nombre)}"`,
      `"Fecha Generacion";"${now}"`,
      `"Pedidos Involucrados";"${pedidosActivos.length}"`,
      '',
      '"ID Pedido";"Comprador";"Detalle Productos";"Email";"Total Pedido";"Estado"',
      ...buyerRows,
      '',
      `"";"";"";"";"TOTAL PAGADO RECAUDADO";${totalRecaudado}`
    ];

    if (pedidosActivos.length === 0) {
      rows.push('', '"INFO";"No se registran pedidos involucrados para este paquete aun."');
    }

    this.downloadCsv(rows.join('\n'), `LOGISTICA-${p.paqueteBase?.nombre?.replace(/\s+/g, '_')}.csv`);
    this.toast.success('Reporte de logística generado');
  }

  private downloadCsv(content: string, filename: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private scrubForCsv(v: unknown): string {
    if (v === null || v === undefined) return 'N/A';
    return v.toString()
      .replace(/"/g, '""')
      .replace(/[;\n\r]/g, ' ');
  }

  // ── Helpers ───────────────────────────────────────────────────

  getEstadoClasses(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text';
    switch (estado.nombre?.toLowerCase().trim()) {
      case 'activo': return 'bg-status-active-bg text-status-active-text';
      case 'completo': return 'bg-status-info-bg text-status-info-text';
      case 'confirmado': return 'bg-status-neutral-bg text-brand-secondary';
      case 'entregado': return 'bg-success-light text-success';
      case 'cancelado': return 'bg-error-light text-error';
      default: return 'bg-status-neutral-bg text-status-neutral-text';
    }
  }

  getEstadoPedidoClasses(estadoId?: number): string {
    switch (estadoId) {
      case 1: return 'bg-status-pending-bg text-status-pending-text';   // Pendiente
      case 2: return 'bg-status-active-bg text-status-active-text';     // Pagado
      case 3: return 'bg-status-neutral-bg text-text-secondary';        // Reembolsado
      case 4: return 'bg-brand-primary-light text-brand-secondary border border-brand-primary/30 whitespace-nowrap'; // En preparación
      case 5: return 'bg-brand-primary/20 text-brand-primary-hover border border-brand-primary/30 whitespace-nowrap'; // En camino
      case 6: return 'bg-success-light text-success border border-success/30 whitespace-nowrap'; // Recibido
      default: return 'bg-status-neutral-bg text-status-neutral-text';
    }
  }

  getEstadoPedidoLabel(estadoId?: number): string {
    switch (estadoId) {
      case 1: return 'Pendiente';
      case 2: return 'Pagado';
      case 3: return 'Reembolsado';
      case 4: return 'En preparación';
      case 5: return 'En camino';
      case 6: return 'Recibido';
      default: return 'Desconocido';
    }
  }

  formatFecha(fecha?: Date): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatMonto(monto?: number | null): string {
    if (monto === undefined || monto === null) return 'N/A';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
  }

  getSubtotalProductos(): number {
    const productos = this.pedidoSeleccionado()?.pedidoProductos;
    if (!productos?.length) return 0;
    return productos.reduce((acc, pp) => acc + (pp.producto?.precio || 0) * pp.cantidad, 0);
  }

  volver() {
    this.router.navigate(['/admin/administrar-publicaciones']);
  }

  getEstadoClasesStr(estadoNombre?: string): string {
    switch (estadoNombre?.toLowerCase().trim()) {
      case 'activo': return 'bg-status-active-bg text-status-active-text border-status-active-text/20';
      case 'pendiente': return 'bg-status-pending-bg text-status-pending-text border-status-pending-text/20';
      case 'en preparación': return 'bg-brand-primary-light text-brand-secondary border-focus';
      case 'finalizado': return 'bg-status-active-bg text-secondary border-secondary/20';
      case 'cancelado': return 'bg-error-light text-error border-error-light';
      default: return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
    }
  }
}

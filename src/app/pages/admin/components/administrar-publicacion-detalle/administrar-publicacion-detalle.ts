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
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';
import { ToastService } from '@app/services/toast/toast.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-administrar-publicacion-detalle',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, FormsModule, AdminBackButtonComponent],
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

  // ── Señas Computadas (Optimización de Performance) ──────────

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

  puedeEnviarMail = computed(() => {
    const nombre = this.paquete()?.estado?.nombre?.toLowerCase() ?? '';
    return nombre === 'cerrado' || nombre === 'completo' || nombre === 'en preparación' || nombre === 'finalizado';
  });

  // ── Estado del paquete (para botones condicionales) ──────────
  esActivo = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'activo');
  esPendiente = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'pendiente');
  esEnPreparacion = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'en preparación');
  esFinalizado = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'finalizado');
  esCancelado = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'cancelado');

  puedeEditar = computed(() => this.esActivo() || this.esPendiente());
  puedeCerrar = computed(() => this.esActivo());
  puedeNotificar = computed(() => this.esActivo());
  puedeFinalizar = computed(() => this.esEnPreparacion());
  puedeCancelar = computed(() => !this.esCancelado() && !this.esFinalizado());

  montoTotal = computed(() => {
    const p = this.paquete();
    if (!p?.monto_total) return 0;
    return p.monto_total;
  });

  urgenciaColor = computed(() => {
    const dias = this.diasRestantes();
    if (dias <= 0)  return 'text-error';
    if (dias <= 3)  return 'text-warning';
    if (dias <= 7)  return 'text-brand-cta-hover';
    return 'text-text-secondary';
  });

  urgenciaBg = computed(() => {
    const dias = this.diasRestantes();
    if (dias <= 0)  return 'bg-error';
    if (dias <= 3)  return 'bg-warning';
    if (dias <= 7)  return 'bg-brand-cta';
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

  // ── Acciones de gestión de paquete ──────────────────────────

  editarPublicacion() {
    const id = this.paquete()?.id_paquete_publicado;
    if (!id) return;
    this.router.navigate(['/admin/publicar-paquete'], { queryParams: { id, edit: true } });
  }

  cerrarPaquete() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    const faltan = (p.cant_productos || 0) - (p.cant_usuarios_registrados || 0);
    const avisoFaltantes = faltan > 0
      ? `<p class="text-red-500 font-bold mt-2">⚠️ Atención: Faltan ${faltan} cupos para llenarlo.</p>`
      : '<p class="text-green-600 font-bold mt-2">¡El paquete está lleno!</p>';

    Swal.fire({
      title: '¿Cerrar pedido?',
      html: `<p>Se cerrará <strong>${p.paqueteBase?.nombre}</strong> a nuevos compradores y pasará a <strong>En Preparación</strong>.</p>
             ${avisoFaltantes}
             <p class="text-sm text-gray-500 mt-2">Los compradores recibirán un mail de cierre anticipado.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar pedido',
      confirmButtonColor: '#71A8D9',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.paqueteService.cerrarPaquete(p.id_paquete_publicado!).subscribe({
        next: () => {
          this.toast.success(`"${p.paqueteBase?.nombre}" está en preparación`, 'Pedido cerrado');
          this.loadPaquete(p.id_paquete_publicado!);
        },
        error: () => this.toast.error('Error al intentar cerrar el paquete.', 'Error')
      });
    });
  }

  finalizarPaquete() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    Swal.fire({
      title: '¿Completar pedido?',
      html: `<p>Marcás <strong>${p.paqueteBase?.nombre}</strong> como <strong>Finalizado</strong>.</p>
             <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 text-left">
               <p class="font-bold flex items-center gap-2"><span class="text-xl">✅</span> ¡Paquete lleno!</p>
               <p class="mt-1">Al completar podrás <strong>descargar los partes de logística y de proveedor</strong>.</p>
             </div>
             <p class="text-sm text-gray-500 mt-4">Los compradores y el admin recibirán un mail notificando que se completó.</p>`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar pedido',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.paqueteService.completarPaquete(p.id_paquete_publicado!).subscribe({
        next: () => {
          this.toast.success(`"${p.paqueteBase?.nombre}" finalizado`, 'Paquete completado');
          this.loadPaquete(p.id_paquete_publicado!);
        },
        error: () => this.toast.error('Error al intentar completar el paquete.', 'Error')
      });
    });
  }

  cancelarPaquete() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado) return;
    Swal.fire({
      title: '¿Cancelar y reembolsar?',
      html: '<p><strong>ESTO devolverá el dinero a todos los compradores.</strong></p><p class="text-sm text-gray-500 mt-2">Acción irreversible. Los compradores recibirán el mail de reembolso.</p>',
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
        this.toast.success('Publicación duplicada con éxito');
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
      icon: 'info',
      showCancelButton: true,
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

  // ── Acciones ──────────────────────────────────────────────────

  confirmarYEnviarMail() {
    const p = this.paquete();
    if (!p?.id_paquete_publicado || !this.puedeEnviarMail() || this.enviandoMail()) return;
    const id = p.id_paquete_publicado;

    Swal.fire({
      title: '¿Confirmar compra y notificar?',
      html: `
        <p style="color:#374151; font-size:15px; line-height:1.6;">
          Se enviará un email de confirmación a <strong>todos los compradores</strong> del paquete
          <strong style="color:#2E608C;">${p.paqueteBase?.nombre ?? 'este paquete'}</strong>.
        </p>
        <p style="color:#6b7280; font-size:13px; margin-top:8px;">Esta acción no se puede deshacer.</p>
      `,
      icon: 'question',
      iconColor: '#71A8D9',
      showCancelButton: true,
      confirmButtonText: '📧 Confirmar y enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      customClass: { popup: 'rounded-xl' }
    }).then(result => {
      if (result.isConfirmed) {
        this.enviandoMail.set(true);
        this.paqueteService.confirmarCompra(id).subscribe({
          next: (res) => {
            this.enviandoMail.set(false);
            this.toast.success(res.message ?? 'Emails enviados correctamente');
            this.loadPaquete(id);
          },
          error: () => {
            this.enviandoMail.set(false);
            this.toast.error('Error al confirmar la compra. Intentá de nuevo.');
          }
        });
      }
    });
  }

  descargarParteProveedor() {
    const p = this.paquete();
    if (!p) return;

    // 1. Obtener pedidos aprobados
    const pedidosAprobados = (p.pedidos ?? []).filter(ped => ped.estadoId === 3);
    
    // 2. Mapear productos base para asegurar que todos aparezcan (incluso con 0)
    const consolidado = new Map<string, { id: number, nombre: string, marca: string, precio: number, cantidad: number, variante: string }>();
    
    // Inicializar con productos base del paquete
    p.paqueteBase?.productos?.forEach(pp => {
      const prod = pp.producto;
      if (!prod) return;
      const key = `${prod.id_producto || prod.id}-`; // Sin variante por defecto del base
      consolidado.set(key, {
        id: (prod.id_producto || prod.id) as number,
        nombre: prod.nombre,
        marca: typeof prod.marca === 'string' ? prod.marca : (prod.marca?.nombre ?? 'N/A'),
        precio: prod.precio,
        cantidad: 0,
        variante: '-'
      });
    });

    // Sumar cantidades de pedidos reales
    pedidosAprobados.forEach(pedido => {
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

    // 3. Generar filas (usando ";" para Excel en español)
    let totalGral = 0;
    const scrub = (v: any) => (v ?? '').toString().replace(/[;\n\r]/g, ' ');

    const itemRows = Array.from(consolidado.values()).map(info => {
      const subtotal = info.precio * info.cantidad;
      totalGral += subtotal;
      return `"${info.id}";"${scrub(info.nombre)}";"${scrub(info.variante)}";"${scrub(info.marca)}";"${this.formatMonto(info.precio)}";"${info.cantidad}";"${this.formatMonto(subtotal)}"`;
    });

    // 4. Construir el CSV final
    const now = new Date().toLocaleString('es-AR');
    const rows = [
      'sep=;', // Truco para que Excel sepa que el separador es ";"
      '# REPORTES MERCADO SINERGICO #',
      '"Tipo";"REPORTE PARA PROVEEDOR"',
      `"Paquete";"${p.paqueteBase?.nombre ?? 'N/A'} (ID: ${p.id_paquete_publicado})"`,
      `"Zona";"${p.zona?.nombre ?? 'N/A'}"`,
      `"Fecha Generacion";"${now}"`,
      `"Pedidos Pagados";"${pedidosAprobados.length}"`,
      '',
      '"SKU (ID)";"Producto";"Variante/Modelo";"Marca";"Precio Unit.";"Cant. Total";"Subtotal"',
      ...itemRows,
      '',
      `"";"";"";"";"";"TOTAL A FACTURAR";"${this.formatMonto(totalGral)}"`
    ];

    this.downloadCsv(
      rows.join('\n'),
      `PROVEEDOR-${p.paqueteBase?.nombre?.replace(/\s+/g, '_')}.csv`
    );
    this.toast.success('Reporte de proveedor generado');
  }

  descargarParteLogistica() {
    const p = this.paquete();
    if (!p) return;

    const pedidosAprobados = (p.pedidos ?? []).filter(ped => ped.estadoId === 3);
    const scrub = (v: any) => (v ?? '').toString().replace(/[;\n\r]/g, ' ');

    const now = new Date().toLocaleString('es-AR');
    let totalRecaudado = 0;

    const buyerRows = pedidosAprobados.map(ped => {
      const id = ped.id_pedido ?? 'N/A';
      const nombre = scrub(ped.usuario?.nombre ?? 'N/A');
      const email = scrub(ped.usuario?.email ?? 'N/A');
      const total = ped.monto_total ?? 0;
      totalRecaudado += total;
      const estado = this.getEstadoPedidoLabel(ped.estadoId);
      
      const detalle = scrub((ped.pedidoProductos ?? [])
        .map(pp => `${pp.cantidad}x ${pp.producto?.nombre}${pp.variante ? ' ('+pp.variante+')' : ''}`)
        .join(' | '));

      return `"${id}";"${nombre}";"${detalle}";"${email}";"${this.formatMonto(total)}";"${estado}"`;
    });

    const rows: string[] = [
      'sep=;',
      '# REPORTES MERCADO SINERGICO #',
      '"Tipo";"HOJA DE RUTA / LOGISTICA"',
      `"Paquete";"${p.paqueteBase?.nombre ?? 'N/A'} (ID: ${p.id_paquete_publicado})"`,
      `"Zona";"${p.zona?.nombre ?? 'N/A'}"`,
      `"Fecha Generacion";"${now}"`,
      `"Pedidos Pagados";"${pedidosAprobados.length}"`,
      '',
      '"ID Pedido";"Comprador";"Detalle Productos";"Email";"Total Pedido";"Estado"',
      ...buyerRows,
      '',
      `"";"";"";"";"TOTAL PAGADO RECAUDADO";"${this.formatMonto(totalRecaudado)}"`
    ];

    if (pedidosAprobados.length === 0) {
      rows.push('', '"INFO";"No se registran pedidos pagados para este paquete aun."');
    }

    this.downloadCsv(
      rows.join('\n'),
      `LOGISTICA-${p.paqueteBase?.nombre?.replace(/\s+/g, '_')}.csv`
    );
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

  // ── Helpers ───────────────────────────────────────────────────

  getEstadoClasses(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text';
    switch (estado.nombre?.toLowerCase()) {
      case 'activo':    return 'bg-status-active-bg text-status-active-text';
      case 'pendiente': return 'bg-status-pending-bg text-status-pending-text';
      case 'cerrado':   return 'bg-status-info-bg text-status-info-text';
      case 'completo':  return 'bg-status-active-bg text-status-active-text';
      case 'eliminado': return 'bg-status-closed-bg text-status-closed-text';
      default:          return 'bg-status-neutral-bg text-status-neutral-text';
    }
  }

  getEstadoPedidoClasses(estadoId?: number): string {
    switch (estadoId) {
      case 1: return 'bg-status-pending-bg text-status-pending-text';   // Pendiente
      case 2: return 'bg-status-info-bg text-status-info-text';         // En proceso
      case 3: return 'bg-status-active-bg text-status-active-text';     // Aprobado/Pagado
      case 4: return 'bg-status-closed-bg text-status-closed-text';     // Cancelado
      default: return 'bg-status-neutral-bg text-status-neutral-text';
    }
  }

  getEstadoPedidoLabel(estadoId?: number): string {
    switch (estadoId) {
      case 1: return 'Pendiente';
      case 2: return 'En proceso';
      case 3: return 'Aprobado';
      case 4: return 'Cancelado';
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
      case 'activo':         return 'bg-status-active-bg text-status-active-text border-status-active-text/20';
      case 'pendiente':      return 'bg-status-pending-bg text-status-pending-text border-status-pending-text/20';
      case 'en preparación': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'finalizado':     return 'bg-status-active-bg text-secondary border-secondary/20';
      case 'cancelado':      return 'bg-red-50 text-red-700 border-red-200';
      default:               return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
    }
  }
}

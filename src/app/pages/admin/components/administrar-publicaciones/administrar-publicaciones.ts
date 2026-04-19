import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { ToastService } from '@app/services/toast/toast.service';
import { AdminPaqueteCard } from '@app/shared/admin-paquete-card/admin-paquete-card';
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

@Component({
  selector: 'app-administrar-publicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent, AdminPaqueteCard, AdminBackButtonComponent],
  templateUrl: './administrar-publicaciones.html',
})
export class AdministrarPublicacionesComponent implements OnInit {
  private paqueteService = inject(PaquetePublicadoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  paquetes = signal<PaquetePublicado[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  estadoFiltro = signal<string>('todos');
  highlightedId = signal<number | null>(null);

  readonly estadosFiltro = ['todos', 'activo', 'completo', 'confirmado', 'entregado', 'cancelado'];

  filteredPaquetes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const estado = this.estadoFiltro().toLowerCase();
    return this.paquetes().filter(p => {
      const matchTerm = !term ||
        p.nombre?.toLowerCase().includes(term) ||
        p.paqueteBase?.nombre?.toLowerCase().includes(term) ||
        p.zona?.nombre?.toLowerCase().includes(term);
      const matchEstado = estado === 'todos' ||
        p.estado?.nombre?.toLowerCase().trim() === estado;
      return matchTerm && matchEstado;
    });
  });


  ngOnInit() {
    // queryParamMap emite sincrónicamente al suscribirse (BehaviorSubject)
    // → siempre se ejecuta en ngOnInit antes de la siguiente línea
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('highlight');
      this.highlightedId.set(id ? Number(id) : null);
      // Siempre recarga — tanto la carga inicial como al volver con reload=1
      this.loadPaquetes();
    });
  }


  loadPaquetes() {
    this.loading.set(true);
    this.error.set(null);
    this.paqueteService.getAllPaquetes().subscribe({
      next: (data) => {
        this.paquetes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los paquetes publicados.');
        this.loading.set(false);
      }
    });
  }

  // ── Acciones de la card ────────────────────────────────────────

  cerrarPaquete(paquete: PaquetePublicado) {
    const faltan = (paquete.cant_productos || 0) - (paquete.cant_usuarios_registrados || 0);
    const avisoFaltantes = faltan > 0
      ? `<p class="text-error font-bold mt-2">⚠️ Atención: Faltan ${faltan} cupos para llenarlo.</p>`
      : '<p class="text-success font-bold mt-2">¡El paquete está lleno!</p>';

    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        title: '¿Confirmar compra con fabricante?',
        html: `<p>Confirmás la compra de <strong>${paquete.paqueteBase?.nombre}</strong> con el proveedor.</p>
               <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 text-left">
                 <p class="mt-1">Todos los pedidos <strong>Pagados</strong> pasarán a <strong>En preparación</strong> y los compradores recibirán un email de confirmación.</p>
               </div>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar compra',
        confirmButtonColor: '#2E608C',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (!result.isConfirmed) return;
        this.paqueteService.confirmarCompra(paquete.id_paquete_publicado!).subscribe({
          next: () => {
            this.toast.success(`"${paquete.paqueteBase?.nombre}" confirmado con el fabricante`, 'Compra confirmada');
            this.loadPaquetes();
          },
          error: () => {
            this.toast.error('Error al confirmar la compra.', 'Error');
          }
        });
      });
    });
  }

  /** Activo → Cancelado */
  cancelarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then(({ default: Swal }) => {
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
        this.paqueteService.cancelarPaquete(paquete.id_paquete_publicado!).subscribe({
          next: (updated: PaquetePublicado) => {
            this.toast.success(`"${paquete.paqueteBase?.nombre}" cancelado`, 'Reembolso procesado');
            this._actualizarPaqueteEnLista(updated);
          },
          error: () => {
            this.toast.error('Error al intentar cancelar el paquete.', 'Error');
          }
        });
      });
    });
  }

  /** Duplicar publicación */
  duplicarPaquete(paquete: PaquetePublicado) {
    this.paqueteService.duplicarPaquete(paquete.id_paquete_publicado!).subscribe({
      next: (nuevoPaquete) => {
        this.toast.success('Publicación duplicada con éxito');
        this.router.navigate(['/admin/publicar-paquete'], { queryParams: { duplicadoId: nuevoPaquete.id_paquete_publicado } });
      },
      error: () => this.toast.error('Error al duplicar la publicación')
    });
  }

  /** Notificar Compradores (Acción manual) */
  notificarCompradores(paquete: PaquetePublicado) {
    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        title: '¿Enviar notificación a compradores?',
        text: `Se enviará un recordatorio de cierre a todos los compradores activos de "${paquete.paqueteBase?.nombre}".`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2E608C',
        cancelButtonColor: '#9ca3af',
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (!result.isConfirmed) return;
        this.paqueteService.notificarCompradores(paquete.id_paquete_publicado!).subscribe({
          next: (res) => {
            this.toast.success(
              `Notificación enviada a ${res.notificados} comprador/es.`,
              '¡Aviso enviado!'
            );
          },
          error: () => this.toast.error('Error al enviar la notificación.', 'Error')
        });
      });
    });
  }
  verDetalle(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/administrar-publicacion', paquete.id_paquete_publicado]);
  }

  // ── Helpers de estilo ──────────────────────────────────────────

  getEstadoClasses(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
    switch (estado.nombre?.toLowerCase().trim()) {
      case 'activo': return 'bg-status-active-bg text-status-active-text border-status-active-text/20';
      case 'pendiente': return 'bg-status-pending-bg text-status-pending-text border-status-pending-text/20';
      case 'en preparación': return 'bg-brand-primary-light text-brand-secondary border-focus';
      case 'finalizado': return 'bg-status-active-bg text-secondary border-secondary/20';
      case 'cancelado': return 'bg-error-light text-error border-error-light';
      case 'eliminado': return 'bg-status-closed-bg text-status-closed-text border-transparent';
      default: return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
    }
  }

  isHighlighted(paquete: PaquetePublicado): boolean {
    return this.highlightedId() !== null && paquete.id_paquete_publicado === this.highlightedId();
  }

  getStockPct(p: PaquetePublicado): number {
    if (!p.cant_productos) return 0;
    return Math.min(100, Math.round(((p.cant_productos_reservados ?? 0) / p.cant_productos) * 100));
  }

  getStockBarColor(pct: number): string {
    if (pct >= 100) return 'bg-success';
    if (pct >= 75) return 'bg-brand-primary';
    if (pct >= 50) return 'bg-brand-cta';
    return 'bg-border-default';
  }

  getDiasRestantes(fechaFin?: Date): number {
    if (!fechaFin) return 0;
    return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86400000);
  }

  formatFecha(fecha?: Date): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  setEstadoFiltro(estado: string) {
    this.estadoFiltro.set(estado);
  }

  volver() {
    this.router.navigate(['/admin/perfil']);
  }

  // ── Helpers internos ──────────────────────────────────────────

  private _actualizarPaqueteEnLista(updated: PaquetePublicado) {
    this.paquetes.update(lista =>
      lista.map(p => p.id_paquete_publicado === updated.id_paquete_publicado ? updated : p)
    );
  }

  private _mockearEstado(paquete: PaquetePublicado, nuevoEstado: string) {
    this.paquetes.update(lista =>
      lista.map(p => p.id_paquete_publicado === paquete.id_paquete_publicado
        ? { ...p, estado: { ...p.estado, nombre: nuevoEstado, id_estado: p.estado?.id_estado ?? 0 } }
        : p
      )
    );
  }
}

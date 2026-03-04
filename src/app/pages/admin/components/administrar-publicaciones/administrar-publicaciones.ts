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

@Component({
  selector: 'app-administrar-publicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent, AdminPaqueteCard],
  templateUrl: './administrar-publicaciones.html',
})
export class AdministrarPublicacionesComponent implements OnInit {
  private paqueteService = inject(PaquetePublicadoService);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private toast        = inject(ToastService);

  paquetes       = signal<PaquetePublicado[]>([]);
  loading        = signal(true);
  error          = signal<string | null>(null);
  searchTerm     = signal('');
  estadoFiltro   = signal<string>('todos');
  highlightedId  = signal<number | null>(null);

  readonly estadosFiltro = ['todos', 'activo', 'pendiente', 'en preparación', 'finalizado', 'cancelado'];

  filteredPaquetes = computed(() => {
    const term   = this.searchTerm().toLowerCase().trim();
    const estado = this.estadoFiltro().toLowerCase();
    return this.paquetes().filter(p => {
      const matchTerm   = !term ||
        p.paqueteBase?.nombre?.toLowerCase().includes(term) ||
        p.zona?.nombre?.toLowerCase().includes(term);
      const matchEstado = estado === 'todos' ||
        p.estado?.nombre?.toLowerCase().trim() === estado;
      return matchTerm && matchEstado;
    });
  });

  ngOnInit() {
    // Leer el queryParam de highlight
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('highlight');
      this.highlightedId.set(id ? Number(id) : null);
    });
    this.loadPaquetes();
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

  /** Activo → En Preparación (cierre del pedido) */
  cerrarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        title: '¿Cerrar pedido?',
        html: `<p>Se cerrará <strong>${paquete.paqueteBase?.nombre}</strong> a nuevos compradores y pasará a <strong>En Preparación</strong>.</p><p class="text-sm text-gray-500 mt-2">Los compradores recibirán un mail de confirmación (simulado).</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar pedido',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (!result.isConfirmed) return;
        this.paqueteService.cerrarPaquete(paquete.id_paquete_publicado!).subscribe({
          next: (updated) => {
            this.toast.success(`"${paquete.paqueteBase?.nombre}" está en preparación`, 'Pedido cerrado');
            // Actualizar en señal localmente si el back devuelve el paquete actualizado
            this._actualizarPaqueteEnLista(updated);
          },
          error: () => {
            // Mockear cambio de estado localmente si el endpoint no existe aún
            this._mockearEstado(paquete, 'En Preparación');
            this.toast.info(`Estado actualizado a "En Preparación" (simulado)`, 'Cerrar pedido');
          }
        });
      });
    });
  }

  /** En Preparación → Finalizado */
  finalizarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then(({ default: Swal }) => {
      Swal.fire({
        title: '¿Confirmar despacho?',
        html: `<p>Marcás <strong>${paquete.paqueteBase?.nombre}</strong> como <strong>Finalizado</strong>.</p><p class="text-sm text-gray-500 mt-2">Los compradores recibirán el mail de despacho (simulado).</p>`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar despacho',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (!result.isConfirmed) return;
        this.paqueteService.completarPaquete(paquete.id_paquete_publicado!).subscribe({
          next: (updated) => {
            this.toast.success(`"${paquete.paqueteBase?.nombre}" finalizado`, 'Paquete despachado');
            this._actualizarPaqueteEnLista(updated);
          },
          error: () => {
            this._mockearEstado(paquete, 'Finalizado');
            this.toast.info(`Estado actualizado a "Finalizado" (simulado)`, 'Despacho confirmado');
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
        html: `<p><strong>ESTO devolverá el dinero a todos los compradores.</strong></p><p class="text-sm text-gray-500 mt-2">Acción irreversible. Los compradores recibirán el mail de reembolso (simulado).</p>`,
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        confirmButtonText: 'SÍ, CANCELAR',
        cancelButtonText: 'No, volver'
      }).then(result => {
        if (!result.isConfirmed) return;
        this.paqueteService.cancelarPaquete(paquete.id_paquete_publicado!).subscribe({
          next: (updated) => {
            this.toast.success(`"${paquete.paqueteBase?.nombre}" cancelado`, 'Reembolso procesado');
            this._actualizarPaqueteEnLista(updated);
          },
          error: () => {
            this._mockearEstado(paquete, 'Cancelado');
            this.toast.info(`Estado actualizado a "Cancelado" (simulado)`, 'Reembolso');
          }
        });
      });
    });
  }

  /** Duplicar publicación */
  duplicarPaquete(paquete: PaquetePublicado) {
    this.paqueteService.duplicarPaquete(paquete.id_paquete_publicado!).subscribe({
      next: () => {
        this.toast.success('Publicación duplicada con éxito');
        this.loadPaquetes();
      },
      error: () => this.toast.error('Error al duplicar la publicación')
    });
  }

  verDetalle(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/administrar-publicacion', paquete.id_paquete_publicado]);
  }

  // ── Helpers de estilo ──────────────────────────────────────────

  getEstadoClasses(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
    switch (estado.nombre?.toLowerCase().trim()) {
      case 'activo':          return 'bg-status-active-bg text-status-active-text border-status-active-text/20';
      case 'pendiente':       return 'bg-status-pending-bg text-status-pending-text border-status-pending-text/20';
      case 'en preparación':  return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'finalizado':      return 'bg-status-active-bg text-secondary border-secondary/20';
      case 'cancelado':       return 'bg-red-50 text-red-700 border-red-200';
      case 'eliminado':       return 'bg-status-closed-bg text-status-closed-text border-transparent';
      default:                return 'bg-status-neutral-bg text-status-neutral-text border-transparent';
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
    if (pct >= 75)  return 'bg-brand-primary';
    if (pct >= 50)  return 'bg-brand-cta';
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

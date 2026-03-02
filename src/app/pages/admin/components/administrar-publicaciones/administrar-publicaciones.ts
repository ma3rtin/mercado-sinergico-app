import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { ToastService } from '@app/services/toast/toast.service';

@Component({
  selector: 'app-administrar-publicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent],
  templateUrl: './administrar-publicaciones.html',
})
export class AdministrarPublicacionesComponent implements OnInit {
  private paqueteService = inject(PaquetePublicadoService);
  private router = inject(Router);
  private toast = inject(ToastService);

  paquetes = signal<PaquetePublicado[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  estadoFiltro = signal<string>('todos');

  filteredPaquetes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const estado = this.estadoFiltro();
    return this.paquetes().filter(p => {
      const matchTerm = !term ||
        p.paqueteBase?.nombre?.toLowerCase().includes(term) ||
        p.zona?.nombre?.toLowerCase().includes(term);
      const matchEstado = estado === 'todos' || p.estado?.nombre?.toLowerCase() === estado;
      return matchTerm && matchEstado;
    });
  });

  ngOnInit() {
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

  verDetalle(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/administrar-publicacion', paquete.id_paquete_publicado]);
  }

  // ── Helpers de estilo ──────────────────────────────────────────

  getEstadoClasses(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-status-neutral-bg text-status-neutral-text';
    switch (estado.nombre?.toLowerCase()) {
      case 'activo':   return 'bg-status-active-bg text-status-active-text';
      case 'pendiente': return 'bg-status-pending-bg text-status-pending-text';
      case 'cerrado':  return 'bg-status-info-bg text-status-info-text';
      case 'completo': return 'bg-status-active-bg text-status-active-text'; // O usar uno diferente si preferís
      case 'eliminado': return 'bg-status-closed-bg text-status-closed-text';
      default:         return 'bg-status-neutral-bg text-status-neutral-text';
    }
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
}

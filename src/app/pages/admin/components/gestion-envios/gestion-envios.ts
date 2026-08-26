import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { ToastService } from '@app/services/toast/toast.service';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { LoaderComponent } from '@app/shared/loader/loader';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

@Component({
  selector: 'app-gestion-envios',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent, BackButtonComponent, PaginationComponent, LoaderComponent, LoadingOverlay],
  templateUrl: './gestion-envios.html',
})
export class GestionEnviosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paqueteService = inject(PaquetePublicadoService);
  private toast = inject(ToastService);

  // ── Estado principal ──────────────────────────────────────
  paquete = signal<PaquetePublicado | null>(null);
  loading = signal(true);
  enviando = signal(false);
  error = signal<string | null>(null);

  // ── Búsqueda ──────────────────────────────────────────────
  busqueda = signal('');

  // ── Selección ─────────────────────────────────────────────
  /** IDs de pedidos seleccionados para marcar en camino */
  seleccionados = signal<Set<number>>(new Set());

  // ── Paginación ────────────────────────────────────────────
  currentPage = signal(1);
  itemsPerPage = signal(10);

  // ── ID del paquete desde la ruta ──────────────────────────
  paqueteId = signal<number>(0);

  // ── Computed ──────────────────────────────────────────────

  /** Pedidos con estadoId === 4 (En preparación) */
  pedidosEnPreparacion = computed(() =>
    (this.paquete()?.pedidos ?? []).filter(p => p.estadoId === 4)
  );

  /** Pedidos en preparación filtrados por búsqueda */
  pedidosFiltrados = computed(() => {
    const busq = this.busqueda().toLowerCase().trim();
    return this.pedidosEnPreparacion().filter(p => {
      if (!busq) return true;
      return (
        (p.usuario?.nombre ?? '').toLowerCase().includes(busq) ||
        (p.usuario?.email ?? '').toLowerCase().includes(busq) ||
        String(p.id_pedido ?? '').includes(busq)
      );
    });
  });

  paginatedPedidos = computed(() => {
    const all = this.pedidosFiltrados();
    const page = this.currentPage();
    const limit = this.itemsPerPage();
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  });

  cantidadSeleccionados = computed(() => this.seleccionados().size);

  /** True si todos los pedidos filtrados están seleccionados */
  todosSeleccionados = computed(() => {
    const filtrados = this.paginatedPedidos();
    if (filtrados.length === 0) return false;
    return filtrados.every(p => this.seleccionados().has(p.id_pedido!));
  });

  /** True si hay al menos uno pero no todos (para estado indeterminate) */
  algunoSeleccionado = computed(() => {
    const filtrados = this.paginatedPedidos();
    const sel = this.seleccionados();
    return filtrados.some(p => sel.has(p.id_pedido!)) && !this.todosSeleccionados();
  });

  constructor() {
    effect(() => {
      this.busqueda();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  // ── Lifecycle ────────────────────────────────────────────
  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('ID de paquete inválido.');
      this.loading.set(false);
      return;
    }
    this.paqueteId.set(id);
    this.cargarPaquete(id);
  }

  cargarPaquete(id: number) {
    this.loading.set(true);
    this.paqueteService.getPaqueteById(id).subscribe({
      next: (data) => {
        this.paquete.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el paquete.');
        this.loading.set(false);
      }
    });
  }

  // ── Selección ────────────────────────────────────────────

  togglePedido(pedidoId: number) {
    this.seleccionados.update(set => {
      const nuevo = new Set(set);
      nuevo.has(pedidoId) ? nuevo.delete(pedidoId) : nuevo.add(pedidoId);
      return nuevo;
    });
  }

  estaSeleccionado(pedidoId: number): boolean {
    return this.seleccionados().has(pedidoId);
  }

  /**
   * Selecciona/deselecciona todos los pedidos actualmente filtrados.
   * Si todos están seleccionados, los deselecciona. De lo contrario, selecciona todos.
   */
  toggleTodos() {
    const filtrados = this.paginatedPedidos();
    if (this.todosSeleccionados()) {
      // Deseleccionar solo los filtrados
      this.seleccionados.update(set => {
        const nuevo = new Set(set);
        filtrados.forEach(p => nuevo.delete(p.id_pedido!));
        return nuevo;
      });
    } else {
      // Seleccionar todos los filtrados
      this.seleccionados.update(set => {
        const nuevo = new Set(set);
        filtrados.forEach(p => nuevo.add(p.id_pedido!));
        return nuevo;
      });
    }
  }

  seleccionarTodos() {
    const ids = this.pedidosFiltrados().map(p => p.id_pedido!);
    this.seleccionados.set(new Set(ids));
  }

  limpiarSeleccion() {
    this.seleccionados.set(new Set());
  }

  // ── Acción principal ─────────────────────────────────────

  marcarEnCamino() {
    const id = this.paqueteId();
    if (!id || this.enviando()) return;

    const ids = Array.from(this.seleccionados());
    if (ids.length === 0) {
      this.toast.error('Seleccioná al menos un pedido para marcar en camino.');
      return;
    }

    this.enviando.set(true);
    this.paqueteService.marcarEnCamino(id, ids).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.toast.success(`${res.notificados} comprador/es notificado/s`, 'Pedidos en camino');
        this.seleccionados.set(new Set());
        this.cargarPaquete(id);
      },
      error: () => {
        this.enviando.set(false);
        this.toast.error('Error al marcar pedidos en camino.', 'Error');
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  formatMonto(monto?: number | null): string {
    if (monto === undefined || monto === null) return 'N/A';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(monto);
  }
}

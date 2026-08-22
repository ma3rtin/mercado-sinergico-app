import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { ToastService } from '@app/services/toast/toast.service';
import { AdminPaqueteCard } from '@app/shared/admin-paquete-card/admin-paquete-card';
import { shareReplay } from 'rxjs/operators';

const ITEMS_POR_PAGINA = 5;

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, IconComponent, AdminPaqueteCard],
  templateUrl: './perfil-admin.html',
  styleUrl: './perfil-admin.css',
})
export class PerfilAdmin implements OnInit {
  // 🔧 Servicios
  private paquetePublicadoService = inject(PaquetePublicadoService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  // 📌 Referencia a la sección de finalizados para scroll
  @ViewChild('seccionFinalizados') seccionFinalizados?: ElementRef<HTMLElement>;

  // 📊 Señales — Perfil
  usuario = signal<Usuario | null>(null);

  // 📊 Señales — Sección 1: Completos (requieren atención)
  paquetesCompletos = signal<PaquetePublicado[]>([]);
  loadingCompletos = signal(true);
  errorCompletos = signal<string | null>(null);

  // 📊 Señales — Sección 2: Finalizados (Recibido + Cancelado)
  paquetesFinalizados = signal<PaquetePublicado[]>([]);
  loadingFinalizados = signal(true);
  errorFinalizados = signal<string | null>(null);
  paginaActualFinalizados = signal(1);

  // 📐 Computed — Paginación de finalizados
  readonly totalPaginasFinalizados = computed(() =>
    Math.ceil(this.paquetesFinalizados().length / ITEMS_POR_PAGINA)
  );

  readonly paquetesFinalizadosPaginados = computed(() => {
    const pagina = this.paginaActualFinalizados();
    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    return this.paquetesFinalizados().slice(inicio, inicio + ITEMS_POR_PAGINA);
  });

  readonly mostrarPaginacion = computed(() =>
    this.paquetesFinalizados().length > ITEMS_POR_PAGINA
  );

  readonly paginasArray = computed(() =>
    Array.from({ length: this.totalPaginasFinalizados() }, (_, i) => i + 1)
  );

  // ─────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.loadPerfil();
    this.loadPaquetesCompletos();
    this.loadPaquetesFinalizados();
  }

  // ─────────────────────────────────────────────────────────────
  // Carga de datos
  // ─────────────────────────────────────────────────────────────

  loadPerfil() {
    this.usuarioService.getPerfil().subscribe({
      next: (usuario) => this.usuario.set(usuario),
      error: (err) => console.error('Error al cargar perfil:', err),
    });
  }

  loadPaquetesCompletos() {
    this.loadingCompletos.set(true);
    this.errorCompletos.set(null);

    // Reutiliza el mismo observable (shareReplay evita doble request si se llama junto a loadPaquetesFinalizados)
    const todos$ = this.paquetePublicadoService.getAllPaquetes().pipe(shareReplay(1));

    todos$.subscribe({
      next: (paquetes) => {
        const completos = paquetes.filter(p => {
          const nombre = p.estado?.nombre?.toLowerCase();
          return (nombre === 'completo' || nombre === 'confirmado') && !p.archivado;
        });
        this.paquetesCompletos.set(completos);
        this.loadingCompletos.set(false);
      },
      error: (err) => {
        console.error('Error al cargar paquetes completos:', err);
        this.errorCompletos.set('No se pudieron cargar los paquetes que requieren atención.');
        this.loadingCompletos.set(false);
      },
    });
  }

  loadPaquetesFinalizados() {
    this.loadingFinalizados.set(true);
    this.errorFinalizados.set(null);
    this.paginaActualFinalizados.set(1);

    this.paquetePublicadoService.getAllPaquetes().subscribe({
      next: (paquetes) => {
        const finalizados = paquetes.filter(p => {
          const nombre = p.estado?.nombre?.toLowerCase();
          return (nombre === 'recibido' || nombre === 'cancelado') && !p.archivado;
        });
        this.paquetesFinalizados.set(finalizados);
        this.loadingFinalizados.set(false);
      },
      error: (err) => {
        console.error('Error al cargar paquetes finalizados:', err);
        this.errorFinalizados.set('No se pudieron cargar los paquetes finalizados.');
        this.loadingFinalizados.set(false);
      },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Paginación
  // ─────────────────────────────────────────────────────────────

  cambiarPagina(pagina: number) {
    const total = this.totalPaginasFinalizados();
    if (pagina < 1 || pagina > total) return;
    this.paginaActualFinalizados.set(pagina);
    this.seccionFinalizados?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers de estado para items finalizados
  // ─────────────────────────────────────────────────────────────

  esRecibido(paquete: PaquetePublicado): boolean {
    return paquete.estado?.nombre?.toLowerCase() === 'recibido';
  }

  esCancelado(paquete: PaquetePublicado): boolean {
    return paquete.estado?.nombre?.toLowerCase() === 'cancelado';
  }

  getBadgeClaseEstado(paquete: PaquetePublicado): string {
    if (this.esRecibido(paquete)) return 'bg-green-100 text-green-700';
    if (this.esCancelado(paquete)) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  }

  // ─────────────────────────────────────────────────────────────
  // Exportaciones Excel
  // ─────────────────────────────────────────────────────────────

  descargarPlanillaFabrica(id: number | undefined) {
    if (!id) return;
    this.paquetePublicadoService.exportarFabrica(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_proveedor_${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastService.error('Error al descargar el reporte del proveedor.'),
    });
  }

  descargarPlanillaLogistica(id: number | undefined) {
    if (!id) return;
    this.paquetePublicadoService.exportarLogistica(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hoja_de_ruta_${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastService.error('Error al descargar la hoja de ruta.'),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers de formato
  // ─────────────────────────────────────────────────────────────

  formatearFecha(fecha?: Date | string): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Acciones de la AdminPaqueteCard
  // ─────────────────────────────────────────────────────────────

  confirmarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '¿Confirmar compra?',
        text: `Se confirmará la compra de "${paquete.paqueteBase?.nombre}" al fabricante.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          this.paquetePublicadoService.confirmarCompra(paquete.id_paquete_publicado!).subscribe({
            next: () => {
              this.toastService.success('Compra confirmada con éxito');
              this.loadPaquetesCompletos();
              this.loadPaquetesFinalizados();
            },
            error: () => this.toastService.error('Error al confirmar la compra'),
          });
        }
      });
    });
  }

  reembolsarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '¿Cancelar y Reembolsar?',
        text: 'ESTO DEVOLVERÁ EL DINERO A TODOS LOS USUARIOS. Acción irreversible.',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: 'var(--error)',
        confirmButtonText: 'SÍ, REEMBOLSAR',
        cancelButtonText: 'No, volver',
      }).then((result) => {
        if (result.isConfirmed) {
          this.paquetePublicadoService.cancelarPaquete(paquete.id_paquete_publicado!).subscribe({
            next: () => {
              this.toastService.success('Paquete cancelado y reembolsos procesados');
              this.loadPaquetesCompletos();
              this.loadPaquetesFinalizados();
            },
            error: () => this.toastService.error('Error al procesar el reembolso'),
          });
        }
      });
    });
  }

  duplicarPaquete(paquete: PaquetePublicado) {
    this.paquetePublicadoService.duplicarPaquete(paquete.id_paquete_publicado!).subscribe({
      next: (nuevoPaquete) => {
        this.toastService.info('Duplicación creada. Revisá y completá los datos antes de guardar.', '¡Revisión requerida!');
        this.router.navigate(['/admin/publicar-paquete'], { queryParams: { duplicadoId: nuevoPaquete.id_paquete_publicado } });
      },
      error: () => this.toastService.error('Error al duplicar la publicación'),
    });
  }

  archivarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '¿Archivar paquete?',
        text: `El paquete "${paquete.paqueteBase?.nombre || paquete.nombre}" se ocultará de esta lista.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, archivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'var(--brand-secondary)',
      }).then((result) => {
        if (result.isConfirmed) {
          this.paquetePublicadoService.archivarPaquete(paquete.id_paquete_publicado!, true).subscribe({
            next: () => {
              this.toastService.success('Paquete archivado con éxito');
              this.loadPaquetesFinalizados();
            },
            error: () => this.toastService.error('Error al archivar el paquete'),
          });
        }
      });
    });
  }

  navigateToPublicacionDetalle(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/administrar-publicacion', paquete.id_paquete_publicado]);
  }

  // ─────────────────────────────────────────────────────────────
  // Navegaciones
  // ─────────────────────────────────────────────────────────────

  navigateToAdminProducts() { this.router.navigate(['/admin/administrar-productos']); }
  navigateToAdminPackages() { this.router.navigate(['/admin/administrar-paquetes']); }
  navigateToAdminPublicaciones() { this.router.navigate(['/admin/administrar-publicaciones']); }
  navigateToAdminTemplates() { this.router.navigate(['/admin/administrar-plantillas']); }
  navigateToAdminPostPackages() { this.router.navigate(['/admin/publicar-paquete']); }
  crearProducto() { this.router.navigate(['/admin/crear-producto']); }
  crearPaquete() { this.router.navigate(['/admin/crear-paquete']); }
  navigateToImportarProductos() { this.router.navigate(['/admin/importar-productos']); }
}

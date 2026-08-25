import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Models
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';

// Services
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { ToastService } from '@app/services/toast/toast.service';

// Shared Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { PaginationComponent } from '@app/shared/paginacion/paginacion';
import { TipoBadgeComponent } from '@app/tipo-badge/tipo-badge';
import { LoaderComponent } from '@app/shared/loader/loader';

@Component({
  selector: 'app-administrar-paquetes',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    IconComponent,
    BackButtonComponent,
    PaginationComponent,
    TipoBadgeComponent,
    LoaderComponent,
  ],
  templateUrl: './administrar-paquetes.html',
})
export class AdministrarPaquetesComponent implements OnInit {
  private baseService = inject(PaqueteBaseService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // States
  paquetesBase = signal<PaqueteBase[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);
  currentPage = signal(1);
  itemsPerPage = signal(10);
  mostrarArchivados = signal(false);

  // Computed
  filteredBase = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.paquetesBase().filter(p =>
      (p.nombre ?? '').toLowerCase().includes(term) ||
      (p.descripcion ?? '').toLowerCase().includes(term)
    );
  });

  paginatedBase = computed(() => {
    const all = this.filteredBase();
    const page = this.currentPage();
    const limit = this.itemsPerPage();
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  });

  constructor() {
    effect(() => {
      this.mostrarArchivados();
      this.loadData();
    }, { allowSignalWrites: true });

    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  ngOnInit(): void {
    // La carga inicial la realiza el efecto del constructor al evaluar mostrarArchivados()
  }

  loadData(): void {
    this.isLoading.set(true);
    this.baseService.getPaquetes(this.mostrarArchivados()).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => this.paquetesBase.set(data),
      error: () => this.toast.error('Error al cargar paquetes base')
    });
  }

  // --- Acciones Paquete Base ---

  crearPaqueteBase(): void {
    this.router.navigate(['/admin/crear-paquete']);
  }

  editarPaqueteBase(paquete: PaqueteBase): void {
    this.router.navigate(['/admin/editar-paquete-base', paquete.id_paquete_base]);
  }

  duplicarPaqueteBase(paquete: PaqueteBase): void {
    Swal.fire({
      title: '¿Duplicar molde?',
      text: `Se creará una copia de "${paquete.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return this.baseService.duplicarPaquete(paquete.id_paquete_base!).toPromise()
          .then(() => true)
          .catch(() => {
            Swal.showValidationMessage('Error al duplicar el molde');
            return false;
          });
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.toast.success('Molde duplicado con éxito');
        this.loadData();
      }
    });
  }

  archivarPaqueteBase(paquete: PaqueteBase): void {
    const nuevoEstado = !paquete.archivado;
    const accion = nuevoEstado ? 'archivar' : 'desarchivar';
    Swal.fire({
      title: `¿${nuevoEstado ? 'Archivar' : 'Desarchivar'} paquete base?`,
      text: `Se cambiará el estado de "${paquete.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? 'Archivar' : 'Desarchivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#9ca3af',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return this.baseService.archivarPaquete(paquete.id_paquete_base!, nuevoEstado).toPromise()
          .then(() => true)
          .catch(() => {
            Swal.showValidationMessage(`No se pudo ${accion} el paquete base`);
            return false;
          });
      }
    }).then(result => {
      if (result.isConfirmed) {
        this.toast.success(`Paquete base ${nuevoEstado ? 'archivado' : 'desarchivado'} correctamente`);
        this.loadData();
      }
    });
  }

  publicarPaquete(paquete: PaqueteBase): void {
    this.router.navigate(['/admin/publicar-paquete'], { queryParams: { baseId: paquete.id_paquete_base } });
  }

  volverAlPerfil(): void {
    this.router.navigate(['/admin/perfil']);
  }

  // --- Helpers ---
  getImagenUrl(paquete: PaqueteBase | undefined): string {
    if (!paquete) return '/assets/placeholder.png';
    return paquete.imagen_url || '/assets/placeholder.png';
  }
}

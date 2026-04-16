import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { AdminBackButtonComponent } from '@app/shared/admin-back-button/admin-back-button';

@Component({
  selector: 'app-administrar-paquetes',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, AdminBackButtonComponent],
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

  // Computed
  filteredBase = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.paquetesBase().filter(p =>
      (p.nombre ?? '').toLowerCase().includes(term) ||
      (p.descripcion ?? '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.baseService.getPaquetes().pipe(
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
    this.baseService.duplicarPaquete(paquete.id_paquete_base!).subscribe({
      next: () => {
        this.toast.success('Molde duplicado con éxito');
        this.loadData();
      },
      error: () => this.toast.error('Error al duplicar el molde')
    });
  }

  eliminarPaqueteBase(paquete: PaqueteBase): void {
    Swal.fire({
      title: '¿Eliminar paquete base?',
      text: `Se eliminará "${paquete.nombre}" y sus asociaciones.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B92905',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.baseService.deletePaquete(paquete.id_paquete_base!).subscribe({
          next: () => {
            this.toast.success('Paquete eliminado');
            this.loadData();
          },
          error: () => this.toast.error('Error al eliminar. Verificá si tiene publicaciones activas.')
        });
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

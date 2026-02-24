import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Models
import { PaqueteBase } from '@app/models/PaquetesInterfaces/PaqueteBase';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Services
import { PaqueteBaseService } from '@app/services/paquete/paquete-base.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { ToastService } from '@app/services/toast/toast.service';

// Shared Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';

import { AdminPaqueteCard } from '@app/shared/admin-paquete-card/admin-paquete-card';

@Component({
  selector: 'app-administrar-paquetes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, IconComponent, AdminPaqueteCard],
  templateUrl: './administrar-paquetes.html',
})
export class AdministrarPaquetesComponent implements OnInit {
  private baseService = inject(PaqueteBaseService);
  private publicadoService = inject(PaquetePublicadoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // States
  activeTab = signal<'base' | 'publicado'>('base');
  paquetesBase = signal<PaqueteBase[]>([]);
  paquetesPublicados = signal<PaquetePublicado[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);

  // Computed
  filteredBase = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.paquetesBase().filter(p => 
      p.nombre.toLowerCase().includes(term) || 
      p.descripcion.toLowerCase().includes(term)
    );
  });

  filteredPublicados = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.paquetesPublicados().filter(p => 
      p.paqueteBase?.nombre.toLowerCase().includes(term) || 
      p.zona?.nombre.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    // Carga paralela simplificada
    this.baseService.getPaquetes().pipe(
      finalize(() => {
        if (this.activeTab() === 'base') this.isLoading.set(false);
      })
    ).subscribe({
      next: (data) => this.paquetesBase.set(data),
      error: () => this.toast.error('Error al cargar paquetes base')
    });

    this.publicadoService.getPaquetes().pipe(
      finalize(() => {
        if (this.activeTab() === 'publicado') this.isLoading.set(false);
      })
    ).subscribe({
      next: (data) => this.paquetesPublicados.set(data),
      error: () => this.toast.error('Error al cargar paquetes publicados')
    });
  }

  setTab(tab: 'base' | 'publicado'): void {
    this.activeTab.set(tab);
  }

  // --- Acciones Paquete Base ---

  crearPaqueteBase(): void {
    this.router.navigate(['/admin/crear-paquete']);
  }

  editarPaqueteBase(paquete: PaqueteBase): void {
    console.log('✏️ Navegando a edición de paquete base:', paquete.id_paquete_base);
    this.router.navigate(['/admin/editar-paquete-base', paquete.id_paquete_base]);
  }

  duplicarPaqueteBase(paquete: PaqueteBase): void {
    // INFO: Endpoint aún no disponible en el backend
    this.toast.warning('La duplicación de paquetes base requiere actualización del backend. Consultar backend_requirements.md');
  }

  eliminarPaqueteBase(paquete: PaqueteBase): void {
    console.log('🗑️ Intentando eliminar paquete base:', paquete);
    Swal.fire({
      title: '¿Eliminar paquete base?',
      text: `Se eliminará "${paquete.nombre}" y sus asociaciones.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53935',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.baseService.deletePaquete(paquete.id_paquete_base!).subscribe({
          next: () => {
            console.log('✅ Paquete base eliminado con éxito');
            this.toast.success('Paquete eliminado');
            this.loadData();
          },
          error: (err) => {
            console.error('❌ Error al eliminar paquete base:', err);
            this.toast.error('Error al eliminar paquete. Verifique si tiene publicaciones activas.');
          }
        });
      }
    });
  }

  publicarPaquete(paquete: PaqueteBase): void {
    this.router.navigate(['/admin/publicar-paquete'], { queryParams: { baseId: paquete.id_paquete_base } });
  }

  // --- Acciones Paquete Publicado ---

  editarPublicacion(paquete: PaquetePublicado): void {
    this.toast.info('Edición de publicación disponible próximamente');
  }

  duplicarPublicacion(paquete: PaquetePublicado): void {
    this.toast.warning('Duplicación de publicación requiere actualización del backend.');
  }

  eliminarPublicacion(paquete: PaquetePublicado): void {
    console.log('🗑️ Intentando eliminar publicación:', paquete);
    Swal.fire({
      title: '¿Eliminar publicación?',
      text: 'Esta acción cancelará la disponibilidad en esta zona.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E53935',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.publicadoService.deletePaquete(paquete.id_paquete_publicado!).subscribe({
          next: () => {
            console.log('✅ Publicación eliminada con éxito');
            this.toast.success('Publicación eliminada');
            this.loadData();
          },
          error: (err) => {
            console.error('❌ Error al eliminar publicación:', err);
            this.toast.error('Error al eliminar. Verifique si hay pedidos activos.');
          }
        });
      }
    });
  }

  finalizarExitoso(paquete: PaquetePublicado): void {
    this.toast.warning('El cierre exitoso manual requiere actualización del backend.');
  }

  cancelarYReembolsar(paquete: PaquetePublicado): void {
    console.log('🚨 Acción: Cancelar y Reembolsar para paquete:', paquete);
    Swal.fire({
      title: '¿Cancelar y Reembolsar?',
      text: 'ESTO DEVOLVERÁ EL DINERO A TODOS LOS USUARIOS. Acción irreversible.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#E53935',
      confirmButtonText: 'SÍ, CANCELAR Y REEMBOLSAR',
      cancelButtonText: 'No, volver'
    }).then(result => {
      if (result.isConfirmed) {
        this.toast.warning('Lógica de reembolso pendiente de implementación en backend.');
      }
    });
  }

  notificarCierre(paquete: PaquetePublicado): void {
    console.log('🔔 Notificando cierre (Admin Gestión):', paquete.paqueteBase?.nombre);
  }

  volverAlPerfil(): void {
    this.router.navigate(['/admin/perfil']);
  }

  // --- Helpers ---
  getImagenUrl(paquete: PaqueteBase | PaquetePublicado | undefined): string {
    if (!paquete) return '/assets/placeholder.png';
    const base = (paquete as PaquetePublicado).paqueteBase || (paquete as PaqueteBase);
    return base.imagen_url || '/assets/placeholder.png';
  }

  formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString();
  }
}

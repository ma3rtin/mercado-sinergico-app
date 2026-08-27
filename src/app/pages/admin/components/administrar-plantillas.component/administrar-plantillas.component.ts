import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import Swal from 'sweetalert2';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { ToastService } from '@app/services/toast/toast.service';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { LoaderComponent } from '@app/shared/loader/loader';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

@Component({
  selector: 'app-administrar-plantillas',
  templateUrl: './administrar-plantillas.component.html',
  styleUrls: ['./administrar-plantillas.component.css'],
  imports: [CrearPlantillaModalComponent, ButtonComponent, IconComponent, BackButtonComponent, LoaderComponent, LoadingOverlay],
})
export class AdministrarPlantillasComponent implements OnInit {
  plantillas = signal<Plantilla[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal('');
  sortOrder = signal<'asc' | 'desc'>('asc');
  isCreateModalOpen = signal(false);
  plantillaToEdit = signal<Plantilla | undefined>(undefined);
  isProcesando = signal(false);
  overlayTitulo = signal('Procesando...');
  overlayMensajes = signal<string[]>([]);

  private plantillaService = inject(PlantillaService);
  private toast = inject(ToastService);

  filteredPlantillas = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const order = this.sortOrder();
    const all = this.plantillas();

    let filtered = all.filter(p => p.nombre.toLowerCase().includes(term));

    filtered = filtered.sort((a, b) =>
      order === 'asc'
        ? a.nombre.localeCompare(b.nombre)
        : b.nombre.localeCompare(a.nombre)
    );

    return filtered;
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.plantillaService.getPlantillas().subscribe({
      next: (plantillas) => {
        this.plantillas.set(plantillas);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando plantillas:', err);
        this.loading.set(false);
      },
    });
  }

  // ==========================
  // 🔹 MODALES
  // ==========================
  openCreateModal(): void {
    this.plantillaToEdit.set(undefined);
    this.isCreateModalOpen.set(true);
  }

  openEditModal(plantilla: Plantilla): void {
    this.plantillaToEdit.set(plantilla);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  // ==========================
  // 🔹 CRUD
  // ==========================
  onPlantillaCreated(plantilla: Plantilla): void {
    const editing = this.plantillaToEdit();

    if (editing) {
      this.plantillas.update(prev =>
        prev.map(p => (p.id === plantilla.id ? plantilla : p))
      );
    } else {
      this.plantillas.update(prev => [...prev, plantilla]);
    }

    this.plantillaToEdit.set(undefined);
    this.closeCreateModal();
  }

  duplicatePlantilla(plantilla: Plantilla): void {
    Swal.fire({
      title: '¿Duplicar plantilla?',
      text: `Se creará una copia de "${plantilla.nombre}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2E608C'
    }).then((result) => {
      if (result.isConfirmed) {
        this.overlayTitulo.set('Duplicando plantilla...');
        this.overlayMensajes.set(['Copiando estructura...', 'Guardando plantilla...']);
        this.isProcesando.set(true);

        const copia: Plantilla = {
          ...plantilla,
          id: undefined,
          nombre: `${plantilla.nombre} (Copia)`,
        };

        this.plantillaService.crearPlantilla(copia).subscribe({
          next: (response) => {
            this.plantillas.update(prev => [...prev, response]);
            this.toast.success('Plantilla duplicada correctamente');
          },
          error: (error) => {
            console.error('Error duplicando plantilla:', error);
            this.toast.error('No se pudo duplicar la plantilla');
          }
        }).add(() => this.isProcesando.set(false));
      }
    });
  }

  deletePlantilla(plantilla: Plantilla): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la plantilla "${plantilla.nombre}". Nota: Si la plantilla tiene productos asociados, la eliminación fallará.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2E608C',
      cancelButtonColor: '#B92905',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.overlayTitulo.set('Eliminando plantilla...');
        this.overlayMensajes.set(['Eliminando plantilla...']);
        this.isProcesando.set(true);

        this.plantillaService.eliminarPlantilla(plantilla.id ?? 0).subscribe({
          next: () => {
            this.plantillas.update(prev =>
              prev.filter(p => p.id !== plantilla.id)
            );
            this.toast.success('Plantilla eliminada correctamente');
          },
          error: (err) => {
            console.error('Error eliminando plantilla:', err);
            const message = err.error?.message || 'No se pudo eliminar la plantilla';
            if (err.status === 409) {
              this.toast.warning(message);
            } else {
              this.toast.error(message);
            }
          },
        }).add(() => this.isProcesando.set(false));
      }
    });
  }
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';

@Component({
  selector: 'app-administrar-plantillas',
  templateUrl: './administrar-plantillas.component.html',
  styleUrls: ['./administrar-plantillas.component.css'],
  imports: [CrearPlantillaModalComponent, ButtonComponent],
})
export class AdministrarPlantillasComponent implements OnInit {
  // ✅ signals
  plantillas = signal<Plantilla[]>([]);
  searchTerm = signal('');
  sortOrder = signal<'asc' | 'desc'>('asc');
  isCreateModalOpen = signal(false);
  plantillaToEdit = signal<Plantilla | undefined>(undefined);

  private plantillaService = inject(PlantillaService);
  private toastr = inject(ToastrService);

  // ✅ computed: filtra y ordena automáticamente
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
    this.plantillaService.getPlantillas().subscribe({
      next: (plantillas) => this.plantillas.set(plantillas),
      error: (err) => console.error('❌ Error cargando plantillas:', err),
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
      this.toastr.success('Plantilla actualizada correctamente');
    } else {
      this.plantillas.update(prev => [...prev, plantilla]);
      this.toastr.success('Plantilla creada correctamente');
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
      confirmButtonColor: '#71A8D9'
    }).then((result) => {
      if (result.isConfirmed) {
        const copia: Plantilla = {
          ...plantilla,
          id: undefined,
          nombre: `${plantilla.nombre} (Copia)`,
        };

        this.plantillaService.crearPlantilla(copia).subscribe({
          next: (response) => {
            this.plantillas.update(prev => [...prev, response]);
            this.toastr.success('Plantilla duplicada correctamente');
          },
          error: (error) => {
            console.error('Error duplicando plantilla:', error);
            this.toastr.error('No se pudo duplicar la plantilla');
          }
        });
      }
    });
  }

  deletePlantilla(plantilla: Plantilla): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la plantilla "${plantilla.nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#71A8D9',
      cancelButtonColor: 'rgba(170, 58, 58, 1)',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.plantillaService.eliminarPlantilla(plantilla.id ?? 0).subscribe({
          next: () => {
            this.plantillas.update(prev =>
              prev.filter(p => p.id !== plantilla.id)
            );
            this.toastr.success('Plantilla eliminada correctamente');
          },
          error: (err) => {
            console.error('Error eliminando plantilla:', err);
            this.toastr.error('No se pudo eliminar la plantilla');
          },
        });
      }
    });
  }
}

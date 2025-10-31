import { Component, inject, OnInit } from '@angular/core';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { CrearPlantillaModalComponent } from '@app/components/crear-plantilla-modal.component/crear-plantilla';
import { FormsModule } from '@angular/forms';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
@Component({
  selector: 'app-administrar-plantillas',
  templateUrl: './administrar-plantillas.component.html',
  styleUrls: ['./administrar-plantillas.component.css'],
  imports: [CrearPlantillaModalComponent, FormsModule, ButtonComponent]
})
export class AdministrarPlantillasComponent implements OnInit {
  plantillas: Plantilla[] = [];
  filteredPlantillas: Plantilla[] = [];
  searchTerm: string = '';
  sortOrder: string = 'asc';
  isCreateModalOpen: boolean = false;
  plantillaService: PlantillaService = new PlantillaService;
  private toastr = inject(ToastrService);
  constructor() { }

  ngOnInit(): void {
    this.plantillaService.getPlantillas().subscribe(plantillas => {
      this.plantillas = plantillas;
      this.filteredPlantillas = [...this.plantillas];
    });
  }

  onSearch(): void {
    this.filteredPlantillas = this.plantillas.filter(plantilla =>
      plantilla.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onSort(): void {
    this.filteredPlantillas.sort((a, b) => {
      if (this.sortOrder === 'asc') {
        return a.nombre.localeCompare(b.nombre);
      } else {
        return b.nombre.localeCompare(a.nombre);
      }
    });
  }

  openCreateModal(): void {
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
  }

plantillaToEdit?: Plantilla;

openEditModal(plantilla: Plantilla): void {
  setTimeout(() => {
    this.plantillaToEdit = plantilla;
    this.isCreateModalOpen = true;
  });
}

onPlantillaCreated(plantilla: Plantilla): void {
  if (this.plantillaToEdit) {
    // fue edición
    const index = this.plantillas.findIndex(p => p.id === plantilla.id);
    if (index !== -1) {
      this.plantillas[index] = plantilla;
      this.filteredPlantillas[index] = plantilla;
    }
  } else {
    // fue creación
    this.plantillas.push(plantilla);
    this.filteredPlantillas = [...this.plantillas];
  }

  this.plantillaToEdit = undefined;
  this.closeCreateModal();
}


  duplicatePlantilla(plantilla: Plantilla): void {
    // Implementar duplicación
    this.plantillaService.crearPlantilla(plantilla).subscribe(createdPlantilla => {
      this.plantillas.push(createdPlantilla);
      this.filteredPlantillas.push(createdPlantilla);
    });
  }

  deletePlantilla(plantilla: Plantilla): void {
    // Implementar eliminación
  Swal.fire({
    title: '¿Estás seguro?',
    text: `Se eliminará la plantilla "${plantilla.nombre}"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#71A8D9',
    cancelButtonColor: 'rgba(170, 58, 58, 1)',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      this.plantillaService.eliminarPlantilla(plantilla.id ?? 0).subscribe(() => {
        this.toastr.success('Plantilla eliminada correctamente');
        this.plantillas = this.plantillas.filter(p => p.id !== plantilla.id);
        this.filteredPlantillas = this.filteredPlantillas.filter(p => p.id !== plantilla.id);
      });
    }
  });
}

}
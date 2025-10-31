import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, inject, Inject, DOCUMENT } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Caracteristica } from '@app/models/PlantillaInterfaces/Caracteristica';
import { Opcion } from '@app/models/PlantillaInterfaces/Opcion';
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { ToastrService } from 'ngx-toastr';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';


@Component({
  selector: 'app-crear-plantilla-modal',
  templateUrl: './crear-plantilla-modal.component.html',
  imports: [FormsModule, ButtonComponent],
  standalone: true,
})
export class CrearPlantillaModalComponent implements OnInit, OnChanges, OnDestroy {

  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() plantillaCreated = new EventEmitter<Plantilla>();
  @Input() plantillaToEdit?: Plantilla;
  isEditMode: boolean = false;
  private toastr = inject(ToastrService);

  plantilla: Plantilla = {
    nombre: '',
    caracteristicas: [
      {
        nombre: '',
        opciones: [{ nombre: '' }]
      }
    ]
  };

  maxOptions = 10;
  maxCaracteristicas = 10;

  // En el constructor, agregá:
  constructor(
    private plantillaService: PlantillaService,
    @Inject(DOCUMENT) private document: Document,
    private router: Router // 
  ) { }

  ngOnInit(): void {

  }

  ngOnChanges() {
    if (this.isOpen) {
      this.document.body.classList.add('overflow-hidden');
      if (this.plantillaToEdit) {
        this.isEditMode = true;
        this.plantilla = JSON.parse(JSON.stringify(this.plantillaToEdit)); // clonar para no mutar
      } else {
        this.isEditMode = false;
        this.resetForm();
      }
    } else {
      // si se cierra (click backdrop o cambio de isOpen desde padre),
      // resetear estado para evitar quedarse en editMode
      this.document.body.classList.remove('overflow-hidden');
      this.isEditMode = false;
      this.plantillaToEdit = undefined;
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('overflow-hidden');
  }

  closeModal(): void {
    // Verificar si hay cambios en el formulario
    const hasChanges = this.plantilla.nombre.trim() !== '' ||
      this.plantilla.caracteristicas.length > 0;

    if (hasChanges) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Perderás todos los cambios no guardados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#71A8D9',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetForm();
          this.close.emit();
        }
      });
    } else {
      this.resetForm();
      this.close.emit();
    }
  }

  resetForm(): void {
    this.plantilla = {
      nombre: '',
      caracteristicas: []
    };
  }

  addCaracteristica(): void {
    if (!this.canAddMoreCaracteristicas()) return;

    this.plantilla.caracteristicas.push({
      nombre: '',
      opciones: [{ nombre: '' }]
    } as Caracteristica);
  }

  removeCaracteristica(index: number): void {
    this.plantilla.caracteristicas.splice(index, 1);
  }


  addOption(caracIndex: number): void {
    const caracteristica = this.plantilla.caracteristicas[caracIndex];
    if (caracteristica.opciones.length < this.maxOptions) {
      caracteristica.opciones.push({ nombre: '' } as Opcion);
    }
  }

  removeOption(caracIndex: number, opcionIndex: number): void {
    this.plantilla.caracteristicas[caracIndex].opciones.splice(opcionIndex, 1);
  }

  guardarPlantilla(): void {
    if (this.plantilla.nombre.trim() === '') {
      this.toastr.error('Por favor ingresa el nombre de la plantilla');
      return;
    }

    if (this.plantilla.caracteristicas.length === 0) {
      this.toastr.warning('Por favor agrega al menos una característica');
      return;
    }

    for (const caracteristica of this.plantilla.caracteristicas) {
      if (caracteristica.nombre.trim() === '') {
        this.toastr.warning('Por favor ingresa el nombre de la característica 🚨');
        return;
      }
      const existingCharacteristic = this.plantilla.caracteristicas.find(
        (c) => c.nombre.trim() === caracteristica.nombre.trim()
      );
      if (existingCharacteristic && existingCharacteristic !== caracteristica) {
        this.toastr.warning(`La característica ${caracteristica.nombre} ya existe`);
        return;
      }

      if (
        caracteristica.opciones.length === 0 ||
        caracteristica.opciones.some(opcion => opcion.nombre.trim() === '')
      ) {
        this.toastr.warning(//emoji warning
          `Por favor ingresa el nombre de las opciones de la característica: ${caracteristica.nombre || '(sin nombre)' + '🚨'}`
        );
        return;
      }
      for (const opcion of caracteristica.opciones) {
        const existingOption = caracteristica.opciones.find(
          (o) => o.nombre.trim() === opcion.nombre.trim()
        );
        if (existingOption && existingOption !== opcion) {
          this.toastr.warning(`La opcion ${opcion.nombre} ya existe`);
          return;
        }
        //Validar que haya al menos 2 opciones por caracteristica
        if (caracteristica.opciones.length < 2) {
          this.toastr.warning(
            `Por favor ingresa al menos 2 opciones de la característica: ${caracteristica.nombre || '(sin nombre)' + '🚨'}`
          );
          return;
        }
      }
    }

    // Crear o actualizar
    if (this.isEditMode && this.plantilla.id) {
      this.plantillaService.actualizarPlantilla(this.plantilla).subscribe({
        next: (actualizada) => {
          this.plantillaCreated.emit(actualizada);
          this.toastr.success(`Plantilla ${this.plantilla.nombre} actualizada exitosamente`);
          this.closeModal();
        },
        error: (err) => console.error('Error al actualizar plantilla:', err)
      });
    } else {
      this.plantillaService.crearPlantilla(this.plantilla).subscribe({
        next: (nueva) => {
          this.plantillaCreated.emit(nueva);
          this.toastr.success(`Plantilla ${this.plantilla.nombre} creada exitosamente` + '🎉');
          this.closeModal();
        },
        error: (err) => console.error('Error al crear plantilla:', err)
      });
    }
  }


  canAddMoreCaracteristicas(): boolean {
    return this.plantilla.caracteristicas.length < this.maxCaracteristicas;
  }
  cancelarYVolver(): void {
    const hasChanges = this.plantilla.nombre.trim() !== '' ||
      this.plantilla.caracteristicas.length > 0;

    if (hasChanges) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Perderás todos los cambios no guardados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#71A8D9',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.resetForm();
          this.close.emit();
        }
      });
    } else {
      this.resetForm();
      this.close.emit();
    }
  }
}

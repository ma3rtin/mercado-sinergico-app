import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, inject, Inject, DOCUMENT, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Models
import { Plantilla } from '@app/models/PlantillaInterfaces/Plantilla';
import { Caracteristica } from '@app/models/PlantillaInterfaces/Caracteristica';
import { Opcion } from '@app/models/PlantillaInterfaces/Opcion';

// Services
import { PlantillaService } from '@app/services/plantilla/plantilla.service';
import { ToastService } from '@app/services/toast/toast.service'; // ✅ NUEVO

// Components
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

@Component({
  selector: 'app-crear-plantilla-modal',
  templateUrl: './crear-plantilla-modal.component.html',
  imports: [FormsModule, ButtonComponent, LoadingOverlay],
  standalone: true,
})
export class CrearPlantillaModalComponent implements OnInit, OnChanges, OnDestroy {

  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() plantillaCreated = new EventEmitter<Plantilla>();
  @Input() plantillaToEdit?: Plantilla;

  isEditMode: boolean = false;
  private toast = inject(ToastService); // ✅ CAMBIADO

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
  isGuardando = signal(false);
  overlayTitulo = signal('Guardando...');

  constructor(
    private plantillaService: PlantillaService,
    @Inject(DOCUMENT) private document: Document,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Inicialización si es necesaria
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
      // Si se cierra, resetear estado
      this.document.body.classList.remove('overflow-hidden');
      this.isEditMode = false;
      this.plantillaToEdit = undefined;
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('overflow-hidden');
  }

  closeModal(force: boolean = false): void {
    if (force) {
      this.resetForm();
      this.close.emit();
      return;
    }

    // Verificar si hay cambios en el formulario
    const hasChanges = this.plantilla.nombre.trim() !== '' ||
      this.plantilla.caracteristicas.length > 0;

    if (hasChanges) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Perderás todos los cambios no guardados',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2E608C',
        cancelButtonColor: '#B92905',
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
    // ✅ Validación: Nombre de plantilla
    if (this.plantilla.nombre.trim() === '') {
      this.toast.error('Por favor ingresa el nombre de la plantilla');
      return;
    }

    // ✅ Validación: Al menos una característica
    if (this.plantilla.caracteristicas.length === 0) {
      this.toast.warning('Por favor agrega al menos una característica');
      return;
    }

    // ✅ Validar cada característica
    for (const caracteristica of this.plantilla.caracteristicas) {
      // Nombre de característica vacío
      if (caracteristica.nombre.trim() === '') {
        this.toast.warning('Por favor ingresa el nombre de la característica 🚨');
        return;
      }

      // Característica duplicada
      const existingCharacteristic = this.plantilla.caracteristicas.find(
        (c) => c.nombre.trim() === caracteristica.nombre.trim()
      );
      if (existingCharacteristic && existingCharacteristic !== caracteristica) {
        this.toast.warning(`La característica "${caracteristica.nombre}" ya existe`);
        return;
      }

      const opcionesValidas = caracteristica.opciones.filter(o => o.nombre.trim() !== '');

      // Opciones vacías
      if (opcionesValidas.length === 0) {
        this.toast.warning(
          `Por favor ingresa el nombre de las opciones de la característica: ${caracteristica.nombre || '(sin nombre)'} 🚨`
        );
        return;
      }

      // Al menos 2 opciones por característica
      if (opcionesValidas.length < 2) {
        this.toast.warning(
          `Por favor ingresa al menos 2 opciones para: ${caracteristica.nombre || '(sin nombre)'} 🚨`
        );
        return;
      }

      // Opciones duplicadas
      for (const opcion of opcionesValidas) {
        const existingOption = opcionesValidas.find(
          (o) => o !== opcion && o.nombre.trim().toLowerCase() === opcion.nombre.trim().toLowerCase()
        );
        if (existingOption) {
          this.toast.warning(`La opción "${opcion.nombre}" ya existe en ${caracteristica.nombre}`);
          return;
        }
      }
    }

    // Prepare payload filtering empty options
    const plantillaFinal: Plantilla = {
      ...this.plantilla,
      caracteristicas: this.plantilla.caracteristicas.map(c => ({
        ...c,
        opciones: c.opciones.filter(o => o.nombre.trim() !== '')
      }))
    };

    // ✅ Crear o actualizar con loading
    if (this.isEditMode && plantillaFinal.id) {
      this.overlayTitulo.set('Actualizando plantilla...');
      this.isGuardando.set(true);

      this.plantillaService.actualizarPlantilla(plantillaFinal).subscribe({
        next: (actualizada) => {
          this.isGuardando.set(false);
          this.toast.success(`Plantilla "${plantillaFinal.nombre}" actualizada exitosamente 🎉`);
          this.plantillaCreated.emit(actualizada);
          this.closeModal(true);
        },
        error: (err) => {
          this.isGuardando.set(false);
          console.error('Error al actualizar plantilla:', err);
          this.toast.error('Error al actualizar la plantilla. Intenta nuevamente.');
        }
      });
    } else {
      this.overlayTitulo.set('Creando plantilla...');
      this.isGuardando.set(true);

      this.plantillaService.crearPlantilla(plantillaFinal).subscribe({
        next: (nueva) => {
          this.isGuardando.set(false);
          this.toast.success(`Plantilla "${plantillaFinal.nombre}" creada exitosamente 🎉`);
          this.plantillaCreated.emit(nueva);
          this.closeModal(true);
        },
        error: (err) => {
          this.isGuardando.set(false);
          console.error('Error al crear plantilla:', err);

          // Manejo de error más específico
          if (err.status === 409) {
            this.toast.error('Ya existe una plantilla con ese nombre');
          } else {
            this.toast.error('Error al crear la plantilla. Intenta nuevamente.');
          }
        }
      });
    }
  }

  canAddMoreCaracteristicas(): boolean {
    return this.plantilla.caracteristicas.length < this.maxCaracteristicas;
  }

  cancelarYVolver(): void {
    this.closeModal();
  }
}

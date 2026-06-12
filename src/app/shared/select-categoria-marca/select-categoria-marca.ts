import { Component, input, output, computed, signal, inject, forwardRef, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '@app/shared/icono/icono';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { ToastService } from '@app/services/toast/toast.service';
import Swal from 'sweetalert2';

export interface SelectOption {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-select-categoria-marca',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ButtonComponent],
  templateUrl: './select-categoria-marca.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectCategoriaMarca),
      multi: true
    }
  ]
})
export class SelectCategoriaMarca implements ControlValueAccessor {
  private toast = inject(ToastService);

  options = input.required<SelectOption[]>();
  label = input<string>('');
  placeholderCreate = input<string>('Nuevo...');
  loading = input<boolean>(false);
  hasError = input<boolean>(false);
  allowDeselect = input<boolean>(true);

  createRequest = output<string>();
  editRequest = output<{ id: number; nombre: string }>();

  searchTerm = signal('');
  newName = signal('');
  editingId = signal<number | null>(null);
  editingName = signal('');
  selectedValue = signal<number | null>(null);
  isDisabled = signal(false);
  isEditLoading = signal(false);

  // Nombre normalizado enviado al backend. Permite verificar que el close
  // corresponde a la edición que está en vuelo, no a una ajena.
  private pendingEditName = signal<string | null>(null);
  private pendingCreateName = signal('');

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.options();
    if (!term) return all;
    return all.filter(opt => opt.nombre.toLowerCase().includes(term));
  });

  searchPlaceholder = computed(() => {
    const lbl = this.label().toLowerCase().trim();
    return lbl ? `Buscar ${lbl}...` : 'Buscar...';
  });

  onChange: (value: number | null) => void = () => {};
  onTouched: () => void = () => {};

  constructor() {
    // Detecta creación exitosa cuando la opción pendiente aparece en la lista.
    // Solo limpia newName si todavía contiene el nombre pendiente; si el usuario
    // ya escribió algo nuevo, lo preserva.
    effect(() => {
      const opts = this.options();
      const pending = this.pendingCreateName();
      if (pending && opts.some(o => o.nombre.toLowerCase() === pending.toLowerCase())) {
        untracked(() => {
          this.pendingCreateName.set('');
          if (this.newName().trim().toLowerCase() === pending.toLowerCase()) {
            this.newName.set('');
            this.searchTerm.set('');
          }
        });
      }
    });
  }

  // ─── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: number | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ─── Selección ─────────────────────────────────────────────────────────────

  select(id: number): void {
    if (this.isDisabled()) return;
    if (!this.allowDeselect() && this.selectedValue() === id) return;
    const newVal = this.selectedValue() === id ? null : id;
    this.selectedValue.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

  // ─── Creación inline ───────────────────────────────────────────────────────

  handleCreate(): void {
    const name = this.newName().trim();
    if (!name) return;

    const exists = this.options().some(
      opt => opt.nombre.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      this.toast.warning(`"${name}" ya existe en la lista.`, 'Opción duplicada');
      return;
    }

    this.pendingCreateName.set(name);
    this.createRequest.emit(name);
    // newName se limpia por el effect solo si el backend confirma el alta
  }

  // ─── Edición inline ────────────────────────────────────────────────────────

  startEdit(option: SelectOption, event: Event): void {
    event.stopPropagation();
    this.editingId.set(option.id);
    this.editingName.set(option.nombre);
  }

  cancelEdit(event?: Event): void {
    event?.stopPropagation();
    this.isEditLoading.set(false);
    this.pendingEditName.set(null);
    this.editingId.set(null);
    this.editingName.set('');
  }

  confirmEdit(event?: Event): void {
    event?.stopPropagation();
    const newName = this.editingName().trim();
    const id = this.editingId();

    if (!id || !newName) {
      this.cancelEdit();
      return;
    }

    const original = this.options().find(o => o.id === id);
    if (original?.nombre === newName) {
      this.cancelEdit();
      return;
    }

    const exists = this.options().some(
      opt => opt.id !== id && opt.nombre.toLowerCase() === newName.toLowerCase()
    );

    if (exists) {
      this.toast.warning(`"${newName}" ya existe en la lista.`, 'Nombre duplicado');
      return;
    }

    Swal.fire({
      title: '¿Confirmar edición?',
      text: `Esta acción modificará el nombre de "${original?.nombre}" a "${newName}" en TODOS los productos que utilicen esta opción.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--brand-secondary)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Guarda el nombre enviado (normalizado) para que el padre pueda
        // verificar el resultado antes de llamar a finishEditSuccess/Error.
        this.pendingEditName.set(newName.trim().toLowerCase());
        this.isEditLoading.set(true);
        this.editRequest.emit({ id, nombre: newName });
      }
    });
  }

  /**
   * El padre lo llama desde `next()` pasando el nombre devuelto por el backend.
   * Solo cierra edición si ese nombre coincide con el que fue enviado (pendingEditName).
   * Si no coincide, apaga el spinner pero deja el modo edición abierto para reintentar.
   */
  finishEditSuccess(updatedName: string): void {
    const normalized = updatedName.trim().toLowerCase();
    if (normalized === this.pendingEditName()) {
      this.isEditLoading.set(false);
      this.pendingEditName.set(null);
      this.editingId.set(null);
      this.editingName.set('');
    } else {
      this.isEditLoading.set(false);
      // nombre inesperado: spinner apagado, edición permanece abierta
    }
  }

  /**
   * El padre lo llama desde `error()` cuando el PUT falla.
   * Apaga el spinner pero preserva el modo edición y el texto para reintentar.
   */
  finishEditError(): void {
    this.isEditLoading.set(false);
    this.pendingEditName.set(null);
    // editingId y editingName se mantienen para que el usuario pueda reintentar
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmEdit();
    if (event.key === 'Escape') this.cancelEdit();
  }
}

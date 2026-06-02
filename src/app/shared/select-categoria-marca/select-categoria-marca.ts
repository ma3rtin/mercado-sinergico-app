import { Component, input, Output, EventEmitter, computed, signal, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../icono/icono';
import { ButtonComponent } from '../botones/buttonComponent';
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
  loadingEdit = input<boolean>(false);

  @Output() createRequest = new EventEmitter<string>();
  @Output() editRequest = new EventEmitter<{ id: number; nombre: string }>();

  searchTerm = signal('');
  newName = signal('');
  editingId = signal<number | null>(null);
  editingName = signal('');
  selectedValue = signal<number | null>(null);
  isDisabled = signal(false);

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.options();
    if (!term) return all;
    return all.filter(opt => opt.nombre.toLowerCase().includes(term));
  });

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: number | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  select(id: number): void {
    if (this.isDisabled()) return;
    const newVal = this.selectedValue() === id ? null : id;
    this.selectedValue.set(newVal);
    this.onChange(newVal);
    this.onTouched();
  }

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

    this.createRequest.emit(name);
    this.newName.set('');
    this.searchTerm.set('');
  }

  startEdit(option: SelectOption, event: Event): void {
    event.stopPropagation();
    this.editingId.set(option.id);
    this.editingName.set(option.nombre);
  }

  cancelEdit(event?: Event): void {
    event?.stopPropagation();
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
        this.editRequest.emit({ id, nombre: newName });
        this.editingId.set(null);
        this.editingName.set('');
      }
    });
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.confirmEdit();
    if (event.key === 'Escape') this.cancelEdit();
  }
}
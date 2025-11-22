import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  signal,
  computed,
  DestroyRef,
  inject,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NgControl
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  templateUrl: './select-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor {
  // 🧩 Inyecciones
  private destroyRef = inject(DestroyRef);
  public ngControl = inject(NgControl, { optional: true, self: true });

  // 🎨 Configuración visual - Signals
  label = signal<string>('');
  placeholder = signal<string>('Seleccionar...');
  helperText = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  size = signal<SelectSize>('md');

  // 🔧 Configuración funcional - Signals
  selectId = signal<string>(`select-${Math.random().toString(36).substr(2, 9)}`);
  required = signal<boolean>(false);
  multiple = signal<boolean>(false);
  searchable = signal<boolean>(false);
  clearable = signal<boolean>(false);

  // 📋 Opciones - Signals
  options = signal<SelectOption[]>([]);
  groups = signal<SelectGroup[]>([]);

  // 🎯 Búsqueda
  searchTerm = signal<string>('');
  showDropdown = signal<boolean>(false);

  // ♿ Accesibilidad
  ariaLabel = signal<string>('');

  // 🎭 Estados internos
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  isFocused = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // 📤 Eventos
  @Output() valueChange = new EventEmitter<any>();
  @Output() onBlur = new EventEmitter<FocusEvent>();
  @Output() onFocus = new EventEmitter<FocusEvent>();
  @Output() searchChange = new EventEmitter<string>();

  // 🧠 Control interno
  internalValue: any = null;

  // Control de formulario
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  // 🎨 Computed Signals
  hasGroups = computed(() => this.groups().length > 0);

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const opts = this.options();

    if (!term) return opts;

    return opts.filter(opt =>
      opt.label.toLowerCase().includes(term) ||
      opt.value?.toString().toLowerCase().includes(term)
    );
  });

  filteredGroups = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const grps = this.groups();

    if (!term) return grps;

    return grps.map(group => ({
      ...group,
      options: group.options.filter(opt =>
        opt.label.toLowerCase().includes(term) ||
        opt.value?.toString().toLowerCase().includes(term)
      )
    })).filter(group => group.options.length > 0);
  });

  selectedLabel = computed(() => {
    const value = this.internalValue;
    if (value === null || value === undefined || value === '') {
      return this.placeholder();
    }

    // Multi-select
    if (this.multiple() && Array.isArray(value)) {
      if (value.length === 0) return this.placeholder();
      if (value.length === 1) {
        const opt = this.findOptionByValue(value[0]);
        return opt?.label || value[0];
      }
      return `${value.length} seleccionados`;
    }

    // Single select
    const option = this.findOptionByValue(value);
    return option?.label || value?.toString() || this.placeholder();
  });

  currentError = computed(() => {
    if (!this.isTouched() || !this.ngControl?.control) {
      return '';
    }

    const control = this.ngControl.control;

    if (this.errorMessage()) {
      return this.errorMessage();
    }

    if (control.invalid && control.touched) {
      const errors = control.errors;
      if (!errors) return '';

      if (errors['required']) return `${this.label() || 'Este campo'} es requerido`;
    }

    return '';
  });

  hasError = computed(() => !!this.currentError());

  hasHelperOrError = computed(() => {
    return !!(this.helperText() || this.currentError() || this.successMessage());
  });

  selectClasses = computed(() => {
    const base = 'w-full border-2 rounded-lg font-body focus:outline-none transition-all cursor-pointer';

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    const state = this.currentError()
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : this.successMessage()
      ? 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200'
      : this.isFocused()
      ? 'border-secondary focus:ring-2 focus:ring-secondary/20'
      : 'border-gray-300 hover:border-gray-400';

    const disabledClass = this.isDisabled()
      ? 'bg-gray-100 cursor-not-allowed opacity-60'
      : 'bg-white';

    return `${base} ${sizes[this.size()]} ${state} ${disabledClass}`;
  });

  labelSizeClass = computed(() => ({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[this.size()]));

  dropdownClasses = computed(() => {
    return this.showDropdown()
      ? 'opacity-100 translate-y-0 pointer-events-auto'
      : 'opacity-0 -translate-y-2 pointer-events-none';
  });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Cerrar dropdown al hacer click fuera
    if (typeof document !== 'undefined') {
      effect(() => {
        if (this.showDropdown()) {
          const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const selectElement = document.getElementById(this.selectId());
            if (selectElement && !selectElement.contains(target)) {
              this.closeDropdown();
            }
          };

          document.addEventListener('click', handleClickOutside);
          return () => document.removeEventListener('click', handleClickOutside);
        }
        return undefined;
      });
    }

    // Effect para sincronizar con el FormControl
    effect(() => {
      if (this.ngControl?.control) {
        this.ngControl.control.statusChanges
          ?.pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            // Trigger change detection
          });
      }
    });
  }

  // 🎨 Setters para Inputs
  @Input() set labelValue(value: string) { this.label.set(value); }
  @Input() set placeholderValue(value: string) { this.placeholder.set(value); }
  @Input() set helperTextValue(value: string) { this.helperText.set(value); }
  @Input() set errorMessageValue(value: string) { this.errorMessage.set(value); }
  @Input() set successMessageValue(value: string) { this.successMessage.set(value); }
  @Input() set sizeValue(value: SelectSize) { this.size.set(value); }
  @Input() set idValue(value: string) { this.selectId.set(value); }
  @Input() set requiredValue(value: boolean) { this.required.set(value); }
  @Input() set multipleValue(value: boolean) { this.multiple.set(value); }
  @Input() set searchableValue(value: boolean) { this.searchable.set(value); }
  @Input() set clearableValue(value: boolean) { this.clearable.set(value); }
  @Input() set optionsValue(value: SelectOption[]) { this.options.set(value); }
  @Input() set groupsValue(value: SelectGroup[]) { this.groups.set(value); }
  @Input() set ariaLabelValue(value: string) { this.ariaLabel.set(value); }
  @Input() set loadingValue(value: boolean) { this.isLoading.set(value); }

  // 🔄 ControlValueAccessor
  writeValue(value: any): void {
    this.internalValue = value ?? (this.multiple() ? [] : null);
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

  // 🎯 Handlers
  toggleDropdown(): void {
    if (this.isDisabled() || this.isLoading()) return;

    this.showDropdown.update(v => !v);

    if (this.showDropdown()) {
      this.isFocused.set(true);
      this.onFocus.emit();
    }
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
    this.isFocused.set(false);
    this.searchTerm.set('');
    this.isTouched.set(true);
    this.onTouched();
    this.onBlur.emit();
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple()) {
      const currentValues = Array.isArray(this.internalValue) ? [...this.internalValue] : [];
      const index = currentValues.indexOf(option.value);

      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(option.value);
      }

      this.internalValue = currentValues;
    } else {
      this.internalValue = option.value;
      this.closeDropdown();
    }

    this.onChange(this.internalValue);
    this.valueChange.emit(this.internalValue);
  }

  clearValue(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.internalValue = this.multiple() ? [] : null;
    this.onChange(this.internalValue);
    this.valueChange.emit(this.internalValue);
  }

  onSearchInput(term: string): void {
    this.searchTerm.set(term);
    this.searchChange.emit(term);
  }

  isOptionSelected(option: SelectOption): boolean {
    if (this.multiple()) {
      return Array.isArray(this.internalValue) && this.internalValue.includes(option.value);
    }
    return this.internalValue === option.value;
  }

  private findOptionByValue(value: any): SelectOption | undefined {
    // Buscar en opciones planas
    let found = this.options().find(opt => opt.value === value);
    if (found) return found;

    // Buscar en grupos
    for (const group of this.groups()) {
      found = group.options.find(opt => opt.value === value);
      if (found) return found;
    }

    return undefined;
  }

  // 🎹 Keyboard navigation
  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!this.showDropdown()) {
          this.toggleDropdown();
        }
        break;
    }
  }
}
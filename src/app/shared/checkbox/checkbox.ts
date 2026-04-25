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
  ChangeDetectionStrategy,
  OnInit,
  Injector
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NgControl
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type CheckboxVariant = 'default' | 'chip' | 'switch' | 'card';
export type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ],
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent implements ControlValueAccessor, OnInit {

private destroyRef = inject(DestroyRef);
private injector = inject(Injector); // 👈 NUEVO
public ngControl: NgControl | null = null; // 👈 NUEVO

  // 🎨 Configuración visual - Signals
  label = signal<string>('');
  description = signal<string>('');
  helperText = signal<string>('');
  errorMessage = signal<string>('');
  variant = signal<CheckboxVariant>('default');
  size = signal<CheckboxSize>('md');

  // 🔧 Configuración funcional - Signals
  checkboxId = signal<string>(`checkbox-${Math.random().toString(36).substr(2, 9)}`);
  required = signal<boolean>(false);
  indeterminate = signal<boolean>(false); // Estado intermedio (para "select all")

  // ♿ Accesibilidad
  ariaLabel = signal<string>('');

  // 🎭 Estados internos
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  isChecked = signal<boolean>(false);

  // 📤 Eventos
  @Output() checkedChange = new EventEmitter<boolean>();

  // 🧠 Control interno
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  // 🎨 Computed Signals
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

      if (errors['required']) return `Debes aceptar ${this.label() || 'este campo'}`;
      if (errors['requiredTrue']) return `Debes aceptar ${this.label() || 'este campo'}`;
    }

    return '';
  });

  hasError = computed(() => !!this.currentError());

  containerClasses = computed(() => {
    const variant = this.variant();
    const size = this.size();
    const checked = this.isChecked();
    const disabled = this.isDisabled();

    // Variante: Default (checkbox tradicional)
    if (variant === 'default') {
      return 'flex items-start gap-3';
    }

    // Variante: Chip (como tus atributos de plantilla)
    if (variant === 'chip') {
      const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
      };

      const base = `inline-flex items-center gap-2 rounded-full cursor-pointer transition-all border-2 ${sizeClasses[size]}`;
      const state = checked
        ? 'bg-warning-light text-secondary-dark border-secondary-dark font-medium'
        : 'bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200';
      const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

      return `${base} ${state} ${disabledClass}`;
    }

    // Variante: Switch (toggle moderno)
    if (variant === 'switch') {
      return 'flex items-center justify-between gap-3';
    }

    // Variante: Card (tarjeta seleccionable)
    if (variant === 'card') {
      const base = 'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all';
      const state = checked
        ? 'bg-warning-light border-secondary-dark'
        : 'bg-white border-gray-200 hover:border-gray-300';
      const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

      return `${base} ${state} ${disabledClass}`;
    }

    return '';
  });

  checkboxClasses = computed(() => {
    const size = this.size();
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return `${sizeClasses[size]} text-secondary-dark border-2 border-gray-300 rounded focus:ring-2 focus:ring-secondary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`;
  });

  labelClasses = computed(() => {
    const variant = this.variant();
    const size = this.size();

    if (variant === 'chip') {
      return 'font-medium';
    }

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg'
    };

    return `${sizeClasses[size]} font-medium text-gray-900 cursor-pointer select-none`;
  });

  switchClasses = computed(() => {
    const checked = this.isChecked();
    const disabled = this.isDisabled();

    const base = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors';
    const state = checked ? 'bg-secondary' : 'bg-gray-300';
    const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

    return `${base} ${state} ${disabledClass}`;
  });

  switchToggleClasses = computed(() => {
    const checked = this.isChecked();
    return checked
      ? 'translate-x-6 bg-white'
      : 'translate-x-1 bg-white';
  });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
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
ngOnInit(): void {
  try {
    this.ngControl = this.injector.get(NgControl, null, { optional: true, self: true });
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  } catch (e) {
    console.warn('CheckboxComponent: No se pudo obtener NgControl', e);
  }
}

  // 🎨 Setters para Inputs
  @Input() set labelValue(value: string) { this.label.set(value); }
  @Input() set descriptionValue(value: string) { this.description.set(value); }
  @Input() set helperTextValue(value: string) { this.helperText.set(value); }
  @Input() set errorMessageValue(value: string) { this.errorMessage.set(value); }
  @Input() set variantValue(value: CheckboxVariant) { this.variant.set(value); }
  @Input() set sizeValue(value: CheckboxSize) { this.size.set(value); }
  @Input() set idValue(value: string) { this.checkboxId.set(value); }
  @Input() set requiredValue(value: boolean) { this.required.set(value); }
  @Input() set indeterminateValue(value: boolean) { this.indeterminate.set(value); }
  @Input() set ariaLabelValue(value: string) { this.ariaLabel.set(value); }
  @Input() set checkedValue(value: boolean) { 
    this.isChecked.set(value);
    this.writeValue(value);
  }

  // 🔄 ControlValueAccessor
  writeValue(value: boolean): void {
    this.isChecked.set(!!value);
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
  toggle(): void {
    if (this.isDisabled()) return;

    this.isChecked.update(v => !v);
    this.isTouched.set(true);
    this.onChange(this.isChecked());
    this.onTouched();
    this.checkedChange.emit(this.isChecked());
  }

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.isChecked.set(input.checked);
    this.isTouched.set(true);
    this.onChange(this.isChecked());
    this.onTouched();
    this.checkedChange.emit(this.isChecked());
  }
}
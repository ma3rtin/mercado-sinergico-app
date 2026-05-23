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
  Injector,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NgControl
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'url';
export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor, OnInit {
  // 🧩 Inyecciones
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private cdr = inject(ChangeDetectorRef);
  public ngControl?: NgControl | null = null;

  // 🎨 Configuración visual - Signals
  label = signal<string>('');
  placeholder = signal<string>('');
  helperText = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  size = signal<InputSize>('md');

  // 🔧 Configuración funcional - Signals
  type = signal<InputType>('text');
  inputId = signal<string>(`input-${Math.random().toString(36).substr(2, 9)}`);
  required = signal<boolean>(false);
  readonly = signal<boolean>(false);
  clearable = signal<boolean>(false);
  showCounter = signal<boolean>(false);

  // 📏 Validaciones - Signals
  min = signal<number | string | undefined>(undefined);
  max = signal<number | string | undefined>(undefined);
  step = signal<number | string | undefined>(undefined);
  maxLength = signal<number | undefined>(undefined);
  pattern = signal<string | undefined>(undefined);

  // 🎯 Prefijos y sufijos - Signals
  prefix = signal<string>('');
  suffix = signal<string>('');

  // ♿ Accesibilidad
  ariaLabel = signal<string>('');
  autocomplete = signal<string>('off');

  // 🎭 Estados internos
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  isFocused = signal<boolean>(false);

  // 📤 Eventos
  @Output() valueChange = new EventEmitter<any>();
  @Output() onBlur = new EventEmitter<FocusEvent>();
  @Output() onFocus = new EventEmitter<FocusEvent>();

  // 🧠 Control interno
  internalValue: any = '';
  private valueChanges$ = new Subject<any>();

  // Control de formulario
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  // 🎨 Computed Signals
  characterCount = computed(() => {
    return this.internalValue?.toString().length || 0;
  });

  currentError = computed(() => {
    // Forzar re-evaluación cuando cambia el estado del control
    this.controlStateTracker();

    if (!this.isTouched() || !this.ngControl?.control) {
      return '';
    }

    const control = this.ngControl.control;

    // Si hay errorMessage manual, usarlo
    if (this.errorMessage()) {
      return this.errorMessage();
    }

    // Si no, obtener del FormControl
    if (control.invalid && control.touched) {
      const errors = control.errors;
      if (!errors) return '';

      if (errors['required']) return `${this.label() || 'Este campo'} es requerido`;
      if (errors['email']) return 'Formato de email inválido';
      if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
      if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
      if (errors['min']) return `El valor debe ser mayor o igual a ${errors['min'].min}`;
      if (errors['max']) return `El valor debe ser menor o igual a ${errors['max'].max}`;
      if (errors['pattern']) return `${this.label() || 'Este campo'} tiene un formato inválido`;
    }

    return '';
  });

  hasError = computed(() => !!this.currentError());

  hasHelperOrError = computed(() => {
    return !!(this.helperText() || this.currentError() || this.successMessage());
  });

  inputClasses = computed(() => {
    const base = 'w-full border-2 rounded-lg font-body focus:outline-none transition-all placeholder:text-gray-400';

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    const leftPadding = this.prefix() ? 'pl-10' : '';
    const rightPadding = (this.suffix() || this.clearable()) ? 'pr-10' : '';

    const state = this.currentError()
      ? 'border-error focus:border-error focus:ring-2 focus:ring-error-light'
      : this.successMessage()
        ? 'border-success focus:border-success focus:ring-2 focus:ring-success-light'
        : this.isFocused()
          ? 'border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
          : 'border-gray-300 hover:border-gray-400';

    const disabledClass = this.isDisabled()
      ? 'bg-gray-100 cursor-not-allowed opacity-60'
      : this.readonly()
      ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-default focus:ring-0 focus:border-gray-200'
      : 'bg-white';

    return `${base} ${sizes[this.size()]} ${leftPadding} ${rightPadding} ${state} ${disabledClass}`;
  });

  labelSizeClass = computed(() => ({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[this.size()]));

  prefixClass = computed(() => {
    return this.type() === 'number' || this.prefix() === '$'
      ? 'text-gray-600 font-semibold'
      : 'text-gray-500';
  });

  suffixClass = computed(() => 'text-gray-500 text-sm');
  // 🎯 Signal para forzar re-evaluación de computed properties
  private controlStateTracker = signal<number>(0);

  // 🎯 Effect para sincronizar con el FormControl
  statusEffect = effect(() => {
    const control = this.ngControl?.control;
    if (!control) return;

    control.statusChanges
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.controlStateTracker.update(v => v + 1);
        this.cdr.markForCheck();
      });
  });

  // 🎯 ngOnInit - Obtener NgControl de forma segura
  ngOnInit(): void {
    // Obtener NgControl del injector DESPUÉS de la construcción
    try {
      this.ngControl = this.injector.get(NgControl, null, { optional: true, self: true });
      if (this.ngControl) {
        // Registrar este componente como valueAccessor
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      // Si falla, el componente funciona como standalone sin validaciones
      console.warn('InputComponent: No se pudo obtener NgControl', e);
    }

    // 🔥 Debounce para valores numéricos (evita re-renders innecesarios)
    this.valueChanges$
      .pipe(
        debounceTime(this.type() === 'number' ? 300 : 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        this.onChange(value);
        this.valueChange.emit(value);
      });
  }

  // 🎨 Setters para Inputs (mantener compatibilidad con property binding)
  @Input() set labelValue(value: string) { this.label.set(value); }
  @Input() set placeholderValue(value: string) { this.placeholder.set(value); }
  @Input() set helperTextValue(value: string) { this.helperText.set(value); }
  @Input() set errorMessageValue(value: string) { this.errorMessage.set(value); }
  @Input() set successMessageValue(value: string) { this.successMessage.set(value); }
  @Input() set sizeValue(value: InputSize) { this.size.set(value); }
  @Input() set typeValue(value: InputType) { this.type.set(value); }
  @Input() set idValue(value: string) { this.inputId.set(value); }
  @Input() set requiredValue(value: boolean) { this.required.set(value); }
  @Input() set readonlyValue(value: boolean) { this.readonly.set(value); }
  @Input() set clearableValue(value: boolean) { this.clearable.set(value); }
  @Input() set showCounterValue(value: boolean) { this.showCounter.set(value); }
  @Input() set minValue(value: number | string | undefined) { this.min.set(value); }
  @Input() set maxValue(value: number | string | undefined) { this.max.set(value); }
  @Input() set stepValue(value: number | string | undefined) { this.step.set(value); }
  @Input() set maxLengthValue(value: number | undefined) { this.maxLength.set(value); }
  @Input() set patternValue(value: string | undefined) { this.pattern.set(value); }
  @Input() set prefixValue(value: string) { this.prefix.set(value); }
  @Input() set suffixValue(value: string) { this.suffix.set(value); }
  @Input() set ariaLabelValue(value: string) { this.ariaLabel.set(value); }
  @Input() set autocompleteValue(value: string) { this.autocomplete.set(value); }

  // 🔄 ControlValueAccessor
  writeValue(value: any): void {
    this.internalValue = value ?? '';
    this.cdr.markForCheck();
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
  onValueChange(value: any): void {
    this.internalValue = value;
    this.valueChanges$.next(value);
  }

  handleBlur(): void {
    this.isTouched.set(true);
    this.isFocused.set(false);
    this.onTouched();
    this.onBlur.emit();
  }

  handleFocus(event: FocusEvent): void {
    this.isFocused.set(true);
    this.onFocus.emit(event);
  }

  clearValue(): void {
    this.internalValue = '';
    this.onChange('');
    this.valueChange.emit('');
  }
}
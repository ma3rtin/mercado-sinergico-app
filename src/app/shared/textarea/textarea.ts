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
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Injector,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NgControl
} from '@angular/forms';
import { Subject } from 'rxjs';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  templateUrl: './textarea.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaComponent implements ControlValueAccessor, AfterViewInit, OnInit {
ngOnInit(): void {
  try {
    this.ngControl = this.injector.get(NgControl, null, { optional: true, self: true });
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  } catch (e) {
    console.warn('TextareaComponent: No se pudo obtener NgControl', e);
  }
}
  @ViewChild('textareaElement', { static: false }) textareaElement?: ElementRef<HTMLTextAreaElement>;

  // 🧩 Inyecciones
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  public ngControl?: NgControl|null = null ;

  // 🎨 Configuración visual - Signals
  label = signal<string>('');
  placeholder = signal<string>('');
  helperText = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  size = signal<TextareaSize>('md');

  // 🔧 Configuración funcional - Signals
  textareaId = signal<string>(`textarea-${Math.random().toString(36).substr(2, 9)}`);
  required = signal<boolean>(false);
  readonly = signal<boolean>(false);
  resize = signal<TextareaResize>('vertical');
  autoResize = signal<boolean>(false);

  // 📏 Validaciones - Signals
  rows = signal<number>(4);
  minRows = signal<number>(3);
  maxRows = signal<number>(10);
  minLength = signal<number | undefined>(undefined);
  maxLength = signal<number | undefined>(undefined);
  showCounter = signal<boolean>(false);

  // ♿ Accesibilidad
  ariaLabel = signal<string>('');
  autocomplete = signal<string>('off');

  // 🎭 Estados internos
  isDisabled = signal<boolean>(false);
  isTouched = signal<boolean>(false);
  isFocused = signal<boolean>(false);

  // 📤 Eventos
  @Output() valueChange = new EventEmitter<string>();
  @Output() onBlur = new EventEmitter<FocusEvent>();
  @Output() onFocus = new EventEmitter<FocusEvent>();

  // 🧠 Control interno
  internalValue: string = '';
  private valueChanges$ = new Subject<string>();

  // Control de formulario
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  // 🎨 Computed Signals
  characterCount = computed(() => {
    return this.internalValue?.length || 0;
  });

  remainingChars = computed(() => {
    const max = this.maxLength();
    if (!max) return null;
    return max - this.characterCount();
  });

  isNearLimit = computed(() => {
    const remaining = this.remainingChars();
    if (remaining === null) return false;
    return remaining <= 20 && remaining > 0;
  });

  isOverLimit = computed(() => {
    const remaining = this.remainingChars();
    if (remaining === null) return false;
    return remaining < 0;
  });

  currentError = computed(() => {
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
      if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
      if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    }

    return '';
  });

  hasError = computed(() => !!this.currentError());

  hasHelperOrError = computed(() => {
    return !!(this.helperText() || this.currentError() || this.successMessage());
  });

  textareaClasses = computed(() => {
    const base = 'w-full border-2 rounded-lg font-body focus:outline-none transition-all placeholder:text-gray-400';

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg'
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
      auto: 'resize-none'
    };

    const state = this.currentError()
      ? 'border-error focus:border-error focus:ring-2 focus:ring-error-light'
      : this.successMessage()
      ? 'border-success focus:border-success focus:ring-2 focus:ring-success-light'
      : this.isFocused()
      ? 'border-secondary focus:ring-2 focus:ring-secondary/20'
      : 'border-gray-300 hover:border-gray-400';

    const disabledClass = this.isDisabled()
      ? 'bg-gray-100 cursor-not-allowed opacity-60'
      : 'bg-white';

    return `${base} ${sizes[this.size()]} ${resizeClasses[this.resize()]} ${state} ${disabledClass}`;
  });

  labelSizeClass = computed(() => ({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[this.size()]));

  counterClasses = computed(() => {
    if (this.isOverLimit()) return 'text-error font-semibold';
    if (this.isNearLimit()) return 'text-warning font-medium';
    return 'text-gray-500';
  });

  ngAfterViewInit(): void {
    // Si está habilitado el auto-resize, ajustar altura inicial
    if (this.autoResize() && this.textareaElement) {
      this.adjustHeight();
    }
  }


  // 🎨 Setters para Inputs
  @Input() set labelValue(value: string) { this.label.set(value); }
  @Input() set placeholderValue(value: string) { this.placeholder.set(value); }
  @Input() set helperTextValue(value: string) { this.helperText.set(value); }
  @Input() set errorMessageValue(value: string) { this.errorMessage.set(value); }
  @Input() set successMessageValue(value: string) { this.successMessage.set(value); }
  @Input() set sizeValue(value: TextareaSize) { this.size.set(value); }
  @Input() set idValue(value: string) { this.textareaId.set(value); }
  @Input() set requiredValue(value: boolean) { this.required.set(value); }
  @Input() set readonlyValue(value: boolean) { this.readonly.set(value); }
  @Input() set resizeValue(value: TextareaResize) { this.resize.set(value); }
  @Input() set autoResizeValue(value: boolean) {
    this.autoResize.set(value);
    if (value) {
      this.resize.set('auto');
    }
  }
  @Input() set rowsValue(value: number) { this.rows.set(value); }
  @Input() set minRowsValue(value: number) { this.minRows.set(value); }
  @Input() set maxRowsValue(value: number) { this.maxRows.set(value); }
  @Input() set minLengthValue(value: number | undefined) { this.minLength.set(value); }
  @Input() set maxLengthValue(value: number | undefined) { this.maxLength.set(value); }
  @Input() set showCounterValue(value: boolean) { this.showCounter.set(value); }
  @Input() set ariaLabelValue(value: string) { this.ariaLabel.set(value); }
  @Input() set autocompleteValue(value: string) { this.autocomplete.set(value); }

  // 🔄 ControlValueAccessor
  writeValue(value: string): void {
    this.internalValue = value ?? '';
    if (this.autoResize()) {
      setTimeout(() => this.adjustHeight(), 0);
    }
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
  onValueChange(value: string): void {
    this.internalValue = value;
    this.valueChanges$.next(value);

    if (this.autoResize()) {
      this.adjustHeight();
    }
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

    if (this.autoResize() && this.textareaElement) {
      this.textareaElement.nativeElement.style.height = 'auto';
    }
  }

  // 📏 Auto-resize logic
  private adjustHeight(): void {
    if (!this.textareaElement) return;

    const textarea = this.textareaElement.nativeElement;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);

    const minHeight = this.minRows() * lineHeight;
    const maxHeight = this.maxRows() * lineHeight;

    let newHeight = scrollHeight;

    if (newHeight < minHeight) {
      newHeight = minHeight;
    } else if (newHeight > maxHeight) {
      newHeight = maxHeight;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }

    textarea.style.height = `${newHeight}px`;
  }
}

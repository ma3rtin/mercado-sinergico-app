import { Component, inject, signal, input, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@app/shared/icono/icono';
import { ToastService } from '@app/services/toast/toast.service';

export interface ImageSlot {
  file: File | null;
  preview: string | null;
  isExisting?: boolean;
  existingUrl?: string;
}

@Component({
  selector: 'app-subidor-imagenes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './subidor-imagenes.html',
})
export class SubidorImagenes {
  private toast = inject(ToastService);

  // Configuración
  titulo = input<string>('Imágenes del Producto');
  allowMultiple = input<boolean>(true);
  maxSlots = input<number>(16);
  formSubmitted = input<boolean>(false);
  labelPrincipal = input<string>('Imagen Principal (Obligatoria)');
  labelAdicionales = input<string>('Imágenes Adicionales (Carga Masiva)');
  initialSlots = input<ImageSlot[]>([]);

  // Estado interno privado
  public _slots = signal<ImageSlot[]>(Array(16).fill(null).map(() => ({ 
    file: null, 
    preview: null, 
    isExisting: false 
  })));

  draggedIndex = signal<number | null>(null);

  // Debe coincidir con TIPOS_PERMITIDOS del backend (uploadFiles.middleware.ts).
  // Las extensiones sueltas cubren los navegadores que no reconocen HEIC y no
  // mandan un mimetype de imagen.
  readonly tiposAceptados =
    'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,image/avif,.heic,.heif';

  // Firefox y algunos navegadores de escritorio no reconocen HEIC y reportan
  // 'application/octet-stream' o vacío; sin este fallback el archivo se
  // descartaba en silencio aunque el backend sí lo acepta.
  private esImagenValida(file: File): boolean {
    return file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
  }

  // Exponemos estados para el padre y el template
  hasMainImage = computed(() => !!this._slots()[0]?.preview);

  getCantidadImagenesCargadas = computed(() => 
    this._slots().filter(slot => slot.preview !== null).length
  );

  hasAdditionalImages = computed(() => 
    this._slots().slice(1).some(slot => slot.preview !== null)
  );

  constructor() {
effect(() => {
  const initial = this.initialSlots();
  const max = this.maxSlots();
  
  if (initial && initial.length > 0 && initial.some(s => s.preview)) {
    untracked(() => {
      const hasContent = this._slots().some(s => s.file !== null || s.isExisting);
      if (!hasContent) {
        // Completar hasta maxSlots con slots vacíos
        const filled = [...initial];
        while (filled.length < max) {
          filled.push({ file: null, preview: null, isExisting: false });
        }
        this._slots.set(filled);
      }
    });
  }
});
  }

  // API Pública para el padre
  getSlots(): ImageSlot[] {
    return this._slots();
  }

  loadSlots(slots: ImageSlot[]): void {
    this._slots.set(slots);
  }

  reset(): void {
    this._slots.set(Array(16).fill(null).map(() => ({ 
      file: null, 
      preview: null, 
      isExisting: false 
    })));
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!this.esImagenValida(file)) {
        this.toast.error('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('La imagen no puede superar los 5MB');
        return;
      }

      this._slots.update(prev => {
        const s = [...prev];
        s[index] = { file, preview: null, isExisting: false };
        return s;
      });

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this._slots.update(prev => {
          const s = [...prev];
          s[index].preview = e.target.result;
          return s;
        });
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onMultipleFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const max = this.maxSlots();
      const freeSlots = this._slots().map((s, i) => s.preview ? -1 : i).filter(i => i > 0 && i < max);

      if (freeSlots.length === 0) {
        this.toast.error('Límite de imágenes adicionales alcanzado.');
        return;
      }

      // Antes los archivos inválidos se descartaban en silencio: el usuario
      // elegía 16 y aparecían 13 sin ninguna explicación.
      const validos = files.filter(f => this.esImagenValida(f) && f.size <= 5 * 1024 * 1024);
      const descartados = files.length - validos.length;
      if (descartados > 0) {
        this.toast.error(
          `Se ${descartados === 1 ? 'omitió 1 archivo' : `omitieron ${descartados} archivos`}: deben ser imágenes de hasta 5MB.`
        );
      }

      const aCargar = validos.slice(0, freeSlots.length);
      if (aCargar.length < validos.length) {
        this.toast.warning(
          `Solo quedaban ${aCargar.length} espacios: se ignoraron ${validos.length - aCargar.length} imágenes.`
        );
      }

      aCargar.forEach((file, idx) => {
        const targetIndex = freeSlots[idx];
        this._slots.update(prev => {
          const s = [...prev];
          s[targetIndex] = { file, preview: null, isExisting: false };
          return s;
        });

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this._slots.update(prev => {
            const s = [...prev];
            s[targetIndex].preview = e.target.result;
            return s;
          });
        };
        reader.readAsDataURL(file);
      });
    }
    input.value = '';
  }

  removeImage(index: number, event?: Event) {
    if (event) event.stopPropagation();
    this._slots.update(prev => {
      const s = [...prev];
      s[index] = { file: null, preview: null, isExisting: false };
      return s;
    });
  }

  // Drag & Drop
  onDragStart(index: number, event: DragEvent) {
    this.draggedIndex.set(index);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDrop(targetIndex: number, event: DragEvent) {
    event.preventDefault();
    const sourceIndex = this.draggedIndex();
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    this._slots.update(prev => {
      const s = [...prev];
      [s[sourceIndex], s[targetIndex]] = [s[targetIndex], s[sourceIndex]];
      return s;
    });
    this.draggedIndex.set(null);
  }

  onDragEnd() { this.draggedIndex.set(null); }
}

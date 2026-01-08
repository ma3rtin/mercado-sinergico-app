import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

/**
 * 🎯 Servicio para mostrar notificaciones con ngx-sonner
 *
 * Uso simple:
 * - this.toast.success('Producto creado')
 * - this.toast.error('Hubo un error')
 */
@Injectable({ providedIn: 'root' })
export class ToastService {

  /**
   * ✅ Notificación de éxito (verde)
   */
  success(message: string, title?: string) {
    return toast.success(title || message, {
      description: title ? message : undefined,
      duration: 3000,
    });
  }

  /**
   * ❌ Notificación de error (rojo)
   */
  error(message: string, title?: string) {
    return toast.error(title || message, {
      description: title ? message : undefined,
      duration: 4000,
    });
  }

  /**
   * ⚠️ Notificación de advertencia (amarillo)
   */
  warning(message: string, title?: string) {
    return toast.warning(title || message, {
      description: title ? message : undefined,
      duration: 3500,
    });
  }

  /**
   * ℹ️ Notificación informativa (azul)
   */
  info(message: string, title?: string) {
    return toast.info(title || message, {
      description: title ? message : undefined,
      duration: 3000,
    });
  }

  /**
   * 🔄 Notificación de carga
   */
  loading(message: string) {
    return toast.loading(message);
  }

  /**
   * 🗑️ Cerrar una notificación específica
   */
  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  }

  /**
   * 🧹 Cerrar todas las notificaciones
   */
  clear() {
    toast.dismiss();
  }
}

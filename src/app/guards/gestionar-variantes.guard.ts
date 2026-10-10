import { CanDeactivateFn } from '@angular/router';
import Swal from 'sweetalert2';
import { GestionarVariantesComponent } from '../pages/gestionar-variantes/gestionar-variantes';

export const gestionarVariantesGuard: CanDeactivateFn<GestionarVariantesComponent> = (
  component,
): Promise<boolean> => {
  if (!component) {
    return Promise.resolve(true);
  }

  // 1. Guardado en curso: bloquear la salida. Las requests están atadas al
  // ciclo de vida del componente (takeUntilDestroyed), así que navegar ahora
  // cancelaría el guardado a mitad de camino y dejaría el estado indefinido.
  if (component.isSaving()) {
    Swal.fire({
      title: 'Guardado en curso',
      text: 'Esperá a que termine de guardar antes de salir de esta pantalla.',
      icon: 'info',
      confirmButtonColor: 'var(--brand-secondary)',
      confirmButtonText: 'Entendido',
    });
    return Promise.resolve(false);
  }

  // 2. Cambios staged sin persistir
  if (component.hasChanges()) {
    return Swal.fire({
      title: '¿Salir sin guardar?',
      text: 'Hay cambios sin guardar que se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    }).then((result) => result.isConfirmed);
  }

  return Promise.resolve(true);
};

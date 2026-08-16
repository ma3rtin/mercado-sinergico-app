import { CanDeactivateFn } from '@angular/router';
import Swal from 'sweetalert2';
import { GestionarVariantesComponent } from '../pages/gestionar-variantes/gestionar-variantes';

export const gestionarVariantesGuard: CanDeactivateFn<GestionarVariantesComponent> = (
  component,
): Promise<boolean> => {
  if (!component) {
    return Promise.resolve(true);
  }

  // 1. Guardado en curso: advertir que salir puede cortar el proceso
  if (component.isSaving()) {
    return Swal.fire({
      title: 'Guardado en curso',
      text: 'Hay un guardado en curso. ¿Seguro que querés salir? Podés perder cambios sin guardar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'var(--text-muted)',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Quedarme',
    }).then((result) => result.isConfirmed);
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

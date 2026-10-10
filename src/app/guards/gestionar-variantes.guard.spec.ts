import { GestionarVariantesComponent } from '../pages/gestionar-variantes/gestionar-variantes';
import { gestionarVariantesGuard } from './gestionar-variantes.guard';

const swalMocks = vi.hoisted(() => ({
  fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

vi.mock('sweetalert2', () => ({
  default: { fire: swalMocks.fire },
}));

function mockComponent(overrides: { isSaving?: boolean; hasChanges?: boolean }) {
  return {
    isSaving: () => overrides.isSaving ?? false,
    hasChanges: () => overrides.hasChanges ?? false,
  } as unknown as GestionarVariantesComponent;
}

describe('gestionarVariantesGuard', () => {
  beforeEach(() => {
    swalMocks.fire.mockClear();
    swalMocks.fire.mockResolvedValue({ isConfirmed: true });
  });

  it('bloquea la salida sin preguntar mientras hay un guardado en curso', async () => {
    const puedeSalir = await gestionarVariantesGuard(
      mockComponent({ isSaving: true, hasChanges: true }),
      {} as never,
      {} as never,
      {} as never,
    );

    expect(puedeSalir).toBe(false);
    expect(swalMocks.fire).toHaveBeenCalledTimes(1);
    expect(swalMocks.fire.mock.calls[0][0].showCancelButton).toBeFalsy();
  });

  it('pide confirmación si hay cambios sin guardar y no está guardando', async () => {
    const puedeSalir = await gestionarVariantesGuard(
      mockComponent({ isSaving: false, hasChanges: true }),
      {} as never,
      {} as never,
      {} as never,
    );

    expect(puedeSalir).toBe(true);
    expect(swalMocks.fire).toHaveBeenCalledTimes(1);
  });

  it('permite salir sin preguntar si no hay guardado en curso ni cambios pendientes', async () => {
    const puedeSalir = await gestionarVariantesGuard(
      mockComponent({ isSaving: false, hasChanges: false }),
      {} as never,
      {} as never,
      {} as never,
    );

    expect(puedeSalir).toBe(true);
    expect(swalMocks.fire).not.toHaveBeenCalled();
  });
});

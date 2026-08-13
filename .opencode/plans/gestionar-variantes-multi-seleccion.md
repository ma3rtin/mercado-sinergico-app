# Plan: Acciones de selección múltiple en variantes

## Contexto
En `GestionarVariantesComponent`, la **BARRA MULTI-SELECCIÓN** (fixed bottom, `gestionar-variantes.html:436-467`) es el menú que se abre al tildar variantes. Hoy solo ofrece "Stock" (enérgico) y "Cancelar". Se agregan tres acciones que operan **solo sobre el subconjunto seleccionado**:

- **Activar seleccionadas**
- **Desactivar seleccionadas**
- **Eliminar seleccionadas**

Confirmado con el usuario: van como botones dentro de la barra inferior existente.

## Iconos disponibles (ya registrados)
`checkCircle` (Activar), `xCircle` (Desactivar), `trash2` (Eliminar).

## Cambios en `src/app/pages/gestionar-variantes/gestionar-variantes.ts`

1. **`ejecutarGuardado(onTerminar?: (exitoTotal: boolean) => void)`**
   - Parámetro opcional nuevo; tras `finalizarGuardado(...)` se invoca `onTerminar?.(errores === 0)`.
   - Sin cambios de comportamiento para llamadores actuales.

2. **Renombrar/generalizar `aplicarEstadoATodas(activo)` → `aplicarEstadoMasivo(activo: boolean, ids: number[] | null = null, onTerminar?: (exitoTotal: boolean) => void)`**
   - `idsObjetivo = ids ?? todos los ids`.
   - Actualiza el signal solo para los ids objetivo con `hasChanges` calculado (después de actualizar el signal se chequearon `hasChanges`, criterio del fix previo).
   - Con cambios → `ejecutarGuardado(onTerminar)`.
   - Sin cambios → toast info adaptado (subset vs "todas") y `onTerminar?.(true)`.
   - `activarTodas()`/`desactivarTodas()` pasan a llamar `aplicarEstadoMasivo(true/false)` sin ids (comportamiento global intacto).

3. **`activarSeleccionadas()`** — guard `isSaving()`; si `cantidadSeleccionadas() === 0` → toast warning; SweetAlert2 ("Se activarán `<strong>N</strong>` variante(s)", icon `question`, confirm `var(--success)`); al confirmar → `aplicarEstadoMasivo(true, ids, exito => { if (exito) this.deseleccionarTodas(); })`.

4. **`desactivarSeleccionadas()`** — ídem con `false`, icon `warning`, confirm `var(--warning)`.

5. **`eliminarSeleccionadas()`** — guard `isSaving()`; si 0 seleccionadas → toast warning; SweetAlert2 con `N` + "Esta acción no se puede deshacer" (confirm `var(--error)`); al confirmar → `ejecutarEliminacionSeleccionadas(seleccionadas)`.

6. **`private ejecutarEliminacionSeleccionadas(seleccionadas)`** — no existe endpoint bulk de borrado; se recorre cada seleccionada con `varianteService.eliminarVariante(id)`.
   - `isSaving.set(true)` durante el proceso (LoadingOverlay + botones deshabilitados).
   - Por éxito → se remueve del signal (auto-limpia la selección para ese id).
   - Por fallo → se conserva en la señal/selección para reintento (edge case: no salir del modo selección).
   - Al terminar: éxito total → "N variantes eliminadas"; parcial → warning "X eliminadas, Y con errores"; total → error.
   - `isSaving.set(false)` al completar; `lastSelectedId.set(null)`.

## Cambios en `src/app/pages/gestionar-variantes/gestionar-variantes.html`
Dentro de la BARRA MULTI-SELECCIÓN, en el contenedor `overflow-x-auto`, agregar **antes del botón "Stock"** tres botones con el mismo estilo base (`flex flex-col sm:flex-row items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-[20px] transition-all shrink-0 border border-white/5`):

- Activar (`checkCircle`) → `activarSeleccionadas()`
- Desactivar (`xCircle`) → `desactivarSeleccionadas()`
- Eliminar (`trash2`) → `eliminarSeleccionadas()` (estilo destructivo `bg-red-500/90 hover:bg-red-600 border-white/20 shadow-lg`)

Cada uno con `[disabled]="isSaving() || cantidadSeleccionadas() === 0"`, `[class.opacity-50]` y `[class.cursor-not-allowed]` (patrón del resto de botones).

## Comportamiento resultante
- Tildar subconjunto → barra → Activar/Desactivar/Eliminar solo sobre ese subconjunto, con SweetAlert2 de confirmación, persistencia inmediata (LoadingOverlay + toast éxito/error) y salida automática del modo selección en éxito.
- En fallo, la selección se conserva para reintentar.
- Flujo global "activar/desactivar todas" y guardado manual intactos.

## Verificación
- `npx ng build`
- `npx eslint src/app/pages/gestionar-variantes/gestionar-variantes.ts`

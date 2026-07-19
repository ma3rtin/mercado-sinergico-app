### 📦 PR - Mercado Sinérgico Frontend

#### 🔗 Título Sugerido
`fix(buscador): corregir conteo total de resultados y fixes menores en BuscadorComponent`

#### 📝 Tipo de Cambio
- [ ] ✨ Feat (Nueva funcionalidad)
- [x] 🐛 Fix (Corrección de error)
- [ ] ♻️ Refactor (Refactorización de código existente)
- [ ] 🧹 Chore (Tareas de mantenimiento, dependencias, etc.)
- [x] 🧪 Test (Pruebas unitarias o de integración)
- [ ] 📝 Docs (Documentación)

#### 📖 Descripción General
`totalResultados()` en `BuscadorComponent` no reflejaba la cantidad real de matches porque contaba sobre arrays ya recortados a 6 (`.slice(0, 6)`). Esto causaba que el botón "Ver todos los resultados (n)" mostrara un número incorrecto cuando había más de 6 coincidencias. Se corrige guardando los conteos totales antes del slice y se aprovechan fixes menores: rutas de navegación correctas, display de marca con helper, limpieza de logs de debug y normalización de iconos.

#### 🛠️ Cambios Principales

- **Modificado** `src/app/shared/buscador/buscador.ts`:
  - Extended interface `ResultadoBusqueda` con `totalProductos` y `totalPaquetes` para almacenar el conteo real antes del `.slice(0, 6)`.
  - `totalResultados()` ahora suma `totalProductos + totalPaquetes` en vez de `productos.length + paquetes.length`.
  - Todos los `.set()` del signal `resultados` actualizados con los nuevos campos.
  - Corregidas rutas de navegación: `verProducto()` → `/producto/:id`, `verPaquete()` → `/paquete/:id/productos`.
  - Agregado helper `obtenerNombreMarca()` para manejar correctamente `marca` (string | objeto).
  - Eliminados console.logs de debug (`tap`/`finalize`).

- **Modificado** `src/app/shared/buscador/buscador.html`:
  - Normalizado tamaño de iconos Box y Package a `w-6 h-6` (desktop).
  - Reemplazado `producto.marca || 'Sin marca'` por `obtenerNombreMarca(producto)` en desktop y mobile.

- **Creado** `src/app/shared/buscador/buscador.spec.ts`:
  - 27 tests unitarios cubriendo: creación, búsqueda con debounce, filtrado por tipo, manejo de errores, navegación, matching por marca/categoría, `distinctUntilChanged`, límite de 6 resultados y el fix de `totalResultados`.

#### 🧪 Pasos para Verificar
1. Levantar el proyecto localmente (`npm start`).
2. Buscar un término que tenga más de 6 productos o paquetes que matcheen.
3. Verificar que el botón "Ver todos los resultados (n)" muestre el número real de coincidencias (no 6 o 12).
4. Verificar que solo se rendericen 6 ítems por tipo en el dropdown.
5. Navegar a un producto/paquete desde el buscador y confirmar que llega a la ruta correcta.
6. Correr `npx vitest run src/app/shared/buscador/buscador.spec.ts` — todos los tests deben pasar.

#### ⚠️ Notas Adicionales
Ninguna.

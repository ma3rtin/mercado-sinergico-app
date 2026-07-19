# AGENTS.md — Mercado Sinérgico (Frontend)

Instrucciones generales que se aplican a toda tarea que se te asigne en este repositorio (frontend), sin importar si es un feat, fix, refactor, chore o hotfix.

---

## Estimación previa obligatoria

Antes de empezar a ejecutar cualquier tarea, SIEMPRE debés clasificarla y comunicar la estimación antes de tocar código. El formato es:

```
📋 Estimación de tarea
Dificultad: [Baja / Media / Alta]
Tiempo estimado: [rango en minutos]
Motivo: [una línea explicando por qué cae en esa categoría]
```

### Criterios de clasificación

**Baja (2-10 min)**
Cambios acotados a un solo archivo o componente, sin tocar lógica de negocio compleja. Ejemplos: ajustar estilos, cambiar un texto, eliminar código muerto ya identificado, agregar un campo a una interfaz existente.

**Media (10-30 min)**
Cambios que afectan 2 a 4 archivos relacionados, o que requieren entender el flujo de datos entre componente padre/hijo, o tocar un servicio y su consumidor. Ejemplos: corregir un computed que depende de otro componente, refactor de un componente standalone, agregar un endpoint nuevo con su DTO.

**Alta (30+ min)**
Cambios que afectan múltiples capas (backend + frontend), requieren migración de schema/Prisma, tocan lógica de negocio central (cálculo de precios, disponibilidad, estados de paquete), o tienen alto riesgo de romper funcionalidad existente en otras pantallas. Ejemplos: cambios en el modelo de variantes, refactor de servicios compartidos, cambios en flujo de pedidos o pagos.

Si después de empezar a investigar el código la tarea resulta más compleja de lo estimado inicialmente, está permitido reclasificarla y avisar antes de seguir, en lugar de continuar en silencio.

---

## Idioma de respuesta

Todas tus respuestas, resúmenes de cambios, explicaciones y comentarios en consola deben estar SIEMPRE en español. Esto incluye los resúmenes de tipo "Summary of Changes" al finalizar una tarea: deben titularse y redactarse en español ("Resumen de cambios"), sin mezclar inglés salvo en nombres propios de código (nombres de archivos, variables, funciones, clases) que no se traducen.

---

## Reglas de ejecución

- No instalar dependencias nuevas sin preguntar primero.
- No modificar código fuera del scope indicado en el prompt sin avisar y justificar por qué es necesario.
- Si una tarea de dificultad Alta requiere tocar backend y frontend, dividir el trabajo en pasos y confirmar cada paso antes de seguir al siguiente.
- Al finalizar, correr los tests/build relevantes y mostrar el resultado real, no asumir que todo funciona.
- Si la tarea es ambigua o falta contexto del negocio, preguntar antes de asumir comportamiento.

---

## Contexto técnico del proyecto (Frontend)

- **Tecnologías**: Angular (zoneless, signals-based), TypeScript, Tailwind CSS, Vitest.
- **Convenciones**: standalone components, `@if`/`@for` (nunca `*ngIf`/`*ngFor`), signal inputs/outputs, ToastService para notificaciones, SweetAlert2 para confirmaciones destructivas.
- **Dominio**: productos Sinérgicos (sin stock físico) vs Energéticos (con stock físico controlado). Las variantes activas son la fuente de verdad sobre si un producto requiere selección antes de la compra, no la existencia de plantilla.

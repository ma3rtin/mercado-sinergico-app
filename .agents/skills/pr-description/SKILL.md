---
name: pr-description
description: Genera y escribe una descripción de Pull Request (PR) estructurada en español (como PR-DESCRIPTION.md) analizando los commits y diffs de la rama actual del repositorio respecto a su rama de partida (dev o main).
---

Cuando se invoque esta skill para generar la descripción de un PR:

## Instrucciones de ejecución

1. **Identificar la rama actual y la de partida**:
   - Ejecuta `git branch --show-current` para obtener el nombre de la rama actual.
   - Determina la rama base de partida usando la siguiente lógica:
     - Si la rama actual es `dev`, la rama base de partida es `origin/main` (o `main` si no está configurado el remoto).
     - Si la rama actual es cualquier otra (rama de feature, fix, refactor, etc.), la rama base de partida es `origin/dev` (o `dev` si no está configurado el remoto).

2. **Analizar los cambios en el repositorio actual**:
   - Obtén el listado de commits locales de la rama actual respecto a la base:
     `git log <rama_base>..HEAD --oneline`
   - Obtén el diff de los cambios confirmados:
     `git diff <rama_base>...HEAD`
   - Obtén el diff de los cambios locales no confirmados (working tree y staging):
     `git diff HEAD`
   - Ejecuta `git status` para identificar archivos no trackeados (untracked files) y eliminaciones pendientes de confirmación, asegurando que no se omitan del análisis.
   - Identifica explícitamente cualquier eliminación de directorios obsoletos, refactorización de configuraciones y limpieza de contexto previo mal estructurado.
   - Analiza los archivos modificados, creados o eliminados y sus implicancias.

3. **Generar y guardar la descripción**:
   - Crea un archivo llamado `PR-DESCRIPTION.md` en la raíz del repositorio actual con la descripción estructurada en español.
   - Muestra el contenido generado en la conversación del asistente de IA para que el usuario pueda revisarlo.

---

## Plantilla y Formato de PR a generar

El archivo `PR-DESCRIPTION.md` debe seguir el siguiente formato:

### 📦 PR - [Nombre del Repositorio]

#### 🔗 Título Sugerido
`[tipo]([scope]): [descripción corta y clara en minúsculas]` (ej: `feat(views): ofuscación y encubrimiento de ids en urls` o `fix(auth): corregir renovación de token de sesión`)

#### 📝 Tipo de Cambio
- [ ] ✨ Feat (Nueva funcionalidad)
- [ ] 🐛 Fix (Corrección de error)
- [ ] ♻️ Refactor (Refactorización de código existente)
- [ ] 🧹 Chore (Tareas de mantenimiento, dependencias, etc.)
- [ ] 🧪 Test (Pruebas unitarias o de integración)
- [ ] 📝 Docs (Documentación)

#### 📖 Descripción General
*Explicar brevemente qué problema soluciona este PR y cuál es la solución técnica implementada (máximo 3-4 líneas).*

#### 🛠️ Cambios Principales
*Detallar de forma clara y concisa los principales archivos modificados y qué se hizo en cada uno. Ejemplo:*
- **[Modificación/Nuevo]** `src/app/services/crypto.service.ts`: Implementación de funciones para encriptar y desencriptar IDs secuenciales en URLs.

#### 🧪 Pasos para Verificar (Cómo Probar)
*Pasos claros para que otro desarrollador o QA pueda validar el cambio.*
1. Levantar el proyecto localmente.
2. Realizar los pasos necesarios de prueba de la feature o fix.
3. Correr las pruebas pertinentes y verificar que pasen.

#### ⚠️ Notas Adicionales
*Indicar si hay dependencias nuevas, cambios necesarios en variables de entorno, scripts de base de datos a correr, etc. Si no hay nada, escribir "Ninguna".*

# Pendientes de la aplicacion

Este documento registra los problemas detectados durante el analisis funcional y tecnico de Mercado Sinergico que no forman parte de la correccion del flujo de creacion de productos.

## Prioridad alta

### 1. Validacion duplicada entre frontend y backend

Las reglas de validacion siguen estando definidas en dos lugares distintos:

- Frontend: `src/app/pages/admin/components/crear-producto/crear-producto.ts`.
- Backend: `src/dtos/producto/producto.dto.ts`.

Esto puede volver a producir comportamientos diferentes si se modifica una capa y no la otra. Deben mantenerse alineadas las reglas de longitudes, rangos, campos obligatorios y valores permitidos.

### 2. Prueba end-to-end del alta de productos

El flujo tiene pruebas unitarias, pero falta una prueba integrada que cubra la petición real `POST /api/productos` con:

- Usuario administrador autenticado.
- Imagen principal y varias imágenes adicionales.
- Producto sin plantilla.
- Producto energético con stock.
- Producto con plantilla y variantes.
- Persistencia del producto, imágenes y variantes.

Esta prueba debe comprobar también que un fallo de validación o generación no deje registros parciales.

### 3. Configuración y verificación de Cloudinary

La subida de imágenes depende de Cloudinary y actualmente el flujo solo puede confirmar su resultado mediante errores y logs del backend. Falta una verificación operativa que compruebe:

- Tiempo máximo de respuesta.
- Mensaje mostrado ante una caída del proveedor.
- Limpieza o tratamiento de archivos subidos si falla posteriormente la persistencia.
- Límites de tamaño y cantidad de imágenes.

## Prioridad media

### 4. IDs incompletos en plantillas y opciones

El frontend ignora características u opciones sin ID al preparar `opcionesDisponibles` en `crear-producto.ts`. Esto puede generar un payload incompleto sin advertir cuál elemento está defectuoso.

Debe validarse explícitamente que todas las características y opciones tengan IDs antes de enviar el formulario y mostrar un error identificable al administrador.

### 5. Manejo de errores demasiado genérico

En varios flujos se muestra un mensaje general como `Error creando producto`, aunque el backend puede distinguir validación, autorización, Cloudinary, conflictos y errores internos.

Conviene centralizar la traducción de errores HTTP y mostrar mensajes específicos para:

- `400`: datos inválidos.
- `401`: sesión vencida.
- `403`: permisos insuficientes.
- `409`: conflicto de datos.
- `415`: formato de archivo no permitido.
- `500`: error interno o proveedor externo.

### 6. Logs de depuración en producción

Hay múltiples `console.log` y `console.error` detallados en servicios y controladores, incluyendo respuestas completas. Deben reemplazarse por un logger con niveles configurables y evitar exponer datos innecesarios.

## Prioridad baja

### 7. Tipado débil

Persisten usos de `any`, especialmente en `ProductosService` y en respuestas HTTP. Esto oculta incompatibilidades entre los DTO del backend y los modelos del frontend.

Debe priorizarse el tipado de respuestas de productos, imágenes, marcas, categorías y variantes.

### 8. Normalización de productos dispersa

La normalización de `imagen_url`, `imagenes`, `marca`, `categoria` e IDs está concentrada en el frontend, mientras que varias respuestas del backend tienen formas diferentes.

Se debe definir un contrato de respuesta único o centralizar formalmente el mapeo para evitar lógica especial por pantalla.

### 9. Advertencias de iconos en tests

Los tests del frontend muestran advertencias del tipo `No icon named ... was found`. No bloquean actualmente las pruebas, pero indican que los mocks de iconos no reflejan completamente los nombres registrados por la aplicación.

Debe corregirse la configuración de iconos de los tests para que una ausencia real no quede oculta entre advertencias.

### 10. Cobertura del componente de imágenes

El componente `SubidorImagenes` debe contar con pruebas propias para:

- Selección de imagen principal.
- Orden de slots.
- Eliminación y reemplazo.
- Cantidad máxima.
- Tipos y tamaños inválidos.
- Reinicio del componente.

## Criterio de cierre

Estos pendientes podrán considerarse resueltos cuando:

1. Exista un contrato de validación compartido o pruebas de contrato entre frontend y backend.
2. El alta de productos tenga cobertura integrada con imágenes y variantes.
3. Los errores operativos sean accionables para el administrador.
4. Los logs de producción sean seguros y configurables.
5. No queden advertencias de configuración durante la suite de pruebas.

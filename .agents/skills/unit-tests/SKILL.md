---
name: unit-tests
description: Genera tests unitarios siguiendo las convenciones del proyecto Mercado Sinérgico (Angular zoneless + Vitest en front, NestJS + Prisma en back)
---

Cuando se invoque esta skill para generar tests unitarios:

## Reglas generales
- Usar el framework ya configurado en el proyecto (Vitest en frontend, el que corresponda en backend). Nunca instalar uno nuevo sin preguntar.
- No modificar código de producción salvo que sea estrictamente necesario para hacerlo testeable. Si es necesario, preguntar antes.
- Usar mocks para dependencias externas: Prisma, HttpClient, servicios de Cloudinary, MercadoPago.
- Nombrar cada test describiendo el comportamiento que valida, nunca "test 1", "test 2".
- Agrupar tests con describe/it anidados por método o función.
- Al terminar, ejecutar los tests realmente y mostrar el resultado, nunca asumir que pasan.

## Casos de negocio prioritarios del dominio (Mercado Sinérgico)
Al testear lógica relacionada a estos temas, cubrir siempre:

- Tipo de producto: Sinérgico nunca requiere stockFisico; Energético sin plantilla requiere stock; Energético con plantilla no permite stock directo.
- Variantes: stock inicial debe ser 0 para Energético y null para Sinérgico al generar variantes automáticas.
- Combinabilidad de variantes: una variante con activo=false nunca debe ser combinable ni seleccionable. Si no existe combinación válida, debe devolver null sin excepciones.
- Stock: nunca debe poder guardarse un stockFisico negativo, ni en actualización individual ni en bulk.
- Bulk update de variantes: debe rechazar si alguna variante no pertenece al producto indicado.
- Cálculo de disponibilidad real: si cuposRestantesPaquete <= 0, la disponibilidad es 0 sin importar el stock. Si la variante es Sinérgica (stockFisico null), el límite es solo el cupo del paquete. Si es Energético, el límite es el mínimo entre cupo y stock.
- Eliminación en cascada: borrar un producto debe borrar sus variantes, imágenes y relaciones de paquete base. No debe poder eliminarse una variante con pedidos asociados.

## Formato de salida
Antes de escribir el test, mostrar un resumen breve de qué casos se van a cubrir.
Después de correr los tests, reportar cuántos pasaron/fallaron y por qué si hay fallos.

# Contrato de Almacenamiento de Entidades

## Propósito

La aplicación almacena los registros de entidad localmente en el navegador usando `localStorage`.

## Forma de los Datos

Cada registro de entidad debe incluir:

- `id`: cadena única
- `entity_id`: cadena única, generada automáticamente, usada para vincular documentos
- `name`: cadena no vacía
- `code`: cadena no vacía
- `taxId`: cadena opcional (identificación fiscal)
- `email`: cadena opcional con formato de correo válido cuando está presente
- `phone`: cadena opcional
- `address`: cadena opcional
- `category`: cadena opcional
- `description`: cadena opcional
- `targetDate`: cadena de fecha opcional (YYYY-MM-DD) válida cuando está presente
- `creditLimit`: número opcional no negativo
- `paymentTerms`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

## Operaciones

- `loadEntities()`: devuelve todas las entidades almacenadas.
- `saveEntities(entities)`: persiste la lista completa.
- `addEntity(entity)`: añade una nueva entidad.
- `updateEntity(id, updates)`: actualiza una entidad existente.
- `deleteEntity(id)`: elimina una entidad por id.
- `hasStoredEntities()`: devuelve `true` si la clave de entidades existe en `localStorage` (aunque la lista esté vacía); `false` en el primer arranque. Usado por la siembra de demostración para decidir si debe ejecutarse.

## Siembra de Datos de Demostración (`src/seed.js`)

- `SEED_PRODUCTS`: lista fija de tres productos de supermercado (`Arroz Blanco 1 kg`/`AR-1001`, `Leche Entera 1 L`/`LE-1002`, `Aceite Vegetal 900 ml`/`AC-1003`), con `category` = `Producto terminado` y sin `stockMin`.
- `seedDemoProducts()`: si `hasStoredEntities()` devuelve `false`, crea los tres productos con `addEntity()` y devuelve el número de productos creados; si la clave ya existe, no hace nada y devuelve `0`. Idempotente: nunca duplica ni recrea productos eliminados por el usuario.
- Se invoca únicamente desde `src/main.js` antes de `initApp()`, de modo que la suite de pruebas (que importa `initApp` de `src/app.js`) no queda afectada.

Expectativas de validación de la siembra:

- Cada producto sembrado debe pasar la validación normal (`name` y `code` obligatorios, `code` único sin distinguir mayúsculas/minúsculas).
- Si la siembra falla (p. ej., código duplicado preexistente), la aplicación debe continuar arrancando; la siembra nunca bloquea el arranque.

## Almacenamiento de Documentos

Cada registro de documento debe incluir:

- `id`: cadena única
- `entity_id`: el entity_id autogenerado de la entidad vinculada
- `series`: cadena opcional que agrupa folios consecutivos
- `folio`: entero positivo obligatorio; junto con la serie forma el número oficial del documento
- `startDate`: cadena de fecha de calendario válida
- `endDate`: cadena de fecha de calendario válida, igual o posterior a startDate
- `quantity`: entero positivo opcional
- `subtotal`: número no negativo opcional
- `discount`: número no negativo opcional; no puede superar el subtotal
- `taxAmount`: número no negativo opcional
- `totalAmount`: número no negativo opcional
- `currency`: cadena opcional
- `paymentTerms`: cadena opcional
- `notes`: cadena opcional
- `status`: cadena opcional
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

Operaciones:

- `loadDocuments()`: devuelve todos los documentos almacenados.
- `saveDocuments(documents)`: persiste la lista completa.
- `addDocument(document)`: añade un nuevo documento.
- `updateDocument(id, updates)`: actualiza un documento existente.
- `deleteDocument(id)`: elimina un documento por id.
- `deleteDocumentsForEntity(entityId)`: elimina todos los documentos vinculados a una entidad eliminada.

## Expectativas de Validación

- Un `name` o `code` faltante debe rechazarse antes de la persistencia.
- Un `email` presente debe tener formato de correo válido y un `creditLimit` presente debe ser un número no negativo.
- Un documento sin `folio` entero positivo debe rechazarse; un `discount` mayor que el `subtotal` debe rechazarse.
- Un entity_id debe generarse automáticamente y debe ser único.
- Un documento sin un `entity_id` que coincida con una entidad existente debe rechazarse.
- Eliminar una entidad también debe eliminar todos los documentos vinculados a su entity_id.
- Las operaciones de almacenamiento deben preservar el orden actual de la lista y actualizar las marcas de tiempo.

## Expectativas de Extensibilidad

- Los campos adicionales añadidos por módulos personalizados deben persistirse junto a los campos base sin manejo especial en la capa de almacenamiento.
- Las operaciones base anteriores permanecen estables para que los módulos personalizados puedan construir sobre ellas sin modificación.

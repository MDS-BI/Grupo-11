# Modelo de Datos: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Entidad: Entity (registro de datos maestros)

Representa el dato maestro central del módulo (p. ej., cliente, proveedor, artículo) con su identidad fiscal, contacto y condiciones comerciales.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador interno único del registro de entidad | Obligatorio, generado automáticamente |
| entity_id | string | Identificador público usado para vincular documentos a esta entidad | Obligatorio, generado automáticamente, único |
| name | string | Nombre o razón social de la entidad | Obligatorio, no vacío |
| code | string | Código o clave de negocio que identifica la entidad | Obligatorio, no vacío |
| taxId | string | Identificación fiscal de la entidad (p. ej., RFC, NIT, CUIT) | Opcional; se almacena recortada cuando se proporciona |
| email | string | Correo electrónico principal de contacto | Opcional; debe tener formato de correo válido si se proporciona |
| phone | string | Teléfono de contacto | Opcional |
| address | string | Dirección fiscal o comercial | Opcional |
| category | string | Clasificación opcional como tipo, grupo o clase | Opcional |
| description | string | Descripción corta o notas | Opcional |
| targetDate | string | Fecha objetivo opcional en formato YYYY-MM-DD; los módulos personalizados definen su significado (p. ej., fecha de vencimiento, fecha de revisión) | Opcional, debe ser una fecha de calendario válida si se proporciona |
| creditLimit | number | Límite de crédito extendido a la entidad en la moneda configurada | Opcional, debe ser un número no negativo |
| paymentTerms | string | Condiciones de pago acordadas (p. ej., contado, neto 30) | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó la entidad | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización de la entidad | Obligatorio |

## Entidad: Document (registro transaccional)

Representa un documento transaccional vinculado a una entidad (p. ej., pedido, factura, contrato), identificado por serie y folio y con desglose económico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del documento | Obligatorio, generado automáticamente |
| entity_id | string | Identificador de la entidad a la que pertenece este documento | Obligatorio, debe referenciar el entity_id de una entidad existente |
| series | string | Serie del documento (p. ej., FAC, A, NV) que agrupa folios consecutivos | Opcional |
| folio | number | Folio consecutivo que, junto con la serie, forma el número oficial del documento | Obligatorio, debe ser un entero positivo |
| startDate | string | Fecha de inicio en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| endDate | string | Fecha de fin en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida, debe ser igual o posterior a startDate |
| quantity | number | Cantidad asociada al documento | Opcional, debe ser un entero positivo |
| subtotal | number | Importe antes de descuentos e impuestos | Opcional, debe ser un número no negativo |
| discount | number | Descuento aplicado sobre el subtotal | Opcional, debe ser un número no negativo y no puede superar el subtotal |
| taxAmount | number | Impuesto calculado para el documento | Opcional, debe ser un número no negativo |
| totalAmount | number | Importe total del documento en la moneda configurada | Opcional, debe ser un número no negativo |
| currency | string | Código de moneda para los importes del documento (p. ej., MXN, USD, EUR) | Opcional |
| paymentTerms | string | Condiciones de pago del documento (p. ej., contado, neto 30) | Opcional |
| notes | string | Notas u observaciones libres del documento | Opcional |
| status | string | Estado del documento como borrador, pendiente, aprobado o cancelado | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó el documento | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del documento | Obligatorio |

## Entidad: ModuleConfig

Objeto de configuración cargado al arrancar que adapta el módulo base en un módulo específico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| moduleName | string | Nombre visible del módulo adaptado | Obligatorio, no vacío |
| labels | object | Mapeos de términos como `{ entity: "Cliente", entities: "Clientes", document: "Pedido de Venta", documents: "Pedidos de Venta" }` | Opcional; retrocede a Entidad/Documento |
| customFields | array | Definiciones de campos por tipo de registro: `{ target: "entity"\|"document", key, label, type: "text"\|"number"\|"date"\|"select", required: boolean, options?: string[] }` | Opcional; las claves NO DEBEN chocar con nombres de campos base |
| statusLifecycle | object | Estados ordenados y transiciones permitidas para documentos, p. ej., `{ statuses: ["cotización", "pedido", "facturado"], transitions: { cotización: ["pedido"], pedido: ["facturado"], facturado: [] } }` | Opcional |
| theme | object | Opciones de marca, p. ej., `{ accentColor: "#0f62fe" }`; aplicado como propiedad personalizada de CSS en todo el marco del espacio de trabajo | Opcional; accentColor debe ser un color CSS válido o retrocede al predeterminado |

## Entidad: Warehouse (almacén)

Representa un lugar físico donde se almacena inventario (p. ej., almacén central, bodega de tránsito, sucursal).

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del almacén | Obligatorio, generado automáticamente |
| code | string | Código o clave de negocio del almacén | Obligatorio, no vacío, único |
| name | string | Nombre del almacén | Obligatorio, no vacío |
| address | string | Dirección del almacén | Opcional |
| description | string | Descripción corta o notas | Opcional |
| active | boolean | Indica si el almacén puede recibir movimientos | Opcional; por defecto verdadero |
| createdAt | string | Marca de tiempo de cuándo se creó el almacén | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del almacén | Obligatorio |

## Entidad: Lot (lote)

Representa un lote de un artículo para dar trazabilidad y controlar vencimientos.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del lote | Obligatorio, generado automáticamente |
| entity_id | string | Identificador del artículo al que pertenece el lote | Obligatorio, debe referenciar el entity_id de una entidad existente |
| lotNumber | string | Número o clave del lote | Obligatorio, no vacío; único por artículo |
| manufactureDate | string | Fecha de fabricación en formato YYYY-MM-DD | Opcional, debe ser una fecha de calendario válida |
| expiryDate | string | Fecha de vencimiento en formato YYYY-MM-DD | Opcional, debe ser una fecha de calendario válida y no anterior a manufactureDate |
| createdAt | string | Marca de tiempo de cuándo se creó el lote | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del lote | Obligatorio |

## Entidad: DocumentLine (partida de documento)

Representa una línea de un documento con el artículo, la cantidad y el precio, y el almacén que se afecta.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la partida | Obligatorio, generado automáticamente |
| document_id | string | Identificador del documento al que pertenece la partida | Obligatorio, debe referenciar el id de un documento existente |
| entity_id | string | Identificador del artículo de la partida | Obligatorio, debe referenciar el entity_id de una entidad existente |
| warehouse_id | string | Almacén afectado por la partida | Opcional, debe referenciar el id de un almacén existente |
| lot_id | string | Lote del artículo de la partida | Opcional, debe referenciar el id de un lote del mismo artículo |
| quantity | number | Cantidad del artículo en la partida | Obligatorio, debe ser un entero positivo |
| unitPrice | number | Precio o costo unitario del artículo | Opcional, debe ser un número no negativo |
| discount | number | Descuento aplicado a la partida | Opcional, debe ser un número no negativo y no puede superar quantity × unitPrice |
| notes | string | Notas u observaciones de la partida | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó la partida | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización de la partida | Obligatorio |

## Entidad: StockMovement (movimiento de inventario)

Representa una entrada, salida, traslado o ajuste de inventario. El saldo de un artículo se obtiene sumando sus movimientos y no se edita directamente.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del movimiento | Obligatorio, generado automáticamente |
| entity_id | string | Identificador del artículo movido | Obligatorio, debe referenciar el entity_id de una entidad existente |
| warehouse_id | string | Almacén donde ocurre el movimiento | Obligatorio, debe referenciar el id de un almacén existente |
| lot_id | string | Lote del artículo movido | Opcional, debe referenciar el id de un lote del mismo artículo |
| document_id | string | Documento que origina el movimiento | Opcional, debe referenciar el id de un documento existente |
| type | string | Tipo de movimiento: entrada, salida, traslado o ajuste | Obligatorio |
| quantity | number | Cantidad movida | Obligatorio, debe ser un entero positivo (el signo lo determina el tipo) |
| unitCost | number | Costo unitario del movimiento | Opcional, debe ser un número no negativo |
| movementDate | string | Fecha del movimiento en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| notes | string | Notas u observaciones del movimiento | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó el movimiento | Obligatorio |

## Reglas de ModuleConfig

- La configuración se carga una vez al arrancar y se aplica en todas las pantallas.
- Cuando la configuración está ausente, se aplican los valores predeterminados integrados: etiquetas Entidad/Documento, sin campos personalizados, estado de texto libre, color de acento predeterminado.
- Los valores inválidos o conflictivos deben informarse con claridad en lugar de fallar silenciosamente.
- Las claves de campos personalizados no deben chocar con los nombres de campos base (`id`, `entity_id`, `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`, `series`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `notes`, `status`).
- Los valores de campos personalizados se persisten junto a los campos base sin cambios de esquema en el almacenamiento.
- Un ciclo de vida configurado reemplaza la entrada de estado de texto libre; sin uno, el estado permanece como texto libre.

## Reglas de Validación

### Entidad

- Una entidad debe incluir un nombre no vacío.
- Una entidad debe incluir un código no vacío.
- La identificación fiscal, teléfono, dirección, categoría, descripción y condiciones de pago son opcionales pero deben almacenarse como cadenas recortadas.
- El correo electrónico es opcional pero, cuando está presente, debe tener formato de correo válido.
- El límite de crédito es opcional pero, cuando está presente, debe ser un número no negativo.
- La fecha objetivo es opcional pero, cuando está presente, debe ser una fecha de calendario válida en formato YYYY-MM-DD.
- Un entity_id debe generarse automáticamente y debe ser único entre todas las entidades.

### Documento

- Un documento debe referenciar una entidad existente mediante entity_id.
- Un documento debe incluir un folio entero positivo; la serie es opcional y, cuando existe, se combina con el folio para formar el número oficial del documento (p. ej., `FAC-1001`).
- Un documento debe incluir fechas de inicio y fin válidas; la fecha de fin debe ser igual o posterior a la fecha de inicio.
- La cantidad es opcional y debe ser un entero positivo.
- Subtotal, descuento, impuesto e importe total son opcionales y deben ser números no negativos; el descuento no puede superar el subtotal.
- La aplicación debe normalizar el texto para un comportamiento de búsqueda consistente.

> Nota: el cálculo automático de totales (p. ej., `total = subtotal - descuento + impuesto`) queda como punto de extensión; el módulo base valida cada importe de forma independiente para evitar sorpresas por redondeo.

### Almacén

- Un almacén debe incluir un código y un nombre no vacíos.
- El código del almacén debe ser único entre todos los almacenes.

### Lote

- Un lote debe referenciar un artículo existente mediante entity_id y debe incluir un número de lote no vacío, único por artículo.
- La fecha de vencimiento, cuando está presente, no puede ser anterior a la fecha de fabricación.

### Partida de documento

- Una partida debe referenciar un documento existente y un artículo existente.
- La cantidad debe ser un entero positivo.
- Si se indica un lote, debe pertenecer al mismo artículo de la partida.

### Movimiento de inventario

- Un movimiento debe referenciar un artículo y un almacén existentes.
- El tipo debe ser uno de: entrada, salida, traslado o ajuste.
- Una salida no puede dejar el saldo del artículo en el almacén por debajo de cero.
- Los movimientos no se editan ni se eliminan; una corrección se registra con un movimiento de ajuste.

## Relaciones

- Cada entidad se almacena independientemente y aparece como una única fila en la lista de entidades.
- Cada entidad tiene un entity_id usado para conectarse a sus documentos.
- Cada documento pertenece exactamente a una entidad, vinculada por el entity_id de la entidad.
- Cuando se elimina una entidad, todos los documentos que referencian su entity_id también se eliminan.
- Las operaciones de búsqueda se realizan sobre los registros de entidad almacenados, incluyendo identidad fiscal, contacto y condiciones comerciales.
- Cada partida pertenece exactamente a un documento y a un artículo (una entidad).
- Cuando se elimina un documento, sus partidas también se eliminan.
- Cada lote pertenece exactamente a un artículo (una entidad).
- Cada movimiento de inventario referencia un artículo y un almacén, y opcionalmente un lote y un documento.
- El saldo de un artículo por almacén (y por lote) es la suma de sus movimientos.
- Una entidad que tenga movimientos de inventario no puede eliminarse, para conservar el historial del inventario.

## Notas de Extensibilidad

- Los módulos personalizados pueden añadir campos específicos del dominio a cualquiera de los dos tipos de registro; los campos base anteriores deben mantener sus nombres y semántica para que el almacenamiento, la validación y la integridad referencial permanezcan intactos.
- El campo `status` es intencionadamente de texto libre a nivel base para que cada módulo personalizado pueda imponer su propio ciclo de vida (p. ej., estados de pedidos, estados de aprobación).
- La unicidad de folio por serie, las partidas de documento (líneas con producto, cantidad y precio) y la numeración automática son puntos de extensión naturales para módulos que los requieran.

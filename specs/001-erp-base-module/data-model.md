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
| stockMin | number | Stock mínimo por producto para marcar "stock bajo" cuando el saldo total queda por debajo (HU 9) | Opcional; debe ser un entero no negativo; vacío = sin mínimo |
| createdAt | string | Marca de tiempo de cuándo se creó la entidad | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización de la entidad | Obligatorio |

## Entidad: Document (registro transaccional)

Representa un documento transaccional vinculado a una entidad (p. ej., pedido, factura, contrato), identificado por serie y folio y con desglose económico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del documento | Obligatorio, generado automáticamente |
| entity_id | string | Identificador de la entidad a la que pertenece este documento | Obligatorio, debe referenciar el entity_id de una entidad existente |
| type | string | Tipo de documento: `orden-compra` o `remision` (HU 10) | Obligatorio; uno de los valores soportados por el módulo |
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
| direction | string | Signo del efecto en el saldo: `in` (suma) o `out` (resta) | Obligatorio; entrada=`in`, salida=`out`, traslado por la pierna (origen=`out`, destino=`in`), ajuste=`in`\|`out` según la corrección |
| transferId | string | Clave del traslado al que pertenece esta pierna (solo type=traslado) | Obligatorio cuando type=traslado; debe referenciar el id de un traslado existente |
| leg | string | Pierna del traslado: `origin` o `destination` | Obligatorio cuando type=traslado |
| returnId | string | Devolución que originó este ajuste (solo ajustes generados por una devolución) | Opcional; debe referenciar el id de una devolución existente |
| quantity | number | Cantidad movida | Obligatorio, debe ser un entero positivo (el signo lo determina `direction`) |
| unitCost | number | Costo unitario del movimiento | Opcional, debe ser un número no negativo |
| movementDate | string | Fecha del movimiento en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| notes | string | Notas u observaciones del movimiento | Opcional |
| status | string | Estado actual del movimiento en su ciclo de vida (HU 12) | Opcional; con ciclo de vida configurado debe ser una transición válida y se registra junto con `statusChangedAt`; sin ciclo de vida, permanece como texto libre (FR-031) |
| statusChangedAt | string | Marca de tiempo de la última transición de estado del movimiento | Opcional; se actualiza cada vez que cambia `status` |
| createdAt | string | Marca de tiempo de cuándo se creó el movimiento | Obligatorio |

## Entidad: Transfer (encabezado de traslado)

Representa un traslado entre dos bodegas distintas. Cada línea del traslado se materializa como dos movimientos `traslado` (pierna de origen y pierna de destino) que comparten el `transferId`; el encabezado mantiene la referencia y el estado del conjunto.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del traslado | Obligatorio, generado automáticamente |
| reference | string | Referencia visible del traslado (p. ej., TR-0001) | Obligatorio, generado automáticamente, único |
| origin_warehouse_id | string | Bodega de origen | Obligatorio; debe referenciar una bodega existente, activa y distinta del destino |
| destination_warehouse_id | string | Bodega de destino | Obligatorio; debe referenciar una bodega existente, activa y distinta del origen |
| date | string | Fecha del traslado en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| notes | string | Notas u observaciones del traslado | Opcional |
| status | string | Estado del ciclo de vida del traslado (HU 12) | Obligatorio; inicia en el primer estado del ciclo configurado y solo cambia por transiciones permitidas |
| statusChangedAt | string | Marca de tiempo de la última transición de estado | Opcional; se actualiza en cada transición |
| createdAt | string | Marca de tiempo de cuándo se creó el traslado | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del traslado | Opcional |

Las líneas del traslado no se duplican en una tabla propia: cada línea queda representada por su par de movimientos `traslado` (pierna `origin` con `direction=out` y pierna `destination` con `direction=in`), ambos con el mismo `entity_id`, `quantity`, `lot_id` opcional y `transferId`.

## Entidad: Return (devolución)

Representa la devolución de cantidad despachada hacia la bodega de origen, vinculada al movimiento o traslado original. Los efectos de stock se materializan como movimientos `ajuste` cuando la devolución pasa a "Recibida en bodega".

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la devolución | Obligatorio, generado automáticamente |
| movement_kind | string | Tipo de referencia: `movement` (salida) o `transfer` (traslado) | Obligatorio; uno de los dos valores |
| movement_id | string | Referencia al movimiento original o al id del traslado original | Obligatorio; según `movement_kind` debe existir la salida (en estado final de entrega) o el traslado (en estado `Recibido`) |
| entity_id | string | Artículo devuelto; obligatorio cuando el traslado original tiene varias líneas | Opcional para salidas (se deriva del movimiento) |
| warehouse_id | string | Bodega de origen a la que regresa la mercancía | Opcional; se deriva del original |
| reason | string | Motivo de la devolución | Obligatorio; debe pertenecer a la lista controlada (Dañado, Error de pedido, Rechazo del cliente, Vencido) |
| quantity_good | number | Cantidad en condiciones devuelta a bodega | Obligatorio, entero no negativo |
| quantity_damaged | number | Cantidad dañada o merma (no afecta stock) | Obligatorio, entero no negativo |
| notes | string | Notas u observaciones | Opcional |
| status | string | Estado del ciclo de vida de la devolución (HU 14) | Obligatorio; inicia en `Solicitada` y solo cambia por transiciones permitidas |
| statusChangedAt | string | Marca de tiempo de la última transición de estado | Opcional |
| stockApplied | boolean | Indica si los ajustes de stock ya fueron generados | Obligatorio; solo se vuelve verdadero al pasar a `Recibida en bodega` |
| createdAt | string | Marca de tiempo de cuándo se creó la devolución | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización | Opcional |

## Reglas de ModuleConfig

- La configuración se carga una vez al arrancar y se aplica en todas las pantallas.
- Cuando la configuración está ausente, se aplican los valores predeterminados integrados del módulo Logística e Inventario: etiquetas Productos/Movimientos/Bodegas, sin campos personalizados, estado de texto libre, color de acento predeterminado.
- Los valores inválidos o conflictivos deben informarse con claridad en lugar de fallar silenciosamente.
- Las claves de campos personalizados no deben chocar con los nombres de campos base (`id`, `entity_id`, `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`, `stockMin`, `series`, `type`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `notes`, `status`, `statusChangedAt`, `warehouse_id`, `movementDate`, `direction`, `transferId`, `leg`, `lot_id`, `reason`, `quantity_good`, `quantity_damaged`).
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
- Cuando hay un ciclo de vida configurado, el `status` de un movimiento solo puede cambiar mediante transiciones permitidas y el cambio registra su fecha en `statusChangedAt`.
- Un movimiento con `status` `Cancelado` (o anulado) no altera el saldo, aunque sea visible en el historial.
- Solo el módulo crea movimientos `traslado`, siempre como par de piernas vinculadas a un traslado existente.

### Traslado

- El traslado debe tener origen y destino distintos; ambas bodegas deben existir y estar activas al crearlo y al despacharlo.
- Cada línea debe indicar un artículo existente y una cantidad entero positiva; no se permiten líneas duplicadas por artículo.
- El saldo disponible en la bodega de origen debe ser suficiente al crear y al despachar el traslado.
- El efecto en el saldo lo gobierna el ciclo de vida (HU 12): la pierna de origen descuenta al despachar y la pierna de destino suma al recibir; cancelar un traslado en `Solicitado` no altera saldo.

### Devolución

- La cantidad total (`quantity_good` + `quantity_damaged`) no puede superar la cantidad despachada menos las devoluciones previas no rechazadas del mismo original.
- El motivo debe pertenecer a la lista controlada de motivos.
- La merma (`quantity_damaged`) nunca altera el stock; solo `quantity_good` genera ajustes al recibir.
- Los ajustes generados son movimientos `ajuste` inmutables que apuntan a la devolución mediante `returnId` y solo se crean una vez.

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
- El saldo de un artículo por almacén (y por lote) es la suma de sus movimientos efectivos.
- Una entidad que tenga movimientos de inventario no puede eliminarse, para conservar el historial del inventario.
- Un traslado encabeza dos movimientos por línea (origen y destino) que comparten `transferId` y reflejan el mismo estado que el encabezado.
- Una devolución referencia exactamente una salida o un traslado y, al recibir, genera los movimientos `ajuste` que restauran stock en la bodega de origen.

## Notas de Extensibilidad

- Los módulos personalizados pueden añadir campos específicos del dominio a cualquiera de los dos tipos de registro; los campos base anteriores deben mantener sus nombres y semántica para que el almacenamiento, la validación y la integridad referencial permanezcan intactos.
- El campo `status` es intencionadamente de texto libre a nivel base para que cada módulo personalizado pueda imponer su propio ciclo de vida (p. ej., estados de pedidos, estados de aprobación).
- La unicidad de folio por serie, las partidas de documento (líneas con producto, cantidad y precio) y la numeración automática son puntos de extensión naturales para módulos que los requieran.

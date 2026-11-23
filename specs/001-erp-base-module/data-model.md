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
| stockMin | number | Stock mínimo por producto para marcar "stock bajo" cuando el disponible total (físico menos reservas activas) queda por debajo (HU 9) | Opcional; debe ser un entero no negativo; vacío = sin mínimo |
| createdAt | string | Marca de tiempo de cuándo se creó la entidad | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización de la entidad | Obligatorio |

### Datos de demostración (siembra en el primer arranque)

Para que la implementación muestre datos desde el arranque, el punto de entrada (`src/main.js`) siembra tres productos de supermercado mediante `src/seed.js`:

| name | code | category | stockMin |
|---|---|---|---|
| Arroz Blanco 1 kg | AR-1001 | Producto terminado | vacío |
| Leche Entera 1 L | LE-1002 | Producto terminado | vacío |
| Aceite Vegetal 900 ml | AC-1003 | Producto terminado | vacío |

Reglas de la siembra:

- Solo se ejecuta si `localStorage` aún no contiene la clave de entidades (primer arranque); es idempotente y no vuelve a crear los productos si el usuario los elimina.
- Solo crea el registro maestro de cada producto: sin bodega, movimientos ni lotes asociados, por lo que su saldo es 0.
- No asigna `stockMin`, de modo que ninguno aparece marcado como "stock bajo" de fábrica.
- Los identificadores (`id`, `entity_id`) y las marcas de tiempo se generan con las mismas operaciones de almacenamiento que cualquier alta manual, de modo que las validaciones de unicidad de `code` aplican igual.
- La suite de pruebas no se ve afectada: las pruebas importan `initApp` de `src/app.js` y no pasan por `src/main.js`.

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

## Entidad: User (usuario de acceso)

Representa una cuenta de usuario para iniciar sesión en el espacio de trabajo. No hay registro libre: en el primer arranque se siembra un usuario admin por defecto (HU 17, FR-062). La contraseña se almacena únicamente como hash con sal, nunca en claro (FR-059).

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del usuario | Obligatorio, generado automáticamente |
| username | string | Nombre de usuario para iniciar sesión | Obligatorio, no vacío, único (comparación sin distinguir mayúsculas/minúsculas) |
| passwordHash | string | Hash SHA-256 de la contraseña combinada con la sal, en hexadecimal | Obligatorio; generado a partir de `password` + `salt`; nunca se almacena la contraseña en claro |
| salt | string | Sal aleatoria única por usuario, en hexadecimal | Obligatorio, generado automáticamente con `crypto.getRandomValues` |
| createdAt | string | Marca de tiempo de creación | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización | Obligatorio |

## Entidad: Session (sesión iniciada)

Indicador de sesión persistida en `localStorage` hasta que el usuario la cierre (FR-060). No tiene ciclo de vida: existe o no existe.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| username | string | Usuario autenticado | Obligatorio; debe corresponder a un usuario existente |
| loggedInAt | string | Marca de tiempo de inicio de la sesión | Obligatorio |

La sesión se elimina únicamente al cerrar sesión (FR-061), que limpia solo este indicador y conserva intactos todos los demás datos almacenados.

## Entidad: ModuleConfig

Objeto de configuración cargado al arrancar que adapta el módulo base en un módulo específico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| moduleName | string | Nombre visible del módulo adaptado | Obligatorio, no vacío |
| labels | object | Mapeos de términos como `{ entity: "Cliente", entities: "Clientes", document: "Pedido de Venta", documents: "Pedidos de Venta" }` | Opcional; retrocede a Entidad/Documento |
| customFields | array | Definiciones de campos por tipo de registro: `{ target: "entity"\|"document", key, label, type: "text"\|"number"\|"date"\|"select", required: boolean, options?: string[] }` | Opcional; las claves NO DEBEN chocar con nombres de campos base |
| statusLifecycle | object | Estados ordenados y transiciones permitidas por tipo de registro: `references`, `documents`, `movements` y `returns` (p. ej., `{ documents: { statuses: ["cotización", "pedido", "facturado"], transitions: { cotización: ["pedido"], pedido: ["facturado"], facturado: [] } } }`). `references` cubre los ciclos de documentos referenciados por movimientos y traslados. Incluye los ciclos predeterminados de orden de compra, salida, traslado y devolución; las tomas de inventario usan un ciclo fijo y no configurable | Opcional; si falta, el estado permanece como texto libre |
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

Representa una entrada, salida, traslado o ajuste de inventario. El saldo de un artículo se obtiene sumando sus movimientos y no se edita directamente. Los movimientos de tipo `traslado` solo los crea el sistema, como par de piernas vinculadas a un traslado (ver `Transfer`).

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
| reservationId | string | Reserva que consume este movimiento (solo salidas que consumen una reserva) | Opcional; debe referenciar una reserva `Activa` del mismo artículo y bodega |
| countId | string | Toma de inventario que originó este ajuste | Opcional; obligatorio cuando el ajuste lo genera una toma confirmada |
| reason | string | Motivo del ajuste | Obligatorio en ajustes generados por una toma o una devolución; en el resto es opcional |
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

## Entidad: StockReservation (reserva de stock)

Representa el compromiso de una cantidad de un artículo en una bodega para un pedido pendiente. No crea movimientos ni altera el saldo físico: reduce el **disponible**. El saldo pendiente de una reserva es `quantity - releasedQuantity`.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la reserva | Obligatorio, generado automáticamente |
| entity_id | string | Artículo reservado | Obligatorio; debe referenciar una entidad existente |
| warehouse_id | string | Bodega donde se reserva | Obligatorio; debe referenciar un almacén existente y activo |
| quantity | number | Cantidad reservada original | Obligatorio, entero positivo |
| reference | string | Referencia del pedido que origina la reserva | Obligatorio, no vacío |
| status | string | Estado: `Activa`, `Consumida`, `Liberada` o `Vencida` | Obligatorio; inicia en `Activa`; una liberación parcial mantiene `Activa` |
| expiresAt | string | Fecha de expiración | Opcional, fecha válida `YYYY-MM-DD`; vence al terminar ese día en hora local |
| movementId | string | Movimiento de salida que consumió la reserva | Opcional; obligatorio cuando `status = Consumida` |
| releasedQuantity | number | Cantidad liberada acumulada | Opcional, entero no negativo, no mayor que `quantity` |
| createdAt | string | Marca de tiempo de creación | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización | Opcional |

## Entidad: StockCount (toma de inventario)

Representa un conteo físico de una bodega. Al confirmarse genera movimientos `ajuste` por cada diferencia y queda inmutable.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la toma | Obligatorio, generado automáticamente |
| reference | string | Referencia visible de la toma (p. ej., TOM-0001) | Obligatorio, generado automáticamente, único |
| warehouse_id | string | Bodega contada | Obligatorio; debe referenciar un almacén existente |
| status | string | Estado: `Borrador`, `En conteo`, `Confirmada` o `Anulada` | Obligatorio; ciclo fijo, no configurable; exige el paso `Borrador → En conteo` antes de confirmar |
| notes | string | Observaciones | Opcional |
| startedAt | string | Fecha de inicio del conteo | Obligatorio |
| confirmedAt | string | Fecha de confirmación | Opcional; obligatorio cuando `status = Confirmada` |
| createdAt | string | Marca de tiempo de creación | Obligatorio |

Una toma en estado `Confirmada` es inmutable: no se edita ni se anula. La anulación solo es posible en `Borrador` o `En conteo`.

## Entidad: StockCountLine (línea de toma)

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la línea | Obligatorio, generado automáticamente |
| count_id | string | Toma a la que pertenece | Obligatorio; debe referenciar una toma existente |
| entity_id | string | Artículo contado | Obligatorio; debe referenciar una entidad existente |
| lot_id | string | Lote contado | Obligatorio si el artículo tiene lotes registrados y el saldo está asociado a un lote; se deja vacío en la línea "sin lote" para saldo físico no asociado; debe pertenecer al mismo artículo |
| systemQuantity | number | Saldo del sistema al iniciar la línea (referencia) | Obligatorio, número no negativo |
| countedQuantity | number | Cantidad contada físicamente | Opcional; entero no negativo; si está vacío, la línea no genera ajuste |
| difference | number | `countedQuantity - saldo vigente al confirmar` | Derivado, no se almacena |
| adjustmentMovementId | string | Movimiento de ajuste generado por la línea | Opcional; obligatorio cuando la toma se confirma y la diferencia no es cero |

## Reglas de ModuleConfig

- La configuración se carga una vez al arrancar y se aplica en todas las pantallas.
- Cuando la configuración está ausente, se aplican los valores predeterminados integrados del módulo Logística e Inventario: etiquetas Productos/Movimientos/Bodegas, sin campos personalizados, estado de texto libre, color de acento predeterminado.
- Los valores inválidos o conflictivos deben informarse con claridad en lugar de fallar silenciosamente.
- Las claves de campos personalizados no deben chocar con los nombres de campos base (`id`, `entity_id`, `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`, `stockMin`, `series`, `type`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `notes`, `status`, `statusChangedAt`, `warehouse_id`, `movementDate`, `direction`, `transferId`, `leg`, `lot_id`, `reason`, `quantity_good`, `quantity_damaged`, `reservationId`, `countId`, `movementId`, `reference`, `expiresAt`, `releasedQuantity`, `count_id`, `systemQuantity`, `countedQuantity`, `startedAt`, `confirmedAt`, `adjustmentMovementId`).
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
- El stock mínimo es opcional; cuando está presente debe ser un entero no negativo y se compara con el disponible total del producto (físico menos los saldos pendientes de reservas activas), no con el saldo de una bodega concreta.

### Documento

- Un documento debe referenciar una entidad existente mediante entity_id.
- Un documento debe incluir un folio entero positivo; la serie es opcional y, cuando existe, se combina con el folio para formar el número oficial del documento (p. ej., `FAC-1001`).
- Un documento debe incluir fechas de inicio y fin válidas; la fecha de fin debe ser igual o posterior a la fecha de inicio.
- La cantidad es opcional y debe ser un entero positivo.
- Subtotal, descuento, impuesto e importe total son opcionales y deben ser números no negativos; el descuento no puede superar el subtotal.
- La aplicación debe normalizar el texto para un comportamiento de búsqueda consistente.

> Nota: el cálculo automático de totales (p. ej., `total = subtotal - descuento + impuesto`) queda como punto de extensión; el módulo base valida cada importe de forma independiente para evitar sorpresas por redondeo.

### Usuario y sesión

- Un usuario debe incluir un nombre de usuario no vacío; la unicidad no distingue mayúsculas/minúsculas.
- La contraseña se transforma en `passwordHash` usando SHA-256 con la `salt` del usuario antes de persistirse; en el almacenamiento nunca debe aparecer la contraseña en claro.
- Al iniciar sesión, las credenciales se validan contra los usuarios almacenados; el rechazo usa un mensaje genérico que no revela si el usuario existe (FR-058).
- En el primer arranque, si no existe ningún usuario registrado, se crea el usuario admin por defecto `admin` con la contraseña `admin123` (FR-062, documentada en el quickstart).
- La sesión se persiste como un único indicador en `erp_base_module:session` y solo se elimina al cerrar sesión; cerrar la sesión no borra entidades, documentos, movimientos ni cualquier otro dato.

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
- Una salida no puede dejar el **disponible** del artículo en el almacén por debajo de cero, salvo que consuma una reserva activa por su saldo pendiente; en ese caso la reserva deja de descontar ese saldo. El disponible es el saldo físico menos los saldos pendientes de reservas activas no vencidas de ese artículo en esa bodega.
- Si se indica un lote, la cantidad no puede superar el saldo físico de ese lote.
- Los movimientos no se editan ni se eliminan; una corrección se registra con un movimiento de ajuste.
- Cuando hay un ciclo de vida configurado, el `status` de un movimiento solo puede cambiar mediante transiciones permitidas y el cambio registra su fecha en `statusChangedAt`.
- Un movimiento con `status` `Cancelado` (o anulado) no altera el saldo, aunque sea visible en el historial.
- Solo el módulo crea movimientos `traslado`, siempre como par de piernas vinculadas a un traslado existente.

### Traslado

- El traslado debe tener origen y destino distintos; ambas bodegas deben existir y estar activas al crearlo y al despacharlo, y la de destino debe seguir activa al recibirlo.
- Cada línea debe indicar un artículo existente y una cantidad entero positiva; no se permiten líneas duplicadas por artículo.
- El disponible en la bodega de origen (saldo físico menos reservas activas) debe ser suficiente al crear y al despachar el traslado; las reservas activas no se trasladan.
- El efecto en el saldo lo gobierna el ciclo de vida (HU 12): la pierna de origen descuenta al despachar y la pierna de destino suma al recibir; cancelar un traslado en `Solicitado` no altera saldo.

### Devolución

- La cantidad total (`quantity_good` + `quantity_damaged`) no puede superar la cantidad despachada menos las devoluciones previas no rechazadas del mismo original.
- El motivo debe pertenecer a la lista controlada de motivos.
- La merma (`quantity_damaged`) nunca altera el stock; solo `quantity_good` genera ajustes al recibir.
- Los ajustes generados son movimientos `ajuste` inmutables que apuntan a la devolución mediante `returnId` y solo se crean una vez.

### Reserva de stock

- Una reserva debe referenciar un artículo y una bodega existentes; la bodega debe estar activa.
- La cantidad debe ser un entero positivo.
- La suma de los saldos pendientes (`quantity - releasedQuantity`) de reservas activas y no vencidas de un artículo en una bodega no puede superar sus existencias físicas.
- Una liberación parcial mantiene la reserva en `Activa` y acumula `releasedQuantity`; solo una liberación total la pasa a `Liberada`.
- Una reserva `Consumida` debe referenciar el movimiento de salida que la consumió, y esa salida debe cubrir el saldo pendiente; si despacha menos, la diferencia se libera antes.
- Una reserva vencida deja de contar para el disponible pero conserva su registro y su estado histórico. La expiración se evalúa al terminar el día de `expiresAt`, de forma perezosa al consultar u operar.
- Si el físico queda por debajo de las reservas activas, el disponible puede ser negativo; se muestra, se advierte y se bloquean nuevas reservas y salidas hasta resolverlo.
- Un artículo con reservas activas o líneas en una toma abierta no puede eliminarse, y una bodega con reservas activas o una toma abierta no puede desactivarse.

### Toma de inventario

- Una toma debe referenciar una bodega existente y tener al menos una línea.
- Solo puede existir una toma en estado `Borrador` o `En conteo` por bodega.
- El avance exige `Borrador → En conteo`; solo se puede confirmar una toma en estado `En conteo`. Una toma `Confirmada` es inmutable y no puede anularse ni editarse.
- `systemQuantity` es una referencia capturada al iniciar la línea; la diferencia se calcula contra el saldo vigente al confirmar.
- Las líneas se generan por producto, por lote cuando el artículo tiene lotes y por una línea "sin lote" cuando existe saldo físico no asociado a lotes.
- Al confirmar, cada línea con `countedQuantity` informada y diferencia distinta de cero genera un movimiento `ajuste` inmutable, con motivo, `countId` y `direction` según el signo de la diferencia.
- La toma no modifica el estado de las reservas; si las reservas activas superan el físico contado, se advierte, se muestra el disponible negativo y se bloquean nuevas reservas y salidas hasta resolverlo.
- Una bodega con una toma abierta no puede desactivarse, y un producto con líneas en una toma abierta no puede eliminarse.

## Relaciones

- Cada entidad se almacena independientemente y aparece como una única fila en la lista de entidades.
- Cada entidad tiene un entity_id usado para conectarse a sus documentos.
- Cada documento pertenece exactamente a una entidad, vinculada por el entity_id de la entidad.
- Cuando se elimina una entidad, todos los documentos y lotes que la referencian también se eliminan; la eliminación se bloquea si tiene movimientos, reservas activas o líneas en una toma abierta.
- Las operaciones de búsqueda se realizan sobre los registros de entidad almacenados, incluyendo identidad fiscal, contacto y condiciones comerciales.
- Cada partida pertenece exactamente a un documento y a un artículo (una entidad).
- Cuando se elimina un documento, sus partidas también se eliminan.
- Cada lote pertenece exactamente a un artículo (una entidad).
- Cada movimiento de inventario referencia un artículo y un almacén, y opcionalmente un lote y un documento.
- El saldo de un artículo por almacén (y por lote) es la suma de sus movimientos efectivos.
- Una entidad que tenga movimientos de inventario no puede eliminarse, para conservar el historial del inventario.
- Un traslado encabeza dos movimientos por línea (origen y destino) que comparten `transferId` y reflejan el mismo estado que el encabezado.
- Una devolución referencia exactamente una salida o un traslado y, al recibir, genera los movimientos `ajuste` que restauran stock en la bodega de origen.
- Una reserva referencia exactamente un artículo y una bodega; no crea movimientos.
- El disponible de un artículo por bodega es su saldo físico menos la suma de los saldos pendientes de sus reservas activas y no vencidas; puede ser negativo si una toma deja el físico por debajo de lo reservado.
- Una toma de inventario referencia exactamente una bodega y contiene una o más líneas por artículo, por lote cuando corresponda y una línea "sin lote" para saldo físico no asociado.
- Al confirmarse, cada línea de la toma con diferencia distinta de cero genera un movimiento `ajuste` con motivo y `countId` que referencia la toma y es inmutable.
- El ajuste de una devolución o de una toma modifica el físico en la dirección de la diferencia, y con ello el disponible, sin alterar las reservas.
- Un usuario referencia exactamente una sesión activa como máximo (una sesión por navegador); la sesión referencia el `username` de un usuario existente.

## Notas de Extensibilidad

- Los módulos personalizados pueden añadir campos específicos del dominio a cualquiera de los dos tipos de registro; los campos base anteriores deben mantener sus nombres y semántica para que el almacenamiento, la validación y la integridad referencial permanezcan intactos.
- El campo `status` es intencionadamente de texto libre a nivel base para que cada módulo personalizado pueda imponer su propio ciclo de vida (p. ej., estados de pedidos, estados de aprobación).
- La unicidad de folio por serie, las partidas de documento (líneas con producto, cantidad y precio) y la numeración automática son puntos de extensión naturales para módulos que los requieran.

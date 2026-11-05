# Inicio Rápido: Módulo de Logística e Inventario (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

La barra lateral ofrece cinco módulos: **Panel, Productos, Movimientos, Bodegas y Buscar**.

1. **Panel**: aterrice en el panel ERP y use un botón de acción rápida (nuevo producto, nuevo movimiento, áreas de gestión o búsqueda) o revise las tarjetas de estadísticas en vivo.
2. **Productos**: cree un producto con nombre, código y categoría; edítelo o elimínelo desde la lista. Desde el detalle del producto abra sus **documentos**, **lotes** y **kardex**.
3. **Bodegas**: cree una bodega con código único (p. ej. `CENTRAL`). Desactívela en lugar de eliminarla si ya tiene movimientos.
4. **Movimientos**: registre una **entrada** (aumenta stock en una bodega), luego una **salida** (reduce stock; sugiere lote FEFO y bloquea saldo negativo). Los movimientos son inmutables: las correcciones se hacen con **ajustes** o **devoluciones**.
5. **Lotes**: desde el detalle del producto cree un lote con número, saldo inicial y fecha de vencimiento; el saldo se recalcula con sus movimientos y los vencidos se excluyen de las salidas.
6. **Buscar**: escriba en la barra de búsqueda (ignora tildes y mayúsculas) y combine filtros de categoría, bodega y "stock bajo"; el detalle de producto se abre en modo solo lectura con retorno a los resultados.
7. **Traslados**: desde *Gestionar traslados* (cabecera de Movimientos) cree un traslado origen → destino con líneas por producto; despáchelo (descuenta el origen) y recíbalo (abona el destino). El stock total no cambia, solo se redistribuye.
8. **Devoluciones**: en el panel *Devoluciones* (dentro de Movimientos) pulse **Devolver** en una salida o en un traslado recibido; registre motivo y cantidades (buen estado + dañada). Lleve la devolución por su ciclo: `Solicitada → Aprobada → Recibida en bodega → Cerrada` (o `Rechazada`); el stock solo sube al recibirla en bodega y solo en la cantidad en buen estado (la merma no vuelve al stock).
9. Actualice la página para confirmar que los registros persisten en el almacenamiento local y que el marco con marca (logotipo, nombre del módulo) permanece consistente.

## Validación

- Verifique que los campos obligatorios muestran errores de validación (`aria-invalid` + mensaje asociado).
- Verifique que una salida no puede dejar saldo negativo y que el mensaje indica el saldo disponible.
- Verifique que un producto con código duplicado o una bodega con código repetido se rechazan.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe y que los scripts en nombres de producto se muestran como texto (XSS).
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.
- Verifique que un traslado solo pasa de `Despachado` a `Recibido` mediante las transiciones permitidas y que un despacho sin saldo se rechaza.
- Verifique que una devolución rechaza motivos fuera de la lista, cantidades superiores a lo despachado y traslados que no estén en `Recibido`.
- Verifique que el stock de una devolución solo cambia al llevarla a `Recibida en bodega` y que el movimiento original conserva su cantidad.
- Verifique que los estados finales (`Cerrada`, `Rechazada`, `Cancelado`) no ofrecen más transiciones.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej. Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados por tipo de registro (`documents`, `movements`, `returns`) y las transiciones permitidas (p. ej. cotización → pedido → facturado); los movimientos sin ciclo se efectivizan de inmediato.
4. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.

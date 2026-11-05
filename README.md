# Módulo de Logística e Inventario - ERP (Grupo 11)

Aplicación web de una sola página construida sobre el módulo base de un sistema ERP (Planificación de Recursos Empresariales), enfocada en la gestión de logística e inventario. La interfaz está completamente en **español** y utiliza Vite con HTML, CSS y JavaScript puro (vanilla), sin framework de interfaz pesado, persistiendo los datos en el `localStorage` del navegador.

## Autores

- Catalina Cifuentes Mosqueira
- Florencia Casas Caro
- Martin Gonzales Salas
- Estefano Gutierres San Martin
- Gonzalo Romero Aravena
- Juan Pablo Valladares Ruiz

## Descripción del Proyecto

Este sistema gestiona el **stock** de productos de una organización. Para ello, implementa dos piezas centrales del modelo de datos base del ERP:

- **Entidad `Producto`** — representa el dato maestro del inventario (artículo o producto), reutilizando la estructura de la entidad base (`Entity`) con sus campos de identidad, contacto y clasificación, extendida según las necesidades del dominio de logística.
- **Documento `Movimiento de Inventario`** — representa las transacciones que afectan el stock (entradas, salidas, ajustes y traslados), reutilizando la estructura del documento base (`Document`), con su vinculación obligatoria a un producto y su desglose de cantidades y montos.

El módulo incluye además **bodegas** (con código único y estado activo/inactivo), **lotes** con saldo y vencimiento (sugiere FEFO en las salidas), **documentos de soporte** (orden de compra y remisión) vinculados a los movimientos, **traslados** entre bodegas (dos movimientos vinculados con ciclo de estados) y **devoluciones** de salidas y traslados (motivo controlado, merma y ciclo Solicitada → Aprobada → Recibida en bodega → Cerrada).

La aplicación se presenta como un espacio de trabajo ERP coherente:

- **Estructura del espacio de trabajo (shell)** — cada pantalla vive dentro de un marco con identidad visual: una barra superior con logotipo (monograma SVG derivado del nombre del módulo) y el nombre del módulo, más una barra lateral persistente con los cinco módulos: **Panel, Productos, Movimientos, Bodegas y Buscar**. El módulo activo se resalta (`aria-current="page"`), hay enlace de "Saltar al contenido principal" y la barra lateral se colapsa en una railing de iconos en pantallas estrechas.
- **Panel de inicio** — la pantalla de entrada ofrece botones de acción rápida para las tareas clave del módulo (nuevo producto, nuevo movimiento de inventario, abrir áreas de gestión, buscar registros) y tarjetas de estadísticas en vivo que muestran el número de registros.
- **Tokens de diseño** — los estilos se controlan mediante propiedades personalizadas de CSS en `src/styles.css`, por lo que los cambios de marca se aplican globalmente.

### Flujos principales

1. **Productos** (`Productos`): crear, editar y eliminar productos; desde el detalle se abren sus documentos, lotes y kardex.
2. **Bodegas** (`Bodegas`): alta con código único; se desactivan en lugar de eliminarse si ya tienen movimientos.
3. **Movimientos** (`Movimientos`): entradas (aumentan stock), salidas (reducen stock y sugieren lote FEFO), ajustes con dirección; los movimientos son inmutables y sus estados siguen un ciclo de vida (`Pendiente → … → Entregado` para salidas; cancelados nunca afectan stock).
4. **Lotes**: se crean desde el detalle del producto con saldo inicial; el saldo se calcula a partir de sus movimientos y los vencidos se excluyen de las salidas.
5. **Búsqueda** (`Buscar`): filtros combinados por texto (ignora tildes/mayúsculas), categoría, bodega y "stock bajo"; el stock bajo se marca con badge.
6. **Traslados** (botón *Gestionar traslados* en Movimientos): origen → destino con líneas por producto; la bodega destino descuenta al despachar y abona al recibir; el stock total de la empresa no cambia, solo se redistribuye.
7. **Devoluciones** (panel dentro de Movimientos): devolución parcial sobre salidas y traslados recibidos, con motivo controlado; la merma (cantidad dañada) no vuelve al stock y el stock solo sube al pasar a **Recibida en bodega**; el movimiento original queda intacto y muestra el total devuelto.

Para más detalles sobre la estructura de datos (entidades, documentos, almacenes, lotes, partidas, movimientos de inventario, traslados y devoluciones), consulta [`specs/001-erp-base-module/data-model.md`](specs/001-erp-base-module/data-model.md).

## Estado Actual y Próximos Pasos

1. **Implementación completa de las 14 historias de usuario** — las fases de `specs/001-erp-base-module/tasks.md` (T001–T090) están ejecutadas: producto, gestión, panel, bodegas, movimientos, lotes, stock bajo, documentos, traslados, búsqueda y devoluciones.
2. **Suite de pruebas verde** — pruebas unitarias e integración (incluye casos XSS, ciclos de vida, redistribución de stock y rendimiento de búsqueda con 500 productos < 200 ms p95).
3. **Siguientes pasos**: pulido final (accesibilidad, revisión XSS, documentación y validación manual del flujo quickstart).

## Instalación

Instala las dependencias y ejecuta el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre http://localhost:5173 (o la URL que imprima Vite).

## Pruebas

Ejecuta la suite completa de pruebas (unitarias + de integración) con:

```bash
npm test
```

O una ejecución puntual sin modo watch:

```bash
npx vitest run
```

## Construcción de módulos personalizados

Los módulos ERP personalizados construidos sobre esta base definen:

- Qué representa una **Entidad** (por ejemplo, producto, proveedor, ubicación) más los campos propios del dominio.
- Qué representa un **Documento** (por ejemplo, movimiento de inventario, orden de compra, remisión).
- Etiquetas y reglas de validación específicas del módulo.

El módulo base se encarga de la generación de identidades, las marcas de tiempo, la integridad referencial entre entidades y documentos, el borrado en cascada, la navegación y la búsqueda. Consulta `specs/001-erp-base-module/` para la especificación completa.

## Personalización mediante configuración

Toda la personalización se concentra en un solo lugar: el objeto `userConfig` en la parte superior de `src/module-config.js`. Los desarrolladores editan esta única exportación; no es necesario modificar el código principal. Ajustes disponibles:

- `moduleName` — nombre visible que se muestra en la barra superior, el panel y el título del documento; también se deriva de él el monograma del logotipo.
- `labels` — renombra los términos Entidad/Documento en todas las pantallas, incluidos los botones de la barra lateral, las acciones rápidas, los formularios y los mensajes. Los artículos y las concordancias del español (el/la, seleccionado/a) se derivan de la primera palabra de cada término configurado.
- `customFields` — declara campos adicionales por tipo de registro con `target` (`entity` o `document`), `key`, `label`, `type` (`text`, `number`, `date` o `select`), `required` opcional, y `options` para los select. Las claves no deben coincidir con nombres de campos base (consulta `specs/001-erp-base-module/data-model.md`). Los valores persisten junto a los registros y aparecen en los resultados de búsqueda (p. ej., categoría, unidad de medida o cualquier atributo del dominio).
- `statusLifecycle` — restringe los estados por tipo de registro (`documents`, `movements` y `returns`) a una lista configurada de `statuses` con las `transitions` permitidas entre ellos. Incluye los ciclos predeterminados de orden de compra, traslado, salida y devolución; los movimientos sin ciclo (entradas y ajustes) se efectivizan de inmediato. Si no se define, el estado permanece como un campo de texto libre.
- `theme.accentColor` — un color hexadecimal (por ejemplo, `"#0f62fe"`) aplicado en todo el shell como resaltado y para los controles primarios. Los valores no válidos recurren al valor predeterminado.

Si la configuración es inválida (tipos desconocidos, claves incorrectas, transiciones que referencian estados desconocidos, colores de acento no hexadecimales), la aplicación muestra los problemas en una banda de advertencia y recurre a los valores predeterminados en lugar de fallar.

## Notas

- Los datos se guardan en `localStorage` bajo las claves con prefijo `erp_base_module:` (`entities`, `documents`, `warehouses`, `lots`, `movements`, `transfers` y `returns`).
- Al eliminar una entidad (producto) que no tiene movimientos, sus documentos y lotes también se eliminan (borrado en cascada); un producto con movimientos no se puede eliminar.
- Los movimientos no se editan ni se eliminan: las correcciones se registran como ajustes o devoluciones.
- Este proyecto usa intencionalmente HTML, CSS y JavaScript puro (vanilla) por simplicidad.

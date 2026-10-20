# Módulo Base de Software ERP (Vite + Vanilla JS)

Aplicación web de una sola página mínima que sirve como módulo base de un sistema ERP (Planificación de Recursos Empresariales). Proporciona la base común para construir módulos ERP personalizados: gestión de datos maestros (Entidades) y documentos transaccionales vinculados (Documentos) con creación/edición/eliminación/búsqueda, validación y persistencia en el `localStorage` del navegador, usando Vite y HTML, CSS y JavaScript puro (vanilla).

La interfaz de usuario está completamente en **español** (términos predeterminados: Entidad / Documento; nombre del módulo: Módulo Base ERP), incluyendo etiquetas, mensajes de validación, estados vacíos y diálogos.

Las Entidades cuentan con los campos estándar de datos maestros de un ERP (nombre, código, RFC/NIF, correo electrónico, teléfono, dirección, categoría, fecha objetivo, límite de crédito, condiciones de pago). Los Documentos usan numeración por serie + folio e incluyen un desglose monetario (subtotal, descuento, impuesto, total), moneda, condiciones de pago, notas, cantidad, fechas y estado.

La aplicación se presenta como un espacio de trabajo ERP coherente:

- **Estructura del espacio de trabajo (shell)** — cada pantalla vive dentro de un marco con identidad visual: una barra superior con un logotipo (un monograma SVG derivado del nombre del módulo) y el nombre del módulo, más una barra lateral persistente con los botones de los módulos (Panel, Entidades, Documentos, Búsqueda). El módulo activo se resalta (`aria-current="page"`), y la barra lateral se colapsa en una railing de iconos en pantallas estrechas.
- **Panel de inicio** — la pantalla de entrada ofrece botones de acción rápida para las tareas clave del ERP (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) y tarjetas de estadísticas en vivo que muestran el número de registros.
- **Tokens de diseño** — los estilos se controlan mediante propiedades personalizadas de CSS en `src/styles.css`, por lo que los cambios de marca se aplican globalmente.

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

- Qué representa una **Entidad** (por ejemplo, cliente, producto, activo) más los campos propios del dominio.
- Qué representa un **Documento** (por ejemplo, pedido, factura, contrato).
- Etiquetas y reglas de validación específicas del módulo.

El módulo base se encarga de la generación de identidades, las marcas de tiempo, la integridad referencial entre entidades y documentos, el borrado en cascada, la navegación y la búsqueda. Consulta `specs/001-erp-base-module/` para la especificación completa.

## Personalización mediante configuración

Toda la personalización se concentra en un solo lugar: el objeto `userConfig` en la parte superior de `src/module-config.js`. Los desarrolladores editan esta única exportación; no es necesario modificar el código principal. Ajustes disponibles:

- `moduleName` — nombre visible que se muestra en la barra superior, el panel y el título del documento; también se deriva de él el monograma del logotipo.
- `labels` — renombra los términos Entidad/Documento en todas las pantallas, incluidos los botones de la barra lateral, las acciones rápidas, los formularios y los mensajes. Los artículos y las concordancias del español (el/la, seleccionado/a) se derivan de la primera palabra de cada término configurado.
- `customFields` — declara campos adicionales por tipo de registro con `target` (`entity` o `document`), `key`, `label`, `type` (`text`, `number`, `date` o `select`), `required` opcional, y `options` para los select. Las claves no deben coincidir con nombres de campos base (consulta `specs/001-erp-base-module/data-model.md`). Los valores persisten junto a los registros y aparecen en los resultados de búsqueda.
- `statusLifecycle` — restringe los estados de los documentos a una lista configurada de `statuses` con las `transitions` permitidas entre ellos. Si no se define, el estado permanece como un campo de texto libre.
- `theme.accentColor` — un color hexadecimal (por ejemplo, `"#0f62fe"`) aplicado en todo el shell como resaltado y para los controles primarios. Los valores no válidos recurren al valor predeterminado.

Si la configuración es inválida (tipos desconocidos, claves incorrectas, transiciones que referencian estados desconocidos, colores de acento no hexadecimales), la aplicación muestra los problemas en una banda de advertencia y recurre a los valores predeterminados en lugar de fallar.

## Notas

- Los datos se guardan en `localStorage` bajo las claves `erp_base_module:entities` y `erp_base_module:documents`.
- Al eliminar una entidad, sus documentos también se eliminan (borrado en cascada).
- Este proyecto usa intencionalmente HTML, CSS y JavaScript puro (vanilla) por simplicidad.
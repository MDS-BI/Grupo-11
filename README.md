# Módulo de Logística e Inventario - ERP (Grupo 11)

Aplicación web de una sola página construida sobre el módulo base de un sistema ERP (Planificación de Recursos Empresariales), enfocada en la gestión de logística e inventario. La interfaz está completamente en **español** y utiliza Vite con HTML, CSS y JavaScript puro (vanilla), sin framework de interfaz pesado, persistiendo los datos en el `localStorage` del navegador.

## Autores

- Catalina Cifuentes Mosqueira
- Florencia Casas Caro
- Martin Gonzales Salas
- Estefano Gutierres San Martin
- Gonzalo Romero Aravena
- Pablo Valladares Ruiz

## Descripción del Proyecto

Este sistema gestiona el **stock** de productos de una organización. Para ello, implementa dos piezas centrales del modelo de datos base del ERP:

- **Entidad `Producto`** — representa el dato maestro del inventario (artículo o producto), reutilizando la estructura de la entidad base (`Entity`) con sus campos de identidad, contacto y clasificación, extendida según las necesidades del dominio de logística.
- **Documento `Movimiento de Inventario`** — representa las transacciones que afectan el stock (entradas, salidas, ajustes, etc.), reutilizando la estructura del documento base (`Document`), con su vinculación obligatoria a un producto y su desglose de cantidades y montos.

Las **bodegas o ubicaciones** de almacenamiento se manejan mediante **campos personalizados (`customFields`)** declarados en la configuración del módulo (`src/module-config.js`), de modo que se respeta la estructura base del ERP sin alterar el esquema central de datos. Del mismo modo, otros atributos específicos del dominio (categorías, unidades de medida, etc.) pueden añadirse como campos personalizados sin modificar el código principal.

La aplicación se presenta como un espacio de trabajo ERP coherente:

- **Estructura del espacio de trabajo (shell)** — cada pantalla vive dentro de un marco con identidad visual: una barra superior con logotipo (monograma SVG derivado del nombre del módulo) y el nombre del módulo, más una barra lateral persistente con los botones de los módulos (Panel, Productos, Movimientos, Búsqueda). El módulo activo se resalta (`aria-current="page"`), y la barra lateral se colapsa en una railing de iconos en pantallas estrechas.
- **Panel de inicio** — la pantalla de entrada ofrece botones de acción rápida para las tareas clave del módulo (nuevo producto, nuevo movimiento de inventario, abrir áreas de gestión, buscar registros) y tarjetas de estadísticas en vivo que muestran el número de registros.
- **Tokens de diseño** — los estilos se controlan mediante propiedades personalizadas de CSS en `src/styles.css`, por lo que los cambios de marca se aplican globalmente.

Para más detalles sobre la estructura de datos (entidades, documentos, almacenes, lotes, partidas y movimientos de inventario), consulta [`specs/001-erp-base-module/data-model.md`](specs/001-erp-base-module/data-model.md).

## Estado Actual y Próximos Pasos

El equipo se encuentra actualmente trabajando en:

1. **Definición y redacción de Historias de Usuario (US)** — se están especificando las historias de usuario correspondientes al módulo de Logística e Inventario dentro de los documentos de especificación (`specs/`).
2. **División equitativa de tareas y US** — se está organizando la distribución justa de las tareas e historias de usuario entre los integrantes del equipo para las iteraciones semanales del proyecto.
3. **Preparación para una versión integrada de prueba** — se están sentando las bases para ejecutar, en próximas iteraciones, una versión integrada del módulo que permita validar el funcionamiento conjunto de las piezas desarrolladas por cada integrante.

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
- `customFields` — declara campos adicionales por tipo de registro con `target` (`entity` o `document`), `key`, `label`, `type` (`text`, `number`, `date` o `select`), `required` opcional, y `options` para los select. Las claves no deben coincidir con nombres de campos base (consulta `specs/001-erp-base-module/data-model.md`). Los valores persisten junto a los registros y aparecen en los resultados de búsqueda. En este módulo, los campos personalizados son el mecanismo indicado para modelar bodegas y ubicaciones de almacenamiento.
- `statusLifecycle` — restringe los estados de los documentos a una lista configurada de `statuses` con las `transitions` permitidas entre ellos. Si no se define, el estado permanece como un campo de texto libre.
- `theme.accentColor` — un color hexadecimal (por ejemplo, `"#0f62fe"`) aplicado en todo el shell como resaltado y para los controles primarios. Los valores no válidos recurren al valor predeterminado.

Si la configuración es inválida (tipos desconocidos, claves incorrectas, transiciones que referencian estados desconocidos, colores de acento no hexadecimales), la aplicación muestra los problemas en una banda de advertencia y recurre a los valores predeterminados en lugar de fallar.

## Notas

- Los datos se guardan en `localStorage` bajo las claves `erp_base_module:entities` y `erp_base_module:documents`.
- Al eliminar una entidad (producto), sus documentos (movimientos de inventario) también se eliminan (borrado en cascada).
- Este proyecto usa intencionalmente HTML, CSS y JavaScript puro (vanilla) por simplicidad.

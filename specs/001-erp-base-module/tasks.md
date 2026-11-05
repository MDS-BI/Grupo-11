# Tareas: Módulo de Logística e Inventario - ERP (Grupo 11)

**Entrada**: Documentos de diseño desde `/specs/001-erp-base-module/`
**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario), research.md, data-model.md, contracts/
**Clarificaciones aplicadas**: spec.md → `Clarifications / Session 2026-11-03` (UI Logística por defecto, 5 botones de barra lateral, sin autenticación, traslado = dos movimientos vinculados, `status` en el movimiento y Devolución como entidad propia)
**Ajustes tras /speckit.analyze**: añadidas T006 (pruebas de `module-config`, C1) y T024/T027 (reetiquetado FR-029/XR-002, E1)

**Pruebas**: incluidas por historia (Constitución II – Test-First); se ejecutan con `npm test` (Vitest + jsdom).

**Organización**: Las tareas están agrupadas por historia de usuario para permitir implementación y prueba independiente de cada una.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencias de tareas incompletas)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (p. ej. US1, US2, US13)
- Toda tarea incluye la ruta exacta del archivo a crear o modificar

## Convenciones de Rutas

- **Proyecto único**: `src/`, `tests/` en la raíz del repositorio (según plan.md)
- Componentes: `src/components/*.js` (kebab-case), estilos en `src/styles.css`, configuración en `src/module-config.js`, persistencia en `src/storage.js`

---

## Fase 1: Configuración (Infraestructura Compartida)

**Propósito**: Inicializar la estructura de la aplicación Vite y las herramientas compartidas.

- [X] T001 Crear la estructura de la aplicación Vite con index.html, src/, src/components/ y src/styles.css según plan.md
- [X] T002 Instalar las dependencias del proyecto con `npm install` (Vite, Vitest y jsdom ya declarados en package.json)
- [X] T003 [P] Configurar ESLint y Prettier para JavaScript ES2022 en .eslintrc y .prettierrc, añadiendo los scripts `lint` y `format` en package.json

---

## Fase 2: Fundacional (Prerrequisitos Bloqueantes)

**Propósito**: Crear la capa de almacenamiento, la configuración del módulo y el esqueleto de la aplicación de los que dependen todas las historias.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T004 Crear el modelo de datos de entidad y documento con validación e integridad referencial (entity_id único, cascade) en src/storage.js según contracts/entity-storage.md
- [X] T005 Implementar la persistencia en localStorage del navegador con claves `erp_base_module:*`, marcas de tiempo y borrado en cascada de documentos al eliminar la entidad en src/storage.js
- [X] T006 [P] Añadir pruebas unitarias de carga de configuración, retroceso a valores por defecto, configuración inválida y `accentColor` en tests/unit/module-config.test.js (FR-023, FR-024, FR-025, FR-038)
- [X] T007 Crear el cargador de configuración del módulo con los valores por defecto de Logística e Inventario (Producto, Movimiento, Bodega), validación de conflictos y retroceso seguro en src/module-config.js (FR-023, FR-024, FR-025)
- [X] T008 Crear el esqueleto de la aplicación con renderizado inicial y enrutador de vistas (panel, gestión, bodegas, búsqueda) en src/app.js y src/main.js
- [X] T009 [P] Construir la base de hoja de estilos con tokens de diseño, formularios, listas, estados vacíos y retroalimentación de validación en src/styles.css
- [X] T010 [P] Crear el componente de renderizado y validación de campos personalizados declarados (FR-026, FR-027) en src/components/custom-fields.js
- [X] T011 Integrar los campos personalizados en la validación, la persistencia y la búsqueda de src/storage.js (FR-027, FR-028)

**Punto de control**: La fundación está lista; las historias de usuario pueden comenzar.

---

## Fase 3: Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1) 🎯 MVP

**Objetivo**: Permitir a los usuarios crear productos (entidades) con validación de obligatoriedad y unicidad, y verlos en la lista.

**Prueba Independiente**: Un usuario abre el módulo, añade un nuevo producto con nombre y código y lo ve aparecer en la lista; un campo obligatorio en blanco o un código duplicado bloquea el guardado con una explicación.

### Pruebas para la Historia de Usuario 1

- [X] T012 [P] [US1] Añadir pruebas unitarias de validación de entidades (obligatorios, código duplicado, escape de HTML) en tests/unit/storage.test.js
- [X] T013 [P] [US1] Añadir pruebas de integración para crear un producto y verlo en la lista en tests/integration/create-entity.test.js
- [X] T014 [P] [US1] Añadir pruebas de integración para campos personalizados en formularios, listas y búsqueda en tests/integration/custom-fields.test.js

### Implementación de la Historia de Usuario 1

- [X] T015 [P] [US1] Crear el formulario de producto (entidad) con campos base, categoría de valores controlados y campos personalizados declarados (FR-026) en src/components/entity-form.js
- [X] T016 [US1] Conectar el envío del formulario para crear y persistir la entidad escapando el HTML del contenido del usuario en src/app.js
- [X] T017 [US1] Renderizar la lista de productos con retroalimentación de validación, estado vacío y valores de campos personalizados (FR-005, FR-028) en src/components/entity-list.js

**Punto de control**: La Historia de Usuario 1 debe estar completamente funcional y ser comprobable de forma independiente (MVP).

---

## Fase 4: Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)

**Objetivo**: Permitir actualizar o eliminar productos almacenados, manteniendo la coherencia con listas, búsqueda y panel.

**Prueba Independiente**: Un usuario selecciona un producto existente, cambia su información o lo elimina, y la lista refleja el cambio.

### Pruebas para la Historia de Usuario 2

- [X] T018 [P] [US2] Añadir pruebas unitarias de actualización y eliminación de entidades en tests/unit/storage.test.js
- [X] T019 [P] [US2] Añadir pruebas de integración para editar y eliminar una entidad en tests/integration/edit-delete-entity.test.js

### Implementación de la Historia de Usuario 2

- [X] T020 [P] [US2] Añadir acciones de edición y eliminación a la interfaz de la lista de productos en src/components/entity-list.js
- [X] T021 [US2] Conectar la edición para poblar el formulario y actualizar el registro persistido en src/app.js
- [X] T022 [US2] Conectar la eliminación con el refresco de la lista, la búsqueda y las estadísticas del panel en src/app.js

**Punto de control**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Fase 5: Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

**Objetivo**: Envolver cada pantalla en un marco ERP persistente: barra superior con logotipo derivado y nombre del módulo, más barra lateral con los cinco módulos (Panel, Productos, Movimientos, Bodegas, Buscar) y resaltado del módulo activo (ver Clarificaciones), con todas las etiquetas derivadas de la configuración.

**Prueba Independiente**: En cada pantalla son visibles la barra superior y la barra lateral con los cinco botones, el módulo activo está resaltado, todas las etiquetas mostradas provienen de la configuración del módulo, navegar entre módulos no pierde datos y en ventanas estrechas la barra lateral se contrae a iconos etiquetados de forma accesible.

### Pruebas para la Historia de Usuario 13

- [X] T023 [P] [US13] Añadir pruebas de integración que afirmen el marco (logotipo, nombre del módulo, cinco botones de barra lateral, resaltado activo) en todas las pantallas en tests/integration/workspace-shell.test.js
- [X] T024 [P] [US13] Añadir pruebas de integración de reetiquetado desde la configuración en todas las pantallas (formularios, listas, mensajes, barra lateral) en tests/integration/relabeling.test.js

### Implementación de la Historia de Usuario 13

- [X] T025 [P] [US13] Añadir el marcado del marco del espacio de trabajo (barra superior, región de contenido principal) a index.html
- [X] T026 [P] [US13] Crear src/components/shell.js con el monograma SVG derivado del nombre del módulo, los botones Panel, Productos, Movimientos, Bodegas y Buscar, el resaltado del módulo activo y los eventos de navegación (FR-011, FR-012, FR-036, FR-037)
- [X] T027 [US13] Derivar todas las etiquetas visibles (formularios, listas, mensajes, botones) de la configuración del módulo en lugar de texto fijo en index.html, src/app.js y src/components/*.js (FR-029, XR-002)
- [X] T028 [US13] Reemplazar la navegación previa por enrutamiento de módulos mediante la barra lateral sin pérdida de datos en src/app.js
- [X] T029 [P] [US13] Estilizar barra superior, barra lateral, color de acento configurable y contracción a columna de iconos en pantallas estrechas (FR-038, FR-039) en src/styles.css

**Punto de control**: Todas las pantallas se renderizan dentro del marco con marca, la navegación por barra lateral funciona sin pérdida de datos y el módulo habla su terminología configurada.

---

## Fase 6: Historia de Usuario 3 - Inicio con botones sencillos (Prioridad: P1)

**Objetivo**: Ofrecer un panel de entrada con acciones rápidas etiquetadas por defecto de Logística e Inventario y estadísticas de registros en vivo.

**Prueba Independiente**: Un usuario abre la aplicación, ve al menos cuatro botones sencillos, inicia un nuevo producto o movimiento con un clic y ve estadísticas que reflejan los datos almacenados.

### Pruebas para la Historia de Usuario 3

- [X] T030 [P] [US3] Añadir pruebas de integración para las acciones rápidas del panel y las estadísticas en vivo en tests/integration/dashboard.test.js

### Implementación de la Historia de Usuario 3

- [X] T031 [P] [US3] Crear el panel con la cuadrícula de acciones rápidas (nuevo producto, nuevo movimiento, gestionar productos, buscar registros) y las tarjetas de estadísticas en src/components/dashboard.js (FR-033, FR-035)
- [X] T032 [US3] Conectar las acciones rápidas para abrir la gestión con el formulario vacío y la búsqueda con el campo enfocado en src/app.js (FR-034, FR-021)
- [X] T033 [US3] Actualizar los recuentos de entidades y documentos cada vez que se muestra el panel en src/components/dashboard.js (SC-010)

**Punto de control**: La aplicación abre en un panel funcional; cada tarea clave está a un clic.

---

## Fase 7: Historia de Usuario 5 - Gestionar las bodegas del inventario (Prioridad: P1)

**Objetivo**: Crear, editar, desactivar y reactivar bodegas (almacenes), protegiendo el histórico de movimientos y sus saldos.

**Prueba Independiente**: Un encargado crea una bodega con código y nombre, la desactiva y comprueba que ya no acepta movimientos nuevos, mientras los movimientos y saldos históricos permanecen intactos.

### Pruebas para la Historia de Usuario 5

- [X] T034 [P] [US5] Añadir pruebas unitarias de validación y unicidad de bodegas en tests/unit/storage.test.js
- [X] T035 [P] [US5] Añadir pruebas de integración de creación, desactivación, reactivación y rechazo de eliminación con movimientos en tests/integration/manage-warehouses.test.js

### Implementación de la Historia de Usuario 5

- [X] T036 [P] [US5] Implementar la persistencia de bodegas con código único, campo `active` y rechazo de eliminación cuando existen movimientos en src/storage.js (data-model.md → Warehouse)
- [X] T037 [US5] Crear la lista y el formulario de bodegas con estado visible (activa/desactivada) en src/components/warehouse-list.js
- [X] T038 [US5] Conectar crear, editar, desactivar/reactivar y bloquear movimientos en bodegas desactivadas en src/app.js

**Punto de control**: El catálogo de bodegas está listo como cimiento del módulo de logística.

---

## Fase 8: Historia de Usuario 4 - Registrar movimientos de inventario (Prioridad: P1)

**Objetivo**: Registrar entradas, salidas, traslados y ajustes en una pantalla dedicada, con saldo calculado y movimientos inmutables.

**Prueba Independiente**: Un usuario registra una entrada y ve subir el saldo, registra una salida y ve bajar el saldo; una salida que dejaría el saldo en negativo se rechaza indicando el saldo disponible; un movimiento guardado no puede editarse ni eliminarse.

### Pruebas para la Historia de Usuario 4

- [X] T039 [P] [US4] Añadir pruebas unitarias de validación de movimientos y cálculo de saldo en tests/unit/storage.test.js
- [X] T040 [P] [US4] Añadir pruebas de integración de entrada, salida, rechazo de saldo negativo e inmutabilidad en tests/integration/manage-movements.test.js

### Implementación de la Historia de Usuario 4

- [X] T041 [P] [US4] Implementar StockMovement con tipos entrada/salida/traslado/ajuste, cantidad entero positiva, fecha válida, lote y documento de origen opcionales en src/storage.js (data-model.md → StockMovement, FR-040, FR-044)
- [X] T042 [US4] Calcular el saldo por producto y almacén como suma de sus movimientos y rechazar saldos negativos indicando el saldo disponible en src/storage.js (FR-041, FR-042)
- [X] T043 [P] [US4] Crear el formulario de movimientos con validaciones de obligatoriedad, cantidad y fecha en src/components/movement-form.js
- [X] T044 [P] [US4] Crear la lista de movimientos con el saldo actual del producto por almacén de un vistazo en src/components/movement-list.js
- [X] T045 [US4] Conectar la creación de movimientos desde la barra lateral y las acciones rápidas del panel, con el módulo activo resaltado en src/app.js
- [X] T046 [US4] Impedir editar o eliminar movimientos guardados y explicar que la corrección se registra con un ajuste (FR-043) en src/app.js
- [X] T047 [US4] Impedir eliminar entidades con movimientos de inventario registrados para conservar el histórico en src/storage.js

**Punto de control**: La Historia de Usuario 4 debe estar completamente funcional y ser comprobable de forma independiente.

---

## Fase 9: Historia de Usuario 7 - Consultar el kárdex de un producto (Prioridad: P1)

**Objetivo**: Mostrar el historial de movimientos de un producto con su saldo acumulado, filtrable por tipo y rango de fechas.

**Prueba Independiente**: Un usuario abre el detalle de un producto, ve sus movimientos ordenados por fecha con el saldo acumulado de cada uno, y el último saldo coincide con el stock de la lista de productos.

### Pruebas para la Historia de Usuario 7

- [X] T048 [P] [US7] Añadir pruebas de integración del kárdex con saldo acumulado, movimientos anulados y estado vacío en tests/integration/kardex.test.js

### Implementación de la Historia de Usuario 7

- [X] T049 [P] [US7] Crear la vista de kárdex con saldo acumulado, estado vacío y marcado de anulados en src/components/kardex-view.js
- [X] T050 [US7] Conectar el kárdex desde el detalle del producto con filtros por tipo de movimiento y rango de fechas, en modo solo lectura, en src/app.js

**Punto de control**: El stock calculado es auditable de extremo a extremo.

---

## Fase 10: Historia de Usuario 6 - Registrar lotes y controlar vencimientos (Prioridad: P2)

**Objetivo**: Registrar lotes por producto con fechas, saldo derivado de movimientos y reglas FEFO/vencidos.

**Prueba Independiente**: Un operador registra un lote con número y fechas para un producto, ve su saldo en cero, al usarlo en una entrada sube su saldo; una fecha de vencimiento anterior a la de fabricación se rechaza.

### Pruebas para la Historia de Usuario 6

- [X] T051 [P] [US6] Añadir pruebas unitarias de validación de lotes (unicidad por producto, fechas) en tests/unit/storage.test.js
- [X] T052 [P] [US6] Añadir pruebas de integración de registro de lotes, saldo, FEFO y rechazo de vencidos en tests/integration/manage-lots.test.js

### Implementación de la Historia de Usuario 6

- [X] T053 [P] [US6] Implementar la persistencia de lotes con unicidad de número por producto y validación de fechas en src/storage.js (data-model.md → Lot, FR-045)
- [X] T054 [US6] Crear la pantalla de lotes abierta desde la gestión del producto con marcado visual de vencidos o próximos a vencer en src/components/lot-list.js
- [X] T055 [US6] Sugerir el lote FEFO en las salidas y rechazar lotes vencidos o pertenecientes a otro producto en src/app.js (FR-044); aplicar la misma regla a los traslados al implementar US8

**Punto de control**: La trazabilidad por lotes complementa la captura de movimientos sin bloquear el MVP.

---

## Fase 11: Historia de Usuario 9 - Definir stock mínimo por producto y almacén (Prioridad: P2)

**Objetivo**: Fijar un stock mínimo por producto y marcar visualmente el "stock bajo" en listas y búsqueda.

**Prueba Independiente**: Un encargado fija un stock mínimo de 10, con saldo real de 5 el producto aparece marcado como "stock bajo"; una entrada que eleva el saldo a 15 hace desaparecer la marca.

### Pruebas para la Historia de Usuario 9

- [X] T056 [P] [US9] Añadir pruebas de integración de la marca de stock bajo con saldo bajo, igual al mínimo y por encima en tests/integration/low-stock.test.js

### Implementación de la Historia de Usuario 9

- [X] T057 [P] [US9] Añadir el campo de stock mínimo con validación de cantidad no negativa al formulario de producto en src/components/entity-form.js
- [X] T058 [US9] Calcular y mostrar la marca de "stock bajo" en la lista de productos y en las funciones de búsqueda de src/storage.js y src/components/entity-list.js (la muestra en la pantalla de búsqueda se conecta en US11), sin marcar cuando el saldo es igual al mínimo

**Punto de control**: La detección de faltantes queda automatizada en listas y búsqueda.

---

## Fase 12: Historia de Usuario 10 - Registrar documentos de respaldo de logística (Prioridad: P2)

**Objetivo**: Crear y organizar documentos de respaldo (orden de compra, remisión) junto a los productos, con borrado en cascada y vínculo a movimientos.

**Prueba Independiente**: Un usuario crea una orden de compra con sus datos obligatorios, la ve en la lista de documentos junto al producto y, al eliminar ese producto, el documento se elimina en cascada.

### Pruebas para la Historia de Usuario 10

- [X] T059 [P] [US10] Añadir pruebas de integración de documentos con validación de folio, edición y borrado en cascada en tests/integration/manage-document.test.js

### Implementación de la Historia de Usuario 10

- [X] T060 [P] [US10] Crear el formulario de documentos de respaldo con serie, folio y fechas validadas en src/components/document-form.js
- [X] T061 [P] [US10] Crear la lista de documentos por producto con tipo y folio identificables de un vistazo en src/components/document-list.js
- [X] T062 [US10] Conectar crear, editar y eliminar documentos junto a la gestión del producto en src/app.js
- [X] T063 [US10] Vincular opcionalmente los movimientos al documento que los origina desde el formulario de movimientos en src/app.js (FR-044)

**Punto de control**: Los datos maestros y la evidencia transaccional quedan vinculados.

---

## Fase 13: Historia de Usuario 11 - Buscar productos en una pantalla dedicada (Prioridad: P2)

**Objetivo**: Ofrecer una pantalla de búsqueda con filtros combinados, resultados con stock y estados vacíos claros.

**Prueba Independiente**: Un usuario abre la búsqueda desde la barra lateral o el panel, introduce un SKU o nombre y ve solo los productos coincidentes con su stock actual y su marca de stock bajo.

### Pruebas para la Historia de Usuario 11

- [X] T064 [P] [US11] Añadir pruebas de integración de búsqueda por SKU, nombre, categoría y ubicación con filtros combinados en tests/integration/search-entities.test.js

### Implementación de la Historia de Usuario 11

- [X] T065 [P] [US11] Crear la interfaz de la pantalla de búsqueda con campo enfocado, filtros (categoría, almacén, solo stock bajo) y estado vacío en src/components/search-bar.js
- [X] T066 [US11] Conectar la búsqueda con normalización de tildes y mayúsculas, escape de HTML y resultados que muestran el stock con su marca en src/app.js (FR-020, FR-032)
- [X] T067 [US11] Mostrar el detalle del producto en modo solo lectura desde un resultado de búsqueda en src/app.js

**Punto de control**: La recuperación rápida funciona sin saturar las pantallas de gestión.

---

## Fase 14: Historia de Usuario 12 - Configurar el ciclo de vida de estados (Prioridad: P2)

**Objetivo**: Aplicar un ciclo de estados controlado a los documentos con transiciones válidas, estado visible y la regla única de stock (baja al Despachar, alta al Recibir).

**Prueba Independiente**: Con el ciclo del traslado configurado, solo se ofrecen los estados siguientes válidos, las transiciones inválidas se rechazan con explicación, el estado es visible de un vistazo y el stock cambia únicamente al despachar y al recibir.

### Pruebas para la Historia de Usuario 12

- [X] T068 [P] [US12] Añadir pruebas unitarias de transiciones válidas, inválidas y estados finales en tests/unit/storage.test.js
- [X] T069 [P] [US12] Añadir pruebas de integración de la regla de stock al despachar y recibir en tests/integration/lifecycle-stock.test.js

### Implementación de la Historia de Usuario 12

- [X] T070 [US12] Definir los ciclos de vida de referencia (orden de compra, traslado, salida) en la configuración del módulo en src/module-config.js
- [X] T071 [US12] Implementar el motor de transiciones con el campo `status` y la fecha de cambio del movimiento en src/storage.js (FR-030, FR-031)
- [X] T072 [US12] Aplicar la regla de stock: baja al pasar a Despachado en el origen y alta al pasar a Recibido en el destino, con rechazo de despachos sin stock en src/storage.js
- [X] T073 [P] [US12] Mostrar la etiqueta de estado en listas y detalles y ofrecer solo transiciones permitidas en src/components/document-form.js y src/components/movement-list.js

**Punto de control**: El estado del ciclo de vida gobierna cuándo el stock cambia, de extremo a extremo.

---

## Fase 15: Historia de Usuario 8 - Trasladar stock entre bodegas (Prioridad: P2)

**Objetivo**: Registrar traslados con origen y destino distintos, guardados como dos movimientos vinculados con unidades en tránsito (ver Clarificaciones).

**Prueba Independiente**: Un encargado traslada 20 unidades del Almacén A al B y lo despacha: A baja en 20 y las unidades quedan en tránsito sin estar disponibles en B; al recibirlas, B sube en 20. Trasladar 999 con 50 disponibles se rechaza indicando el saldo.

### Pruebas para la Historia de Usuario 8

- [X] T074 [P] [US8] Añadir pruebas de integración del traslado completo (solicitar, despachar, en tránsito, recibir, cancelar) en tests/integration/transfer.test.js

### Implementación de la Historia de Usuario 8

- [X] T075 [P] [US8] Crear el formulario de traslados con origen y destino distintos, fecha y líneas de producto con cantidad en src/components/transfer-form.js
- [X] T076 [US8] Guardar el traslado como dos movimientos vinculados (salida en el origen, entrada en el destino) que comparten el documento del traslado en src/storage.js
- [X] T077 [US8] Implementar los estados Solicitado → Despachado → En tránsito → Recibido y mostrar el saldo en tránsito por separado en src/app.js
- [X] T078 [US8] Rechazar traslados con saldo insuficiente en origen, líneas repetidas y bodegas desactivadas o iguales, aplicando la regla FEFO de lotes de US6, en src/storage.js

**Punto de control**: El stock total de la empresa no cambia; solo se redistribuye entre bodegas.

---

## Fase 16: Historia de Usuario 14 - Registrar devoluciones de movimientos (Prioridad: P2)

**Objetivo**: Registrar devoluciones parciales de movimientos Entregado o Recibido como entidad propia, con motivo controlado, merma y ciclo de vida propio (ver Clarificaciones).

**Prueba Independiente**: Un usuario selecciona una salida en estado Entregado, registra una devolución parcial con motivo, la lleva hasta Recibida en bodega y comprueba que el stock sube solo en la cantidad en buen estado, que el movimiento original queda intacto y que muestra lo devuelto.

### Pruebas para la Historia de Usuario 14

- [X] T079 [P] [US14] Añadir pruebas de integración de devolución parcial, merma y ciclo de vida en tests/integration/returns.test.js

### Implementación de la Historia de Usuario 14

- [X] T080 [P] [US14] Implementar la entidad Devolución con motivo controlado, cantidades, merma y vinculación al movimiento original sin modificarlo en src/storage.js
- [X] T081 [P] [US14] Crear el formulario de devoluciones sobre movimientos en estado Entregado o Recibido con rechazo en otros estados en src/components/return-form.js
- [X] T082 [US14] Aplicar el ciclo Solicitada → Aprobada → Recibida en bodega → Cerrada y el ajuste de stock al recibirla en src/app.js
- [X] T083 [US14] Mostrar la cantidad total devuelta en el detalle y la lista del movimiento original en src/components/movement-list.js

**Punto de control**: Todas las historias de usuario deben estar completas y ser comprobables de forma independiente.

---

## Fase 17: Pulido y Preocupaciones Transversales

**Propósito**: Mejorar la calidad, accesibilidad, seguridad y el comportamiento con grandes volúmenes en todas las historias.

- [X] T084 [P] Añadir refinamientos de accesibilidad (etiquetas, foco de teclado, `aria-current`, contraste) en index.html y src/styles.css
- [X] T085 [P] Revisar el escape de HTML en toda salida de datos de localStorage contra XSS en src/app.js y src/components/*.js
- [X] T086 Verificar el rendimiento con 500 productos y búsqueda <200 ms p95 (FR-032, SC-004) en src/storage.js
- [X] T087 [P] Retirar o adaptar las pruebas obsoletas del spec anterior (p. ej. navegación por pestañas) en tests/integration/manage-tabs.test.js
- [X] T088 [P] Actualizar README.md y specs/001-erp-base-module/quickstart.md con la barra lateral de cinco módulos y los flujos nuevos (bodegas, movimientos, lotes, traslados, devoluciones)
- [X] T089 Ejecutar la suite completa de pruebas (`npm test`) y la compilación de producción (`npm run build`) para verificar que no hay regresiones
- [X] T090 Ejecutar la validación manual del flujo principal descrito en specs/001-erp-base-module/quickstart.md

---

## Dependencias y Orden de Ejecución

### Dependencias entre Fases

- **Configuración (Fase 1)**: Sin dependencias — puede comenzar de inmediato
- **Fundacional (Fase 2)**: Depende de la Configuración — **BLOQUEA todas las historias**
- **US1 (Fase 3)**: Depende de Fundacional
- **US2 (Fase 4)**: Depende de US1
- **US13 (Fase 5)**: Depende de Fundacional (ModuleConfig); es la columna vertebral de navegación de las demás pantallas
- **US3 (Fase 6)**: Depende de US13 (el panel vive dentro del marco) y de US1/US4 para estadísticas reales
- **US5 (Fase 7)**: Depende de Fundacional
- **US4 (Fase 8)**: Depende de US1 (producto) y US5 (bodega)
- **US7 (Fase 9)**: Depende de US4
- **US6 (Fase 10)**: Depende de US1 y US4 (el saldo del lote es la suma de sus movimientos)
- **US9 (Fase 11)**: Depende de US1 y US4 (marca según el saldo calculado)
- **US10 (Fase 12)**: Depende de US1
- **US11 (Fase 13)**: Depende de US1, US9 (marca de stock bajo) y US13 (navegación)
- **US12 (Fase 14)**: Depende de US4 y US10 (documentos y movimientos) y de ModuleConfig (Fundacional)
- **US8 (Fase 15)**: Depende de US4, US5 y US12 (cadena de estados del traslado)
- **US14 (Fase 16)**: Depende de US12, US4 y US8 (movimientos Entregado/Recibido)
- **Pulido (Fase 17)**: Depende de que todas las historias deseadas estén completas

### Dependencias entre Historias de Usuario

- **US1 (P1)**: Solo depende de la fase Fundacional
- **US2 (P1)**: Integra con US1, pero es independientemente testeable
- **US13 (P1)**: Solo depende de Fundacional; desbloquea la navegación de US3, US4, US5, US11
- **US3 (P1)**: Depende de US13 y se beneficia de US1 y US4 para sus estadísticas
- **US5 (P1)**: Solo depende de Fundacional
- **US4 (P1)**: Depende de US1 y US5
- **US7 (P1)**: Depende de US4
- **US6, US9, US10 (P2)**: Independientes entre sí; US6/US9 dependen de US4, US10 de US1
- **US11 (P2)**: Depende de US1, US9 y US13
- **US12 (P2)**: Depende de US4/US10; US8 y US14 dependen de ella
- **US8 (P2)**: Depende de US4, US5 y US12
- **US14 (P2)**: Depende de US12, US4 y US8

### Dentro de Cada Historia

- Las pruebas se escriben ANTES de la implementación y deben fallar primero
- Modelos y persistencia antes que servicios/lógica
- Lógica antes que interfaz; interfaz antes que integración con navegación
- Historia completa antes de pasar a la siguiente prioridad

### Oportunidades Paralelas

- T003 puede ejecutarse en paralelo con T001–T002
- T006 puede ejecutarse en paralelo con T004–T005, y T009–T010 pueden completarse junto al trabajo de almacenamiento y configuración
- Todas las tareas de pruebas marcadas [P] de una historia pueden lanzarse juntas
- Después de Fundacional: US1/US5/US13 pueden avanzar en paralelo
- US2 (tras US1) y US5/US13 pueden ejecutarse en paralelo
- US10 puede avanzar en paralelo con US6, US9 y US11 una vez desbloqueadas
- En Fase 17, T084, T085, T087 y T088 son paralelas antes de la verificación final T089–T090

---

## Ejemplo Paralelo: Historia de Usuario 4

```bash
# Lanzar juntas todas las pruebas de US4:
Task: "Pruebas unitarias de validación de movimientos y cálculo de saldo en tests/unit/storage.test.js"
Task: "Pruebas de integración de entrada, salida, rechazo de saldo negativo e inmutabilidad en tests/integration/manage-movements.test.js"

# Lanzar juntas las piezas independientes de US4:
Task: "Implementar StockMovement ... en src/storage.js"
Task: "Crear el formulario de movimientos ... en src/components/movement-form.js"
Task: "Crear la lista de movimientos ... en src/components/movement-list.js"
```

---

## Estrategia de Implementación

### MVP Primero (Historia de Usuario 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (**CRÍTICO** — bloquea todas las historias)
3. Completar Fase 3: Historia de Usuario 1
4. **PARAR y VALIDAR**: Probar la Historia de Usuario 1 de forma independiente
5. Desplegar/demostrar si está listo

### Entrega Incremental

1. Configuración + Fundacional → base lista
2. US1 → probar → US2 → probar (datos maestros completos)
3. US13 + US3 → probar (marco y panel = experiencia ERP)
4. US5 + US4 → probar (movimientos y saldos = operación diaria)
5. US7 → probar (auditoría del stock)
6. Historias P2 en orden de dependencias: US6/US9/US10 → US11 → US12 → US8 → US14
7. Pulido → suite completa y build de producción

### Estrategia de Equipo en Paralelo

1. El equipo completo completa Configuración + Fundacional
2. Una vez Fundacional listo:
   - Desarrollador A: US1 → US2 (datos maestros)
   - Desarrollador B: US13 → US3 (marco y panel)
   - Desarrollador C: US5 → US4 (bodegas y movimientos)
3. En P2: repartir US6/US9/US10/US11 y US12 → US8 → US14 según capacidad
4. Las historias se integran y prueban de forma independiente

---

## Notas

- [P] = archivos distintos, sin dependencias; [Historia] = trazabilidad con la US del spec
- Cada historia debe poder completarse y probarse de forma independiente
- Verificar que las pruebas fallan antes de implementar
- Hacer commit tras cada tarea o grupo lógico
- Detenerse en cualquier punto de control para validar la historia
- Evitar: tareas vagas, conflictos de archivo en la misma tarea, dependencias que rompan la independencia de las historias
- El `tasks.md` anterior (spec previo al clarify) fue reescrito por completo; las pruebas existentes de esa versión se adaptan o retiran en T087
- Tras `/speckit.analyze` se añadieron T006 (pruebas de `module-config`, hallazgo C1) y T024/T027 (reetiquetado FR-029/XR-002, hallazgo E1)

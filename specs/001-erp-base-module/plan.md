# Plan de Implementación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama**: `001-erp-base-module` | **Fecha**: 2026-07-08 | **Especificación**: [spec.md](spec.md)
**Entrada**: Especificación de la funcionalidad desde `/specs/001-erp-base-module/spec.md`

## Resumen

Construir una aplicación web ligera con Vite que sirva como módulo base de software de planificación de recursos empresariales (ERP). El módulo proporciona la base común que todo módulo ERP personalizado necesita: gestión de datos maestros (Entidades), documentos transaccionales vinculados (Documentos), flujos de crear/editar/eliminar/buscar, validación y persistencia local — construida principalmente con HTML, CSS y JavaScript vanilla. La aplicación se presenta como un espacio de trabajo ERP coherente: una barra superior con marca (logotipo derivado + nombre del módulo) y una barra lateral persistente de botones de módulo envuelven cada pantalla, y la pantalla de entrada es un panel estilo ERP que ofrece botones de acción rápida para las tareas clave (nueva entidad, nuevo documento, abrir áreas de gestión, buscar registros) además de estadísticas de registros en vivo. La adaptación a un módulo específico (p. ej., Ventas) se realiza mediante un único archivo de configuración (`src/module-config.js`) que cubre terminología, campos personalizados, ciclo de vida de documentos y color de acento, de modo que el código central permanece intacto. El módulo se distribuye con la configuración de **Logística e Inventario** cargada por defecto (Producto, Bodega, Movimiento) e incorpora, además del CRUD base de entidades y documentos, bodegas con activación/desactivación, movimientos de inventario con saldo derivado, control de lotes con FEFO, kárdex por producto, stock mínimo, traslados entre bodegas como dos movimientos vinculados y devoluciones con merma.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 (sin framework, sin backend)  
**Dependencias Principales**: Vite ^8.2.1 (dev server + build)  
**Almacenamiento**: `localStorage` del navegador (claves `erp_base_module:entities`, `erp_base_module:documents`, `erp_base_module:warehouses`, `erp_base_module:lots`, `erp_base_module:movements` y `erp_base_module:returns`)  
**Pruebas**: Vitest ^4.1.10 + jsdom ^30.0.1 (`npm test` / `npx vitest run`)  
**Plataforma Objetivo**: SPA web en navegador moderno (evergreen), escritorio y móvil  
**Tipo de Proyecto**: web-app frontend-only (módulo base ERP personalizable)  
**Objetivos de Rendimiento**: Interacciones responsivas para listas de hasta 500 registros; búsqueda de inventario <200ms p95; la búsqueda y las actualizaciones de la interfaz deben sentirse instantáneas  
**Restricciones**: Huella mínima de librerías, despliegue simple, sin backend requerido; la estructura debe mantenerse extensible para módulos personalizados  
**Escala/Alcance**: Módulo base con CRUD de datos maestros (Entidad) y documentos transaccionales (Documento), búsqueda y capacidades de navegación; ~10k movimientos, 1k artículos, 5 almacenes como referencia de escala

## Verificación de la Constitución

*COMPROBACIÓN: Debe pasar antes de la investigación de la Fase 0. Reverificar tras el diseño de la Fase 1.*

Gates basados en `.specify/memory/constitution.md` (v1.0.0):

1. **Code Quality & Maintainability** — código legible, modular, funciones pequeñas. La implementación usará una estructura JavaScript pequeña y modular con límites de función claros y nomenclatura consistente, manteniendo las preocupaciones base (almacenamiento, identidad, integridad referencial) separadas de la lógica específica del dominio para que los módulos personalizados puedan extenderlas.
2. **Test-First & Verification** — tests unitarios + integración; nada se da por completo sin tests verdes. Los flujos centrales de crear, editar, eliminar y buscar estarán cubiertos por pruebas automatizadas antes de completar.
3. **User Experience Consistency** — patrones consistentes de layout/feedback/estados vacíos; accesibilidad obligatoria; UI en español. La interfaz proporcionará mensajes de validación claros, estados vacíos y comportamiento de formulario consistente, presentados dentro de un marco de espacio de trabajo ERP con marca (barra superior + barra lateral) que se ve y se comporta idénticamente en todas las pantallas.
4. **Performance & Reliability** — presupuestos de performance; evitar round-trips y re-renders innecesarios. La búsqueda y el renderizado de listas se optimizarán para colecciones de hasta 500 registros usando actualizaciones ligeras del DOM.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-erp-base-module/
├── plan.md              # Este archivo (salida del comando /speckit.plan)
├── research.md          # Salida de la Fase 0 (comando /speckit.plan)
├── data-model.md        # Salida de la Fase 1 (comando /speckit.plan)
├── quickstart.md        # Salida de la Fase 1 (comando /speckit.plan)
├── contracts/           # Salida de la Fase 1 (comando /speckit.plan)
└── tasks.md             # Salida de la Fase 2 (comando /speckit.tasks — NO lo crea /speckit.plan)
```

### Código Fuente (raíz del repositorio)

```text
index.html

src/
├── main.js
├── app.js
├── storage.js
├── module-config.js
├── styles.css
└── components/
    ├── shell.js          (marco del espacio de trabajo: barra superior, logotipo SVG, barra lateral con Panel, Productos, Movimientos, Bodegas y Buscar, estado de módulo activo)
    ├── dashboard.js      (vista de inicio: cuadrícula de acciones rápidas + tarjetas de estadísticas en vivo)
    ├── entity-list.js    (listado de productos/entidades con búsqueda, marca de stock bajo y acciones)
    ├── entity-form.js    (formulario de creación/edición de productos con campos personalizados y stock mínimo)
    ├── document-list.js  (lista de documentos de respaldo por producto con ciclo de vida de estados)
    ├── document-form.js  (formulario de documentos de respaldo con campos personalizados y ciclo de vida de estados)
    ├── custom-fields.js  (renderizado y validación de campos personalizados)
    ├── search-bar.js     (pantalla de búsqueda de registros con filtros combinados)
    ├── warehouse-list.js (lista y formulario de bodegas con estado activa/desactivada)
    ├── movement-form.js  (formulario de movimientos de inventario: entrada, salida, traslado, ajuste)
    ├── movement-list.js  (lista de movimientos con saldo por almacén y etiqueta de estado)
    ├── kardex-view.js    (historial de movimientos de un producto con saldo acumulado y filtros)
    ├── lot-list.js       (lotes por producto con marcado de vencidos, abierta desde la gestión del producto)
    ├── transfer-form.js  (traslados entre bodegas con líneas de producto)
    └── return-form.js    (devoluciones sobre movimientos entregados o recibidos, con merma)

tests/
├── unit/
│   ├── storage.test.js
│   └── module-config.test.js
└── integration/
    └── [pruebas por journey: CRUD entidades, documentos, bodegas, movimientos, kárdex, lotes, stock bajo, búsqueda, relabeling, dashboard, shell, ciclo de vida, traslados, devoluciones]
```

**Decisión de Estructura**: Una aplicación Vite simple con un único punto de entrada HTML, un pequeño conjunto de módulos JavaScript y CSS en un archivo separado. Se usará localStorage para la persistencia de modo que la aplicación permanezca ligera y autónoma. Los componentes se dividen en pares de entidad (datos maestros) y documento (transaccional) que reflejan los dos conceptos centrales del módulo base, de modo que un módulo personalizado pueda renombrar o extender cada par de forma independiente. `shell.js` posee el marco del espacio de trabajo ERP — un logotipo monograma SVG en línea derivado del nombre del módulo, la barra superior y la barra lateral de módulos — envolviendo todas las vistas para que la marca y la navegación permanezcan consistentes sin duplicar marcado. `dashboard.js` renderiza los botones de acción rápida y las tarjetas de estadísticas de la pantalla de entrada, leyendo los recuentos del almacenamiento cada vez que se vuelve visible. `module-config.js` centraliza todos los puntos de adaptación — nombre del módulo, etiquetas de términos, definiciones de campos personalizados, ciclo de vida de estados y color de acento — manteniendo la personalización del dominio fuera del código central; el estilo se controla mediante propiedades personalizadas de CSS (tokens de diseño) en `styles.css` para que el color de acento configurado se aplique globalmente.

## Seguimiento de Complejidad

> **Completar SOLO si la Verificación de la Constitución tiene violaciones que deban justificarse**

Este plan no introdujo violaciones de la constitución.

| Violación | Por qué es Necesaria | Alternativa Más Simples Rechazada Porque |
|-----------|----------------------|-----------------------------------------|
| [ej., Nuevo módulo de almacenes] | [necesidad de gestionar stock por ubicación] | [por qué no basta con la categoría de Entidad] |
| [ej., Servicio de cálculo de stock] | [saldo derivado de movimientos inmutables] | [por qué no basta con editar el saldo del artículo] |

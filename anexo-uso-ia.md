# Anexo: Registro de Uso de IA Generativa

**Proyecto**: ERP — Módulo de Logística e Inventario (Grupo 11)
**Curso**: Modelación de Sistemas 2026-2 — Universidad de Concepción
**Equipo**: Catalina Cifuentes Mosqueira · Florencia Casas Caro · Martín Gonzales Salas · Estefano Gutierres San Martin · Gonzalo Romero Aravena · Juan Pablo Valladares Ruiz
**Herramienta**: OpenCode (agente de código en terminal / VS Code)
**Modelo**: Big Pickle (`opencode/big-pickle`) — sesiones 1 y 4–6 · mimo-v2.6-flash-free (`opencode/mimo-v2.6-flash-free`) — sesiones 2–3
**Última actualización**: 2026-11-17

---

## 1. Declaración

En cumplimiento de la política de uso de IA del curso, el equipo declara que la IA generativa se utilizó como **apoyo a la conceptualización, redacción y revisión de artefactos** (README, modelo de datos, historias de usuario, tareas y este anexo). Todo contenido fue **revisado, corregido y validado por los integrantes** antes de incorporarse al repositorio.

Se declara además que:

- La IA **no definió por sí sola** el alcance del MVP, los roles ni las prioridades: esas decisiones fueron discutidas y aprobadas por el equipo.
- **No se ingresaron** datos personales, datos sensibles de terceros, credenciales ni información confidencial en los prompts.
- **No se generaron datos reales**: todos los ejemplos son ficticios.
- La IA **generó cambios locales**, primero en `spec/reservas-tomas` y finalmente en `main`, pero **no hace commits**: los commits los realiza el equipo manualmente. La IA tampoco hace push ni pull request; la integración final se hace con commit directo en `main` (ver §6).
- La responsabilidad final sobre el contenido del repositorio es **exclusivamente del equipo**.

---

## 2. Secuencia de prompts

### Sesión 1 — 2026-10-22 (conceptualización)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 1 | 22/10 | Idioma de trabajo | Solicitud de responder en español | Preferencia de idioma del equipo |
| 2 | 22/10 | Entender el encargo | "Explícame en términos sencillos qué hay que hacer; qué son SpecKit, MER y Gen IA" | Comprensión del instructivo |
| 3 | 22/10 | Orientación metodológica | "El ERP ya está hecho por el grupo; oriéntame sobre el plan.md y el Trabajo del Curso" | Criterios de alcance |
| 4 | 22/10 | Contexto del módulo | "Se nos asignó Logística e Inventario; roles arquitecto y cliente; sin acceso a los avances" | Definición de usuarios y alcance |
| 5 | 22/10 | Visión de producto | "Redacta dos párrafos de visión y dime qué debería esperar, buscar y declarar" | Primer borrador del README |
| 6 | 22/10 | Corrección de artefacto | "Me confundí: el archivo a editar es README.md, no plan.md" | README (sección inicial) |
| 7 | 22/10 | Modelo de datos | "Prepara el anexo de uso de IA y el data-model del módulo" | Borrador de modelo de datos |
| 8 | 22/10 | Revisión del README | "¿Debo borrar los párrafos genéricos del README?" | Limpieza del README |
| 9 | 22/10 | Completitud del README | "¿Conviene incorporar algo más a la visión?" | Secciones de alcance y estructura |
| 10 | 22/10 | Aclaraciones de autoría | "El segundo párrafo es generado; 'arquitecto' lo usa el profesor" | Ajuste de roles y trazabilidad |

### Sesión 2 — 2026-10-29 (conversión del MER)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 11 | 29/10 | Conversión del MER a código | "Quiero que el archivo MER.svg lo pases a código. Quiero que crees un archivo tipo mermaid. Puedes?" | `MER.mmd` creado con 20 tablas y 28 relaciones, sin tocar el SVG (commit `6d02874`) |

### Sesión 3 — 2026-11-01/02 (historias de usuario 9 y 10)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 12 | 01/11 | Acotar alcance | "Lo que quiero es SOLO modificar esos US. No quiero intervenir en ningún otro archivo que no sean los US 9 y 10 de spec.md" | Edición limitada a `spec.md` |
| 13 | 01/11 | Texto propio de las US | Entrega de las frases finales de la US 9 y la US 10, redactadas por el integrante (incluye "Por qué esta prioridad" y "Prueba Independiente") | Texto base de ambas US en `spec.md` |
| 14 | 02/11 | Escenarios de aceptación US 9 | "Solo modifica los escenarios de aceptación del US 9" | Edit en `spec.md` (escenarios de la US 9) |
| 15 | 02/11 | Escenarios de aceptación US 10 | "Ahora solo modifica los escenarios de aceptación del US 10" | Edit en `spec.md` (escenarios de la US 10; commit `7d835e9`) |

### Sesión 4 — 2026-11-02 (revisión de especificación)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 16 | 02/11 | Revisión del repositorio | "Revisa el repo Grupo-11 y las US7 y US8; ¿qué historias conviene incorporar?" | Reemplazo de historias genéricas |
| 17 | 02/11 | Cobertura del traslado | "¿El traslado no está cubierto por la US4?" | Detección de ambigüedad de alcance |
| 18 | 02/11 | Cobertura del kárdex | "¿US4 y US6 no aluden ya a un kárdex?" | Distinción dato vs. funcionalidad |
| 19 | 02/11 | Numeración | "¿Conviene reordenar la numeración de las US?" | Criterio de renumeración |
| 20 | 02/11 | Historia de traslado | "Idea la US8 sobre traslado entre bodegas" | US8 de traslado (incorporada al repo) |
| 21 | 02/11 | Uso de la herramienta | "¿Cómo continúo esta conversación desde la terminal de VS Code?" | Sesiones de OpenCode |

### Sesión 5 — 2026-11-03 (nuevas historias y modelo de datos)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 22 | 03/11 | Nuevas historias | "Incorporar toma de inventario y reserva de stock; acotar US4; revisar el MER" | Propuesta de US de reservas y de toma |
| 23 | 03/11 | Instrucciones de edición | "Entrega las US con acciones, los cambios en data-model.md y tasks.md, y el anexo de IA" | Anexo de IA e instrucciones de edición |

### Sesión 6 — 2026-11-16 (re-análisis y aplicación de cambios)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 24 | 16/11 | Re-análisis del repositorio | "Han pasado días y hay cambios; rehaz el análisis, detecta incongruencias, incorpora historias" | Revisión de `spec.md`, `data-model.md`, `tasks.md`, `MER.mmd` y README contra el estado real (commits del 05/11, 09/11 y 16/11) |
| 25 | 16/11 | Instrucciones de edición actualizadas | "Entrégame las US con acciones, y qué reemplazar en data-model.md y tasks.md; indícame el uso de IA" | US 15 y US 16, FR-046 a FR-056, cambios por archivo y este anexo |
| 26 | 16/11 | Aplicación de los cambios | "Genera todos los cambios solicitados en el repo y deja copia de los archivos nuevos" | `spec.md`, `data-model.md`, `tasks.md`, `plan.md`, `MER.mmd`, README y este anexo (trasladados a `main` para commit directo) |
| 27 | 16/11 | Revisión final previa al commit | "Haz una última revisión y verificación de consistencias, irregularidades y sugerencias" | Correcciones de consistencia en `spec.md`, `data-model.md`, `tasks.md`, `MER.mmd`, README y este anexo |

> La sesión 6 **reemplaza** las recomendaciones de la sesión 5 que quedaron obsoletas: el repositorio ya había acotado la US 4, ya había incorporado la US 8 de traslado y ya conservaba el kárdex como US 7.

---

## 3. Decisiones tomadas por el equipo (no delegadas a la IA)

| Decisión | Fundamento |
|---|---|
| Módulo Logística e Inventario; Entidad = Producto y Documento = Movimiento | Asignación del curso y alcance acordado |
| Kárdex como historia P1 (US 7) | Sostiene la visión de "trazar en todo momento" |
| Traslado como dos movimientos vinculados (pierna origen/pierna destino, mismo `transferId`) | Resuelve el stock en tránsito sin excepciones en el motor de saldos |
| El saldo es siempre derivado de los movimientos; nunca se edita | Coherencia entre `spec.md`, `data-model.md` y el kárdex |
| Stock mínimo a nivel de **producto** (disponible total), no por bodega | Simplicidad del MVP; `min_stock` vive en el producto |
| Reservas descuentan **disponible**, no existencias físicas | Distingue compromiso comercial de stock real |
| Reservas sin lote en la v1 (solo producto + bodega) | La disponibilidad se controla a nivel producto-bodega; el lote se valida por saldo físico propio |
| Toma de inventario compara el conteo contra el **físico** y no altera reservas | Las reservas son compromisos, no existencias |
| El ajuste de una toma se calcula contra el saldo vigente al confirmar | Evita ajustes erróneos si hubo movimientos durante el conteo, sin congelar la bodega |
| Sin autenticación ni permisos por rol en el MVP | Simplificación declarada en Clarifications |

---

## 4. Trazabilidad por artefacto

| Artefacto | Uso de IA | Estado |
|---|---|---|
| `README.md` | Redacción de visión y estructura | Revisado e incorporado |
| `spec.md` — US 7 y US 8 | Redacción inicial | Revisado e incorporado |
| `spec.md` — US 9 y US 10 | Frases redactadas por el integrante; escenarios de aceptación por IA | Revisado e incorporado |
| `spec.md` — US 15 y US 16 | Redacción propuesta | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `spec.md` — FR-046 a FR-056 y Clarifications | Redacción propuesta | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `data-model.md` | Entidades, reglas y relaciones | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `MER.mmd` | Conversión inicial desde `MER.svg` y regeneración | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `tasks.md` | Desglose de tareas | Revisado e incorporado en `main` (T091–T105 pendientes de ejecución); pendiente de commit manual del equipo |
| `plan.md` | Componentes y claves de almacenamiento | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `quickstart.md` | Flujos previstos de reservas y tomas | Revisado e incorporado en `main`; pendiente de commit manual del equipo |
| `anexo-uso-ia.md` | Redacción de este registro | Validado por el equipo |
| Presentación | Pendiente | Pendiente |

---

## 5. Evidencia

| Evidencia | Ubicación |
|---|---|
| Historial de commits | Repositorio del grupo (`MDS-BI/Grupo-11`) |
| Commit previo del equipo | `02eecd6` en `spec/reservas-tomas` (documentación inicial de US 15–16) |
| Rama con los cambios finales | `main` (sobre `30aac12`), con los 8 archivos sin commitear |
| Commit de la revisión final | Pendiente: lo realiza el equipo manualmente en `main` |
| Configuración de la herramienta en el repo | `.opencode/` (comandos de SpecKit) |
| Transcripciones de sesión | Exportadas por el integrante que las realizó (no se adjuntan capturas con datos personales) |

> No adjuntar capturas con datos personales, correos, tokens ni credenciales.

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Contenido inventado o impreciso (alucinación) | Contraste con el instructivo, el repositorio y el código real antes de cada commit |
| Inconsistencia entre `spec.md`, `data-model.md`, `MER.mmd` y `tasks.md` | Revisión cruzada y `/speckit.analyze` antes de cada commit |
| Exposición de datos sensibles en prompts | Prohibido ingresar datos personales, credenciales o información de terceros |
| Dependencia excesiva de la herramienta | Cada integrante debe poder explicar y defender su parte |
| Duplicación de ramas por uso de IA fuera de SpecKit | Una sola rama de integración (`main`), commit manual del equipo, sin ramas paralelas |

---

## 7. Mantenimiento

- Agregar **una fila por sesión de trabajo relevante**, no por mensaje.
- Registrar siempre: fecha, modelo, objetivo, resumen del prompt y artefacto resultante.
- Actualizar la sección 4 cada vez que un artefacto cambie por sugerencia de la IA.
- Mantener este anexo enlazado desde el `README.md` y desde el informe final.

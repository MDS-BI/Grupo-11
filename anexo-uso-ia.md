# Anexo: Registro de Uso de IA Generativa

**Proyecto**: ERP — Módulo de Logística e Inventario (Grupo 11)
**Curso**: Modelación de Sistemas 2026-2 — Universidad de Concepción
**Equipo**: Catalina Cifuentes Mosqueira · Florencia Casas Caro · Martín Gonzales Salas · Estefano Gutierres San Martin · Gonzalo Romero Aravena · Juan Pablo Valladares Ruiz
**Herramienta**: OpenCode (agente de código en terminal / VS Code)
**Modelo**: big-pickle (`opencode/big-pickle`) y mimo-v2.6-flash-free (`opencode/mimo-v2.6-flash-free`) — el modelo de cada sesión se indica en su encabezado
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

> **[MS]** = prompt realizado por **Martin Salas**. Los prompts marcados con [MS] se transcriben **textualmente** desde la base de datos local de OpenCode (`~/.local/share/opencode/opencode.db`); los demás prompts corresponden a otros integrantes del equipo y se registran como resumen (§7).

### Sesión 1 — 2026-10-19/20 (plantillas y plan) — big-pickle / mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 1 | 19/10 | Cambio de modelo de IA | [MS] "quiero cambiar la ia que estoy utilizando" | Preferencia de modelo en la herramienta |
| 2 | 19/10 | Traducción de plantilla | [MS] "transpasame la pantilla al español" | Plantillas de `.specify` en español |
| 3 | 19/10 | Fin de línea LF/CRLF | [MS] Aviso de Git sobre fin de línea LF/CRLF: "me gustaria que lo arreglaras" | Configuración de fin de línea en Git |
| 4 | 20/10 | Edición de plan-template | [MS] "necesito que hagas cambias al archivo ...\.specify\templates\plan-template.md" | Borrador de `plan-template.md` |
| 5 | 20/10 | Explicación del template | [MS] "quiero que me expliques de que trata el archivo, dado a que debo de hacerles cambias al plan" | Comprensión de la plantilla del plan |
| 6 | 20/10 | Ajuste a la temática | [MS] "quiero que ajustes todo esto respecto a que nos toco la tematica de \"logistica e inventario\"" | `plan-template.md` con temática de logística e inventario (commit `930da7b`) |

**Prompts completos (texto literal) — Sesión 1:**

**#1 · 19/10 21:14**
```
quiero cambiar la ia que estoy utilizando
```

**#2 · 19/10 21:39**
```
transpasame la pantilla al español
```

**#3 · 19/10 21:49**
```
me da el siguiente problema "This file uses 'LF' line endings, but Git is configured to convert them to 'CRLF' the next time the file is checked out." me gustaria que lo arreglaras
```

**#4 · 20/10 10:29**
```
necesito que hagas cambias al archivo c:\Users\mrtin\OneDrive\Escritorio\MDS\Grupo-11\.specify\templates\plan-template.md
```

**#5 · 20/10 10:30**
```
quiero que me expliques de que trata el archivo, dado a que debo de hacerles cambias al plan
```

**#6 · 20/10 10:34**
```
quiero que ajustes todo esto respecto a que nos toco la tematica de "logistica e inventario"
```

### Sesión 2 — 2026-10-22 (conceptualización) — big-pickle

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 7 | 22/10 | Idioma de trabajo | Solicitud de responder en español | Preferencia de idioma del equipo |
| 8 | 22/10 | Entender el encargo | "Explícame en términos sencillos qué hay que hacer; qué son SpecKit, MER y Gen IA" | Comprensión del instructivo |
| 9 | 22/10 | Orientación metodológica | "El ERP ya está hecho por el grupo; oriéntame sobre el plan.md y el Trabajo del Curso" | Criterios de alcance |
| 10 | 22/10 | Contexto del módulo | "Se nos asignó Logística e Inventario; roles arquitecto y cliente; sin acceso a los avances" | Definición de usuarios y alcance |
| 11 | 22/10 | Visión de producto | "Redacta dos párrafos de visión y dime qué debería esperar, buscar y declarar" | Primer borrador del README |
| 12 | 22/10 | Corrección de artefacto | "Me confundí: el archivo a editar es README.md, no plan.md" | README (sección inicial) |
| 13 | 22/10 | Modelo de datos | "Prepara el anexo de uso de IA y el data-model del módulo" | Borrador de modelo de datos |
| 14 | 22/10 | Revisión del README | "¿Debo borrar los párrafos genéricos del README?" | Limpieza del README |
| 15 | 22/10 | Completitud del README | "¿Conviene incorporar algo más a la visión?" | Secciones de alcance y estructura |
| 16 | 22/10 | Aclaraciones de autoría | "El segundo párrafo es generado; 'arquitecto' lo usa el profesor" | Ajuste de roles y trazabilidad |

### Sesión 3 — 2026-10-29 (conversión del MER) — mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 17 | 29/10 | Conversión del MER a código | "Quiero que el archivo MER.svg lo pases a código. Quiero que crees un archivo tipo mermaid. Puedes?" | `MER.mmd` creado con 20 tablas y 28 relaciones, sin tocar el SVG (commit `6d02874`) |

### Sesión 4 — 2026-10-30 (spec.md y ajustes de la US 3) — mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 18 | 30/10 | Qué revisar del spec | [MS] "quiero que me indiques, que es lo importante de el spec.md y que se debe de hacer?" | Prioridades de trabajo en `spec.md` |
| 19 | 30/10 | Revisión de la US 3 | [MS] "necesito que rfevises la historia de usiario 3, la cual yo cree que tiene el titulo que empieza por \"como usuario de negocio...\"" | Detección de desalineación en la HU 3 |
| 20 | 30/10 | Verificación de redacción | [MS] "la seccion de \"Como usuario de negocio...\", esta correcta?" | Criterio sobre la redacción de la HU 3 |
| 21 | 30/10 | Cambio de título de la HU 3 | [MS] Cambiar el título de la HU 3 de acuerdo a la frase "Como usuario de negocio, quiero una aplicación con botones sencillos..." | Título nuevo de la HU 3 en `spec.md` |
| 22 | 30/10 | Concordancia del cuerpo | [MS] "ademas quiero que me ajustes lo que vas despues de \"...\" para que tenga concordancia con lo demas" | Ajuste del cuerpo de la HU 3 |
| 23 | 30/10 | "aplicación" → "inicio de página" | [MS] "en vez de que sea una aplicacion, sea el inicio de una pagina" | Ajuste de redacción en `spec.md` (commit `223a6d7`) |

**Prompts completos (texto literal) — Sesión 4:**

**#18 · 30/10 15:22**
```
quiero que me indiques, que es lo importante de el spec.md y que se debe de hacer?
```

**#19 · 30/10 15:28**
```
necesito que rfevises la historia de usiario 3, la cual yo cree que tiene el titulo que empieza por "como usuario de negocio, necesito una aplicacion...."
```

**#20 · 30/10 15:33**
```
la seccion de "Como usuario de negocio, necesito una aplicacion con botones sencillos, los cuales me permitan  realizar tareas de una manera eficaz el acceder a distintos accesos.", esta correcta?
```

**#21 · 30/10 15:36**
```
necesito que el titulo de este historial de usuario lo cambias (el que dice 2### Historia de Usuario 3 - Panel de inicio con acciones rápidas y estadísticas de registros ) de acuerdo a lo que señalo "Como usuario de negocio, quiero una aplicación con botones sencillos que me permitan acceder eficazmente a las distintas tareas, para realizar mi trabajo sin perder tiempo buscando funciones."
```

**#22 · 30/10 15:38**
```
ademas quiero que me ajustes lo que vas despues de "Como usuario de negocio, quiero una aplicación con botones sencillos que me permitan acceder eficazmente a las distintas tareas, para realizar mi trabajo sin perder tiempo buscando funciones." para que tenga concordancia con lo demas
```

**#23 · 30/10 15:48**
```
me gustaria que hicieras un ajuste y que en vez de que sea una aplicacion, sea el inicio de una pagina
```

### Sesión 5 — 2026-11-01/02 (historias de usuario 4, 9 y 10) — mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 24 | 01/11 | Acotar alcance | "Lo que quiero es SOLO modificar esos US. No quiero intervenir en ningún otro archivo que no sean los US 9 y 10 de spec.md" | Edición limitada a `spec.md` |
| 25 | 01/11 | Texto propio de las US | Entrega de las frases finales de la US 9 y la US 10, redactadas por el integrante (incluye "Por qué esta prioridad" y "Prueba Independiente") | Texto base de ambas US en `spec.md` |
| 26 | 01/11 | US 4 | [MS] "necesito que hagas la historia de usuario 4" | US 4 en `spec.md` (commit `fbff753`) |
| 27 | 02/11 | Escenarios de aceptación US 9 | "Solo modifica los escenarios de aceptación del US 9" | Edit en `spec.md` (escenarios de la US 9) |
| 28 | 02/11 | Escenarios de aceptación US 10 | "Ahora solo modifica los escenarios de aceptación del US 10" | Edit en `spec.md` (escenarios de la US 10; commit `7d835e9`) |

**Prompt completo (texto literal) — Sesión 5:**

**#26 · 01/11 17:04**
```
necesito que hagas la historia de usuario 4
```

### Sesión 6 — 2026-11-02 (revisión de especificación) — big-pickle

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 29 | 02/11 | Revisión del repositorio | "Revisa el repo Grupo-11 y las US7 y US8; ¿qué historias conviene incorporar?" | Reemplazo de historias genéricas |
| 30 | 02/11 | Cobertura del traslado | "¿El traslado no está cubierto por la US4?" | Detección de ambigüedad de alcance |
| 31 | 02/11 | Cobertura del kárdex | "¿US4 y US6 no aluden ya a un kárdex?" | Distinción dato vs. funcionalidad |
| 32 | 02/11 | Numeración | "¿Conviene reordenar la numeración de las US?" | Criterio de renumeración |
| 33 | 02/11 | Historia de traslado | "Idea la US8 sobre traslado entre bodegas" | US8 de traslado (incorporada al repo) |
| 34 | 02/11 | Uso de la herramienta | "¿Cómo continúo esta conversación desde la terminal de VS Code?" | Sesiones de OpenCode |

### Sesión 7 — 2026-11-03/04 (nuevas historias, modelo de datos y flujo SpecKit) — big-pickle (equipo) / mimo-v2.6-flash-free (Martin Salas)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 35 | 03/11 | Nuevas historias | "Incorporar toma de inventario y reserva de stock; acotar US4; revisar el MER" | Propuesta de US de reservas y de toma |
| 36 | 03/11 | Instrucciones de edición | "Entrega las US con acciones, los cambios en data-model.md y tasks.md, y el anexo de IA" | Anexo de IA e instrucciones de edición |
| 37 | 03/11 | tasks.md con datos actuales | [MS] "speckit.tasks actualiza a los datos que tenemos actualmente" | Regeneración de `tasks.md` |
| 38 | 03/11 | tasks desde clarify | [MS] "necesito que realizes un speckit.tasks con la informacion del speckit.clarify ... para el \"grupo-11\" de \"logistica e inventario\"" | `tasks.md` de logística e inventario |
| 39 | 03/11 | Análisis de consistencia | [MS] "con la misma tematica del \"grupo 11\" realizes el comando speckit.analyze" | Resultados de `/speckit.analyze` |
| 40 | 03/11 | Implementación | [MS] "quiero que con esto que tienes realizes el speckit.implement" | Ejecución de `tasks.md` |
| 41 | 04/11 | Acotar a implement | [MS] "no lo hagas, simplemente haz el speckit.implement" | Implementación acotada |
| 42 | 04/11 | Ubicación del commit | [MS] "donde debo de colocar el /speckit.git.commit.?" | Uso de SpecKit (`/speckit.git.commit`) |
| 43 | 04/11 | Cómo ver implement | [MS] "como veo el speckit.implement ?" | Uso de SpecKit |
| 44 | 04/11 | Solo mostrar implement | [MS] "yo solamente te pedi que respecto a la info que te di antes, me muestres el speckit.implement" | Corrección de instrucciones a la IA |
| 45 | 04/11 | Delegar ejecución | [MS] "hazlo todo tu" | Ejecución delegada en la IA |

**Prompts completos (texto literal) — Sesión 7:**

**#37 · 03/11 15:53**
```
speckit.tasks actualiza a los datos que tenemos actualmente
```

**#38 · 03/11 16:25**
```
necesito que realizes un speckit.tasks con la informacion del speckit.clarify, que con eso ademas de leefr el spec.md, realizes este speckit.tasks para el "grupo-11" de "logistica e inventario"
```

**#39 · 03/11 16:41**
```
ahora necesito que con la misma tematica del "grupo 11" realizes el comando speckit.analyze
```

**#40 · 03/11 17:11**
```
quiero que con esto que tienes realizes el speckit.implement
```

**#41 · 04/11 23:23**
```
no lo hagas, simplemente haz el speckit.implement
```

**#42 · 04/11 23:29**
```
donde debo de colocar el /speckit.git.commit.?
```

**#43 · 04/11 23:31**
```
como veo el speckit.implement ?
```

**#44 · 04/11 23:35**
```
yo solamente te pedi que respecto a la info que te di antes, me muestres el speckit.implement
```

**#45 · 04/11 23:38**
```
hazlo todo tu
```

### Sesión 8 — 2026-11-05 (resumen de cambios en las US) — mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 46 | 05/11 | Resumen de cambios en US | [MS] "necesito que me hagas un resumen en cuanto a las historias de usuario ... cuales fueron los cambios mas relevantes" | Resumen de cambios en las HU |
| 47 | 05/11 | Exportar a PDF | [MS] "hazme un pdf que contenga toda la informacion del resumen" | Documento PDF del resumen (fuera del repo) |
| 48 | 05/11 | Visualizar la página | [MS] "como puedo ver visualmente el proyecto? Me refiero a la pagina web" | Instrucción de visualización (`npm run dev`) |

**Prompts completos (texto literal) — Sesión 8:**

**#46 · 05/11 11:01**
```
necesito que me hagas un resumen en cuanto a las historias de usuario, quiero que me describas cuales fueron los cambios mas relevantes que le hiciste a ellas
```

**#47 · 05/11 11:07**
```
hazme un pdf que contenga toda la informacion del resumen
```

**#48 · 05/11 11:16**
```
como puedo ver visualmente el proyecto? Me refiero a la pagina web
```

### Sesión 9 — 2026-11-16 (re-análisis, aplicación de cambios y plantilla SpecKit) — big-pickle (equipo) / mimo-v2.6-flash-free (Martin Salas)

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 49 | 16/11 | Re-análisis del repositorio | "Han pasado días y hay cambios; rehaz el análisis, detecta incongruencias, incorpora historias" | Revisión de `spec.md`, `data-model.md`, `tasks.md`, `MER.mmd` y README contra el estado real (commits del 05/11, 09/11 y 16/11) |
| 50 | 16/11 | Instrucciones de edición actualizadas | "Entrégame las US con acciones, y qué reemplazar en data-model.md y tasks.md; indícame el uso de IA" | US 15 y US 16, FR-046 a FR-056, cambios por archivo y este anexo |
| 51 | 16/11 | Aplicación de los cambios | "Genera todos los cambios solicitados en el repo y deja copia de los archivos nuevos" | `spec.md`, `data-model.md`, `tasks.md`, `plan.md`, `MER.mmd`, README y este anexo (trasladados a `main` para commit directo) |
| 52 | 16/11 | Revisión final previa al commit | "Haz una última revisión y verificación de consistencias, irregularidades y sugerencias" | Correcciones de consistencia en `spec.md`, `data-model.md`, `tasks.md`, `MER.mmd`, README y este anexo |
| 53 | 16/11 | Plantilla SpecKit completa | [MS] Plantilla `PROMPT-ACTUALIZAR` con flujo specify → clarify → plan → tasks → analyze → implement y "revises las historias de usuario en general ... me sugirieras cambios a hacer para el trabajo en general" | Revisión general de US con el flujo de SpecKit (plantilla de `PROMPT-ACTUALIZAR.md`) |

**Prompt completo (texto literal) — Sesión 9:**

**#53 · 16/11 12:36**
````

Necesito actualizar el módulo ERP (feature activa: specs/001-erp-base-module).

CAMBIO A REALIZAR:
Necesito que revises las historias de usuario en general para asi tenerlas correctamente, además me gustaria que me sugirieras cambios a hacer para el trabajo en general.
Sigue este flujo de Spec Kit EN ORDEN. No avances al siguiente paso si el anterior
deja errores o preguntas sin resolver, y al terminar cada paso dame un resumen corto:

1. /speckit.specify   → Actualiza spec.md con el cambio descrito arriba (solo si es una
                         funcionalidad nueva o cambia el alcance; si es un ajuste menor, omítelo).
2. /speckit.clarify   → Detecta ambigüedades en spec.md y hazme las preguntas necesarias.
3. /speckit.plan      → Actualiza plan.md, data-model.md y contracts/ según lo aclarado.
4. /speckit.tasks     → Regenera tasks.md con las tareas del cambio, ordenadas por dependencia.
5. /speckit.analyze   → Revisa consistencia entre spec.md, plan.md y tasks.md. Corrige las
                         inconsistencias críticas antes de continuar.
6. /speckit.implement → Ejecuta las tareas de tasks.md y marca cada una como completada.

AL TERMINAR:
- Ejecuta `npm install` si cambiaron dependencias.
- Ejecuta `npm run dev` y verifica que la página levante sin errores.
- Dime qué archivos se modificaron y qué debo probar manualmente.
```

---

## Notas

- El comando correcto es `/speckit.tasks` (con "s"), no `speckit.task`.
- El orden completo es: `specify → clarify → plan → tasks → analyze → implement`.
  Si solo quieres re-ejecutar la implementación sin cambiar la spec, usa solo los pasos 4 a 6.
- Comandos opcionales disponibles en este proyecto:
  `/speckit.checklist` (lista de calidad de requisitos),
  `/speckit.converge`,
  `/speckit.taskstoissues` (crea issues de GitHub desde tasks.md),
  `/speckit.constitution` (reglas generales del proyecto).
- Los comandos están definidos en `.opencode/commands/`.

````

### Sesión 10 — 2026-11-17 (localización de prompts y edición del anexo) — mimo-v2.6-flash-free

| # | Fecha | Objetivo | Resumen del prompt | Artefacto / decisión |
|---|---|---|---|---|
| 54 | 17/11 | Localizar prompts y editar el anexo | [MS] "necesito que localizes todos los promps que he realizado de acuerdo a este trabajo y edites la seccion \"anexo-uso-ia.md\" ... sigas el orden el cual lleva la seccion" | Edición de este anexo (§2) |

**Prompt completo (texto literal) — Sesión 10:**

**#54 · 17/11 15:18**
```
necesito que localizes todos los promps que he realizado de acuerdo a este trabajo y edites la seccion "c:\Users\mrtin\OneDrive\Escritorio\MDS\Grupo-11\anexo-uso-ia.md" colocando en ella lo que te pedi y ademas sigas el orden el cual lleva la seccion
```

> La sesión 9 **reemplaza** las recomendaciones de la sesión 7 que quedaron obsoletas: el repositorio ya había acotado la US 4, ya había incorporado la US 8 de traslado y ya conservaba el kárdex como US 7.

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
| Base de datos local de OpenCode (prompts textuales de Martin Salas) | `~/.local/share/opencode/opencode.db` en la máquina del integrante (§2, texto literal) |

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

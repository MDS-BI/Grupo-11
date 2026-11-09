# Prompt reutilizable: actualizar la página con Spec Kit

Copia el bloque de abajo, reemplaza lo que está entre `[CORCHETES]` y pégalo en el chat.

---

```
Necesito actualizar el módulo ERP (feature activa: specs/001-erp-base-module).

CAMBIO A REALIZAR:
[Describe aquí qué se quiere agregar, modificar o corregir. Ej.: "agregar campo X a productos",
"guardar los datos en Supabase para que todos los usuarios los vean", etc.]

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

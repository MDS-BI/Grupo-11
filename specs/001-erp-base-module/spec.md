# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Borrador  
**Entrada**: Descripción del usuario: "Construir un módulo base de software de planificación de recursos empresariales (ERP) que pueda extenderse en módulos ERP personalizados. Debe proporcionar gestión de datos maestros (entidades) y documentos transaccionales vinculados con capacidades de crear/editar/eliminar/buscar."

## Propósito

Este proyecto sirve como módulo base reutilizable para construir módulos ERP personalizados. Establece los patrones comunes que todo módulo ERP necesita: gestionar registros de datos maestros (**Entidades**) y sus **Documentos** transaccionales asociados, con navegación, validación, persistencia y búsqueda ya implementadas, de modo que los módulos personalizados solo necesiten definir sus campos y reglas específicos del dominio.

## Clarifications

### Session 2026-11-03

- Q: ¿Cómo debe presentarse la interfaz del MVP, como un módulo de Logística e Inventario con etiquetas propias (Producto, Bodega, Movimiento) o como el módulo base genérico de ERP (Entidad, Documento)? → A: Opción A: Logística por defecto; la UI muestra Producto, Bodega y Movimiento desde el arranque (Entidad→Producto, Documento→Movimiento como etiquetas visibles) y Entidad/Documento quedan como nombres internos del módulo base.
- Q: ¿Cómo debe llegar el usuario a las pantallas de Bodegas y de Lotes desde la navegación principal? → A: Opción A: quinto botón en la barra lateral (Panel, Productos, Movimientos, Bodegas y Buscar); los Lotes se abren desde la gestión del producto, no como módulo independiente.
- Q: ¿Habrá control de acceso por rol en el MVP, de modo que el Encargado de Bodega y el Operador de Inventario vean pantallas o acciones diferentes? → A: Opción A: sin autenticación; todos los usuarios tienen los mismos permisos y los roles de las historias son solo actores de los escenarios.
- Q: ¿Cómo debe representarse un traslado entre bodegas en el modelo de datos para que sus saldos cuadren? → A: Opción A: dos movimientos vinculados que comparten el documento del traslado — un tramo de salida en el almacén de origen y un tramo de entrada en el almacén de destino —; el saldo de cada almacén sigue siendo la suma de sus movimientos.
- Q: ¿Dónde deben guardarse el estado de ciclo de vida de un movimiento y el registro de una devolución, que hoy no existen en el modelo de datos? → A: Opción A: el estado vive en el propio movimiento (campo `status` con su fecha de cambio) y la devolución es una entidad propia con motivo, cantidades, merma y ciclo de vida, vinculada al movimiento original sin modificarlo.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Crear y organizar entidades (Prioridad: P1)
Como usuario de negocio, quiero crear entradas de entidad con detalles claros para poder
construir y mantener los datos maestros del módulo.

Por qué esta prioridad: Este es el valor central del producto porque, sin crear entidades,
el resto de la experiencia no puede aportar valor.

Prueba Independiente: Un usuario puede abrir el módulo, añadir una nueva entidad y verla
aparecer en la lista.

Escenarios de Aceptación:
1. Dado que un usuario está viendo la lista de entidades, cuando crea una nueva entidad con un
   nombre y un código, entonces la nueva entidad se guarda y aparece en la lista.
2. Dado que un usuario está creando una entidad, cuando deja la información obligatoria en
   blanco, entonces el sistema impide guardar y explica qué se necesita.
3. Dado que ya existe una entidad con un código determinado, cuando el usuario intenta crear
   otra con el mismo código, entonces el sistema impide guardar e indica que el código está
   duplicado.
4. Dado que el usuario ingresa texto con HTML o scripts en un campo, cuando guarda y la
   entidad se muestra, entonces el contenido se escapa y no se ejecuta.
5. Dado que la entidad tiene categoría, cuando el usuario la clasifica, entonces elige entre
   los valores definidos en la configuración (no texto libre).

Datos involucrados (para el MER y data-model.md):
- Tabla/entidad: Entidad
- Campos: entity_id (autogenerado), nombre (obligatorio), código (obligatorio, único),
  descripción, categoría, fecha objetivo (opcional)
- Relación: una Entidad tiene cero o más Documentos (1:N, eliminación en cascada)

Decisión de datos y justificación:
- El código de negocio es único porque identifica el registro de forma legible y evita
  duplicados en los datos maestros.
- La categoría usa valores controlados para evitar clasificaciones inconsistentes y sesgos
  en análisis posteriores.
- Los datos se guardan en localStorage por ser un MVP sin servidor; esto limita la
  seguridad y la persistencia (ver issue de decisiones).

Riesgos de datos:
- Contenido malicioso (XSS) → mitigado con escape de HTML al renderizar.
- Datos duplicados o incompletos → mitigados con validaciones de obligatoriedad y unicidad.
- Datos reales sensibles en localStorage → usar solo datos ficticios en el MVP.

---

### Historia de Usuario 2 - Editar y eliminar entidades (Prioridad: P1)
Como usuario de negocio, quiero actualizar o eliminar entidades cuando cambien los datos maestros para que los registros se mantengan precisos.

**Por qué esta prioridad**: Mantener los registros actualizados es esencial para la confianza en la herramienta y para soportar las operaciones comerciales diarias.

**Prueba Independiente**: Un usuario puede seleccionar una entidad existente, cambiar su información o eliminarla, y la lista refleja el cambio.

**Escenarios de Aceptación**:

1. **Dada** una entidad que ya existe en la lista, **cuando** el usuario edita sus detalles, **entonces** la información actualizada se guarda y se muestra en la lista.
2. **Dada** una entidad que ya no es relevante, **cuando** el usuario la elimina, **entonces** desaparece de la lista y deja de aparecer en los resultados de búsqueda.
3. **Dadas** cientos de entidades almacenadas, **cuando** el usuario edita o elimina una, **entonces** la lista se actualiza correctamente y sigue siendo ágil.

---

### Historia de Usuario 3 - Inicio de una página con botones sencillos para acceder eficazmente a las tareas (Prioridad: P1)

Como usuario de negocio, quiero el inicio de una página con botones sencillos que me permitan acceder eficazmente a las distintas tareas, para realizar mi trabajo sin perder tiempo buscando funciones.

**Por qué esta prioridad**: La pantalla de inicio es el punto de entrada de la aplicación. Nada más puede alcanzarse sin ella, y los botones sencillos son la ruta más rápida hacia cada flujo de trabajo central.

**Prueba Independiente**: Un usuario abre la aplicación, ve una pantalla con múltiples botones sencillos claramente etiquetados y estadísticas de registros, inicia un nuevo producto o movimiento con un solo clic y ve estadísticas que reflejan los datos almacenados.

**Escenarios de Aceptación**:

1. **Dado** que el usuario abre la aplicación, **cuando** la aplicación carga, **entonces** se muestra la pantalla de inicio con al menos cuatro botones sencillos claramente etiquetados que cubren las tareas clave: crear un nuevo producto, crear un nuevo movimiento, abrir la gestión de productos y buscar registros (etiquetas por defecto de Logística e Inventario; ver Clarificaciones).
2. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de nuevo producto, **entonces** la aplicación abre el área de gestión de productos con un formulario vacío listo para introducir datos.
3. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de nuevo movimiento, **entonces** la aplicación abre el área de gestión de movimientos con un formulario vacío listo para introducir datos.
4. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de buscar registros, **entonces** la aplicación abre la pantalla de búsqueda con el campo de búsqueda enfocado.
5. **Dadas** entidades y documentos almacenados, **cuando** el usuario ve la pantalla de inicio, **entonces** las tarjetas de estadísticas muestran el recuento actual de entidades y documentos.
6. **Dado** que el usuario crea o elimina registros en otra parte de la aplicación, **cuando** vuelve a la pantalla de inicio, **entonces** las estadísticas reflejan el cambio.

---

### Historia de Usuario 4 - Registrar movimientos de inventario en una pantalla dedicada (Prioridad: P1)

Como encargado de bodega, quiero una pantalla dedicada donde registre los movimientos de inventario de entrada, salida, traslado y ajuste, para que el stock de la bodega refleje en todo momento lo que realmente hay en el almacén.

**Por qué esta prioridad**: La captura de movimientos es la operación diaria central del módulo de logística: sin registrar entradas y salidas no existe un stock confiable sobre el que despachar, recibir o planificar. Es el equivalente operativo de la gestión de datos maestros del módulo base.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión desde la barra lateral o una acción rápida del panel, registra una entrada de un producto en un almacén con su cantidad y fecha, verifica que el stock resultante aumenta, y registra una salida que lo hace disminuir; una salida que dejaría el saldo en negativo se rechaza indicando el saldo disponible.

**Alcance y decisiones**:

- Un movimiento identifica un producto, un almacén, una cantidad y un tipo (entrada, salida, traslado o ajuste); el lote y el documento de origen son opcionales.
- Un traslado se captura una sola vez indicando almacén de origen y almacén de destino, y se guarda como dos movimientos vinculados (salida en el origen, entrada en el destino) que comparten el documento del traslado (ver Clarificaciones).
- Los movimientos guardados son inmutables: no se editan ni se eliminan; una corrección se registra con un movimiento de ajuste.
- Con un ciclo de vida configurado, el momento en que el movimiento afecta al stock lo rige la Historia de Usuario 12; sin ciclo de vida, el saldo se actualiza al guardar.
- El saldo por producto y almacén se calcula sumando sus movimientos; nunca se edita directamente.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de gestión de movimientos, **cuando** crea uno nuevo, **entonces** debe indicar tipo, producto, almacén, cantidad y fecha; si deja un campo obligatorio en blanco, el sistema impide guardar y explica qué se necesita.
2. **Dada** una cantidad que no es un entero positivo o una fecha que no es una fecha de calendario válida, **cuando** el usuario intenta guardar, **entonces** el sistema rechaza el guardado con una explicación clara.
3. **Dado** un producto y un almacén existentes, **cuando** el usuario registra una entrada, **entonces** el movimiento se guarda y el saldo del producto en ese almacén aumenta en la cantidad indicada.
4. **Dada** una salida cuya cantidad supera el saldo disponible del producto en el almacén, **cuando** el usuario intenta guardarla, **entonces** el sistema la rechaza e indica el saldo disponible.
5. **Dado** un movimiento guardado, **cuando** el usuario vuelve a la pantalla de gestión, **entonces** ve el saldo actual del producto por almacén de un vistazo.
6. **Dado** que el usuario asocia un lote a un movimiento, **cuando** guarda, **entonces** el lote debe pertenecer al mismo producto; si no, el sistema lo rechaza con una explicación.
7. **Dado** un movimiento, **cuando** el usuario lo registra, **entonces** puede asociarlo opcionalmente al documento que lo origina (p. ej. una orden de compra o una remisión).
8. **Dado** un movimiento ya guardado, **cuando** el usuario intenta editarlo o eliminarlo, **entonces** el sistema no lo permite y explica que las correcciones se registran con un movimiento de ajuste.
9. **Dado** que el usuario llega a la pantalla de gestión desde la barra lateral o una acción rápida del panel, **cuando** la pantalla se abre, **entonces** el formulario está listo para introducir datos y el módulo activo queda resaltado.
10. **Dado** que el usuario está en la pantalla de gestión, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio sin perder los movimientos almacenados.

---

### Historia de Usuario 5 - Gestionar las bodegas del inventario (Prioridad: P1)

Como encargado de bodega, quiero crear, editar y desactivar las bodegas donde se guarda el inventario, para que cada movimiento se registre en el almacén real y el histórico quede protegido.

**Por qué esta prioridad**: Todo movimiento de inventario exige indicar una bodega, así que el catálogo de bodegas es el cimiento del módulo de logística: sin él no se pueden separar los saldos por ubicación ni impedir registrar entradas en almacenes dados de baja. Además, proteger el histórico de movimientos es esencial para la confianza del inventario frente a auditorías y conteos.

**Prueba Independiente**: Un encargado de bodega abre la pantalla de bodegas desde la barra lateral, crea una bodega con código y nombre, la desactiva y comprueba que ya no acepta movimientos nuevos, mientras que los movimientos y los saldos históricos de esa bodega siguen visibles e intactos.

**Escenarios de Aceptación**:

1. **Dado** que el encargado de bodega está en la pantalla de bodegas, **cuando** crea una bodega con código y nombre, **entonces** la bodega se guarda y aparece en la lista de bodegas.
2. **Dado** que el usuario deja el código o el nombre en blanco, **cuando** intenta guardar la bodega, **entonces** el sistema impide guardar y explica qué se necesita.
3. **Dada** una bodega ya registrada con un código determinado, **cuando** el usuario intenta crear otra con el mismo código (incluso si la primera está desactivada), **entonces** el sistema impide guardar e indica que el código está duplicado.
4. **Dada** una bodega activa, **cuando** el usuario edita su nombre o dirección, **entonces** los cambios se guardan y los movimientos históricos que la referencian muestran la información actualizada sin que cambien sus cantidades ni los saldos.
5. **Dada** una bodega con movimientos registrados, **cuando** el usuario intenta eliminarla, **entonces** el sistema rechaza la eliminación y sugiere desactivarla para conservar el histórico de inventario.
6. **Dada** una bodega desactivada, **cuando** el usuario intenta registrar un movimiento con ella, **entonces** el sistema rechaza la operación e indica que la bodega no puede recibir movimientos.
7. **Dada** una bodega desactivada, **cuando** el usuario consulta la lista de movimientos o los saldos existentes, **entonces** el histórico de esa bodega sigue visible y sus saldos no cambian.
8. **Dada** una bodega desactivada, **cuando** el usuario la vuelve a activar, **entonces** queda disponible de nuevo para registrar movimientos sin necesidad de crear otra bodega.
9. **Dado** que el encargado llega a la pantalla de bodegas desde la barra lateral, **cuando** la pantalla se abre, **entonces** ve la lista de bodegas con su código, nombre y estado (activa o desactivada) de un vistazo.

---

### Historia de Usuario 6 - Registrar lotes y controlar vencimientos (Prioridad: P2)

Como operador de inventario, quiero registrar los lotes de cada producto con sus fechas y consultar su saldo y vencimiento, para despachar primero lo que vence antes y mantener la trazabilidad de lo que hay en bodega.

**Por qué esta prioridad**: El control de lotes aporta trazabilidad y evita despachar mercadería vencida; es una mejora de madurez operativa que complementa la captura de movimientos (Historia de Usuario 4), pero no bloquea el MVP porque los lotes siguen siendo opcionales en los movimientos.

**Prueba Independiente**: Un operador de inventario registra un lote con número, fecha de fabricación y fecha de vencimiento para un producto, verifica que aparece en la lista de lotes de ese producto con saldo en cero y que al registrar una entrada con ese lote su saldo aumenta; al intentar guardar una fecha de vencimiento anterior a la de fabricación, el sistema rechaza el guardado.

**Escenarios de Aceptación**:

1. **Dado** que el operador de inventario abre la pantalla de lotes desde la gestión del producto, **cuando** registra un lote con su número, **entonces** el lote se guarda, queda asociado al producto y aparece en la lista de lotes de ese producto con saldo inicial en cero.
2. **Dado** que ya existe un lote con ese número para el mismo producto, **cuando** el usuario intenta registrarlo otra vez, **entonces** el sistema impide guardar e indica que el número de lote está duplicado; el mismo número sí se permite en otro producto.
3. **Dada** una fecha de vencimiento anterior a la fecha de fabricación, **cuando** el usuario intenta guardar el lote, **entonces** el sistema rechaza el guardado con una explicación clara.
4. **Dado** que el usuario deja en blanco la fecha de fabricación o la de vencimiento, **cuando** guarda el lote, **entonces** el lote se guarda igual porque esas fechas son opcionales.
5. **Dado** un lote con movimientos de entrada y salida, **cuando** el usuario consulta sus datos, **entonces** el saldo del lote se muestra como la suma de sus movimientos y no se puede editar directamente.
6. **Dada** una salida o un traslado de un producto con varios lotes vigentes con saldo, **cuando** el operador elige el lote a despachar, **entonces** el sistema sugiere primero el lote con la fecha de vencimiento más próxima (primer vencido, primero fuera).
7. **Dado** un lote cuya fecha de vencimiento ya pasó, **cuando** el usuario intenta usarlo en una salida o un traslado, **entonces** el sistema lo rechaza e indica que el lote está vencido.
8. **Dado** un producto con lotes vencidos o próximos a vencer, **cuando** el usuario consulta la lista de lotes, **entonces** esos lotes se marcan visualmente para detectarlos de un vistazo.
9. **Dado** un producto sin lotes registrados, **cuando** el operador registra una salida, **entonces** puede guardarla sin lote porque el lote sigue siendo opcional en el movimiento.
10. **Dado** un lote con movimientos asociados, **cuando** el usuario intenta eliminarlo, **entonces** el sistema rechaza la eliminación para conservar la trazabilidad de los movimientos.

---

### Historia de Usuario 7 - Consultar el kárdex de un producto con saldo acumulado (Prioridad: P1)

Como encargado de bodega, quiero ver el historial completo de movimientos de un producto junto a su saldo acumulado, para reconstruir cómo llegó a su stock actual y detectar diferencias o registros sospechosos.

**Por qué esta prioridad**: El stock calculado solo es confiable si puede auditarse. El kárdex convierte movimientos dispersos en trazabilidad verificable y es la base para detectar errores de digitación o pérdidas. No requiere estructuras nuevas —se deriva de los movimientos ya registrados—, por lo que su costo es bajo frente al valor que entrega.

**Prueba Independiente**: Un usuario abre el detalle de un producto, ve sus movimientos ordenados por fecha con el saldo acumulado después de cada uno, y comprueba que el último saldo coincide con el stock mostrado en la lista de productos.

**Escenarios de Aceptación**:

1. **Dado** un producto con movimientos registrados, **cuando** el usuario abre su historial, **entonces** ve cada movimiento con fecha, tipo, bodega, cantidad y saldo acumulado posterior, ordenados del más antiguo al más reciente.
2. **Dado** un producto sin movimientos, **cuando** el usuario abre su historial, **entonces** se muestra un estado vacío que indica que aún no hay movimientos registrados.
3. **Dado** un producto con entradas, salidas y ajustes confirmados, **cuando** el usuario consulta el historial, **entonces** el saldo acumulado se calcula solo con movimientos confirmados y el saldo final coincide con el stock mostrado en la lista de productos.
4. **Dado** un movimiento anulado, **cuando** se muestra en el historial, **entonces** aparece marcado como anulado y no altera el saldo acumulado.
5. **Dado** un historial con muchos movimientos, **cuando** el usuario lo consulta, **entonces** puede filtrar por tipo de movimiento y por rango de fechas.
6. **Dado** un producto marcado con stock bajo, **cuando** el usuario revisa su historial, **entonces** puede identificar el último movimiento que dejó el saldo por debajo del mínimo.
7. **Dado** el historial en modo solo lectura, **cuando** el usuario intenta modificar un movimiento desde ahí, **entonces** el sistema lo impide y lo remite a la pantalla de movimientos.

---

### Historia de Usuario 8 - Trasladar stock entre bodegas (Prioridad: P2)

Como encargado de bodega, quiero trasladar unidades de un producto desde una bodega de origen hacia otra de destino, para reflejar el movimiento real de mercadería entre almacenes sin alterar el stock total de la empresa.

**Por qué esta prioridad**: Con una sola bodega el MVP funciona sin traslados; pero en cuanto existen varias, el traslado es la única forma de explicar por qué un producto deja de estar en un almacén y aparece en otro sin haber sido vendido. Se posterga porque exige un documento con dos almacenes, estados y stock en tránsito: una complejidad que no bloquea la captura básica de entradas y salidas.

**Prueba Independiente**: Un encargado registra un traslado de 20 unidades del Almacén A al Almacén B y lo despacha; comprueba que A baja en 20 y que las unidades quedan "en tránsito" sin estar disponibles en B; al marcarlo como recibido, B sube en 20 y el tránsito se cierra. Al intentar trasladar 999 unidades con solo 50 disponibles en origen, el sistema rechaza la operación e indica el saldo disponible.

**Alcance y decisiones**:

- Un traslado tiene bodega de origen, bodega de destino, fecha, estado y una o más líneas (producto + cantidad); un mismo producto no puede repetirse en dos líneas.
- El stock total de la empresa no cambia: solo se redistribuye entre bodegas.
- Las unidades despachadas y aún no recibidas quedan **en tránsito**: no están disponibles en ninguna de las dos bodegas.
- El ciclo de estados sigue la Historia de Usuario 12, con la cadena de referencia Solicitado → Despachado → En tránsito → Recibido.
- Un traslado confirmado es inmutable; una corrección se registra con un movimiento de ajuste, igual que en la Historia de Usuario 4.
- No se permiten traslados desde o hacia bodegas desactivadas (Historia de Usuario 5).

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de traslados, **cuando** crea uno nuevo, **entonces** debe indicar bodega de origen, bodega de destino, fecha y al menos un producto con cantidad; si falta un campo obligatorio, el sistema impide guardar y explica qué se necesita.
2. **Dado** un traslado en preparación, **cuando** el usuario selecciona la misma bodega como origen y destino, **entonces** el sistema rechaza la operación e indica que deben ser distintas.
3. **Dado** un producto con 50 unidades en la bodega de origen, **cuando** el usuario intenta trasladar 999, **entonces** el sistema rechaza la operación e indica el saldo disponible en origen.
4. **Dada** una cantidad no positiva o no numérica, **cuando** el usuario intenta guardar la línea, **entonces** el sistema la rechaza con una explicación clara.
5. **Dado** un traslado en estado "Solicitado", **cuando** el usuario lo despacha, **entonces** el saldo de origen disminuye en la cantidad trasladada y las unidades quedan marcadas como "en tránsito", sin estar disponibles en destino.
6. **Dado** un traslado "En tránsito", **cuando** el usuario consulta el stock de cualquiera de las dos bodegas, **entonces** las unidades en tránsito no se suman al saldo disponible y se informan por separado.
7. **Dado** un traslado "En tránsito", **cuando** el usuario lo marca como "Recibido", **entonces** el saldo de destino aumenta en la cantidad trasladada y el tránsito se cierra.
8. **Dado** un traslado en estado "Solicitado", **cuando** el usuario lo cancela, **entonces** no se altera ningún saldo.
9. **Dado** un traslado ya "Recibido", **cuando** el usuario intenta cancelarlo o editarlo, **entonces** el sistema lo impide y explica que la corrección se registra con un ajuste.
10. **Dado** un traslado despachado o recibido, **cuando** el usuario consulta la trazabilidad de un producto, **entonces** el traslado aparece en el historial de ambas bodegas con su referencia.
11. **Dada** una bodega de destino desactivada, **cuando** el usuario intenta trasladar hacia ella, **entonces** el sistema lo rechaza e indica que la bodega no puede recibir movimientos.

---

### Historia de Usuario 9 - Definir stock mínimo por producto y almacén (Prioridad: P2)
Como encargado de bodega, quiero definir un stock mínimo por producto y almacén, para saber de inmediato qué artículos necesitan reposición antes de que se agoten.

**Por qué esta prioridad**: El stock mínimo automatiza la detección de faltantes para evitar conteos manuales, ganando valor a medida que crecen el catálogo y los almacenes; sin embargo, no bloquea el MVP, ya que las entradas y salidas pueden gestionarse completas sin él.

**Prueba Independiente**: Un encargado de bodega fija un stock mínimo de 10 unidades para un producto en un almacén, guarda, y al consultar la lista o la búsqueda ve el producto marcado como "stock bajo" cuando su saldo real es 5; al subir el saldo con una entrada a 15, la marca desaparece.

**Escenarios de Aceptación**:

1. **Dado** que el encargado de bodega está creando o editando un producto, **cuando** introduce un stock mínimo de 10 unidades y guarda, **entonces** el valor se guarda y se muestra junto al producto en la lista.
2. **Dado** un producto con stock mínimo definido y un saldo real de 5 unidades en un almacén, **cuando** el usuario consulta la lista o la pantalla de búsqueda, **entonces** el producto aparece marcado visualmente como "stock bajo".
3. **Dado** un producto marcado como "stock bajo", **cuando** el usuario registra una entrada que eleva su saldo a 15 unidades, **entonces** la marca de "stock bajo" desaparece al volver a consultar la lista o la búsqueda.
4. **Dada** una cantidad negativa o no numérica, **cuando** el usuario intenta guardar el stock mínimo, **entonces** el sistema rechaza el guardado con una explicación clara.
5. **Dado** que el usuario deja el stock mínimo en blanco, **cuando** guarda el producto, **entonces** el producto se guarda sin mínimo y la lista no muestra ninguna marca de "stock bajo" para él.
6. **Dado** un producto cuyo saldo es igual a su stock mínimo, **cuando** el usuario consulta la lista o la búsqueda, **entonces** no se marca como "stock bajo" porque el saldo no queda por debajo del mínimo.


---

### Historia de Usuario 10 - Registrar documentos de respaldo de logística (Prioridad: P2)
Como usuario de negocio, quiero crear y organizar los documentos de logística junto a los productos, para mantener la actividad transaccional ordenada y no perder evidencia de las operaciones.

**Por qué esta prioridad**: Guardar los documentos de respaldo junto a los productos permite rastrear cada entrada o salida hasta el pedido o remisión que la originó, lo que da confianza al inventario frente a auditorías y diferencias. Es una mejora de madurez operativa: el módulo funciona sin ella, pero con evidencia dispersa. 

**Prueba Independiente**: Un usuario crea una orden de compra con sus datos obligatorios, la ve aparecer en la lista de documentos junto al producto asociado, y al eliminar ese producto comprueba que el documento también se elimina en cascada.

**Escenarios de Aceptación**:

1. **Dada** la lista de productos, **cuando** el usuario crea una orden de compra con sus datos obligatorios y la asocia a un producto, **entonces** el documento se guarda y aparece en la lista de documentos junto a ese producto.
2. **Dado** que el usuario está creando un documento de respaldo (orden de compra o remisión), **cuando** deja un campo obligatorio en blanco, **entonces** el sistema impide guardar y explica qué se necesita.
3. **Dada** la lista de documentos de un producto, **cuando** el usuario los consulta, **entonces** cada documento se muestra con su tipo y su folio, identificables de un vistazo.
4. **Dado** un documento de respaldo existente, **cuando** el usuario edita sus datos, **entonces** los cambios se guardan y se reflejan en la lista junto al producto.
5. **Dado** un producto con documentos de respaldo asociados, **cuando** el usuario elimina el producto, **entonces** sus documentos también se eliminan (borrado en cascada).
6. **Dado** un movimiento de inventario registrado, **cuando** el usuario lo asocia al documento que lo origina, **entonces** el movimiento queda vinculado a esa orden de compra o remisión.

---

### Historia de Usuario 11 - Buscar entidades en una pantalla dedicada (Prioridad: P2)

Como encargado de bodega, quiero una pantalla de búsqueda dedicada para ubicar productos (entidades) por SKU, nombre, categoría o ubicación sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el catálogo de productos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un SKU o nombre y ver solo los productos coincidentes con su stock actual.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente con el SKU, nombre, categoría o ubicación en bodega, **entonces** solo se muestran los productos coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dados** 500 o más productos almacenados, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.
5. **Dados** resultados de búsqueda, **cuando** se muestran, **entonces** cada producto indica su stock actual y se marca visualmente si está por debajo del stock mínimo.
6. **Dada** la pantalla de búsqueda, **cuando** el usuario combina filtros (categoría, almacén y "solo stock bajo"), **entonces** se muestran únicamente los productos que cumplen todos los filtros aplicados.
7. **Dado** que el usuario llega desde la barra lateral o desde la acción rápida de buscar registros del panel, **cuando** se abre la pantalla, **entonces** el campo de búsqueda queda enfocado.
8. **Dado** un resultado de búsqueda, **cuando** el usuario lo selecciona, **entonces** se muestra el detalle del producto en modo solo lectura, y la edición permanece en la pantalla de gestión.
9. **Dado** que el usuario busca un término con distinta capitalización, tildes o solo una parte del SKU, **cuando** envía la búsqueda, **entonces** se devuelven igualmente los productos coincidentes.
10. **Dado** que el usuario introduce HTML o scripts como término de búsqueda, **cuando** se muestran el término o los resultados, **entonces** el contenido se escapa y no se ejecuta.
11. **Dado** que el usuario envía la búsqueda vacía, **cuando** se procesa, **entonces** se muestran todos los productos o se indica que debe ingresar un término, de forma consistente.

---

### Historia de Usuario 12 - Configurar el ciclo de vida de estados de documentos (Prioridad: P2)

Como jefe de logística, quiero que cada movimiento de inventario (documento) siga un ciclo de estados controlado, para que no se pueda marcar como recibido un movimiento que nunca fue despachado y el stock refleje la realidad.

**Por qué esta prioridad**: Los módulos de logística necesitan ciclos de vida controlados, y el stock solo es confiable si cambia en el momento correcto. El estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende de la configuración del módulo cargada al arrancar (ModuleConfig, FR-023 a FR-025).

**Prueba Independiente**: Un desarrollador configura el ciclo de un traslado (Solicitado → Despachado → En tránsito → Recibido); el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, el estado es visible de un vistazo en las listas y el stock cambia únicamente al despachar y al recibir.

**Ciclos de vida de referencia**:

- **Orden de compra**: Borrador → Aprobada → Enviada por proveedor → Recibida → Cerrada; Cancelada posible antes de Recibida.
- **Traslado entre almacenes**: Solicitado → Despachado → En tránsito → Recibido; Cancelado posible antes de Despachado.
- **Salida / despacho a cliente**: Pendiente → Preparado → Despachado → Entregado; Cancelado posible antes de Despachado.

**Regla de stock (única fuente de verdad)**:

- El stock **baja al pasar a Despachado** (salidas y traslados, en el almacén de origen), nunca antes. Una cancelación durante Solicitado, Pendiente o Preparado no afecta el stock, evitando descuentos incorrectos y reingresos manuales.
- El stock **sube al pasar a Recibido / Recibida** (órdenes de compra y traslados, en el almacén de destino).
- Una vez Despachado, el movimiento ya no puede cancelarse.
- El estado del ciclo de vida se guarda en el propio movimiento (campo `status`) junto con la fecha del cambio; las devoluciones son registros aparte con su propio ciclo de vida (HU 14; ver Clarifications).

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario edita el estado de un documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía (p. ej., de Borrador a Recibida), **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de documentos, **entonces** el estado actual es identificable de un vistazo mediante una etiqueta visual.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos, **entonces** el estado permanece como texto libre igual que en el módulo base sin modificar.
5. **Dado** un movimiento de salida o traslado en estado Preparado, **cuando** el usuario lo cancela, **entonces** el stock de los productos no cambia.
6. **Dado** un movimiento de salida o traslado, **cuando** pasa a Despachado, **entonces** el stock del producto disminuye en la cantidad indicada en el almacén de origen.
7. **Dado** un traslado o una orden de compra, **cuando** pasa a Recibido / Recibida, **entonces** el stock del producto aumenta en la cantidad indicada en el almacén de destino.
8. **Dado** un movimiento ya Despachado, **cuando** el usuario intenta cancelarlo, **entonces** el sistema lo rechaza con una explicación clara que indica que, una vez entregado o recibido, debe registrarse una devolución (Historia de Usuario 14).
9. **Dado** un movimiento en un estado final (Cerrada, Cancelado, Entregado), **cuando** el usuario intenta cambiar su estado, **entonces** no se ofrece ninguna transición.
10. **Dado** un despacho cuya cantidad supera el stock disponible, **cuando** el usuario intenta pasarlo a Despachado, **entonces** el sistema lo rechaza e indica el stock disponible.
11. **Dado** un cambio de estado, **cuando** se guarda, **entonces** se registra la fecha del cambio (y opcionalmente el usuario) para mantener un historial del movimiento.

---

### Historia de Usuario 13 - Marco de espacio de trabajo ERP con marca (Prioridad: P1)

Como usuario de negocio, quiero un espacio de trabajo estilo ERP consistente, con una barra superior con marca y una barra lateral de módulos presentes en cada pantalla, para que la aplicación se sienta como un sistema empresarial coherente en lugar de páginas sueltas.

**Por qué esta prioridad**: El marco aporta la marca y la navegación de todas las demás pantallas; construirlo como envoltorio evita tocar cada historia por separado y da al módulo su identidad ERP. Depende de la configuración del módulo cargada al arrancar (ModuleConfig) para el nombre del módulo y la terminología, y centraliza la navegación entre pantallas —panel, gestión y búsqueda— dentro del espacio de trabajo.

**Prueba Independiente**: En cada pantalla, una barra superior muestra un logotipo derivado del nombre del módulo junto al nombre del módulo, una barra lateral ofrece botones de módulo para Panel, Productos, Movimientos, Bodegas y Buscar con el módulo activo resaltado visualmente, y navegar entre módulos nunca pierde datos.

**Escenarios de Aceptación**:

1. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la página, **entonces** es visible una barra superior que contiene un logotipo SVG en línea derivado del nombre del módulo y el nombre del módulo configurado.
2. **Dada** cualquier pantalla mostrada, **cuando** el usuario mira la barra lateral, **entonces** se muestran botones de módulo para Panel, Productos, Movimientos, Bodegas y Buscar usando la terminología por defecto de Logística e Inventario (ver Clarificaciones).
3. **Dado** que el usuario está en cualquier pantalla, **cuando** mira la barra lateral, **entonces** el botón del módulo activo está resaltado visualmente.
4. **Dado** que la ventana gráfica es estrecha, **cuando** se usa la aplicación en una pantalla pequeña, **entonces** la barra lateral se contrae a una columna de iconos manteniéndose utilizable y etiquetada de forma accesible.
5. **Dada** una configuración que define un color de acento, **cuando** cualquier pantalla carga, **entonces** el marco lo usa consistentemente para resaltados y controles principales; sin valor configurado o con un valor inválido, se usan los valores predeterminados integrados sin errores.
6. **Dado** que el usuario navega entre módulos mediante la barra lateral, **cuando** inspecciona sus datos después, **entonces** todas las entidades y documentos almacenados permanecen intactos.

---

### Historia de Usuario 14 - Registrar devoluciones de movimientos (Prioridad: P2)

Como encargado de recepción, quiero registrar la devolución de un movimiento ya entregado o recibido, para que el stock se corrija con trazabilidad en lugar de editar cantidades a mano.

**Por qué esta prioridad**: Las devoluciones son parte habitual de la operación logística (rechazo del cliente, mercadería dañada o error de pedido). Permiten revertir un movimiento sin romper la regla de que un movimiento Despachado no se cancela, pero no son necesarias para la gestión básica. Esta historia depende del ciclo de vida de estados y de la regla de stock (Historia de Usuario 12).

**Prueba Independiente**: Un usuario selecciona una salida en estado Entregado, registra una devolución parcial con motivo, la lleva hasta Recibida en bodega y comprueba que el stock disponible aumenta solo en la cantidad devuelta en buen estado, que el movimiento original queda intacto y que muestra cuánto se ha devuelto.

**Alcance y decisiones**:

- Aplica a **salidas a cliente y traslados entre almacenes**; las devoluciones a proveedor (órdenes de compra) quedan fuera de esta versión.
- Solo se puede iniciar una devolución sobre movimientos **Entregado** (salidas) o **Recibido** (traslados). No se permite desde Despachado ni En tránsito: la mercadería aún no ha llegado a destino y debe completarse primero la entrega o recepción.
- Se permiten **devoluciones parciales**.
- La mercadería devuelta **dañada no vuelve al stock disponible**; se registra como merma.

**Ciclo de vida de la devolución**: Solicitada → Aprobada → Recibida en bodega → Cerrada; Rechazada posible antes de Recibida en bodega.

**Regla de stock de la devolución**:

- El stock **no cambia** mientras la devolución esté en Solicitada, Aprobada o Rechazada.
- Al pasar a **Recibida en bodega**, la cantidad en buen estado **aumenta el stock disponible** del almacén de origen del movimiento original. En un traslado, esa misma cantidad se descuenta del almacén de destino.
- La cantidad dañada se registra como **merma** y no suma al stock disponible.

**Escenarios de Aceptación**:

1. **Dado** un movimiento en estado Entregado o Recibido, **cuando** el usuario registra una devolución, **entonces** se crea un documento de devolución nuevo, vinculado al movimiento original, que no modifica al original.
2. **Dado** un movimiento en estado Despachado, En tránsito o previo a ellos, **cuando** el usuario intenta registrar una devolución, **entonces** el sistema la rechaza e indica que primero debe completarse la entrega o recepción.
3. **Dado** que el usuario registra una devolución, **cuando** deja el motivo en blanco, **entonces** el sistema impide guardar y explica qué se necesita; el motivo se elige entre valores definidos (dañado, error de pedido, rechazo del cliente, vencido), no texto libre.
4. **Dado** un movimiento con una cantidad despachada, **cuando** el usuario solicita una devolución parcial, **entonces** el sistema la acepta siempre que la cantidad no supere lo despachado menos lo ya devuelto.
5. **Dada** una devolución cuya cantidad supera lo despachado menos lo ya devuelto, **cuando** el usuario intenta guardarla, **entonces** el sistema la rechaza e indica la cantidad máxima devolvible.
6. **Dada** una devolución en estado Solicitada, Aprobada o Rechazada, **cuando** el usuario consulta el stock, **entonces** el stock no ha cambiado.
7. **Dada** una devolución con cantidad en buen estado, **cuando** pasa a Recibida en bodega, **entonces** el stock disponible del almacén de origen aumenta en esa cantidad.
8. **Dada** una devolución con cantidad dañada, **cuando** pasa a Recibida en bodega, **entonces** esa cantidad se registra como merma y no aumenta el stock disponible.
9. **Dada** una devolución de un traslado, **cuando** pasa a Recibida en bodega, **entonces** el stock del almacén de destino disminuye y el del almacén de origen aumenta en la cantidad en buen estado.
10. **Dada** una devolución con ciclo de vida configurado, **cuando** el usuario intenta una transición inválida (p. ej., de Solicitada a Cerrada), **entonces** el sistema la rechaza con una explicación clara.
11. **Dado** un movimiento con devoluciones registradas, **cuando** el usuario ve su detalle o la lista, **entonces** se muestra de un vistazo la cantidad total devuelta.
12. **Dada** una devolución Rechazada o Cerrada, **cuando** el usuario intenta cambiar su estado, **entonces** no se ofrece ninguna transición.

---

### Casos Límite

- ¿Qué ocurre cuando un usuario intenta guardar una entidad sin nombre o código obligatorio?
- ¿Cómo gestiona el sistema una búsqueda que no devuelve coincidencias?
- ¿Qué ocurre si un usuario intenta editar o eliminar una entidad que ya no existe?
- ¿Qué ocurre cuando un usuario introduce una fecha objetivo que no es una fecha de calendario válida?
- ¿Qué ocurre con los documentos de una entidad cuando esta se elimina?
- ¿Qué ocurre cuando un usuario introduce una fecha final anterior a la fecha inicial en un documento?
- ¿Qué ocurre cuando la configuración declara un campo personalizado cuya clave choca con un nombre de campo base?
- ¿Qué ocurre cuando la configuración referencia un tipo de campo desconocido o una definición de transición de ciclo de vida inválida?
- ¿Qué ocurre cuando los registros almacenados contienen valores de campos personalizados que ya no están declarados en la configuración?
- ¿Qué ocurre cuando un usuario abre la aplicación directamente en la pantalla de gestión o búsqueda (p. ej., vía enlace profundo o recarga del navegador) sin pasar por el panel de inicio?
- ¿Qué ocurre cuando un usuario pulsa el botón atrás del navegador estando en la pantalla de gestión o búsqueda?
- ¿Qué ocurre si un usuario navega fuera de la pantalla de gestión mientras un formulario aún tiene cambios sin guardar?
- ¿Permanecen intactas las entidades y los documentos al navegar entre el panel, la gestión y la búsqueda?
- ¿Qué ocurre cuando el panel se abre con cero entidades o cero documentos (valores estadísticos)?
- ¿Qué ocurre cuando el color de acento configurado no es un valor de color válido?
- ¿Cómo mantiene la barra lateral contraída las etiquetas de módulo accesibles en ventanas gráficas estrechas?
- ¿Qué ocurre cuando un usuario registra una salida cuya cantidad supera el saldo disponible del producto en el almacén?
- ¿Qué ocurre cuando un usuario intenta editar o eliminar un movimiento de inventario ya guardado?
- ¿Qué ocurre cuando el lote indicado en un movimiento pertenece a un producto distinto al del movimiento?
- ¿Qué ocurre cuando un usuario registra un movimiento con cantidad cero o negativa, o con una fecha inválida?
- ¿Qué ocurre con el impacto de un movimiento en el stock cuando hay un ciclo de vida configurado y cuando no lo hay?

## Requisitos *(obligatorio)*

### Requisitos Funcionales

- **FR-001**: El sistema DEBE permitir a los usuarios crear un registro de entidad con al menos un nombre y un código.
- **FR-002**: El sistema DEBE permitir a los usuarios editar los detalles de un registro de entidad existente.
- **FR-003**: El sistema DEBE permitir a los usuarios eliminar un registro de entidad existente.
- **FR-004**: El sistema DEBE permitir a los usuarios buscar registros de entidad por nombre, código, categoría u otras palabras clave descriptivas.
- **FR-005**: El sistema DEBE mostrar una lista clara de entidades e indicar cuándo ningún resultado coincide con una búsqueda.
- **FR-006**: El sistema DEBE presentar retroalimentación clara cuando falta información obligatoria o no se puede completar una acción.
- **FR-007**: El sistema DEBE mantener los datos de entidad consistentes tras operaciones de creación, edición y eliminación.
- **FR-008**: El sistema DEBE permitir a los usuarios añadir, editar y eliminar detalles de documentos de una entidad.
- **FR-009**: El sistema DEBE asociar cada documento exactamente a una entidad y eliminar los documentos asociados cuando la entidad se elimina.
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Productos, Movimientos, Bodegas y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Entidades DEBE mostrar el contenido de gestión de entidades.
- **FR-014**: El botón de módulo Documentos DEBE mostrar el contenido de gestión de documentos en la pantalla de gestión.
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión NO DEBE mostrar la lista de entidades.
- **FR-017**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar entidades.
- **FR-018**: La pantalla de gestión DEBE proporcionar la funcionalidad de crear, editar y eliminar documentos.
- **FR-019**: El sistema DEBE navegar a una pantalla de búsqueda dedicada cuando se selecciona el botón Buscar en la barra lateral.
- **FR-020**: La pantalla de búsqueda DEBE permitir buscar entidades por nombre, código, categoría, descripción o fecha objetivo.
- **FR-021**: La pantalla de búsqueda DEBE ser accesible tanto desde la barra lateral como desde la acción rápida de buscar registros del panel.
- **FR-022**: El sistema DEBE mantener los datos de entidades y documentos intactos y consistentes durante la navegación entre pantallas.
- **FR-023**: El sistema DEBE cargar la configuración del módulo al arrancar y aplicarla en todas las pantallas.
- **FR-024**: El sistema DEBE retroceder a los valores predeterminados integrados (terminología Entidad/Documento, sin campos personalizados, sin ciclo de vida) cuando no se proporciona configuración.
- **FR-025**: El sistema DEBE informar claramente de una configuración inválida o conflictiva en lugar de fallar silenciosamente.
- **FR-026**: El sistema DEBE mostrar los campos personalizados declarados en los formularios de creación/edición con tipos de entrada que coincidan con sus tipos declarados.
- **FR-027**: El sistema DEBE validar los valores de campos personalizados, incluidos los obligatorios, antes de guardar, usando la misma experiencia de retroalimentación que la validación base.
- **FR-028**: El sistema DEBE incluir los valores de campos personalizados en los resultados de búsqueda y mostrarlos en listas y vistas de detalle.
- **FR-029**: El sistema DEBE derivar todas las etiquetas visibles para el usuario de la configuración del módulo en lugar de texto fijo en el código.
- **FR-030**: El sistema DEBE aplicar las transiciones de estado configuradas en los documentos independientemente de cómo se envíe un cambio.
- **FR-031**: El sistema DEBE mantener el estado del documento como texto libre cuando no hay ciclo de vida configurado.
- **FR-032**: El sistema DEBE mantener el renderizado de listas y la búsqueda ágiles y correctos para conjuntos de datos de al menos 500 registros de entidad.
- **FR-033**: El panel DEBE ofrecer al menos cuatro botones de acción rápida: nuevo producto, nuevo movimiento, abrir gestión de productos y buscar registros (etiquetas por defecto de Logística e Inventario).
- **FR-034**: Activar la acción rápida de nueva entidad o nuevo documento DEBE abrir el área de gestión correspondiente con un formulario vacío listo para introducir datos.
- **FR-035**: El panel DEBE mostrar tarjetas de estadísticas con el número de entidades y documentos almacenados, actualizadas cada vez que se muestra el panel.
- **FR-036**: La barra superior DEBE mostrar un logotipo derivado del nombre del módulo junto con el nombre del módulo configurado en cada pantalla.
- **FR-037**: La barra lateral DEBE resaltar visualmente el módulo activo en cada pantalla.
- **FR-038**: La configuración PUEDE definir un color de acento; el sistema DEBE aplicarlo consistentemente en todo el marco y retroceder de forma segura a los valores integrados cuando esté ausente o sea inválido.
- **FR-039**: En ventanas gráficas estrechas, la barra lateral DEBE contraerse a una columna de iconos manteniéndose operable.
- **FR-040**: El sistema DEBE permitir registrar movimientos de inventario de tipo entrada, salida, traslado o ajuste que referencien un producto y un almacén existentes, con una cantidad entero positivo y una fecha de calendario válida.
- **FR-041**: El sistema DEBE calcular y mostrar el saldo de un producto por almacén como la suma de sus movimientos, sin permitir editarlo directamente.
- **FR-042**: El sistema DEBE rechazar una salida cuya cantidad deje el saldo del producto en el almacén por debajo de cero, indicando el saldo disponible.
- **FR-043**: Los movimientos guardados NO DEBEN ser editables ni eliminables; el sistema DEBE ofrecer registrar un movimiento de ajuste como corrección.
- **FR-044**: El sistema DEBE permitir asociar opcionalmente un movimiento a un lote que pertenezca al mismo producto y al documento que lo origina.
- **FR-045**: La pantalla de gestión de lotes DEBE abrirse desde la gestión del producto correspondiente; la barra lateral NO DEBE exponer un módulo independiente de Lotes.

### Requisitos de Extensibilidad *(obligaciones del módulo base)*

Los módulos personalizados construidos sobre esta base DEBEN poder:

- **XR-001**: Extender los registros de entidad y documento con campos adicionales específicos del dominio sin cambiar la estructura de almacenamiento base.
- **XR-002**: Reetiquetar pantallas, pestañas, formularios y listas con terminología específica del módulo sin alterar el comportamiento de navegación.
- **XR-003**: Añadir reglas de validación específicas del módulo junto a las reglas de validación base.
- **XR-004**: Apoyarse en el módulo base para generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, y eliminación en cascada.
- **XR-005**: Remarcar el espacio de trabajo —nombre del módulo, logotipo derivado y color de acento— únicamente mediante configuración.

### Entidades Clave *(incluir si la funcionalidad implica datos)*

- **Entidad**: Un registro de datos maestros gestionado por el módulo, que incluye su nombre, código de negocio, detalles descriptivos, categoría de clasificación, una fecha objetivo opcional y un entity_id autogenerado. Los módulos personalizados definen qué representa una Entidad en el mundo real (p. ej., cliente, producto, activo).
- **Documento**: Detalles transaccionales adjuntos a una entidad, vinculados a ella por el entity_id de la entidad. Los módulos personalizados definen qué representa un Documento (p. ej., pedido, factura, contrato).
- **ModuleConfig**: El objeto de adaptación cargado al arrancar que define el nombre del módulo, las etiquetas de terminología, las definiciones de campos personalizados y el ciclo de vida de estados de documentos. Consulte data-model.md para su forma completa.
- **Movimiento de traslado**: Dos movimientos de inventario vinculados por el mismo documento de traslado —tramo de salida en el almacén de origen y tramo de entrada en el almacén de destino— que se guardan juntos; el saldo de cada almacén se calcula como la suma de sus movimientos, sin excepciones en el motor de saldos.
- **Estado del movimiento**: Cada movimiento de inventario lleva un campo `status` con el estado actual de su ciclo de vida y la fecha del cambio (HU 12); sin ciclo de vida configurado, el estado permanece como texto libre.
- **Devolución**: Registro propio de la devolución de un movimiento ya entregado o recibido, con motivo, cantidad en buen estado, cantidad dañada (merma) y ciclo de vida Solicitada → Aprobada → Recibida en bodega → Cerrada (Rechazada posible antes de Recibida), vinculado al movimiento original sin modificarlo (HU 14).

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos en el primer uso.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y no muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- El MVP se distribuye con una configuración de Logística e Inventario cargada por defecto, de modo que la UI muestra Producto, Bodega y Movimiento; Entidad y Documento son los nombres internos del módulo base y solo aparecen en pantalla si una configuración los define así. Sin configuración, el módulo base retrocede a Entidad/Documento (FR-024). Ver Clarifications.
- No hay autenticación ni control de acceso por rol en el MVP: los roles mencionados en las historias (usuario de negocio, encargado de bodega, operador de inventario, jefe de logística, encargado de recepción) son actores de los escenarios y todos comparten los mismos permisos. Ver Clarifications.


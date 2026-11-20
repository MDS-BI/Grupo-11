# Especificación de la Funcionalidad: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

**Rama de la funcionalidad**: 001-erp-base-module  
**Creada**: 2026-07-08  
**Estado**: Implementado (v1) · Ampliación propuesta: US 15–17\
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

### Session 2026-11-16 — Reservas y tomas de inventario

- Q: ¿Qué significa exactamente "disponible", que hoy usan las HU 4, 8, 9 y 12? → A: Existencias físicas menos los saldos pendientes de las reservas activas no vencidas, calculado por producto y bodega. El kárdex y el saldo por lote siguen mostrando el físico.
- Q: ¿Una reserva compromete un lote concreto? → A: No en esta versión: la reserva se controla por producto y bodega, y el lote se valida por su propio saldo físico (HU6).
- Q: ¿Sobre qué saldo se evalúa el stock mínimo? → A: Sobre el disponible total (físico menos los saldos pendientes de reservas activas), para no reponer mercadería ya comprometida.
- Q: ¿Una toma de inventario congela la bodega mientras se cuenta? → A: No. El saldo del sistema se muestra como referencia al iniciar, pero la diferencia se calcula contra el saldo vigente al confirmar, de modo que un movimiento ocurrido durante el conteo no genere un ajuste erróneo.
- Q: ¿Cómo se registra una liberación parcial de una reserva? → A: La reserva sigue `Activa`; se acumula `releasedQuantity` y el saldo reservado efectivo es `quantity - releasedQuantity`. Solo una liberación total la deja `Liberada`.
- Q: ¿Qué ocurre si la salida asociada no cubre todo el saldo reservado? → A: La salida debe cubrir el saldo reservado pendiente o liberar la diferencia antes de registrarla; la reserva se consume por ese saldo pendiente y queda `Consumida`.
- Q: ¿Cuándo vence una reserva y cómo se evalúa? → A: Al terminar el día de `expiresAt` en hora local. La evaluación es perezosa: se aplica al consultar el stock o al operar con la reserva, sin tareas programadas.
- Q: ¿Cómo se cuenta un producto que tiene lotes pero conserva saldo físico sin lote? → A: La toma agrega una línea "sin lote" para ese saldo, de modo que el ajuste no descuadre el saldo por lote.
- Q: ¿Se puede modificar o anular una toma confirmada? → A: No; una toma `Confirmada` es inmutable. Solo se anula antes de confirmar, y el avance exige el paso `Borrador → En conteo`.
- Q: ¿Qué ocurre si tras una toma el físico queda por debajo de las reservas activas? → A: El disponible puede quedar negativo; se muestra y se advierte, y se bloquean nuevas reservas y salidas hasta que el físico vuelva a cubrir las reservas o se liberen.

### Session 2026-11-18 — Autenticación con contraseña

- Q: ¿Se mantiene la decisión de "sin autenticación" de la sesión 2026-11-03? → A: No; se revoca. Habrá inicio de sesión con usuario y contraseña (HU 17). No habrá control por rol: todos los usuarios autenticados comparten los mismos permisos y los roles de las historias siguen siendo solo actores de los escenarios.
- Q: ¿Cómo se obtienen las credenciales en el MVP sin servidor? → A: Se crea un usuario admin por defecto en el primer arranque, con credenciales documentadas en el quickstart; la contraseña se guarda hasheada con salt en localStorage, nunca en claro.
- Q: ¿Qué ocurre con la sesión al navegar o recargar el navegador? → A: La sesión iniciada persiste en localStorage hasta que el usuario cierre sesión; navegar entre pantallas o recargar no vuelve a pedir la contraseña, y los datos almacenados no se pierden.
- Q: ¿Cuáles son las credenciales exactas del usuario admin por defecto? → A: Usuario `admin`, contraseña `admin123`; se documentan en el quickstart y se usan en las pruebas.
- Q: ¿Dónde se muestra el botón de cerrar sesión? → A: En la barra superior, a la derecha, visible en todas las pantallas dentro del marco del espacio de trabajo (HU 13).
- Q: ¿Qué ocurre con los intentos fallidos repetidos de contraseña? → A: Solo se muestra el mensaje genérico (FR-058) y se permite reintentar sin límite; no hay bloqueo ni contador de intentos en esta versión.
- Q: ¿Cómo se autentican las pruebas de integración existentes una vez que el login exige sesión (FR-057)? → A: Un helper de pruebas siembra la sesión válida en localStorage antes de cada prueba existente; solo las pruebas de la HU 17 ejercitan el login real desde la interfaz.

## Escenarios de Usuario y Pruebas *(obligatorio)*

### Historia de Usuario 1 - Crear y organizar productos (Prioridad: P1)
Como encargado de bodega, quiero crear productos con su identidad, contacto, clasificación y stock mínimo para construir y mantener el catálogo maestro del inventario.

**Por qué esta prioridad**: El catálogo de productos es el dato maestro central del módulo: sin productos no se pueden registrar movimientos, lotes, traslados ni documentos de respaldo, y el resto de la experiencia no puede aportar valor.

**Prueba Independiente**: Un usuario abre Productos, crea un producto con nombre y código, completa opcionalmente sus datos de identidad, contacto, clasificación y stock mínimo, y comprueba que se guarda y aparece en la lista.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está viendo la lista de productos, **cuando** crea uno nuevo con nombre y código, **entonces** el producto se guarda y aparece en la lista.
2. **Dado** que el usuario está creando un producto, **cuando** deja el nombre o el código en blanco, **entonces** el sistema impide guardar y explica qué campos son obligatorios.
3. **Dado** que ya existe un producto con un código determinado, **cuando** el usuario intenta crear otro con el mismo código (sin distinguir mayúsculas/minúsculas), **entonces** el sistema impide guardar e indica que el código ya está en uso.
4. **Dado** que el usuario completa datos opcionales de identidad y contacto (identificación fiscal, correo, teléfono, dirección), **cuando** guarda, **entonces** los valores se persisten y quedan disponibles para consulta y búsqueda.
5. **Dado** que el usuario introduce un correo electrónico con formato inválido, **cuando** guarda, **entonces** el sistema rechaza el guardado y explica que el correo no es válido.
6. **Dado** que el usuario clasifica el producto, **cuando** selecciona una categoría, **entonces** elige entre los valores definidos en la configuración (p. ej., General, Materia prima, Producto terminado, Insumo), no texto libre.
7. **Dado** que el usuario completa descripción, fecha objetivo, límite de crédito o condiciones de pago, **cuando** guarda, **entonces** esos datos opcionales se persisten con el producto; la fecha objetivo debe ser una fecha de calendario válida y el límite de crédito, un número no negativo.
8. **Dado** que el usuario define un stock mínimo, **cuando** introduce un entero no negativo o lo deja vacío, **entonces** el valor se guarda o queda sin mínimo; una cantidad negativa o no entera se rechaza con una explicación.
9. **Dado** que la configuración declara campos personalizados para productos, **cuando** el usuario los completa, **entonces** se renderizan con el tipo correspondiente, se validan (incluidos los obligatorios) y se guardan con el producto.
10. **Dado** que el usuario ingresa texto con HTML o scripts en un campo, **cuando** guarda y el producto se muestra, **entonces** el contenido se escapa y no se ejecuta.
11. **Dado** que aún no hay productos, **cuando** el usuario abre la lista, **entonces** se muestra un estado vacío claro; al crear el primero, el estado vacío desaparece.

Datos involucrados (para el MER y data-model.md):
- Tabla/entidad: Producto (Entity del módulo base)
- Campos: id y entity_id (autogenerados), nombre (obligatorio), código (obligatorio, único),
  identificación fiscal, correo, teléfono, dirección, categoría, descripción, fecha objetivo,
  límite de crédito, condiciones de pago, stock mínimo y campos personalizados (opcionales según configuración), createdAt y updatedAt
- Relación: un Producto tiene cero o más Documentos, Lotes y Movimientos de inventario; al eliminar un producto sin movimientos se eliminan en cascada sus Documentos y Lotes, y la eliminación se bloquea si tiene Movimientos (HU2, HU4, HU6, HU10)

Decisión de datos y justificación:
- El código de negocio es único porque identifica el registro de forma legible y evita
  duplicados en los datos maestros; la comparación no distingue mayúsculas/minúsculas.
- La categoría usa valores controlados para evitar clasificaciones inconsistentes y sesgos
  en análisis posteriores.
- El stock mínimo se guarda como entero no negativo y se compara con el disponible total del producto (físico menos los saldos pendientes de reservas activas, HU9).
- Los campos personalizados permiten extender el producto sin modificar el código base (FR-026 a FR-028).
- Los datos se guardan en localStorage por ser un MVP sin servidor; esto limita la
  seguridad y la persistencia (ver issue de decisiones).

Riesgos de datos:
- Contenido malicioso (XSS) → mitigado con escape de HTML al renderizar.
- Datos duplicados o incompletos → mitigados con validaciones de obligatoriedad y unicidad.
- Correos o fechas inválidas → mitigados con validación de formato antes de guardar.
- Datos reales sensibles en localStorage → usar solo datos ficticios en el MVP.

---

### Historia de Usuario 2 - Editar y eliminar productos (Prioridad: P1)
Como encargado de bodega, quiero actualizar o eliminar productos cuando cambien los datos maestros para que el catálogo y el stock se mantengan precisos.

**Por qué esta prioridad**: Mantener los productos actualizados es esencial para la confianza en el inventario y para que las operaciones de entrada, salida, traslado y devolución usen datos correctos; además, el histórico de movimientos debe protegerse.

**Prueba Independiente**: Un usuario selecciona un producto existente (con o sin movimientos), edita sus datos (incluidos campos personalizados y stock mínimo); si no tiene movimientos, también puede eliminarlo con confirmación. La lista refleja el cambio y un producto con movimientos no se puede eliminar.

**Escenarios de Aceptación**:

1. **Dado** un producto que ya existe en la lista, con o sin movimientos, **cuando** el usuario edita sus detalles y guarda, **entonces** la información actualizada se persiste y se muestra en la lista; el formulario vuelve al modo de creación.
2. **Dado** que el usuario está editando un producto, **cuando** cancela la edición, **entonces** los cambios no se guardan y el producto conserva sus datos originales.
3. **Dado** que el usuario edita el código de un producto, **cuando** el nuevo código coincide con el de otro producto, **entonces** el sistema rechaza el guardado e indica que el código ya está en uso.
4. **Dado** que el usuario modifica campos personalizados o el stock mínimo al editar, **cuando** guarda, **entonces** los nuevos valores se persisten y se reflejan en la lista.
5. **Dado** un producto sin movimientos ni reservas activas que ya no es relevante, **cuando** el usuario lo elimina y confirma la acción, **entonces** desaparece de la lista y de la búsqueda, y sus documentos y lotes se eliminan en cascada.
6. **Dado** un producto sin movimientos, **cuando** el usuario cancela la confirmación de eliminación, **entonces** el producto permanece intacto en la lista.
7. **Dado** un producto con movimientos de inventario registrados, **cuando** el usuario intenta eliminarlo, **entonces** el sistema rechaza la eliminación y explica que debe conservarse el histórico del inventario.
8. **Dados** cientos de productos almacenados, **cuando** el usuario edita o elimina uno, **entonces** la lista se actualiza correctamente y sigue siendo ágil.
9. **Dado** que el usuario edita un producto con lotes o documentos de respaldo pero sin movimientos, **cuando** guarda los cambios, **entonces** esos registros asociados se conservan y siguen vinculados al producto.
10. **Dado** que el usuario edita el stock mínimo de un producto, **cuando** el nuevo mínimo queda por encima del disponible total, **entonces** la marca de "stock bajo" se actualiza al volver a consultar la lista (HU9).
11. **Dado** un producto con movimientos de inventario registrados, **cuando** el usuario edita sus datos maestros y guarda, **entonces** los cambios se persisten y el histórico de movimientos se conserva intacto; solo la eliminación está bloqueada (escenario 7).
12. **Dado** un producto sin movimientos pero con reservas activas, **cuando** el usuario intenta eliminarlo, **entonces** el sistema rechaza la eliminación e indica que debe liberar o consumir las reservas primero (HU15).

---

### Historia de Usuario 3 - Inicio de una página con botones sencillos para acceder eficazmente a las tareas (Prioridad: P1)

Como usuario de negocio, quiero el inicio de una página con botones sencillos que me permitan acceder eficazmente a las distintas tareas, para realizar mi trabajo sin perder tiempo buscando funciones.

**Por qué esta prioridad**: La pantalla de inicio es el punto de entrada de la aplicación. Nada más puede alcanzarse sin ella, y los botones sencillos son la ruta más rápida hacia cada flujo de trabajo central.

**Prueba Independiente**: Un usuario inicia sesión, ve una pantalla con múltiples botones sencillos claramente etiquetados y estadísticas de registros, inicia un nuevo producto o movimiento con un solo clic y ve estadísticas que reflejan los datos almacenados.

**Escenarios de Aceptación**:

1. **Dado** que el usuario ha iniciado sesión, **cuando** la aplicación carga, **entonces** se muestra la pantalla de inicio con al menos cuatro botones sencillos claramente etiquetados que cubren las tareas clave: crear un nuevo producto, crear un nuevo movimiento, abrir la gestión de productos y buscar registros (etiquetas por defecto de Logística e Inventario; ver Clarificaciones).
2. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de nuevo producto, **entonces** la aplicación abre el área de gestión de productos con un formulario vacío listo para introducir datos.
3. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de nuevo movimiento, **entonces** la aplicación abre el área de gestión de movimientos con un formulario vacío listo para introducir datos.
4. **Dado** que se muestra la pantalla de inicio, **cuando** el usuario activa el botón de buscar registros, **entonces** la aplicación abre la pantalla de búsqueda con el campo de búsqueda enfocado.
5. **Dados** productos (entidades) y documentos de respaldo almacenados, **cuando** el usuario ve la pantalla de inicio, **entonces** las tarjetas de estadísticas muestran el recuento actual de productos y documentos de respaldo.
6. **Dado** que el usuario crea o elimina productos o documentos de respaldo en otra parte de la aplicación, **cuando** vuelve a la pantalla de inicio, **entonces** las estadísticas reflejan el cambio.

---

### Historia de Usuario 4 - Registrar movimientos de inventario en una pantalla dedicada (Prioridad: P1)

Como encargado de bodega, quiero una pantalla dedicada donde registre los movimientos de inventario de entrada, salida y ajuste, para que el stock de la bodega refleje en todo momento lo que realmente hay en el almacén; los traslados se registran en su propio flujo (HU8).

**Por qué esta prioridad**: La captura de movimientos es la operación diaria central del módulo de logística: sin registrar entradas y salidas no existe un stock confiable sobre el que despachar, recibir o planificar. Es el equivalente operativo de la gestión de datos maestros del módulo base.

**Prueba Independiente**: Un usuario llega a la pantalla de gestión desde la barra lateral o una acción rápida del panel, registra una entrada de un producto en un almacén con su cantidad y fecha y verifica que el stock resultante aumenta; registra una salida y verifica que el saldo disminuye (al guardarla sin ciclo de vida o al despacharla con ciclo configurado); una salida que dejaría el saldo en negativo se rechaza indicando el saldo disponible.

**Alcance y decisiones**:

- Un movimiento identifica un producto, un almacén, una cantidad y un tipo (entrada, salida o ajuste); el lote y el documento de origen son opcionales.
- Los traslados no se crean desde este formulario: se capturan en su propia pantalla (HU8) y el sistema genera sus dos movimientos vinculados (salida en el origen, entrada en el destino), que comparten el documento del traslado.
- Los movimientos guardados son inmutables en sus datos (producto, almacén, cantidad, fecha y lote): no se editan ni se eliminan; solo se permite avanzar su estado conforme a la HU12, y una corrección de cantidades se registra con un movimiento de ajuste.
- Con un ciclo de vida configurado, el momento en que el movimiento afecta al stock lo rige la Historia de Usuario 12; sin ciclo de vida, el saldo se actualiza al guardar. Las entradas y los ajustes sin ciclo de vida se efectivizan de inmediato.
- El saldo por producto y almacén se calcula sumando sus movimientos; nunca se edita directamente.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de gestión de movimientos, **cuando** crea uno nuevo, **entonces** debe indicar tipo (entrada, salida o ajuste), producto, almacén, cantidad y fecha; si deja un campo obligatorio en blanco, el sistema impide guardar y explica qué se necesita.
2. **Dada** una cantidad que no es un entero positivo o una fecha que no es una fecha de calendario válida, **cuando** el usuario intenta guardar, **entonces** el sistema rechaza el guardado con una explicación clara.
3. **Dado** un producto y un almacén existentes, **cuando** el usuario registra una entrada (sin ciclo de vida configurado), **entonces** el movimiento se guarda y el saldo del producto en ese almacén aumenta en la cantidad indicada; con ciclo de vida, el efecto en el stock sigue la HU12.
4. **Dada** una salida cuya cantidad supera el saldo disponible del producto en el almacén, **cuando** el usuario intenta guardarla sin ciclo de vida configurado o despacharla con ciclo configurado, **entonces** el sistema la rechaza e indica el saldo disponible. Se entiende por "disponible" las existencias físicas menos los saldos pendientes de reservas activas (HU15); se exceptúa la salida que consume una reserva activa, que se valida contra su saldo pendiente.
5. **Dado** un movimiento guardado, **cuando** el usuario vuelve a la pantalla de gestión, **entonces** ve el saldo actual del producto por almacén de un vistazo.
6. **Dado** que el usuario asocia un lote a un movimiento, **cuando** guarda, **entonces** el lote debe pertenecer al mismo producto y la cantidad no puede superar el saldo físico de ese lote; si no, el sistema lo rechaza con una explicación.
7. **Dado** un movimiento, **cuando** el usuario lo registra, **entonces** puede asociarlo opcionalmente al documento que lo origina (p. ej. una orden de compra o una remisión).
8. **Dado** un movimiento ya guardado, **cuando** el usuario intenta editar sus datos o eliminarlo, **entonces** el sistema no lo permite y explica que las correcciones se registran con un movimiento de ajuste y que solo se puede avanzar el estado según su ciclo de vida (HU12).
9. **Dado** que el usuario llega a la pantalla de gestión desde la barra lateral o una acción rápida del panel, **cuando** la pantalla se abre, **entonces** el formulario está listo para introducir datos y el módulo activo queda resaltado.
10. **Dado** que el usuario está en la pantalla de gestión, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio sin perder los movimientos almacenados.
11. **Dado** un producto con reservas activas, **cuando** el usuario registra una entrada, **entonces** el físico y el disponible aumentan en la misma cantidad, porque las reservas no se alteran.

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
6. **Dada** una bodega desactivada, **cuando** el usuario intenta registrar un movimiento con ella, trasladar hacia ella, reservar en ella o recibir en ella una devolución, **entonces** el sistema rechaza la operación e indica que la bodega no puede recibir movimientos.
7. **Dada** una bodega desactivada, **cuando** el usuario consulta la lista de movimientos o los saldos existentes, **entonces** el histórico de esa bodega sigue visible y sus saldos no cambian.
8. **Dada** una bodega desactivada, **cuando** el usuario la vuelve a activar, **entonces** queda disponible de nuevo para registrar movimientos sin necesidad de crear otra bodega.
9. **Dado** que el encargado llega a la pantalla de bodegas desde la barra lateral, **cuando** la pantalla se abre, **entonces** ve la lista de bodegas con su código, nombre y estado (activa o desactivada) de un vistazo.
10. **Dada** una bodega con reservas activas, **cuando** el usuario intenta desactivarla, **entonces** el sistema lo impide e indica que primero debe liberar o consumir esas reservas (HU15).

---

### Historia de Usuario 6 - Registrar lotes y controlar vencimientos (Prioridad: P2)

Como operador de inventario, quiero registrar los lotes de cada producto con sus fechas y consultar su saldo y vencimiento, para despachar primero lo que vence antes y mantener la trazabilidad de lo que hay en bodega.

**Por qué esta prioridad**: El control de lotes aporta trazabilidad y evita despachar mercadería vencida; es una mejora de madurez operativa que complementa la captura de movimientos (Historia de Usuario 4), pero no bloquea el MVP porque los lotes siguen siendo opcionales en los movimientos.

**Prueba Independiente**: Un operador de inventario registra un lote con número, fecha de fabricación y fecha de vencimiento para un producto, verifica que aparece en la lista de lotes de ese producto con saldo en cero y que al registrar una entrada con ese lote su saldo aumenta; al intentar guardar una fecha de vencimiento anterior a la de fabricación, el sistema rechaza el guardado.

**Alcance y decisiones**:

- El lote es opcional en los movimientos y en las líneas de traslado; cuando se indica, debe pertenecer al mismo producto (HU4, HU8).
- El saldo del lote se deriva de sus movimientos y no se edita directamente.

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
11. **Dado** un movimiento o una línea de traslado con un lote indicado, **cuando** la cantidad supera el saldo físico de ese lote, **entonces** el sistema rechaza la operación e indica el saldo del lote.

---

### Historia de Usuario 7 - Consultar el kárdex de un producto con saldo acumulado (Prioridad: P1)

Como encargado de bodega, quiero ver el historial completo de movimientos de un producto junto a su saldo acumulado, para reconstruir cómo llegó a su stock actual y detectar diferencias o registros sospechosos.

**Por qué esta prioridad**: El stock calculado solo es confiable si puede auditarse. El kárdex convierte movimientos dispersos en trazabilidad verificable y es la base para detectar errores de digitación o pérdidas. No requiere estructuras nuevas —se deriva de los movimientos ya registrados—, por lo que su costo es bajo frente al valor que entrega.

**Prueba Independiente**: Un usuario abre el detalle de un producto, ve sus movimientos ordenados por fecha con el saldo acumulado después de cada uno, y comprueba que el último saldo coincide con el stock mostrado en la lista de productos.

**Alcance y decisiones**:

- El saldo acumulado del kárdex es **físico**: las reservas no son movimientos y no aparecen en el historial. El encabezado del kárdex muestra físico, reservado y disponible, para que el último saldo no se confunda con el disponible (HU15).

**Escenarios de Aceptación**:

1. **Dado** un producto con movimientos registrados, **cuando** el usuario abre su historial, **entonces** ve cada movimiento con fecha, tipo, bodega, cantidad, estado y saldo acumulado posterior, ordenados del más antiguo al más reciente.
2. **Dado** un producto sin movimientos, **cuando** el usuario abre su historial, **entonces** se muestra un estado vacío que indica que aún no hay movimientos registrados.
3. **Dado** un producto con entradas, salidas y ajustes, **cuando** el usuario consulta el historial, **entonces** el saldo acumulado se calcula solo con movimientos efectivos (no cancelados y, con ciclo de vida, en un estado que ya afecta al stock) y el saldo final coincide con el stock mostrado en la lista de productos.
4. **Dado** un movimiento cancelado (anulado), **cuando** se muestra en el historial, **entonces** aparece marcado como cancelado y no altera el saldo acumulado.
5. **Dado** un historial con muchos movimientos, **cuando** el usuario lo consulta, **entonces** puede filtrar por tipo de movimiento y por rango de fechas.
6. **Dado** un producto marcado con stock bajo, **cuando** el usuario revisa su historial, **entonces** puede identificar el último movimiento que dejó el saldo por debajo del mínimo.
7. **Dado** el historial en modo solo lectura, **cuando** el usuario intenta modificar un movimiento desde ahí, **entonces** el sistema lo impide y lo remite a la pantalla de movimientos.
8. **Dado** un producto con reservas activas, **cuando** el usuario abre su kárdex, **entonces** el historial y el saldo acumulado no cambian, y el encabezado muestra el reservado y el disponible por separado.

---

### Historia de Usuario 8 - Trasladar stock entre bodegas (Prioridad: P2)

Como encargado de bodega, quiero trasladar unidades de un producto desde una bodega de origen hacia otra de destino, para reflejar el movimiento real de mercadería entre almacenes sin alterar el stock total de la empresa. El traslado se captura en su propia pantalla y genera dos movimientos vinculados (HU4, HU12).

**Por qué esta prioridad**: Con una sola bodega el MVP funciona sin traslados; pero en cuanto existen varias, el traslado es la única forma de explicar por qué un producto deja de estar en un almacén y aparece en otro sin haber sido vendido. Se posterga porque exige un documento con dos almacenes, estados y stock en tránsito: una complejidad que no bloquea la captura básica de entradas y salidas.

**Prueba Independiente**: Un encargado registra un traslado de 20 unidades del Almacén A al Almacén B y lo despacha; comprueba que A baja en 20 y que las unidades quedan "en tránsito" sin estar disponibles en B; al marcarlo como recibido, B sube en 20 y el tránsito se cierra. Al intentar trasladar 999 unidades con solo 50 disponibles en origen, el sistema rechaza la operación e indica el saldo disponible.

**Alcance y decisiones**:

- Un traslado tiene bodega de origen, bodega de destino, fecha, estado y una o más líneas (producto + cantidad); un mismo producto no puede repetirse en dos líneas. Cada línea puede incluir un lote opcional del mismo producto, sujeto a las reglas FEFO y de vencimiento de la HU6.
- El stock total de la empresa no cambia: solo se redistribuye entre bodegas.
- Solo se pueden trasladar unidades **disponibles**: las reservas activas no se mueven entre bodegas (HU15).
- Las unidades despachadas y aún no recibidas quedan **en tránsito**: no están disponibles en ninguna de las dos bodegas. El tránsito comienza al pasar a Despachado y se mantiene durante En tránsito hasta Recibido.
- El ciclo de estados sigue la Historia de Usuario 12, con la cadena de referencia Solicitado → Despachado → En tránsito → Recibido.
- Un traslado confirmado es inmutable; una corrección se registra con un movimiento de ajuste, igual que en la Historia de Usuario 4.
- No se permiten traslados desde o hacia bodegas desactivadas (Historia de Usuario 5), ni recibir un traslado en una bodega de destino desactivada.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de traslados, **cuando** crea uno nuevo, **entonces** debe indicar bodega de origen, bodega de destino, fecha y al menos un producto con cantidad y, opcionalmente, un lote por línea; si falta un campo obligatorio, el sistema impide guardar y explica qué se necesita.
2. **Dado** un traslado en preparación, **cuando** el usuario selecciona la misma bodega como origen y destino, **entonces** el sistema rechaza la operación e indica que deben ser distintas.
3. **Dado** un producto con 50 unidades disponibles en la bodega de origen, **cuando** el usuario intenta trasladar 999, **entonces** el sistema rechaza la operación e indica el saldo disponible en origen.
4. **Dada** una cantidad no positiva o no numérica, **cuando** el usuario intenta guardar la línea, **entonces** el sistema la rechaza con una explicación clara.
5. **Dado** un traslado en estado "Solicitado", **cuando** el usuario lo despacha (pasa a "Despachado"), **entonces** el saldo de origen disminuye en la cantidad trasladada y las unidades quedan marcadas como "en tránsito" (desde "Despachado" hasta "Recibido"), sin estar disponibles en destino.
6. **Dado** un traslado "En tránsito", **cuando** el usuario consulta el stock de cualquiera de las dos bodegas, **entonces** las unidades en tránsito no se suman al saldo disponible y se informan por separado.
7. **Dado** un traslado "En tránsito", **cuando** el usuario lo marca como "Recibido", **entonces** el saldo de destino aumenta en la cantidad trasladada y el tránsito se cierra.
8. **Dado** un traslado en estado "Solicitado", **cuando** el usuario lo cancela, **entonces** no se altera ningún saldo.
9. **Dado** un traslado ya "Recibido", **cuando** el usuario intenta cancelarlo o editarlo, **entonces** el sistema lo impide y explica que la corrección se registra con un ajuste.
10. **Dado** un traslado despachado o recibido, **cuando** el usuario consulta la trazabilidad de un producto, **entonces** el traslado aparece en su historial con las piernas de origen y destino y su referencia (HU7).
11. **Dada** una bodega de destino desactivada, **cuando** el usuario intenta trasladar hacia ella o recibir en ella un traslado, **entonces** el sistema lo rechaza e indica que la bodega no puede recibir movimientos.
12. **Dado** un traslado con un lote vencido en alguna de sus líneas, **cuando** el usuario intenta despacharlo, **entonces** el sistema lo rechaza e indica que el lote está vencido (HU6).
13. **Dado** un producto con 50 unidades físicas y 30 reservadas en la bodega de origen, **cuando** el usuario intenta trasladar 30, **entonces** el sistema rechaza la operación porque solo 20 están disponibles.

---

### Historia de Usuario 9 - Definir stock mínimo por producto (Prioridad: P2)
Como encargado de bodega, quiero definir un stock mínimo por producto (sobre su disponible total en todas las bodegas), para saber de inmediato qué artículos necesitan reposición antes de que se agoten.

**Por qué esta prioridad**: El stock mínimo automatiza la detección de faltantes para evitar conteos manuales, ganando valor a medida que crecen el catálogo y los almacenes; sin embargo, no bloquea el MVP, ya que las entradas y salidas pueden gestionarse completas sin él.

**Prueba Independiente**: Un encargado de bodega fija un stock mínimo de 10 unidades para un producto, guarda, y al consultar la lista o la búsqueda ve el producto marcado como "stock bajo" cuando su disponible total es 5; al subir el disponible con una entrada a 15, la marca desaparece.

**Alcance y decisiones**:

- El stock mínimo se compara con el **disponible total** del producto (suma de sus bodegas menos los saldos pendientes de reservas activas), no con el saldo de una bodega concreta ni con el físico.
- Un producto puede tener stock físico y aun así marcarse como "stock bajo" si todo su físico está reservado (HU15).

**Escenarios de Aceptación**:

1. **Dado** que el encargado de bodega está creando o editando un producto, **cuando** introduce un stock mínimo de 10 unidades y guarda, **entonces** el valor se guarda y se muestra junto al producto en la lista.
2. **Dado** un producto con stock mínimo definido y un disponible total de 5 unidades (sumando sus bodegas y descontando reservas), **cuando** el usuario consulta la lista o la pantalla de búsqueda, **entonces** el producto aparece marcado visualmente como "stock bajo".
3. **Dado** un producto marcado como "stock bajo", **cuando** el usuario registra una entrada que eleva su disponible a 15 unidades, **entonces** la marca de "stock bajo" desaparece al volver a consultar la lista o la búsqueda.
4. **Dada** una cantidad negativa o no numérica, **cuando** el usuario intenta guardar el stock mínimo, **entonces** el sistema rechaza el guardado con una explicación clara.
5. **Dado** que el usuario deja el stock mínimo en blanco, **cuando** guarda el producto, **entonces** el producto se guarda sin mínimo y la lista no muestra ninguna marca de "stock bajo" para él.
6. **Dado** un producto cuyo disponible es igual a su stock mínimo, **cuando** el usuario consulta la lista o la búsqueda, **entonces** no se marca como "stock bajo" porque el disponible no queda por debajo del mínimo.
7. **Dado** un producto con stock mínimo 10, 15 unidades físicas y 10 reservadas, **cuando** el usuario consulta la lista, **entonces** el producto aparece como "stock bajo" porque su disponible es 5.


---

### Historia de Usuario 10 - Registrar documentos de respaldo de logística (Prioridad: P2)
Como usuario de negocio, quiero crear y organizar los documentos de logística junto a los productos, para mantener la actividad transaccional ordenada y no perder evidencia de las operaciones.

**Por qué esta prioridad**: Guardar los documentos de respaldo junto a los productos permite rastrear cada entrada o salida hasta el pedido o remisión que la originó, lo que da confianza al inventario frente a auditorías y diferencias. Es una mejora de madurez operativa: el módulo funciona sin ella, pero con evidencia dispersa. 

**Prueba Independiente**: Un usuario crea una orden de compra con sus datos obligatorios, la ve aparecer en la lista de documentos junto al producto asociado, y al eliminar ese producto (sin movimientos) comprueba que el documento también se elimina en cascada.

**Alcance y decisiones**:

- Los documentos de respaldo pueden tener un estado de ciclo de vida (HU12), pero ese estado no modifica el stock; el stock cambia únicamente por movimientos de inventario, traslados y devoluciones.

**Escenarios de Aceptación**:

1. **Dada** la lista de productos, **cuando** el usuario crea una orden de compra con sus datos obligatorios y la asocia a un producto, **entonces** el documento se guarda y aparece en la lista de documentos junto a ese producto.
2. **Dado** que el usuario está creando un documento de respaldo (orden de compra o remisión), **cuando** deja un campo obligatorio en blanco, **entonces** el sistema impide guardar y explica qué se necesita.
3. **Dada** la lista de documentos de un producto, **cuando** el usuario los consulta, **entonces** cada documento se muestra con su tipo y su folio, identificables de un vistazo.
4. **Dado** un documento de respaldo existente, **cuando** el usuario edita sus datos, **entonces** los cambios se guardan y se reflejan en la lista junto al producto.
5. **Dado** un producto sin movimientos con documentos de respaldo asociados, **cuando** el usuario elimina el producto, **entonces** sus documentos también se eliminan (borrado en cascada); si el producto tiene movimientos, la eliminación se bloquea (HU2, HU4).
6. **Dado** un movimiento de inventario registrado, **cuando** el usuario lo asocia al documento que lo origina, **entonces** el movimiento queda vinculado a esa orden de compra o remisión.

---

### Historia de Usuario 11 - Buscar productos (entidades) en una pantalla dedicada (Prioridad: P2)

Como encargado de bodega, quiero una pantalla de búsqueda dedicada para ubicar productos (entidades) por SKU (código), nombre, categoría, descripción o fecha objetivo sin que los formularios de edición saturen la vista.

**Por qué esta prioridad**: La recuperación rápida es valiosa cuando el catálogo de productos crece, y una pantalla separada mantiene enfocada la experiencia de gestión, pero la búsqueda no es necesaria para la gestión básica.

**Prueba Independiente**: Un usuario puede abrir la pantalla de búsqueda desde la barra lateral o una acción rápida, introducir un SKU o nombre y ver solo los productos coincidentes con su stock actual.

**Escenarios de Aceptación**:

1. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** introduce un término coincidente con el SKU (código), nombre, categoría, descripción o fecha objetivo, **entonces** solo se muestran los productos coincidentes.
2. **Dada** una búsqueda sin coincidencias, **cuando** el usuario envía la búsqueda, **entonces** se muestra un estado vacío claro y puede volver a intentarlo.
3. **Dados** 500 o más productos almacenados, **cuando** el usuario busca desde la pantalla de búsqueda, **entonces** los resultados aparecen con prontitud sin retraso perceptible.
4. **Dado** que el usuario está en la pantalla de búsqueda, **cuando** activa el botón Panel en la barra lateral, **entonces** vuelve al panel de inicio.
5. **Dados** resultados de búsqueda, **cuando** se muestran, **entonces** cada producto indica su stock actual y se marca visualmente si está por debajo del stock mínimo.
6. **Dada** la pantalla de búsqueda, **cuando** el usuario combina filtros (categoría, bodega y "solo stock bajo"), **entonces** se muestran únicamente los productos que cumplen todos los filtros aplicados; la bodega se aplica como filtro de existencia, no como texto libre.
7. **Dado** que el usuario llega desde la barra lateral o desde la acción rápida de buscar registros del panel, **cuando** se abre la pantalla, **entonces** el campo de búsqueda queda enfocado.
8. **Dado** un resultado de búsqueda, **cuando** el usuario lo selecciona, **entonces** se muestra el detalle del producto en modo solo lectura, y la edición permanece en la pantalla de gestión.
9. **Dado** que el usuario busca un término con distinta capitalización, tildes o solo una parte del SKU, **cuando** envía la búsqueda, **entonces** se devuelven igualmente los productos coincidentes.
10. **Dado** que el usuario introduce HTML o scripts como término de búsqueda, **cuando** se muestran el término o los resultados, **entonces** el contenido se escapa y no se ejecuta.
11. **Dado** que el usuario envía la búsqueda vacía, **cuando** se procesa, **entonces** se muestran todos los productos o se indica que debe ingresar un término, de forma consistente.

---

### Historia de Usuario 12 - Configurar el ciclo de vida de estados de movimientos y documentos (Prioridad: P2)

Como jefe de logística, quiero que cada movimiento de inventario y documento de respaldo siga un ciclo de estados controlado, y que las devoluciones tengan su propio ciclo (HU14), para que no se pueda marcar como recibido un movimiento que nunca fue despachado y el stock refleje la realidad.

**Por qué esta prioridad**: Los módulos de logística necesitan ciclos de vida controlados, y el stock solo es confiable si cambia en el momento correcto. El estado de texto libre sigue siendo aceptable para extensiones simples, así que esto mejora la base sin ser necesario para la adaptación básica. Esta historia depende de la configuración del módulo cargada al arrancar (ModuleConfig, FR-023 a FR-025).

**Prueba Independiente**: Un desarrollador configura el ciclo de un traslado (Solicitado → Despachado → En tránsito → Recibido); el control de estado ofrece solo estados siguientes válidos, las transiciones inválidas se rechazan con una explicación, el estado es visible de un vistazo en las listas y el stock cambia únicamente al despachar y al recibir.

**Ciclos de vida de referencia**:

- **Orden de compra** (documento de respaldo): Borrador → Aprobada → Enviada por proveedor → Recibida → Cerrada; Cancelada posible antes de Recibida. Este ciclo describe el estado del documento y no mueve stock por sí mismo.
- **Traslado entre almacenes**: Solicitado → Despachado → En tránsito → Recibido; Cancelado posible antes de Despachado.
- **Salida / despacho a cliente**: Pendiente → Preparado → Despachado → Entregado; Cancelado posible antes de Despachado.

**Regla de stock (única fuente de verdad)**:

- El stock **baja al pasar a Despachado** (salidas y traslados, en el almacén de origen), nunca antes. Una cancelación durante Solicitado, Pendiente o Preparado no afecta el stock, evitando descuentos incorrectos y reingresos manuales.
- El stock **sube al pasar a Recibido** (traslados, en el almacén de destino) y con las **entradas de inventario**, incluidas las vinculadas a una orden de compra, que se efectivizan al guardarse si no tienen ciclo de vida. El estado de una orden de compra no mueve stock por sí mismo.
- Una vez Despachado, el movimiento ya no puede cancelarse: primero debe completarse la Entrega o Recepción (Entregado / Recibido) y luego, si corresponde, registrarse una devolución (HU 14).
- El estado del ciclo de vida se guarda en el propio movimiento (campo `status`) junto con la fecha del cambio, y en el encabezado del traslado; las devoluciones son registros aparte con su propio ciclo de vida (HU 14; ver Clarifications).
- Las entradas y los ajustes sin ciclo de vida configurado se efectivizan de inmediato al guardarse.

**Escenarios de Aceptación**:

1. **Dado** un ciclo de vida configurado, **cuando** el usuario cambia el estado de un movimiento, traslado o documento, **entonces** solo se ofrecen los estados alcanzables mediante transiciones permitidas.
2. **Dado** que se intenta una transición inválida por cualquier vía (p. ej., de Borrador a Recibida), **cuando** se envía, **entonces** el sistema la rechaza con una explicación clara.
3. **Dado** un ciclo de vida configurado, **cuando** el usuario ve listas o detalles de movimientos, traslados o documentos, **entonces** el estado actual es identificable de un vistazo mediante una etiqueta visual.
4. **Dado** que no hay ciclo de vida configurado, **cuando** se editan documentos de respaldo, **entonces** el estado permanece como texto libre igual que en el módulo base; los movimientos sin ciclo de vida se efectivizan al guardarse y no exponen un estado editable.
5. **Dada** una salida en estado Preparado o un traslado en estado Solicitado, **cuando** el usuario lo cancela, **entonces** el stock de los productos no cambia.
6. **Dado** un movimiento de salida o traslado, **cuando** pasa a Despachado, **entonces** el stock del producto disminuye en la cantidad indicada en el almacén de origen.
7. **Dado** un traslado, **cuando** pasa a Recibido, **entonces** el stock del producto aumenta en la cantidad indicada en el almacén de destino; una entrada de inventario vinculada a una orden de compra aumenta el stock al guardarse.
8. **Dado** un movimiento ya Despachado, **cuando** el usuario intenta cancelarlo, **entonces** el sistema lo rechaza con una explicación clara que indica que primero debe completarse la Entrega o Recepción y que, una vez Entregado o Recibido, la corrección se registra con una devolución (Historia de Usuario 14).
9. **Dado** un movimiento, traslado o devolución en un estado final (Cerrada, Cancelada, Entregada, Recibida, Recibida en bodega, Rechazada), **cuando** el usuario intenta cambiar su estado, **entonces** no se ofrece ninguna transición.
10. **Dado** un despacho cuya cantidad supera el disponible (existencias físicas menos saldos pendientes de reservas activas), **cuando** el usuario intenta pasarlo a Despachado, **entonces** el sistema lo rechaza e indica el disponible, salvo que la salida consuma una reserva activa por su saldo pendiente (HU15).
11. **Dado** un cambio de estado, **cuando** se guarda, **entonces** se registra la fecha del cambio (`statusChangedAt`) para mantener un historial del movimiento.

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
- Solo se puede iniciar una devolución sobre movimientos **Entregado** (salidas) o **Recibido** (traslados). No se permite desde Despachado ni En tránsito: la mercadería aún no ha llegado a destino y debe completarse primero la entrega o recepción (HU12).
- Se permiten **devoluciones parciales**.
- La mercadería devuelta **dañada no vuelve al stock disponible**; se registra como merma.
- La bodega de origen debe estar activa para recibir la devolución (HU5); si está desactivada, la devolución no puede pasar a Recibida en bodega hasta reactivarla.

**Ciclo de vida de la devolución**: Solicitada → Aprobada → Recibida en bodega → Cerrada; Rechazada posible antes de Recibida en bodega.

**Regla de stock de la devolución**:

- El stock **no cambia** mientras la devolución esté en Solicitada, Aprobada o Rechazada.
- Al pasar a **Recibida en bodega**, la cantidad en buen estado **aumenta el stock disponible** del almacén de origen del movimiento original. En un traslado, esa misma cantidad se descuenta del almacén de destino.
- La cantidad dañada se registra como **merma** y no suma al stock disponible.

**Escenarios de Aceptación**:

1. **Dada** una salida en estado Entregado o un traslado en estado Recibido, **cuando** el usuario registra una devolución, **entonces** se crea un documento de devolución nuevo, vinculado al movimiento original, que no modifica al original.
2. **Dada** una salida antes de Entregado o un traslado antes de Recibido (incluidos Despachado y En tránsito), **cuando** el usuario intenta registrar una devolución, **entonces** el sistema la rechaza e indica que primero debe completarse la entrega o recepción.
3. **Dado** que el usuario registra una devolución, **cuando** deja el motivo en blanco, **entonces** el sistema impide guardar y explica qué se necesita; el motivo se elige entre valores definidos (dañado, error de pedido, rechazo del cliente, vencido), no texto libre.
4. **Dado** un movimiento o traslado con una cantidad despachada, **cuando** el usuario solicita una devolución parcial, **entonces** el sistema la acepta siempre que la cantidad no supere lo despachado menos lo ya devuelto.
5. **Dada** una devolución cuya cantidad supera lo despachado menos lo ya devuelto, **cuando** el usuario intenta guardarla, **entonces** el sistema la rechaza e indica la cantidad máxima devolvible.
6. **Dada** una devolución en estado Solicitada, Aprobada o Rechazada, **cuando** el usuario consulta el stock, **entonces** el stock no ha cambiado.
7. **Dada** una devolución con cantidad en buen estado, **cuando** pasa a Recibida en bodega, **entonces** el stock disponible del almacén de origen aumenta en esa cantidad.
8. **Dada** una devolución con cantidad dañada, **cuando** pasa a Recibida en bodega, **entonces** esa cantidad se registra como merma y no aumenta el stock disponible.
9. **Dada** una devolución de un traslado, **cuando** pasa a Recibida en bodega, **entonces** el stock del almacén de destino disminuye y el del almacén de origen aumenta en la cantidad en buen estado.
10. **Dada** una devolución con ciclo de vida configurado, **cuando** el usuario intenta una transición inválida (p. ej., de Solicitada a Cerrada), **entonces** el sistema la rechaza con una explicación clara.
11. **Dado** un movimiento o traslado con devoluciones registradas, **cuando** el usuario ve su detalle o la lista, **entonces** se muestra de un vistazo la cantidad total devuelta.
12. **Dada** una devolución Rechazada o Cerrada, **cuando** el usuario intenta cambiar su estado, **entonces** no se ofrece ninguna transición.
13. **Dada** una devolución cuya bodega de origen está desactivada, **cuando** el usuario intenta pasarla a Recibida en bodega, **entonces** el sistema lo rechaza e indica que la bodega debe estar activa (HU5).

### Historia de Usuario 15 - Reservar stock para pedidos pendientes (Prioridad: P2)

Como encargado de bodega, quiero reservar unidades de un producto en una bodega para un pedido pendiente, para que ese stock no se comprometa con otro destino y el saldo disponible refleje lo que realmente está comprometido.

**Por qué esta prioridad**: Sin reservas, dos pedidos pueden comprometer las mismas unidades y el conflicto se descubre recién al despachar. La reserva convierte una promesa comercial en un dato verificable. No bloquea el MVP, porque con pocos pedidos simultáneos la operación puede gestionarse a mano, pero se vuelve necesaria a medida que crece el volumen.

**Prueba Independiente**: Un encargado reserva 30 de las 50 unidades disponibles de un producto; el disponible baja a 20 y el físico sigue en 50; intenta registrar una salida de 25 sin referencia y el sistema la rechaza indicando 20 disponibles; al liberar la reserva, el disponible vuelve a 50.

**Alcance y decisiones**:

- Una reserva identifica producto, bodega, cantidad, referencia del pedido y, opcionalmente, fecha de expiración.
- **Disponible = existencias físicas − saldos pendientes de reservas activas no vencidas**, por producto y bodega. La reserva no altera las existencias físicas ni crea movimientos.
- La reserva se controla a nivel **producto + bodega**, no por lote: el lote se valida por su propio saldo físico (HU6).
- Una reserva no puede superar el disponible de ese producto en esa bodega.
- Estados: **Activa → Consumida** (al registrar la salida asociada), **Activa → Liberada** (liberación total) o **Activa → Vencida** (al terminar el día de `expiresAt`).
- Una **liberación parcial** mantiene la reserva en `Activa` y acumula `releasedQuantity`; el saldo pendiente es `quantity - releasedQuantity`.
- Para consumir una reserva, la salida asociada debe cubrir el saldo pendiente; si despacha menos, primero se libera la diferencia.
- Las reservas vencidas dejan de descontar disponible sin borrar el registro, para conservar la trazabilidad. La expiración se evalúa de forma perezosa al consultar u operar.
- Las alertas de stock mínimo se evalúan sobre el **disponible** total, no sobre el físico (HU9).
- No se puede eliminar un producto que tenga reservas activas o líneas en una toma abierta, ni desactivar una bodega que tenga reservas activas o una toma abierta.
- Si una toma deja el físico por debajo de las reservas activas, el disponible puede quedar negativo: se muestra y se advierte, y se bloquean nuevas reservas y salidas hasta resolverlo (HU16).

**Escenarios de Aceptación**:

1. **Dado** un producto con 50 unidades físicas y sin reservas, **cuando** el usuario reserva 30, **entonces** el disponible pasa a 20 y las existencias físicas siguen en 50.
2. **Dado** un disponible de 20, **cuando** el usuario intenta reservar 25, **entonces** el sistema rechaza la operación e indica el disponible actual.
3. **Dada** una reserva activa de 30 unidades, **cuando** el usuario registra la salida asociada a esa referencia por 30 unidades, **entonces** la salida se permite y la reserva pasa a "Consumida".
4. **Dada** una reserva activa de 30 unidades, **cuando** el usuario registra una salida sin referencia a esa reserva, **entonces** solo puede despachar hasta el disponible (20) y el exceso se rechaza.
5. **Dada** una reserva activa, **cuando** el usuario la libera totalmente, **entonces** el disponible aumenta en la cantidad liberada y la reserva pasa a "Liberada" conservando su registro.
6. **Dada** una reserva con fecha de expiración, **cuando** termina el día de `expiresAt` y el usuario consulta el stock, **entonces** la reserva aparece como "Vencida" y ya no descuenta disponible.
7. **Dado** un producto con reservas activas, **cuando** el usuario intenta eliminarlo, **entonces** el sistema lo impide e indica que debe liberar o consumir las reservas primero.
8. **Dado** un producto cuyo disponible llegó a cero pero conserva existencias físicas, **cuando** el usuario consulta el producto, **entonces** se muestra como "sin disponible", distinguiéndolo de "sin stock físico".
9. **Dada** una bodega desactivada, **cuando** el usuario intenta reservar en ella, **entonces** el sistema lo rechaza e indica que la bodega no puede recibir movimientos (HU5).
10. **Dada** una bodega con reservas activas, **cuando** el usuario intenta desactivarla, **entonces** el sistema lo impide e indica que debe liberar o consumir las reservas primero.
11. **Dada** una reserva activa de 30 unidades, **cuando** el usuario libera 10, **entonces** el disponible sube en 10, la reserva sigue "Activa" con 20 pendientes y conserva el registro de lo liberado.
12. **Dada** una reserva activa de 30 y una salida asociada de 20, **cuando** el usuario intenta registrarla sin liberar antes la diferencia, **entonces** el sistema lo rechaza e indica que debe liberar 10 o despachar las 30.

---

### Historia de Usuario 16 - Realizar una toma de inventario físico y registrar diferencias (Prioridad: P2)

Como encargado de bodega, quiero comparar el stock del sistema con un conteo físico y registrar las diferencias como ajustes, para mantener el inventario alineado con la realidad y detectar pérdidas o errores de registro.

**Por qué esta prioridad**: El MVP funciona sin conteos, pero sin ellos el stock se desvía con el tiempo y las alertas de stock mínimo pierden sentido. Se posterga porque requiere una pantalla adicional y depende de que los movimientos y los ajustes ya funcionen.

**Prueba Independiente**: Un usuario inicia una toma para una bodega, ingresa las cantidades contadas, el sistema muestra la diferencia contra el saldo del sistema y, al confirmar, se genera un ajuste por cada diferencia que deja el físico igual a lo contado, sin liberar las reservas existentes.

**Alcance y decisiones**:

- La toma es **por bodega** y compara la cantidad contada contra las **existencias físicas**, nunca contra el disponible.
- Si un producto tiene lotes registrados, el conteo se hace **por lote**, y el ajuste hereda ese lote; si además conserva saldo físico sin lote asociado, se agrega una línea **"sin lote"** para no descuadrar el saldo por lote.
- Estados: **Borrador → En conteo → Confirmada**, con **Anulada** posible antes de confirmar. Solo puede existir **una toma abierta por bodega**.
- El paso de **Borrador a En conteo** es obligatorio antes de confirmar; una toma **Confirmada** es inmutable y no puede anularse ni editarse.
- El saldo del sistema que se muestra al iniciar es una **referencia**; la diferencia se calcula **contra el saldo vigente al confirmar**. No se congela la bodega, y así un movimiento ocurrido durante el conteo no produce un ajuste erróneo.
- Al confirmar, se genera **un ajuste por cada diferencia**, con motivo y referencia a la toma mediante `countId`.
- Las **reservas no se modifican** con la toma: son compromisos, no existencias. Si el físico contado queda por debajo de lo reservado, el disponible puede quedar negativo, se advierte y se bloquean nuevas reservas y salidas hasta resolverlo.
- Un producto no contado no genera ajuste y conserva su saldo.
- No se puede desactivar una bodega con una toma abierta ni eliminar un producto con líneas en una toma abierta.

**Escenarios de Aceptación**:

1. **Dado** un usuario en una bodega, **cuando** inicia una toma, **entonces** el sistema lista los productos con su saldo del sistema y un campo para la cantidad contada; si un producto tiene lotes, los lista por lote y agrega una línea "sin lote" cuando exista saldo no asociado.
2. **Dado** el listado de la toma, **cuando** el usuario ingresa una cantidad distinta al saldo del sistema, **entonces** se muestra la diferencia (positiva o negativa) antes de confirmar.
3. **Dado** el listado de la toma, **cuando** el usuario deja un producto sin contar, **entonces** no se genera ajuste y conserva su saldo.
4. **Dada** una toma con diferencias, **cuando** el usuario confirma, **entonces** se genera un ajuste por cada diferencia, con motivo y referencia a la toma.
5. **Dado** un ajuste generado por una toma, **cuando** el usuario consulta el kárdex del producto, **entonces** el ajuste aparece con su motivo y la referencia de la toma.
6. **Dado** un producto con 30 unidades reservadas, **cuando** el conteo físico resulta menor a 30, **entonces** el sistema confirma el ajuste, advierte que las reservas activas superan el físico, no las libera automáticamente y muestra el disponible negativo y bloqueado.
7. **Dada** una toma en estado "En conteo", **cuando** el usuario registra un movimiento en esa bodega, **entonces** el movimiento se permite y la diferencia se calcula contra el saldo actualizado al confirmar.
8. **Dada** una bodega con una toma abierta, **cuando** el usuario intenta iniciar otra, **entonces** el sistema lo impide e indica que debe confirmar o anular la existente.
9. **Dada** una cantidad contada negativa o no numérica, **cuando** el usuario intenta continuar, **entonces** el sistema la rechaza.
10. **Dado** que la toma no se confirma, **cuando** el usuario la anula, **entonces** no se altera ningún stock.
11. **Dada** una toma en "Borrador", **cuando** el usuario intenta confirmarla, **entonces** el sistema exige primero pasarla a "En conteo".
12. **Dada** una toma "Confirmada", **cuando** el usuario intenta anularla o editar sus líneas, **entonces** el sistema no lo permite.
13. **Dada** una bodega con una toma abierta, **cuando** el usuario intenta desactivarla, **entonces** el sistema lo impide e indica que debe confirmar o anular la toma; lo mismo aplica al intentar eliminar un producto con líneas en esa toma.

---

### Historia de Usuario 17 - Iniciar sesión con contraseña y cerrar sesión (Prioridad: P1)

Como usuario de negocio, quiero iniciar sesión con mi usuario y contraseña antes de usar el espacio de trabajo, y poder cerrar la sesión cuando termine mi turno, para que el módulo solo esté accesible para quien tenga credenciales y la sesión quede bajo mi control.

**Por qué esta prioridad**: El inicio de sesión es la puerta de entrada a todas las demás pantallas: sin credenciales no se llega al panel, a la gestión ni a la búsqueda. Al condicionar el acceso al resto de la funcionalidad, se define antes que cualquier otra historia de uso.

**Prueba Independiente**: Un usuario abre la aplicación y ve la pantalla de inicio de sesión; entra con las credenciales del usuario admin por defecto y llega al panel; recarga el navegador y sigue dentro sin volver a pedir la contraseña; al pulsar cerrar sesión regresa a la pantalla de login y, si alguien vuelve a entrar, los datos almacenados siguen intactos.

**Alcance y decisiones**:

- La pantalla de login pide **usuario** y **contraseña**; ambos son obligatorios.
- En el primer arranque se crea un **usuario admin por defecto** con credenciales documentadas; no hay registro libre de usuarios en esta versión.
- La contraseña se guarda únicamente como **hash con sal (salt)** en localStorage; jamás se almacena ni se muestra en claro.
- La sesión iniciada se persiste en localStorage hasta que el usuario la cierre; navegar entre pantallas o recargar el navegador no interrumpe la sesión.
- **No hay control por rol**: cualquier usuario autenticado tiene los mismos permisos (Clarifications 2026-11-18).
- El cierre de sesión limpia solo el indicador de sesión; las entidades, documentos y movimientos almacenados no se eliminan.
- La entrada del usuario se escapa al renderizar para prevenir XSS, igual que el resto de los datos.

**Escenarios de Aceptación**:

1. **Dado** que no hay una sesión iniciada, **cuando** el usuario abre la aplicación (incluido un enlace profundo o una recarga), **entonces** se muestra la pantalla de inicio de sesión con los campos de usuario y contraseña y ningún contenido del espacio de trabajo.
2. **Dado** el usuario en la pantalla de login, **cuando** deja el usuario o la contraseña en blanco e intenta entrar, **entonces** el sistema impide el acceso y explica qué campos son obligatorios.
3. **Dado** que existe la sesión de administrador por defecto creada en el primer arranque, **cuando** el usuario introduce sus credenciales correctas, **entonces** el sistema lo autentica y muestra el panel de inicio.
4. **Dado** un usuario registrado con una contraseña determinada, **cuando** se introduce una contraseña incorrecta, **entonces** el sistema rechaza el acceso con un mensaje genérico que no revela si el usuario existe.
5. **Dado** que se introduce un usuario que no está registrado, **cuando** el usuario intenta entrar, **entonces** el sistema rechaza el acceso con el mismo mensaje genérico del escenario 4.
6. **Dado** que el usuario inició sesión, **cuando** recarga el navegador o navega a otra pantalla y vuelve, **entonces** la sesión se mantiene y no se le vuelve a pedir la contraseña.
7. **Dado** una sesión iniciada, **cuando** el usuario activa el botón de cerrar sesión, **entonces** la sesión termina, se muestra de nuevo la pantalla de login y todas las entidades, documentos y movimientos permanecen intactos.
8. **Dado** que el usuario cerró sesión, **cuando** otra persona abre la aplicación en el mismo navegador, **entonces** debe iniciar sesión para acceder al espacio de trabajo.
9. **Dado** el usuario en la pantalla de login, **cuando** introduce HTML o scripts en el campo de usuario o de contraseña, **entonces** el contenido se escapa y no se ejecuta.
10. **Dado** el usuario admin por defecto creado en el primer arranque, **cuando** se inspecciona el almacenamiento del navegador, **entonces** la contraseña aparece únicamente como hash con sal y nunca en texto plano.
11. **Dado** que el usuario cierra sesión teniendo un formulario con cambios sin guardar, **cuando** vuelve a iniciar sesión, **entonces** el formulario vuelve a su estado inicial sin aplicar cambios parciales.

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
- ¿Qué ocurre cuando un usuario registra una salida cuya cantidad supera el disponible (físico menos reservas activas) del producto en el almacén?
- ¿Qué ocurre cuando un usuario intenta editar o eliminar un movimiento de inventario ya guardado?
- ¿Qué ocurre cuando el lote indicado en un movimiento pertenece a un producto distinto al del movimiento?
- ¿Qué ocurre cuando un usuario registra un movimiento con cantidad cero o negativa, o con una fecha inválida?
- ¿Qué ocurre con el impacto de un movimiento en el stock cuando hay un ciclo de vida configurado y cuando no lo hay?
- ¿Qué ocurre cuando un usuario intenta reservar más cantidad que el disponible del producto en la bodega?
- ¿Qué ocurre cuando una reserva vence mientras el usuario está registrando la salida asociada?
- ¿Qué ocurre cuando se confirma una toma de inventario en una bodega que recibió movimientos durante el conteo?
- ¿Qué ocurre cuando el conteo físico de un producto es menor que su cantidad reservada?
- ¿Qué ocurre cuando se libera solo una parte de una reserva y queda saldo pendiente?
- ¿Qué ocurre cuando una toma confirmada deja el disponible negativo y luego se intenta reservar o despachar?
- ¿Qué ocurre cuando un producto con lotes conserva saldo físico que no está asociado a ningún lote?
- ¿Qué ocurre cuando un usuario introduce una contraseña incorrecta en el inicio de sesión?
- ¿Qué ocurre cuando el almacenamiento del navegador está vacío y no existe el usuario admin por defecto?
- ¿Qué ocurre cuando el usuario cierra sesión con un formulario que tiene cambios sin guardar?
- ¿Qué ocurre cuando se abre la aplicación mediante un enlace profundo sin haber iniciado sesión?

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
- **FR-010**: El sistema DEBE mostrar un panel de inicio como vista inicial una vez iniciada la sesión, con botones de acción rápida claramente etiquetados para las tareas ERP clave.
- **FR-011**: El sistema DEBE envolver cada pantalla en un marco de espacio de trabajo persistente compuesto por una barra superior con marca y una barra lateral de navegación de módulos.
- **FR-012**: La barra lateral DEBE proporcionar botones de módulo para Panel, Productos, Movimientos, Bodegas y Buscar, etiquetados desde la configuración del módulo.
- **FR-013**: El botón de módulo Productos DEBE mostrar el contenido de gestión de productos (entidades).
- **FR-014**: El botón de módulo Movimientos DEBE mostrar el contenido de gestión de movimientos de inventario; los documentos de respaldo se gestionan desde el producto (HU10).
- **FR-015**: El botón de módulo Panel DEBE devolver al usuario al panel de inicio.
- **FR-016**: La pantalla de gestión DEBE mostrar la lista de entidades junto con los formularios de creación y edición.
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
- **FR-040**: El sistema DEBE permitir registrar movimientos de inventario de tipo entrada, salida o ajuste que referencien un producto y un almacén existentes, con una cantidad entero positivo y una fecha de calendario válida. Los traslados se registran mediante su flujo propio (HU8) y generan dos movimientos vinculados.
- **FR-041**: El sistema DEBE calcular y mostrar el saldo de un producto por almacén como la suma de sus movimientos, sin permitir editarlo directamente.
- **FR-042**: El sistema DEBE rechazar una salida cuya cantidad supere el disponible del producto en el almacén (existencias físicas menos los saldos pendientes de reservas activas no vencidas), indicando el disponible actual; se exceptúa la salida que consume una reserva activa, que se valida contra su saldo pendiente.
- **FR-043**: Los movimientos guardados NO DEBEN ser editables ni eliminables; el sistema DEBE ofrecer registrar un movimiento de ajuste como corrección.
- **FR-044**: El sistema DEBE permitir asociar opcionalmente un movimiento a un lote que pertenezca al mismo producto y al documento que lo origina.
- **FR-045**: La pantalla de gestión de lotes DEBE abrirse desde la gestión del producto correspondiente; la barra lateral NO DEBE exponer un módulo independiente de Lotes.
- **FR-046**: El sistema DEBE permitir reservar una cantidad de un producto en una bodega, con una referencia de pedido obligatoria y una fecha de expiración opcional.
- **FR-047**: El sistema DEBE calcular y mostrar el disponible como las existencias físicas menos los saldos pendientes de reservas activas no vencidas, por producto y bodega, sin permitir editarlo directamente.
- **FR-048**: El sistema DEBE rechazar una reserva cuya cantidad supere el disponible del producto en esa bodega, indicando el disponible actual.
- **FR-049**: El sistema DEBE permitir consumir una reserva al registrar la salida asociada y liberarla total o parcialmente; una liberación parcial mantiene la reserva activa y acumula la cantidad liberada, dejando registro del cambio de estado.
- **FR-050**: El sistema DEBE dejar de descontar el disponible de una reserva vencida sin eliminar su registro.
- **FR-051**: El sistema NO DEBE permitir eliminar un producto que tenga reservas activas o líneas en una toma abierta, ni desactivar una bodega que tenga reservas activas o una toma abierta.
- **FR-052**: El sistema DEBE permitir iniciar una toma de inventario por bodega, con una línea por producto y, si el producto tiene lotes, una línea por lote más una línea "sin lote" cuando exista saldo físico no asociado a lotes.
- **FR-053**: El sistema DEBE calcular la diferencia entre lo contado y el saldo vigente al confirmar la toma, y generar un movimiento de ajuste por cada diferencia, con motivo y referencia a la toma mediante `countId`.
- **FR-054**: La toma de inventario NO DEBE modificar las reservas activas y DEBE advertir cuando el físico contado sea menor que lo reservado, mostrando el disponible negativo y bloqueando nuevas reservas y salidas hasta resolverlo.
- **FR-055**: El sistema NO DEBE permitir más de una toma abierta por bodega, DEBE exigir el paso `Borrador → En conteo` antes de confirmar y NO DEBE permitir modificar ni anular una toma `Confirmada`.
- **FR-056**: El sistema DEBE rechazar un movimiento o una línea de traslado cuya cantidad supere el saldo físico del lote indicado.
- **FR-057**: El sistema DEBE exigir un inicio de sesión con usuario y contraseña antes de mostrar cualquier pantalla del espacio de trabajo; sin sesión iniciada solo se muestra la pantalla de login.
- **FR-058**: El sistema DEBE validar las credenciales contra los usuarios almacenados y rechazar el acceso con un mensaje genérico que no revele si el usuario existe.
- **FR-059**: El sistema DEBE almacenar las contraseñas únicamente como hash con sal, DEBE escapar la entrada del usuario para prevenir XSS y NO DEBE guardar ni mostrar contraseñas en texto plano.
- **FR-060**: El sistema DEBE persistir la sesión iniciada en localStorage hasta que el usuario cierre sesión, sin perder datos al navegar entre pantallas ni al recargar el navegador.
- **FR-061**: El sistema DEBE ofrecer un cierre de sesión que elimine únicamente el indicador de sesión, regrese a la pantalla de login y conserve intactos todos los datos almacenados.
- **FR-062**: En el primer arranque, el sistema DEBE crear un usuario admin por defecto con credenciales documentadas cuando no exista ningún usuario registrado.

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
- **Reserva de stock**: Compromiso de una cantidad de un producto en una bodega para un pedido pendiente, con referencia y expiración opcional; reduce el disponible pero no las existencias físicas ni genera movimientos (HU 15).
- **Toma de inventario**: Conteo físico por bodega con ciclo Borrador → En conteo → Confirmada/Anulada; al confirmar genera un ajuste por diferencia, vinculado a la toma, sin alterar las reservas (HU 16).

## Criterios de Éxito *(obligatorio)*

### Resultados Medibles

- **SC-001**: Los usuarios pueden crear una nueva entidad y verla en la lista en menos de 2 minutos.
- **SC-002**: Los usuarios pueden encontrar una entidad existente mediante la búsqueda en menos de 10 segundos tras introducir un término relevante.
- **SC-003**: Al menos el 90% de los usuarios de prueba pueden completar tareas de crear, editar, eliminar y buscar sin ayuda.
- **SC-004**: El sistema sigue siendo utilizable para un conjunto de datos de al menos 500 registros de entidad sin pérdida de funcionalidad central.
- **SC-005**: Un usuario puede iniciar sesión y alcanzar las pantallas de gestión y búsqueda desde el panel o la barra lateral en menos de 10 segundos tras autenticarse.
- **SC-006**: Toda la funcionalidad existente de gestión de entidades y documentos sigue operativa tras el rediseño del marco ERP y el panel (sin regresiones).
- **SC-007**: Los usuarios pueden navegar entre las pantallas de panel, gestión y búsqueda sin perder ninguna entidad ni documento almacenado.
- **SC-008**: Un desarrollador puede producir un módulo adaptado usando solo el archivo de configuración, con cero modificaciones en archivos fuente centrales.
- **SC-009**: Cada pantalla presenta el mismo marco con marca, y los usuarios pueden identificar en qué módulo están de un vistazo.
- **SC-010**: Las estadísticas de registros mostradas en el panel siempre coinciden con el número de entidades y documentos almacenados.
- **SC-011**: Un usuario puede reservar stock y ver actualizado el disponible por producto y bodega en menos de 1 minuto, sin que las existencias físicas cambien.
- **SC-012**: Tras confirmar una toma con diferencias, el saldo físico del sistema coincide con lo contado y cada ajuste generado es rastreable hasta su toma y su motivo.

## Suposiciones

- El módulo base gestiona datos para un único espacio de trabajo en lugar de una base de datos multiinquilino compartida.
- La adaptación a un módulo específico se realiza mediante un archivo de configuración del módulo en lugar de editando archivos fuente centrales.
- Cada entidad incluye información básica suficiente para identificación y seguimiento; los módulos personalizados aportan los campos específicos del dominio.
- La versión inicial se centra en la gestión central de datos maestros y documentos en lugar de capacidades ERP avanzadas como flujos de aprobación, períodos de contabilización o informes.
- La búsqueda se realiza sobre los registros de entidad almacenados.
- La pantalla de gestión consolida los formularios de añadir/editar entidad y añadir/editar documento en una sola pantalla de gestión.
- La navegación entre áreas ocurre mediante una barra lateral persistente; la pantalla de gestión aloja ambos paneles de gestión y muestra la lista de entidades.
- El logotipo se genera como un monograma SVG en línea derivado del nombre del módulo; no se requieren recursos de imagen externos.
- Se puede configurar un color de acento opcional para la marca; el resto de la paleta base permanece fija.
- Solo se muestra una pantalla a la vez; no hay diseño lado a lado del contenido de gestión y búsqueda.
- La navegación entre pantallas se maneja dentro de la aplicación (p. ej., cambio de vistas), y el botón atrás del navegador debe comportarse de forma predecible.
- Los datos siguen persistiéndose en el localStorage del navegador y no se ven afectados por la navegación entre pantallas.
- La pantalla de búsqueda se centra en encontrar y ver entidades; la edición permanece en la pantalla de gestión.
- El contenido del usuario introducido por el usuario (nombres, descripciones, notas de documentos) DEBE sanitizarse antes de renderizarse en el DOM para prevenir ataques de inyección de scripts (XSS). El módulo base DEBE escapar HTML y atributos de eventos al mostrar datos de localStorage.
- El MVP se distribuye con una configuración de Logística e Inventario cargada por defecto, de modo que la UI muestra Producto, Bodega y Movimiento; Entidad y Documento son los nombres internos del módulo base y solo aparecen en pantalla si una configuración los define así. Sin configuración, el módulo base retrocede a Entidad/Documento (FR-024). Ver Clarifications.
- El MVP exige inicio de sesión con usuario y contraseña antes de acceder al espacio de trabajo (HU 17); no hay control de acceso por rol: los roles mencionados en las historias (usuario de negocio, encargado de bodega, operador de inventario, jefe de logística, encargado de recepción) son actores de los escenarios y todos los usuarios autenticados comparten los mismos permisos. Ver Clarifications.
- Las reservas y las tomas de inventario se gestionan en el mismo espacio de trabajo local (`localStorage`) que el resto del módulo.
- El disponible se controla por producto y bodega; no se lleva disponibilidad separada por lote en esta versión.


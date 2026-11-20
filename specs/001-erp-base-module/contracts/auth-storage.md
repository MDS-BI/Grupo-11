# Contrato de Almacenamiento de Autenticación

## Propósito

La aplicación gestiona usuarios y sesión de acceso localmente en el navegador usando `localStorage`, sin servidor (HU 17, FR-057 a FR-062).

## Claves de Almacenamiento

- `erp_base_module:users`: JSON con la lista de usuarios registrados.
- `erp_base_module:session`: JSON con el indicador de sesión iniciada; ausente o `null` = sin sesión.

## Forma de los Datos

Cada registro de usuario debe incluir:

- `id`: cadena única
- `username`: cadena no vacía, única sin distinguir mayúsculas/minúsculas
- `passwordHash`: cadena hexadecimal (SHA-256 de la contraseña combinada con la sal); la contraseña en claro NUNCA se almacena
- `salt`: cadena hexadecimal generada aleatoriamente por usuario
- `createdAt`: cadena de marca de tiempo ISO
- `updatedAt`: cadena de marca de tiempo ISO

El indicador de sesión debe incluir:

- `username`: cadena con el usuario autenticado
- `loggedInAt`: cadena de marca de tiempo ISO

## Operaciones

- `ensureDefaultUser()`: si la lista de usuarios está vacía, crea el usuario admin por defecto (`admin` / `admin123`). Idempotente.
- `loadUsers()`: devuelve todos los usuarios almacenados (nunca con la contraseña en claro expuesta como `password`).
- `login(username, password)`: valida las credenciales; devuelve la sesión creada o `null`.
- `logout()`: elimina únicamente `erp_base_module:session`.
- `isLoggedIn()`: devuelve `true` si existe un indicador de sesión válido.
- `getSession()`: devuelve la sesión actual o `null`.

## Expectativas de Validación

- Un `username` o `password` vacío debe rechazarse antes de validar (FR-057, escenario 2).
- Un usuario inexistente o una contraseña incorrecta deben producir el mismo resultado: rechazo con mensaje genérico que no revele si el usuario existe (FR-058).
- No hay límite de intentos fallidos en esta versión (Clarifications 2026-11-18).
- `passwordHash` debe calcularse con SHA-256 sobre `password + salt`; inspeccionar el almacenamiento no debe mostrar la contraseña en claro (FR-059, escenario 10).
- `login` debe escapar cualquier entrada del usuario al renderizarla para prevenir XSS (FR-059, escenario 9).
- `logout` debe eliminar solo la sesión; entidades, documentos, movimientos, bodegas, lotes, reservas y tomas permanecen intactos (FR-061, escenario 7).
- La sesión persiste hasta `logout`; navegar o recargar no la elimina (FR-060).

## Expectativas de Extensibilidad

- Los módulos personalizados pueden añadir campos propios a los usuarios sin cambiar esta forma base.
- Las operaciones anteriores permanecen estables para que el módulo base y sus extensiones compartan la misma puerta de acceso.

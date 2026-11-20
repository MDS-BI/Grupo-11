import { ensureDefaultUser, login } from '../../src/auth.js';

/**
 * Siembra el usuario admin por defecto y una sesión válida en localStorage
 * (Clarifications 2026-11-18) para que las pruebas de integración existentes
 * superen la compuerta de sesión de FR-057 sin ejercitar el login por UI.
 */
export function seedSession() {
  ensureDefaultUser();
  return login('admin', 'admin123');
}

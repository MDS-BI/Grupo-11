import { describe, it, expect, beforeEach } from 'vitest';
import {
  ensureDefaultUser,
  loadUsers,
  login,
  logout,
  isLoggedIn,
  getSession,
  hashPassword,
  GENERIC_LOGIN_ERROR,
  DEFAULT_USERNAME,
  DEFAULT_PASSWORD,
} from '../../src/auth.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
});

describe('auth storage', () => {
  it('siembra el usuario admin por defecto solo en el primer arranque y de forma idempotente (FR-062)', () => {
    expect(ensureDefaultUser()).toBe(true);
    expect(ensureDefaultUser()).toBe(false);
    const users = loadUsers();
    expect(users.length).toBe(1);
    expect(users[0].username).toBe(DEFAULT_USERNAME);
    expect(DEFAULT_PASSWORD).toBe('admin123');
  });

  it('almacena la contraseña únicamente como hash con sal, nunca en claro (FR-059)', () => {
    ensureDefaultUser();
    const raw = store.get('erp_base_module:users');
    expect(raw).not.toContain('admin123');
    const user = loadUsers()[0];
    expect(user.salt).toMatch(/^[0-9a-f]{32}$/);
    expect(user.passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(user.passwordHash).toBe(hashPassword(DEFAULT_PASSWORD, user.salt));
    expect(user.password).toBeUndefined();
    expect(Object.keys(user)).toEqual(
      expect.arrayContaining(['id', 'username', 'passwordHash', 'salt', 'createdAt', 'updatedAt'])
    );
  });

  it('acepta las credenciales correctas y trata el usuario sin distinguir mayúsculas (FR-057)', () => {
    ensureDefaultUser();
    expect(login(DEFAULT_USERNAME, DEFAULT_PASSWORD)).toMatchObject({ username: DEFAULT_USERNAME });
    expect(isLoggedIn()).toBe(true);
    logout();
    expect(login('ADMIN', DEFAULT_PASSWORD)).toMatchObject({ username: DEFAULT_USERNAME });
  });

  it('rechaza una contraseña incorrecta y un usuario inexistente con el mismo resultado genérico (FR-058)', () => {
    ensureDefaultUser();
    const wrongPassword = login(DEFAULT_USERNAME, 'otra-clave');
    const unknownUser = login('no-existe', DEFAULT_PASSWORD);
    expect(wrongPassword).toBeNull();
    expect(unknownUser).toBeNull();
    expect(isLoggedIn()).toBe(false);
    expect(GENERIC_LOGIN_ERROR).toBe('Usuario o contraseña incorrectos.');
    expect(GENERIC_LOGIN_ERROR).not.toContain(DEFAULT_USERNAME);
    expect(GENERIC_LOGIN_ERROR).not.toContain('exist');
  });

  it('rechaza usuario o contraseña vacíos antes de validar (HU 17, escenario 2)', () => {
    ensureDefaultUser();
    expect(login('', DEFAULT_PASSWORD)).toBeNull();
    expect(login(DEFAULT_USERNAME, '')).toBeNull();
    expect(login('   ', 'x')).toBeNull();
    expect(login(DEFAULT_USERNAME, '   ')).toBeNull();
    expect(isLoggedIn()).toBe(false);
  });

  it('persiste la sesión hasta cerrarla y conserva los demás datos (FR-060, FR-061)', () => {
    ensureDefaultUser();
    store.set('erp_base_module:entities', '[{"id":"ent_1"}]');
    login(DEFAULT_USERNAME, DEFAULT_PASSWORD);

    expect(getSession()).toMatchObject({ username: DEFAULT_USERNAME });
    expect(getSession().loggedInAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(isLoggedIn()).toBe(true);

    logout();
    expect(isLoggedIn()).toBe(false);
    expect(getSession()).toBeNull();
    expect(store.has('erp_base_module:session')).toBe(false);
    expect(store.get('erp_base_module:entities')).toBe('[{"id":"ent_1"}]');
    expect(loadUsers().length).toBe(1);
  });

  it('no guarda la contraseña en la sesión persistida', () => {
    ensureDefaultUser();
    login(DEFAULT_USERNAME, DEFAULT_PASSWORD);
    expect(store.get('erp_base_module:session')).not.toContain(DEFAULT_PASSWORD);
  });

  it('trata una sesión ausente o corrupta como sin sesión (FR-057)', () => {
    expect(isLoggedIn()).toBe(false);
    store.set('erp_base_module:session', '{roto');
    expect(isLoggedIn()).toBe(false);
    store.set('erp_base_module:session', JSON.stringify({}));
    expect(isLoggedIn()).toBe(false);
    store.set('erp_base_module:session', JSON.stringify({ username: '' }));
    expect(isLoggedIn()).toBe(false);
  });
});

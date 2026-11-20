import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, loadEntities, loadDocuments, addDocument } from '../../src/storage.js';
import { logout, GENERIC_LOGIN_ERROR } from '../../src/auth.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
}

function fillAndSubmit(username, password) {
  qs('login-username').value = username;
  qs('login-password').value = password;
  qs('login-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  vi.resetModules();
  app = await import('../../src/app.js');
  await app.initApp(normalizeConfig(undefined));
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 17 - iniciar sesión con contraseña y cerrar sesión', () => {
  it('sin sesión muestra la pantalla de login y ningún contenido del espacio de trabajo (escenario 1)', () => {
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('login-username')).not.toBeNull();
    expect(qs('login-password')).not.toBeNull();
    expect(qs('workspace-content').hidden).toBe(true);
    expect(document.querySelector('.topbar').hidden).toBe(true);
    expect(document.querySelector('.sidebar').hidden).toBe(true);
    expect(qs('view-dashboard').hidden).toBe(true);
  });

  it('impide el acceso con campos vacíos e indica que son obligatorios (escenario 2)', () => {
    fillAndSubmit('', '');
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('login-error').hidden).toBe(false);
    expect(qs('login-error').textContent).toMatch(/obligatorios/i);
    expect(qs('login-username').getAttribute('aria-invalid')).toBe('true');
    expect(qs('login-password').getAttribute('aria-invalid')).toBe('true');

    fillAndSubmit('', 'admin123');
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('login-error').textContent).toMatch(/usuario/i);
    expect(qs('login-username').getAttribute('aria-invalid')).toBe('true');
    expect(qs('login-password').getAttribute('aria-invalid')).toBe('false');
  });

  it('autentica con las credenciales admin por defecto y muestra el panel (escenario 3)', () => {
    fillAndSubmit('admin', 'admin123');
    expect(qs('login-screen')).toBeNull();
    expect(qs('workspace-content').hidden).toBe(false);
    expect(document.querySelector('.topbar').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('logout-btn')).not.toBeNull();
  });

  it('rechaza una contraseña incorrecta con el mismo mensaje genérico de un usuario inexistente (escenarios 4 y 5)', () => {
    fillAndSubmit('admin', 'clave-mala');
    expect(qs('login-screen')).not.toBeNull();
    const wrongPasswordError = qs('login-error').textContent;
    expect(wrongPasswordError).toBe(GENERIC_LOGIN_ERROR);
    expect(wrongPasswordError).not.toMatch(/admin|no existe|incorrecto para/i);

    fillAndSubmit('nadie', 'admin123');
    const unknownUserError = qs('login-error').textContent;
    expect(unknownUserError).toBe(GENERIC_LOGIN_ERROR);
    expect(unknownUserError).toBe(wrongPasswordError);
  });

  it('mantiene la sesión tras recargar el navegador (escenario 6)', async () => {
    fillAndSubmit('admin', 'admin123');
    expect(qs('view-dashboard').hidden).toBe(false);

    vi.resetModules();
    const fresh = await import('../../src/app.js');
    await fresh.initApp(normalizeConfig(undefined));

    expect(qs('login-screen')).toBeNull();
    expect(qs('workspace-content').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(false);
  });

  it('cierra la sesión mostrando el login y conservando intactos los datos (escenario 7)', () => {
    addEntity({ name: 'Acme', code: 'AC-001' });
    fillAndSubmit('admin', 'admin123');
    expect(loadEntities().length).toBe(1);

    qs('logout-btn').click();

    expect(qs('login-screen')).not.toBeNull();
    expect(qs('workspace-content').hidden).toBe(true);
    expect(qs('login-username').value).toBe('');
    expect(qs('login-password').value).toBe('');
    expect(loadEntities().length).toBe(1);
    expect(loadEntities()[0].name).toBe('Acme');
    expect(loadDocuments().length).toBe(0);
  });

  it('exige volver a iniciar sesión después de cerrar sesión (escenario 8)', () => {
    fillAndSubmit('admin', 'admin123');
    qs('logout-btn').click();
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('workspace-content').hidden).toBe(true);

    fillAndSubmit('admin', 'admin123');
    expect(qs('login-screen')).toBeNull();
    expect(qs('workspace-content').hidden).toBe(false);
  });

  it('escapa la entrada con scripts en los campos de login (escenario 9)', () => {
    const payload = '<img src=x onerror="window.__pwned=1">';
    fillAndSubmit(payload, '<script>window.__pwned=1</script>');
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('login-error').textContent).toBe(GENERIC_LOGIN_ERROR);
    expect(qs('login-error').querySelector('img, script')).toBeNull();
    expect(document.querySelector('#login-screen img')).toBeNull();
    expect(document.querySelector('#login-screen script')).toBeNull();
    expect(dom.window.__pwned).toBeUndefined();
  });

  it('guarda la contraseña únicamente como hash con sal en el almacenamiento (escenario 10)', () => {
    fillAndSubmit('admin', 'admin123');
    const users = globalThis.localStorage.getItem('erp_base_module:users');
    const session = globalThis.localStorage.getItem('erp_base_module:session');
    expect(users).not.toContain('admin123');
    expect(session).not.toContain('admin123');
    expect(users).toContain('"passwordHash"');
    expect(users).toContain('"salt"');
  });

  it('al volver a entrar el formulario arranca en su estado inicial (escenario 11)', () => {
    fillAndSubmit('admin', 'admin123');
    qs('logout-btn').click();

    qs('login-username').value = 'admin';
    qs('login-password').value = 'admin123';
    fillAndSubmit('admin', 'clave-mala');
    expect(qs('login-screen')).not.toBeNull();
    expect(qs('login-error').hidden).toBe(false);

    fillAndSubmit('admin', 'admin123');
    expect(qs('login-screen')).toBeNull();

    qs('logout-btn').click();
    expect(qs('login-username').value).toBe('');
    expect(qs('login-password').value).toBe('');
    expect(qs('login-error').hidden).toBe(true);
  });

  it('conserva documentos y movimientos al cerrar sesión (FR-061)', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addDocument({
      entity_id: entity.entity_id,
      type: 'remision',
      folio: 1001,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
    });
    fillAndSubmit('admin', 'admin123');
    expect(loadDocuments().length).toBe(1);

    qs('logout-btn').click();
    logout();

    expect(loadEntities().length).toBe(1);
    expect(loadDocuments().length).toBe(1);
    expect(qs('login-screen')).not.toBeNull();
  });
});

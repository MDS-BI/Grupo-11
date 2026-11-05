import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
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
  const { initApp, navigate } = await import('../../src/app.js');
  await initApp(undefined);
  navigate('entities');
});

afterEach(() => {
  dom.window.close();
});

function submitForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Historia de Usuario 1 - crear y organizar productos', () => {
  it('crea un producto nuevo que aparece en la lista', () => {
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitForm();
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Acme');
    expect(all[0].code).toBe('AC-001');
    expect(all[0].entity_id).toBeDefined();
    const items = qs('entity-list').querySelectorAll('.record-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Acme');
    expect(items[0].textContent).toContain('AC-001');
  });

  it('persiste los campos de identidad y contacto introducidos en el formulario', () => {
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('taxId').value = 'RFC800101AB1';
    qs('email').value = 'ventas@acme.mx';
    qs('phone').value = '555-1234';
    qs('address').value = 'Av. Reforma 100';
    qs('creditLimit').value = '50000';
    qs('paymentTerms').value = 'neto 30';
    submitForm();
    const saved = loadEntities()[0];
    expect(saved.taxId).toBe('RFC800101AB1');
    expect(saved.email).toBe('ventas@acme.mx');
    expect(saved.phone).toBe('555-1234');
    expect(saved.address).toBe('Av. Reforma 100');
    expect(saved.creditLimit).toBe(50000);
    expect(saved.paymentTerms).toBe('neto 30');
  });

  it('rechaza un correo mal formado con una explicación', () => {
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('email').value = 'no-es-correo';
    submitForm();
    expect(loadEntities().length).toBe(0);
    expect(qs('error-email').textContent).toContain('correo electrónico');
  });

  it('bloquea el guardado con campos obligatorios en blanco y explica qué falta', () => {
    qs('name').value = '';
    qs('code').value = '';
    submitForm();
    expect(loadEntities().length).toBe(0);
    expect(qs('error-name').textContent).toContain('obligatorio');
    expect(qs('error-code').textContent).toContain('obligatorio');
  });

  it('rechaza un código duplicado explicando que ya está en uso', () => {
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitForm();
    qs('name').value = 'Otra empresa';
    qs('code').value = 'ac-001';
    submitForm();
    expect(loadEntities().length).toBe(1);
    expect(qs('error-code').textContent).toContain('ya está en uso');
  });

  it('escapa el HTML del contenido del usuario al mostrarlo en la lista', () => {
    const payload = '<img src=x onerror="alert(1)">';
    qs('name').value = payload;
    qs('code').value = 'XSS-1';
    submitForm();
    const item = qs('entity-list').querySelector('.record-item');
    expect(item).not.toBeNull();
    expect(item.querySelector('img')).toBeNull();
    expect(item.querySelector('.record-title').textContent).toBe(payload);
    expect(item.textContent).toContain('onerror');
  });

  it('muestra el estado vacío mientras no hay productos', () => {
    expect(qs('entity-list').querySelectorAll('.record-item').length).toBe(0);
    expect(qs('entity-list-empty').hidden).toBe(false);
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitForm();
    expect(qs('entity-list-empty').hidden).toBe(true);
  });
});

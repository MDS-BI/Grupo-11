import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { loadEntities } from '../../src/storage.js';
import { seedSession } from '../helpers/auth.js';

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
  seedSession();
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

  it('persiste los campos de inventario introducidos en el formulario', () => {
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('category').value = 'Insumo';
    qs('unit').value = 'Caja';
    qs('stockMin').value = '10';
    qs('description').value = 'Material de oficina';
    submitForm();
    const saved = loadEntities()[0];
    expect(saved.category).toBe('Insumo');
    expect(saved.unit).toBe('Caja');
    expect(saved.stockMin).toBe(10);
    expect(saved.description).toBe('Material de oficina');
  });

  it('no muestra los campos genéricos de plantilla en el formulario', () => {
    for (const id of ['taxId', 'email', 'phone', 'address', 'targetDate', 'creditLimit', 'paymentTerms']) {
      expect(qs(id)).toBeNull();
    }
    expect(qs('unit')).toBeTruthy();
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

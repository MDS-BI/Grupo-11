import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let navigateTo;

function qs(id) {
  return document.getElementById(id);
}

function itemWithText(text) {
  return [...qs('entity-list').querySelectorAll('.record-item')].find((item) =>
    item.textContent.includes(text)
  );
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
  addEntity({ name: 'Acme', code: 'AC-001' });
  addEntity({ name: 'Globex', code: 'GL-002' });
  const { initApp, navigate } = await import('../../src/app.js');
  navigateTo = navigate;
  await initApp(undefined);
  navigate('entities');
});

afterEach(() => {
  dom.window.close();
});

function submitForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Historia de Usuario 2 - editar y eliminar productos', () => {
  it('edita un producto desde la lista y persiste el cambio', () => {
    const item = itemWithText('Acme');
    item.querySelector('[data-action="edit"]').click();
    expect(qs('entity-form-title').textContent).toBe('Editar Producto');
    expect(qs('entity-submit').textContent).toBe('Actualizar');
    expect(qs('name').value).toBe('Acme');
    expect(qs('code').value).toBe('AC-001');

    qs('name').value = 'Acme Renovado';
    submitForm();
    expect(loadEntities()[0].name).toBe('Acme Renovado');
    expect(qs('entity-form-title').textContent).toBe('Nuevo Producto');
    expect(qs('entity-submit').textContent).toBe('Guardar');
    expect(itemWithText('Acme Renovado')).toBeDefined();
  });

  it('guarda cambios de campos personalizados al editar', () => {
    const item = itemWithText('Acme');
    item.querySelector('[data-action="edit"]').click();
    qs('category').value = 'Insumo';
    qs('paymentTerms').value = 'contado';
    submitForm();
    const saved = loadEntities()[0];
    expect(saved.category).toBe('Insumo');
    expect(saved.paymentTerms).toBe('contado');
    expect(saved.code).toBe('AC-001');
  });

  it('cancela la edición sin guardar los cambios', () => {
    const item = itemWithText('Acme');
    item.querySelector('[data-action="edit"]').click();
    qs('name').value = 'No debe guardarse';
    qs('entity-cancel').click();
    expect(qs('entity-form-title').textContent).toBe('Nuevo Producto');
    expect(qs('name').value).toBe('');
    expect(loadEntities()[0].name).toBe('Acme');
  });

  it('elimina un producto desde la lista con confirmación', () => {
    const item = itemWithText('Acme');
    item.querySelector('[data-action="delete"]').click();
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(loadEntities().length).toBe(1);
    expect(loadEntities()[0].code).toBe('GL-002');
    expect(itemWithText('Acme')).toBeUndefined();
    expect(itemWithText('Globex')).toBeDefined();
  });

  it('no elimina el producto cuando se cancela la confirmación', () => {
    globalThis.confirm.mockReturnValue(false);
    const item = itemWithText('Acme');
    item.querySelector('[data-action="delete"]').click();
    expect(loadEntities().length).toBe(2);
    expect(itemWithText('Acme')).toBeDefined();
  });

  it('sigue siendo correcto con muchos productos en la lista', () => {
    for (let i = 0; i < 300; i++) {
      addEntity({ name: `Bulk ${i}`, code: `B-${String(i).padStart(4, '0')}` });
    }
    navigateTo('entities');
    const items = qs('entity-list').querySelectorAll('.record-item');
    expect(items.length).toBe(302);

    const target = [...items].find((item) => item.textContent.includes('Bulk 150'));
    target.querySelector('[data-action="edit"]').click();
    expect(qs('name').value).toBe('Bulk 150');
    qs('name').value = 'Bulk 150 Renombrado';
    submitForm();
    expect(loadEntities().find((e) => e.code === 'B-0150').name).toBe('Bulk 150 Renombrado');
  });
});

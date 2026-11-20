import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  addWarehouse,
  addMovement,
  loadEntities,
  searchEntities,
} from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let warehouse;

function qs(id) {
  return document.getElementById(id);
}

function productRow(code) {
  return [...qs('entity-list').querySelectorAll('.record-item')].find((item) =>
    item.textContent.includes(code)
  );
}

function submitEntityForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
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
  warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
});

afterEach(() => {
  dom.window.close();
});

function seedProduct(stockMin, incoming) {
  const entity = addEntity({ name: 'Papel', code: 'P-1', stockMin });
  if (incoming > 0) {
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: incoming,
      movementDate: '2026-08-01',
    });
  }
  return entity;
}

describe('Historia de Usuario 9 - stock mínimo por producto', () => {
  it('guarda el stock mínimo desde el formulario de producto', async () => {
    app.navigate('entities');
    expect(qs('stockMin')).toBeTruthy();
    qs('name').value = 'Papel';
    qs('code').value = 'P-1';
    qs('stockMin').value = '10';
    submitEntityForm();

    expect(loadEntities()[0].stockMin).toBe(10);

    productRow('P-1').querySelector('[data-action="edit"]').click();
    expect(qs('stockMin').value).toBe('10');
  });

  it('rechaza un stock mínimo negativo o no entero', async () => {
    app.navigate('entities');
    qs('name').value = 'Papel';
    qs('code').value = 'P-1';
    qs('stockMin').value = '-5';
    submitEntityForm();
    expect(qs('error-stockMin').textContent).toContain('entero no negativo');
    expect(loadEntities()).toHaveLength(0);

    qs('stockMin').value = '2.5';
    submitEntityForm();
    expect(qs('error-stockMin').textContent).toContain('entero no negativo');
    expect(loadEntities()).toHaveLength(0);
  });

  it('marca stock bajo cuando el saldo real está por debajo del mínimo', async () => {
    const entity = seedProduct(10, 5);
    app.navigate('entities');

    const row = productRow('P-1');
    expect(row.textContent).toContain('Stock: 5');
    expect(row.querySelector('.badge.low').textContent).toBe('Stock bajo');
    expect(qs('entity-list').textContent).toContain(entity.name);
  });

  it('no marca cuando el saldo es igual al mínimo', async () => {
    seedProduct(5, 5);
    app.navigate('entities');

    const row = productRow('P-1');
    expect(row.textContent).toContain('Stock: 5');
    expect(row.querySelector('.badge.low')).toBeNull();
  });

  it('hace desaparecer la marca al subir el saldo con una entrada', async () => {
    const entity = seedProduct(10, 5);
    app.navigate('entities');
    expect(productRow('P-1').querySelector('.badge.low')).toBeTruthy();

    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 10,
      movementDate: '2026-08-02',
    });

    app.navigate('dashboard');
    app.navigate('entities');
    const row = productRow('P-1');
    expect(row.textContent).toContain('Stock: 15');
    expect(row.querySelector('.badge.low')).toBeNull();
  });

  it('filtra los productos con stock bajo en la búsqueda de entidades', async () => {
    seedProduct(10, 5);
    addEntity({ name: 'Tinta', code: 'T-1' });

    const low = searchEntities('', { stockStatus: 'low' });
    expect(low).toHaveLength(1);
    expect(low[0].code).toBe('P-1');

    const ok = searchEntities('', { stockStatus: 'ok' });
    expect(ok).toHaveLength(1);
    expect(ok[0].code).toBe('T-1');
  });
});

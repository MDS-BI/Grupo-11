import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addWarehouse, addMovement } from '../../src/storage.js';
import { seedSession } from '../helpers/auth.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let product;
let warehouse;

function qs(id) {
  return document.getElementById(id);
}

function seedMovement(overrides) {
  return addMovement({
    entity_id: product.entity_id,
    warehouse_id: warehouse.id,
    movementDate: '2026-08-01',
    ...overrides,
  });
}

function openWarehouseDetail() {
  app.navigate('warehouses');
  const row = [...document.querySelectorAll('#warehouse-list .record-item')].find((item) =>
    item.textContent.includes('Central')
  );
  row.querySelector('[data-action="detail"]').click();
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
  app = await import('../../src/app.js');
  await app.initApp(normalizeConfig(undefined));
  product = addEntity({ name: 'Papel', code: 'P-1', unit: 'Rollo', stockMin: 5 });
  warehouse = addWarehouse({ code: 'B-01', name: 'Central', address: 'Av. Principal 100' });
});

afterEach(() => {
  dom.window.close();
});

describe('Detalle de bodega (FR-063)', () => {
  it('abre el detalle desde la lista y muestra los datos de la bodega', () => {
    openWarehouseDetail();
    expect(qs('view-warehouse').hidden).toBe(false);
    expect(qs('view-warehouses').hidden).toBe(true);
    const view = qs('view-warehouse');
    expect(view.querySelector('h1').textContent).toBe('Central');
    expect(view.textContent).toContain('B-01');
    expect(view.textContent).toContain('Av. Principal 100');
    expect(view.textContent).toContain('Activa');
  });

  it('lista los productos con saldo calculado desde sus movimientos', () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    addEntity({ name: 'Tinta', code: 'T-2' });
    openWarehouseDetail();
    const list = qs('warehouse-detail-stock');
    expect(list).toBeTruthy();
    const items = list.querySelectorAll('.record-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Papel');
    expect(items[0].textContent).toContain('P-1');
    expect(items[0].textContent).toContain('Rollo');
    expect(items[0].textContent).toContain('10');
    expect(qs('warehouse-detail-empty').hidden).toBe(true);
  });

  it('marca stock bajo cuando el saldo de la bodega es menor que el stock mínimo', () => {
    seedMovement({ type: 'entrada', quantity: 3 });
    openWarehouseDetail();
    const badge = qs('warehouse-detail-stock').querySelector('.record-item .badge.danger');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Stock bajo');
  });

  it('no marca stock bajo cuando el saldo de la bodega alcanza el stock mínimo', () => {
    seedMovement({ type: 'entrada', quantity: 5 });
    openWarehouseDetail();
    expect(qs('warehouse-detail-stock').querySelector('.badge.danger')).toBeNull();
  });

  it('muestra el estado vacío cuando ningún producto tiene saldo en la bodega', () => {
    openWarehouseDetail();
    expect(qs('warehouse-detail-stock').querySelectorAll('.record-item').length).toBe(0);
    expect(qs('warehouse-detail-empty').hidden).toBe(false);
    expect(qs('warehouse-detail-empty').textContent).toContain('No hay productos con stock');
  });

  it('enlaza al detalle del producto en modo solo lectura', () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    openWarehouseDetail();
    const list = qs('warehouse-detail-stock');
    expect(list.querySelector('input, textarea, select')).toBeNull();
    list.querySelector('[data-action="open-product"]').click();
    expect(qs('view-product').hidden).toBe(false);
    expect(qs('view-warehouse').hidden).toBe(true);
    expect(qs('view-product').querySelector('h1').textContent).toBe('Papel');
  });

  it('vuelve a la lista de bodegas con el botón de retorno', () => {
    openWarehouseDetail();
    qs('warehouse-detail-back').click();
    expect(qs('view-warehouses').hidden).toBe(false);
    expect(qs('view-warehouse').hidden).toBe(true);
  });
});

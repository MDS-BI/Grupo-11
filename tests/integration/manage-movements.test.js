import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addWarehouse, loadMovements, calculateStock, deleteEntity } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let product;
let warehouse;

function qs(id) {
  return document.getElementById(id);
}

function submitMovementForm() {
  qs('movement-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function fillMovement({ type, quantity, date = '2026-08-01', direction = '' }) {
  qs('movement-product').value = product.entity_id;
  qs('movement-type').value = type;
  if (type === 'ajuste') qs('movement-direction').value = direction;
  qs('movement-warehouse').value = warehouse.id;
  qs('movement-quantity').value = String(quantity);
  qs('movement-date').value = date;
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
});

afterEach(() => {
  dom.window.close();
});

async function boot() {
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(undefined));
  product = addEntity({ name: 'Papel', code: 'P-1' });
  warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
  qs('nav-movements').click();
}

describe('Historia de Usuario 4 - registrar movimientos de inventario', () => {
  it('abre la pantalla de movimientos con formulario, lista vacía y nota de inmutabilidad', async () => {
    await boot();
    expect(qs('view-movements').hidden).toBe(false);
    expect(qs('nav-movements').getAttribute('aria-current')).toBe('page');
    expect(qs('view-movements').querySelector('h1').textContent).toBe('Movimientos');
    expect(qs('movement-form')).toBeTruthy();
    expect(qs('movement-product')).toBeTruthy();
    expect(qs('movement-warehouse')).toBeTruthy();
    expect(qs('movement-quantity')).toBeTruthy();
    expect(qs('movement-list-empty').hidden).toBe(false);
    expect(qs('movements-immutable-note').textContent).toContain('ajuste');
  });

  it('registra una entrada y refleja el saldo por bodega', async () => {
    await boot();
    fillMovement({ type: 'entrada', quantity: 10 });
    submitMovementForm();

    expect(qs('movement-form-feedback').textContent).toBe('Movimiento registrado correctamente.');
    expect(loadMovements()).toHaveLength(1);
    expect(calculateStock(product.entity_id, warehouse.id)).toBe(10);

    const row = qs('movement-list').querySelector('.record-item');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('Entrada');
    expect(row.textContent).toContain('Papel');
    expect(row.textContent).toContain('Central');
    expect(qs('stock-summary').textContent).toContain('Central: 10');
  });

  it('registra una salida que reduce el saldo', async () => {
    await boot();
    fillMovement({ type: 'entrada', quantity: 10 });
    submitMovementForm();
    fillMovement({ type: 'salida', quantity: 4, date: '2026-08-02' });
    submitMovementForm();

    expect(loadMovements()).toHaveLength(2);
    expect(calculateStock(product.entity_id)).toBe(6);
    expect(qs('stock-summary').textContent).toContain('Central: 6');
    expect(qs('movement-list').querySelectorAll('.record-item')).toHaveLength(2);
  });

  it('rechaza una salida que dejaría saldo negativo y muestra el saldo disponible', async () => {
    await boot();
    fillMovement({ type: 'entrada', quantity: 10 });
    submitMovementForm();
    fillMovement({ type: 'salida', quantity: 999, date: '2026-08-02' });
    submitMovementForm();

    expect(qs('movement-form-feedback').textContent).toContain('Saldo insuficiente');
    expect(qs('movement-form-feedback').textContent).toContain('10 unidades disponibles');
    expect(qs('error-movement-quantity').textContent).toContain('Saldo insuficiente');
    expect(loadMovements()).toHaveLength(1);
    expect(calculateStock(product.entity_id)).toBe(10);
    expect(qs('movement-list').querySelectorAll('.record-item')).toHaveLength(1);
  });

  it('explica que los movimientos no se pueden editar ni eliminar', async () => {
    await boot();
    fillMovement({ type: 'entrada', quantity: 5 });
    submitMovementForm();

    const row = qs('movement-list').querySelector('.record-item');
    expect(row.querySelector('[data-action="edit"]')).toBeNull();
    expect(row.querySelector('[data-action="delete"]')).toBeNull();
    expect(qs('movements-immutable-note').textContent).toContain('no se pueden editar ni eliminar');
  });

  it('impide guardar sin producto, bodega, cantidad ni fecha y explica qué falta', async () => {
    await boot();
    qs('movement-date').value = '';
    submitMovementForm();

    expect(qs('error-movement-product').textContent).toContain('obligator');
    expect(qs('error-movement-warehouse').textContent).toContain('obligator');
    expect(qs('error-movement-quantity').textContent).toContain('entero positivo');
    expect(qs('error-movement-date').textContent).toContain('AAAA-MM-DD');
    expect(loadMovements()).toHaveLength(0);
  });

  it('rechaza movimientos en bodegas desactivadas', async () => {
    await boot();
    const { updateWarehouse, addMovement } = await import('../../src/storage.js');
    updateWarehouse(warehouse.id, { active: false });

    qs('nav-movements').click();
    expect(qs('movement-warehouse').querySelector(`option[value="${warehouse.id}"]`)).toBeNull();

    qs('movement-product').value = product.entity_id;
    qs('movement-type').value = 'entrada';
    qs('movement-warehouse').value = warehouse.id;
    qs('movement-quantity').value = '5';
    qs('movement-date').value = '2026-08-01';
    submitMovementForm();

    expect(qs('error-movement-warehouse').textContent).toContain('obligator');
    expect(loadMovements()).toHaveLength(0);

    expect(() =>
      addMovement({
        entity_id: product.entity_id,
        warehouse_id: warehouse.id,
        type: 'entrada',
        quantity: 5,
        movementDate: '2026-08-01',
      })
    ).toThrow(/desactivada/);
    expect(loadMovements()).toHaveLength(0);
  });

  it('impide eliminar productos que ya tienen movimientos de inventario', async () => {
    await boot();
    fillMovement({ type: 'entrada', quantity: 5 });
    submitMovementForm();

    expect(() => deleteEntity(product.entity_id)).toThrow(/movimientos de inventario/);
  });
});

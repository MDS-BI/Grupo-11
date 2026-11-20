import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addMovement, loadMovements, loadWarehouses } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
}

function warehouseRow(name) {
  return [...document.querySelectorAll('#warehouse-list .record-item')].find((item) =>
    item.textContent.includes(name)
  );
}

function submitWarehouseForm() {
  qs('warehouse-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
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
  qs('nav-warehouses').click();
}

describe('Historia de Usuario 5 - gestionar bodegas del inventario', () => {
  it('abre la pantalla de bodegas desde la barra lateral con lista y formulario', async () => {
    await boot();
    expect(qs('view-warehouses').hidden).toBe(false);
    expect(qs('nav-warehouses').getAttribute('aria-current')).toBe('page');
    expect(qs('view-warehouses').querySelector('h1').textContent).toBe('Bodegas');
    expect(qs('warehouse-form')).toBeTruthy();
    expect(qs('warehouse-code')).toBeTruthy();
    expect(qs('warehouse-name')).toBeTruthy();
    expect(qs('warehouse-list-empty').hidden).toBe(false);
    expect(qs('warehouse-list-empty').textContent).toBe('No hay Bodegas todavía.');
  });

  it('crea una bodega con código y nombre y la muestra con estado Activa', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    qs('warehouse-address').value = 'Av. Principal 100';
    submitWarehouseForm();

    expect(qs('warehouse-form-feedback').textContent).toBe('Bodega guardada correctamente.');
    expect(loadWarehouses()).toHaveLength(1);

    const row = warehouseRow('Central');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('B-01');
    expect(row.querySelector('.badge').textContent).toBe('Activa');
    expect(qs('warehouse-list-empty').hidden).toBe(true);
  });

  it('impide guardar sin código ni nombre y explica qué falta', async () => {
    await boot();
    qs('warehouse-code').value = '';
    qs('warehouse-name').value = '';
    submitWarehouseForm();

    expect(qs('error-warehouse-code').hidden).toBe(false);
    expect(qs('error-warehouse-code').textContent).toContain('obligatorio');
    expect(qs('error-warehouse-name').hidden).toBe(false);
    expect(qs('error-warehouse-name').textContent).toContain('obligatorio');
    expect(loadWarehouses()).toHaveLength(0);
  });

  it('rechaza un código duplicado incluso si la bodega original está desactivada', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();

    warehouseRow('Central').querySelector('[data-action="toggle"]').click();
    qs('warehouse-code').value = 'b-01';
    qs('warehouse-name').value = 'Otra';
    submitWarehouseForm();

    expect(qs('error-warehouse-code').hidden).toBe(false);
    expect(qs('error-warehouse-code').textContent).toContain('ya está en uso');
    expect(loadWarehouses()).toHaveLength(1);
  });

  it('edita el nombre de una bodega sin alterar sus movimientos históricos', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();

    const { addEntity } = await import('../../src/storage.js');
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const warehouse = loadWarehouses()[0];
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });

    warehouseRow('Central').querySelector('[data-action="edit"]').click();
    expect(qs('warehouse-form-title').textContent).toBe('Actualizar bodega');
    expect(qs('warehouse-code').value).toBe('B-01');
    expect(qs('warehouse-name').value).toBe('Central');

    qs('warehouse-name').value = 'Central 2';
    submitWarehouseForm();

    expect(qs('warehouse-form-feedback').textContent).toBe('Bodega actualizada correctamente.');
    expect(warehouseRow('Central 2')).toBeTruthy();
    expect(loadMovements()).toHaveLength(1);
  });

  it('desactiva una bodega, conserva su histórico y bloquea movimientos nuevos', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();

    const { addEntity } = await import('../../src/storage.js');
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const warehouse = loadWarehouses()[0];
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });

    const row = warehouseRow('Central');
    row.querySelector('[data-action="toggle"]').click();

    expect(warehouseRow('Central').querySelector('.badge').textContent).toBe('Desactivada');
    expect(warehouseRow('Central').querySelector('[data-action="toggle"]').textContent).toBe('Reactivar');
    expect(loadMovements()).toHaveLength(1);

    expect(() =>
      addMovement({
        entity_id: entity.entity_id,
        warehouse_id: warehouse.id,
        type: 'entrada',
        quantity: 2,
        movementDate: '2026-08-02',
      })
    ).toThrow(/desactivada/);
  });

  it('rechaza eliminar una bodega con movimientos y sugiere desactivarla', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();

    const { addEntity } = await import('../../src/storage.js');
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const warehouse = loadWarehouses()[0];
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });

    warehouseRow('Central').querySelector('[data-action="delete"]').click();

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(qs('warehouse-list-feedback').hidden).toBe(false);
    expect(qs('warehouse-list-feedback').textContent).toContain('Desactívala');
    expect(loadWarehouses()).toHaveLength(1);
    expect(loadMovements()).toHaveLength(1);
  });

  it('elimina una bodega que no tiene movimientos', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();
    qs('warehouse-code').value = 'B-02';
    qs('warehouse-name').value = 'Sucursal';
    submitWarehouseForm();
    expect(loadWarehouses()).toHaveLength(2);

    warehouseRow('Sucursal').querySelector('[data-action="delete"]').click();

    expect(qs('warehouse-list-feedback').textContent).toBe('Bodega eliminada correctamente.');
    expect(loadWarehouses()).toHaveLength(1);
    expect(warehouseRow('Central')).toBeTruthy();
    expect(warehouseRow('Sucursal')).toBeUndefined();
  });

  it('reactiva una bodega para volver a recibir movimientos', async () => {
    await boot();
    qs('warehouse-code').value = 'B-01';
    qs('warehouse-name').value = 'Central';
    submitWarehouseForm();

    const row = warehouseRow('Central');
    row.querySelector('[data-action="toggle"]').click();
    warehouseRow('Central').querySelector('[data-action="toggle"]').click();

    expect(warehouseRow('Central').querySelector('.badge').textContent).toBe('Activa');
    expect(warehouseRow('Central').querySelector('[data-action="toggle"]').textContent).toBe('Desactivar');

    const { addEntity } = await import('../../src/storage.js');
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const movement = addMovement({
      entity_id: entity.entity_id,
      warehouse_id: loadWarehouses()[0].id,
      type: 'entrada',
      quantity: 3,
      movementDate: '2026-08-01',
    });
    expect(movement.id).toBeDefined();
    expect(loadMovements()).toHaveLength(1);
  });
});

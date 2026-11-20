import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addWarehouse, addMovement, calculateStock } from '../../src/storage.js';

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
  product = addEntity({ name: 'Papel', code: 'P-1', stockMin: 5 });
  warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 7 - kárdex del producto', () => {
  it('abre el detalle del producto con su saldo y enlaza al kárdex', async () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    seedMovement({ type: 'salida', quantity: 4, movementDate: '2026-08-02' });

    app.navigate('product', { entity_id: product.entity_id });
    expect(qs('view-product').hidden).toBe(false);
    expect(qs('view-product').querySelector('h1').textContent).toBe('Papel');
    expect(qs('product-stock').textContent).toBe('6');

    qs('btn-open-kardex').click();
    expect(qs('view-kardex').hidden).toBe(false);
    expect(qs('view-product').hidden).toBe(true);
    expect(qs('kardex-title').textContent).toContain('Papel');
  });

  it('muestra el historial ordenado con saldo acumulado y el último saldo coincide con el stock', async () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    seedMovement({ type: 'salida', quantity: 4, movementDate: '2026-08-02' });
    seedMovement({ type: 'entrada', quantity: 5, movementDate: '2026-08-03' });

    app.navigate('kardex', { entity_id: product.entity_id });
    const rows = qs('kardex-list').querySelectorAll('.record-item');
    expect(rows).toHaveLength(3);

    expect(rows[0].textContent).toContain('2026-08-01');
    expect(rows[0].textContent).toContain('Saldo: 10');
    expect(rows[1].textContent).toContain('2026-08-02');
    expect(rows[1].textContent).toContain('Saldo: 6');
    expect(rows[2].textContent).toContain('2026-08-03');
    expect(rows[2].textContent).toContain('Saldo: 11');

    const lastBalance = rows[2].querySelector('.kardex-balance').textContent;
    expect(lastBalance).toBe('Saldo: 11');
    expect(calculateStock(product.entity_id)).toBe(11);
  });

  it('filtra por tipo de movimiento y rango de fechas sin alterar los saldos', async () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    seedMovement({ type: 'salida', quantity: 4, movementDate: '2026-08-02' });
    seedMovement({ type: 'entrada', quantity: 5, movementDate: '2026-08-03' });

    app.navigate('kardex', { entity_id: product.entity_id });

    qs('kardex-type').value = 'salida';
    qs('kardex-type').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    let rows = qs('kardex-list').querySelectorAll('.record-item');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Salida');
    expect(rows[0].textContent).toContain('Saldo: 6');

    qs('kardex-type').value = '';
    qs('kardex-type').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    qs('kardex-date-from').value = '2026-08-03';
    qs('kardex-date-from').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    rows = qs('kardex-list').querySelectorAll('.record-item');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('2026-08-03');
    expect(rows[0].textContent).toContain('Saldo: 11');
  });

  it('marca los movimientos anulados sin incluirlos en el saldo acumulado', async () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    seedMovement({ type: 'salida', quantity: 3, movementDate: '2026-08-02', status: 'Cancelado' });

    app.navigate('kardex', { entity_id: product.entity_id });
    const rows = qs('kardex-list').querySelectorAll('.record-item');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Saldo: 10');
    expect(rows[1].querySelector('.badge').textContent).toBe('Anulado');
    expect(rows[1].textContent).toContain('Saldo: 10');
    expect(calculateStock(product.entity_id)).toBe(10);
  });

  it('muestra estado vacío cuando el producto no tiene movimientos', async () => {
    app.navigate('kardex', { entity_id: product.entity_id });
    expect(qs('kardex-list').querySelectorAll('.record-item')).toHaveLength(0);
    expect(qs('kardex-empty').hidden).toBe(false);
    expect(qs('kardex-empty').textContent).toContain('Papel');
  });

  it('es de solo lectura: no ofrece editar ni eliminar', async () => {
    seedMovement({ type: 'entrada', quantity: 10 });
    app.navigate('kardex', { entity_id: product.entity_id });
    const row = qs('kardex-list').querySelector('.record-item');
    expect(row.querySelector('[data-action="edit"]')).toBeNull();
    expect(row.querySelector('[data-action="delete"]')).toBeNull();
  });
});

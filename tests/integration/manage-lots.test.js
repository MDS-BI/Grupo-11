import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  addWarehouse,
  addLot,
  addMovement,
  lotBalance,
  loadLots,
} from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let product;
let warehouse;

function qs(id) {
  return document.getElementById(id);
}

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function submitLotForm() {
  qs('lot-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function lotRow(number) {
  return [...qs('lot-list').querySelectorAll('.record-item')].find((item) =>
    item.textContent.includes(number)
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
  app = await import('../../src/app.js');
  await app.initApp(normalizeConfig(undefined));
  product = addEntity({ name: 'Papel', code: 'P-1' });
  warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 6 - lotes y vencimientos', () => {
  it('abre la pantalla de lotes desde el detalle del producto', async () => {
    app.navigate('product', { entity_id: product.entity_id });
    expect(qs('btn-open-lots')).toBeTruthy();
    qs('btn-open-lots').click();

    expect(qs('view-lots').hidden).toBe(false);
    expect(qs('view-lots').querySelector('h1').textContent).toContain('Papel');
    expect(qs('lot-form')).toBeTruthy();
    expect(qs('lot-list-empty').hidden).toBe(false);
  });

  it('registra un lote con número y fechas y muestra su saldo en cero', async () => {
    app.navigate('lots', { entity_id: product.entity_id });
    qs('lot-number').value = 'L-001';
    qs('lot-manufacture-date').value = dateOffset(-30);
    qs('lot-expiry-date').value = dateOffset(180);
    submitLotForm();

    expect(qs('lot-form-feedback').textContent).toBe('Lote guardado correctamente.');
    expect(loadLots()).toHaveLength(1);

    const row = lotRow('L-001');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('Saldo: 0');
    expect(row.querySelector('.badge')).toBeNull();
  });

  it('rechaza un lote con vencimiento anterior a la fecha de fabricación', async () => {
    app.navigate('lots', { entity_id: product.entity_id });
    qs('lot-number').value = 'L-001';
    qs('lot-manufacture-date').value = '2026-05-01';
    qs('lot-expiry-date').value = '2026-04-01';
    submitLotForm();

    expect(qs('error-lot-expiry-date').textContent).toContain('no puede ser anterior');
    expect(loadLots()).toHaveLength(0);
  });

  it('rechaza números de lote duplicados para el mismo producto', async () => {
    app.navigate('lots', { entity_id: product.entity_id });
    qs('lot-number').value = 'L-001';
    submitLotForm();
    expect(loadLots()).toHaveLength(1);

    qs('lot-number').value = 'L-001';
    submitLotForm();
    expect(qs('error-lot-number').textContent).toContain('ya existe');
    expect(loadLots()).toHaveLength(1);
  });

  it('aumenta el saldo del lote al usarlo en una entrada y lo marca al vencer', async () => {
    const lot = addLot({ entity_id: product.entity_id, lotNumber: 'L-001', expiryDate: dateOffset(180) });
    app.navigate('lots', { entity_id: product.entity_id });
    expect(lotRow('L-001').textContent).toContain('Saldo: 0');

    addMovement({
      entity_id: product.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 8,
      movementDate: dateOffset(-1),
      lot_id: lot.id,
    });

    app.navigate('lots', { entity_id: product.entity_id });
    expect(lotRow('L-001').textContent).toContain('Saldo: 8');
    expect(lotBalance(lot.id)).toBe(8);
  });

  it('marca visualmente los lotes vencidos y próximos a vencer', async () => {
    addLot({ entity_id: product.entity_id, lotNumber: 'L-VENCIDO', expiryDate: dateOffset(-5) });
    addLot({ entity_id: product.entity_id, lotNumber: 'L-PROXIMO', expiryDate: dateOffset(15) });
    addLot({ entity_id: product.entity_id, lotNumber: 'L-VIGENTE', expiryDate: dateOffset(300) });

    app.navigate('lots', { entity_id: product.entity_id });
    expect(lotRow('L-VENCIDO').querySelector('.badge').textContent).toBe('Vencido');
    expect(lotRow('L-PROXIMO').querySelector('.badge').textContent).toBe('Próximo a vencer');
    expect(lotRow('L-VIGENTE').querySelector('.badge')).toBeNull();
  });

  it('sugiere el lote FEFO en las salidas y excluye los vencidos del formulario', async () => {
    const early = addLot({ entity_id: product.entity_id, lotNumber: 'L-TEMPRANO', expiryDate: dateOffset(60) });
    const late = addLot({ entity_id: product.entity_id, lotNumber: 'L-TARDIO', expiryDate: dateOffset(300) });
    const expired = addLot({ entity_id: product.entity_id, lotNumber: 'L-VENCIDO', expiryDate: dateOffset(-5) });
    addMovement({
      entity_id: product.entity_id,
      warehouse_id: warehouse.id,
      type: 'entrada',
      quantity: 6,
      movementDate: dateOffset(-1),
      lot_id: early.id,
    });

    app.navigate('movements');
    qs('movement-product').value = product.entity_id;
    qs('movement-product').dispatchEvent(new dom.window.Event('change', { bubbles: true }));

    const options = [...qs('movement-lot').options].map((o) => o.value).filter(Boolean);
    expect(options[0]).toBe(early.id);
    expect(options).toContain(late.id);
    expect(options).not.toContain(expired.id);

    expect(() =>
      addMovement({
        entity_id: product.entity_id,
        warehouse_id: warehouse.id,
        type: 'salida',
        quantity: 1,
        movementDate: dateOffset(0),
        lot_id: expired.id,
      })
    ).toThrow(/vencido/);
  });

  it('rechaza usar en un movimiento un lote que pertenece a otro producto', async () => {
    const other = addEntity({ name: 'Tinta', code: 'T-1' });
    const foreignLot = addLot({ entity_id: other.entity_id, lotNumber: 'L-OTRO' });

    expect(() =>
      addMovement({
        entity_id: product.entity_id,
        warehouse_id: warehouse.id,
        type: 'entrada',
        quantity: 1,
        movementDate: dateOffset(0),
        lot_id: foreignLot.id,
      })
    ).toThrow(/pertenece a otro producto/);
  });
});

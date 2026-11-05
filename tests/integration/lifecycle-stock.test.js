import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  addWarehouse,
  addMovement,
  createTransfer,
  calculateStock,
  getInTransit,
  loadTransfers,
} from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let entity;
let origin;
let destination;

function qs(id) {
  return document.getElementById(id);
}

function transferRow() {
  return [...qs('movement-list').querySelectorAll('.record-item')].find((row) =>
    row.textContent.includes('Traslado')
  );
}

function transitionButton(row, status) {
  return row.querySelector(`[data-action="transition"][data-status="${status}"]`);
}

function selectProductInForm() {
  const productSelect = qs('movement-product');
  productSelect.value = entity.entity_id;
  productSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
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
  entity = addEntity({ name: 'Papel', code: 'P-1' });
  origin = addWarehouse({ code: 'ORI', name: 'Origen' });
  destination = addWarehouse({ code: 'DES', name: 'Destino' });
  addMovement({
    entity_id: entity.entity_id,
    warehouse_id: origin.id,
    type: 'entrada',
    quantity: 50,
    movementDate: '2026-08-01',
  });
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 12 - regla de stock al despachar y recibir', () => {
  it('baja el stock en el origen al despachar y sube en el destino al recibir', () => {
    const transfer = createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-05',
      lines: [{ entity_id: entity.entity_id, quantity: 20 }],
    });
    expect(calculateStock(entity.entity_id, origin.id)).toBe(50);

    app.navigate('movements');
    let row = transferRow();
    expect(row.textContent).toContain('Solicitado');

    transitionButton(row, 'Despachado').click();
    expect(calculateStock(entity.entity_id, origin.id)).toBe(30);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(0);
    expect(getInTransit(entity.entity_id)).toBe(20);
    expect(qs('movement-list-feedback').hidden).toBe(false);
    expect(qs('movement-list-feedback').className).toContain('success');

    selectProductInForm();
    expect(qs('stock-summary').textContent).toContain('Origen: 30');
    expect(qs('stock-summary').textContent).toContain('Destino: 0');

    row = transferRow();
    expect(row.textContent).toContain('Despachado');
    transitionButton(row, 'Recibido').click();

    expect(calculateStock(entity.entity_id, origin.id)).toBe(30);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(20);
    expect(getInTransit(entity.entity_id)).toBe(0);

    row = transferRow();
    expect(row.textContent).toContain('Recibido');
    expect(transitionButton(row, 'Cancelado')).toBeNull();
    expect(loadTransfers().find((t) => t.id === transfer.id).status).toBe('Recibido');
  });

  it('rechaza un despacho sin saldo suficiente indicando el disponible', () => {
    createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-05',
      lines: [{ entity_id: entity.entity_id, quantity: 10 }],
    });
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: origin.id,
      type: 'salida',
      quantity: 44,
      movementDate: '2026-08-04',
    });
    expect(calculateStock(entity.entity_id, origin.id)).toBe(6);

    app.navigate('movements');
    const row = transferRow();
    transitionButton(row, 'Despachado').click();

    const feedback = qs('movement-list-feedback');
    expect(feedback.hidden).toBe(false);
    expect(feedback.className).toContain('error');
    expect(feedback.textContent).toContain('Saldo insuficiente');
    expect(feedback.textContent).toContain('hay 6 y se requieren 10');
    expect(transferRow().textContent).toContain('Solicitado');
    expect(calculateStock(entity.entity_id, origin.id)).toBe(6);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(0);
  });

  it('no cambia el stock al cancelar antes de despachar y cierra el ciclo', () => {
    createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-05',
      lines: [{ entity_id: entity.entity_id, quantity: 20 }],
    });

    app.navigate('movements');
    const row = transferRow();
    expect(transitionButton(row, 'Cancelado')).toBeTruthy();
    transitionButton(row, 'Cancelado').click();

    expect(calculateStock(entity.entity_id, origin.id)).toBe(50);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(0);
    const cancelled = transferRow();
    expect(cancelled.textContent).toContain('Cancelado');
    expect(transitionButton(cancelled, 'Despachado')).toBeNull();
    expect(cancelled.querySelector('[data-action="transition"]')).toBeNull();
  });
});

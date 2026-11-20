import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  addWarehouse,
  addMovement,
  loadTransfers,
  loadMovements,
  calculateStock,
  getInTransit,
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

function openTransfers() {
  app.navigate('movements');
  qs('btn-open-transfers').click();
}

function submitTransfer() {
  qs('transfer-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function addLine(quantity, productId = null) {
  qs('transfer-line-product').value = productId ?? entity.entity_id;
  qs('transfer-line-quantity').value = String(quantity);
  qs('transfer-line-add').click();
}

function fillTransferBase() {
  qs('transfer-origin').value = origin.id;
  qs('transfer-destination').value = destination.id;
  qs('transfer-date').value = '2026-08-05';
}

function transferRow() {
  return qs('transfer-list').querySelector('.record-item');
}

function transitionButton(row, status) {
  return row.querySelector(`[data-action="transition"][data-status="${status}"]`);
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

describe('Historia de Usuario 8 - traslados entre bodegas', () => {
  it('crea un traslado desde la pantalla y guarda dos tramos vinculados', () => {
    openTransfers();
    expect(qs('view-transfers').hidden).toBe(false);

    fillTransferBase();
    addLine(20);
    expect(qs('transfer-lines').textContent).toContain('Papel');
    submitTransfer();

    const transfers = loadTransfers();
    expect(transfers).toHaveLength(1);
    expect(transfers[0].status).toBe('Solicitado');
    expect(transfers[0].reference).toBe('TR-0001');
    expect(qs('transfer-form-feedback').textContent).toContain('correctamente');

    const legs = loadMovements().filter((m) => m.type === 'traslado');
    expect(legs).toHaveLength(2);
    expect(legs.every((m) => m.transferId === transfers[0].id)).toBe(true);
    expect(legs.map((m) => m.warehouse_id).sort()).toEqual([origin.id, destination.id].sort());
    expect(legs.map((m) => m.direction).sort()).toEqual(['in', 'out']);
    expect(legs.every((m) => m.status === 'Solicitado')).toBe(true);

    const row = transferRow();
    expect(row.textContent).toContain('TR-0001');
    expect(row.textContent).toContain('Solicitado');
    expect(qs('transfer-lines').textContent).not.toContain('Papel');
  });

  it('valida bodegas distintas, campos obligatorios y saldo en origen', () => {
    openTransfers();
    submitTransfer();
    expect(qs('error-transfer-origin').textContent).toContain('obligatoria');
    expect(qs('error-transfer-destination').textContent).toContain('obligatoria');
    expect(qs('error-transfer-lines').textContent).toContain('al menos una línea');
    expect(loadTransfers()).toHaveLength(0);

    fillTransferBase();
    qs('transfer-destination').value = origin.id;
    addLine(1);
    submitTransfer();
    expect(qs('error-transfer-destination').textContent).toContain('distintas');
    expect(loadTransfers()).toHaveLength(0);

    qs('transfer-destination').value = destination.id;
    qs('transfer-lines').querySelector('[data-action="remove-line"]').click();
    addLine(999);
    submitTransfer();
    expect(qs('error-transfer-lines').textContent).toContain('Saldo insuficiente');
    expect(qs('error-transfer-lines').textContent).toContain('hay 50 y se requieren 999');
    expect(loadTransfers()).toHaveLength(0);
  });

  it('rechaza cantidades no positivas, productos duplicados y bodegas desactivadas', () => {
    const desactivada = addWarehouse({ code: 'OFF', name: 'Cerrada', active: false });
    openTransfers();
    fillTransferBase();

    addLine(0);
    expect(qs('error-transfer-lines').textContent).toContain('entero positivo');
    expect(qs('transfer-lines').textContent).not.toContain('Papel');

    addLine(5);
    addLine(5);
    expect(qs('error-transfer-lines').textContent).toContain('duplicado');
    expect(loadTransfers()).toHaveLength(0);

    qs('transfer-destination').value = desactivada.id;
    addLine(6, entity.entity_id);
    submitTransfer();
    expect(qs('error-transfer-destination').textContent).toContain('desactivada');
    expect(loadTransfers()).toHaveLength(0);
  });

  it('despacha, informa el tránsito por separado y recibe', () => {
    openTransfers();
    fillTransferBase();
    addLine(20);
    submitTransfer();

    const row = transferRow();
    transitionButton(row, 'Despachado').click();

    expect(calculateStock(entity.entity_id, origin.id)).toBe(30);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(0);
    expect(getInTransit(entity.entity_id)).toBe(20);
    expect(qs('transfers-in-transit').textContent).toContain('Papel: 20 unidades');

    transitionButton(transferRow(), 'Recibido').click();

    expect(calculateStock(entity.entity_id, origin.id)).toBe(30);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(20);
    expect(getInTransit(entity.entity_id)).toBe(0);
    expect(qs('transfers-in-transit').textContent).toContain('No hay unidades en tránsito');
    const received = transferRow();
    expect(received.textContent).toContain('Recibido');
    expect(received.querySelector('[data-action="transition"]')).toBeNull();
  });

  it('cancela un traslado en solicitud sin alterar saldos', () => {
    openTransfers();
    fillTransferBase();
    addLine(20);
    submitTransfer();

    transitionButton(transferRow(), 'Cancelado').click();

    expect(calculateStock(entity.entity_id, origin.id)).toBe(50);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(0);
    expect(getInTransit(entity.entity_id)).toBe(0);
    const cancelled = transferRow();
    expect(cancelled.textContent).toContain('Cancelado');
    expect(cancelled.querySelector('[data-action="transition"]')).toBeNull();
    expect(qs('transfers-in-transit').textContent).toContain('No hay unidades en tránsito');
  });
});

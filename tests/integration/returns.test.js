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
  updateTransferStatus,
  loadMovements,
  loadReturns,
  calculateStock,
  validateReturn,
  updateReturnStatus,
} from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let entity;
let warehouse;
let origin;
let destination;

function qs(id) {
  return document.getElementById(id);
}

function salidaRow() {
  return [...qs('movement-list').querySelectorAll('.record-item')].find((row) =>
    row.textContent.includes('Salida')
  );
}

function returnRow() {
  return qs('return-list').querySelector('.record-item');
}

function openReturnForm() {
  app.navigate('movements');
  salidaRow().querySelector('[data-action="return"]').click();
}

function fillReturn({ reason = 'Rechazo del cliente', good = '', damaged = '' } = {}) {
  qs('return-reason').value = reason;
  if (good !== '') qs('return-quantity-good').value = String(good);
  if (damaged !== '') qs('return-quantity-damaged').value = String(damaged);
}

function submitReturn() {
  qs('return-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function transitionButton(row, status) {
  return row.querySelector(`[data-action="transition"][data-status="${status}"]`);
}

function seedSalida(quantity = 4) {
  addMovement({
    entity_id: entity.entity_id,
    warehouse_id: warehouse.id,
    type: 'entrada',
    quantity: 10,
    movementDate: '2026-08-01',
  });
  return addMovement({
    entity_id: entity.entity_id,
    warehouse_id: warehouse.id,
    type: 'salida',
    quantity,
    movementDate: '2026-08-02',
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
  entity = addEntity({ name: 'Papel', code: 'P-1' });
  warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
  origin = addWarehouse({ code: 'ORI', name: 'Origen' });
  destination = addWarehouse({ code: 'DES', name: 'Destino' });
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 14 - devoluciones de movimientos', () => {
  it('registra una devolución parcial sin alterar el movimiento original', () => {
    const salida = seedSalida(4);
    openReturnForm();
    expect(qs('return-form')).toBeTruthy();
    expect(qs('return-reference').textContent).toContain('Salida');

    fillReturn({ good: 3, damaged: 1 });
    submitReturn();

    const returns = loadReturns();
    expect(returns).toHaveLength(1);
    expect(returns[0].status).toBe('Solicitada');
    expect(returns[0].movement_id).toBe(salida.id);
    expect(returns[0].reason).toBe('Rechazo del cliente');
    expect(qs('return-list-feedback').textContent).toContain('correctamente');

    const original = loadMovements().find((m) => m.id === salida.id);
    expect(original.quantity).toBe(4);
    expect(original.status).toBe(salida.status);

    expect(calculateStock(entity.entity_id, warehouse.id)).toBe(6);
    expect(salidaRow().textContent).toContain('Devuelto: 4');
    expect(returnRow().textContent).toContain('Solicitada');
  });

  it('valida motivo obligatorio, motivo controlado y cantidad máxima devolvible', () => {
    seedSalida(4);
    openReturnForm();
    fillReturn({ reason: '', good: 1 });
    submitReturn();
    expect(qs('error-return-reason').textContent).toContain('obligatorio');
    expect(loadReturns()).toHaveLength(0);

    fillReturn({ reason: 'Rechazo del cliente', good: 0, damaged: 0 });
    submitReturn();
    expect(qs('error-return-quantity-good').textContent).toContain('al menos una unidad');
    expect(loadReturns()).toHaveLength(0);

    fillReturn({ reason: 'Rechazo del cliente', good: 99 });
    submitReturn();
    expect(qs('error-return-quantity-good').textContent).toContain(
      'supera la cantidad despachada disponible (4)'
    );
    expect(loadReturns()).toHaveLength(0);
  });

  it('rechaza devolver un traslado que no está recibido', () => {
    seedSalida(4);
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: origin.id,
      type: 'entrada',
      quantity: 50,
      movementDate: '2026-08-01',
    });
    const transfer = createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-05',
      lines: [{ entity_id: entity.entity_id, quantity: 10 }],
    });
    updateTransferStatus(transfer.id, 'Despachado');

    app.navigate('transfers');
    const row = qs('transfer-list').querySelector('.record-item');
    expect(row.textContent).toContain('Despachado');
    row.querySelector('[data-action="return"]').click();

    expect(qs('view-movements').hidden).toBe(false);
    expect(qs('return-reference').textContent).toContain('Traslado');
    fillReturn({ good: 1 });
    submitReturn();

    expect(loadReturns()).toHaveLength(0);
    expect(qs('error-return-movement-id').textContent).toContain('Recibido');
    expect(qs('error-return-movement-id').textContent).toContain('Despachado');
  });

  it('solo aumenta el stock al recibirla en bodega y la merma no suma', () => {
    seedSalida(4);
    openReturnForm();
    fillReturn({ good: 3, damaged: 1 });
    submitReturn();

    expect(calculateStock(entity.entity_id, warehouse.id)).toBe(6);
    transitionButton(returnRow(), 'Aprobada').click();
    expect(returnRow().textContent).toContain('Aprobada');
    expect(calculateStock(entity.entity_id, warehouse.id)).toBe(6);

    transitionButton(returnRow(), 'Recibida en bodega').click();
    expect(calculateStock(entity.entity_id, warehouse.id)).toBe(9);

    const adjustments = loadMovements().filter((m) => m.returnId === loadReturns()[0].id);
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0].direction).toBe('in');
    expect(adjustments[0].quantity).toBe(3);

    transitionButton(returnRow(), 'Cerrada').click();
    expect(returnRow().textContent).toContain('Cerrada');
    expect(returnRow().querySelector('[data-action="transition"]')).toBeNull();
  });

  it('rechaza transiciones inválidas y no ofrece opciones en estados finales', () => {
    seedSalida(4);
    const salida = loadMovements().find((m) => m.type === 'salida');
    openReturnForm();
    fillReturn({ good: 1 });
    submitReturn();

    const record = loadReturns()[0];
    expect(transitionButton(returnRow(), 'Cerrada')).toBeNull();
    expect(() => updateReturnStatus(record.id, 'Cerrada')).toThrow(/Transición de estado inválida/);

    transitionButton(returnRow(), 'Rechazada').click();
    expect(returnRow().textContent).toContain('Rechazada');
    expect(returnRow().querySelector('[data-action="transition"]')).toBeNull();
    expect(() => updateReturnStatus(record.id, 'Aprobada')).toThrow(/Transición de estado inválida/);
    expect(calculateStock(entity.entity_id, warehouse.id)).toBe(6);
    expect(loadMovements().find((m) => m.id === salida.id).quantity).toBe(4);
  });

  it('devuelve un traslado recibido moviendo stock del destino al origen', () => {
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: origin.id,
      type: 'entrada',
      quantity: 50,
      movementDate: '2026-08-01',
    });
    const transfer = createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-05',
      lines: [{ entity_id: entity.entity_id, quantity: 20 }],
    });
    updateTransferStatus(transfer.id, 'Despachado');
    updateTransferStatus(transfer.id, 'Recibido');
    expect(calculateStock(entity.entity_id, origin.id)).toBe(30);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(20);

    app.navigate('transfers');
    qs('transfer-list').querySelector('.record-item [data-action="return"]').click();
    fillReturn({ reason: 'Dañado', good: 5, damaged: 0 });
    submitReturn();

    let record = loadReturns()[0];
    updateReturnStatus(record.id, 'Aprobada');
    record = updateReturnStatus(record.id, 'Recibida en bodega');

    expect(record.stockApplied).toBe(true);
    expect(calculateStock(entity.entity_id, destination.id)).toBe(15);
    expect(calculateStock(entity.entity_id, origin.id)).toBe(35);
  });

  it('impide una devolución cuando la cantidad supera lo ya devuelto', () => {
    seedSalida(4);
    openReturnForm();
    fillReturn({ good: 3, damaged: 1 });
    submitReturn();
    updateReturnStatus(loadReturns()[0].id, 'Aprobada');
    updateReturnStatus(loadReturns()[0].id, 'Recibida en bodega');
    updateReturnStatus(loadReturns()[0].id, 'Cerrada');

    openReturnForm();
    fillReturn({ good: 2 });
    submitReturn();

    expect(loadReturns()).toHaveLength(1);
    expect(qs('error-return-quantity-good').textContent).toContain('(0)');
    expect(validateReturn({ movement_kind: 'movement', movement_id: 'x', reason: 'Dañado' }).valid).toBe(false);
  });
});

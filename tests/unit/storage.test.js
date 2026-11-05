import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAll,
  loadEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  validateEntity,
  searchEntities,
  loadDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  deleteDocumentsForEntity,
  validateDocument,
  documentNumber,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
  loadWarehouses,
  getWarehouse,
  validateWarehouse,
  addMovement,
  loadMovements,
  validateMovement,
  calculateStock,
  getStockByWarehouse,
  validateLot,
  addLot,
  loadLots,
  lotBalance,
  suggestLotsFEFO,
  isLotExpired,
  loadTransfers,
} from '../../src/storage.js';
import * as storageApi from '../../src/storage.js';
import { setActiveConfig, normalizeConfig } from '../../src/module-config.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
  setActiveConfig(normalizeConfig(undefined));
});

describe('entity storage', () => {
  it('validates entity name and code', () => {
    expect(validateEntity({ name: '', code: '' }).valid).toBe(false);
    expect(validateEntity({ name: 'Acme', code: '' }).valid).toBe(false);
    expect(validateEntity({ name: 'A', code: 'B' }).valid).toBe(true);
    expect(validateEntity({ name: '', code: '' }).errors.name).toContain('obligatorio');
  });

  it('adds and loads entities', () => {
    const e = addEntity({ name: 'Acme', code: 'AC-001' });
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(e.id);
    expect(all[0].createdAt).toBeDefined();
    expect(all[0].updatedAt).toBeDefined();
  });

  it('generates a unique entity_id for each entity', () => {
    const e1 = addEntity({ name: 'Acme', code: 'AC-001' });
    const e2 = addEntity({ name: 'Globex', code: 'GL-002' });
    expect(e1.entity_id).toBeDefined();
    expect(e1.entity_id).not.toBe(e2.entity_id);
    expect(loadEntities()[0].entity_id).toBe(e1.entity_id);
  });

  it('rejects a duplicated business code', () => {
    addEntity({ name: 'Acme', code: 'AC-001' });
    expect(() => addEntity({ name: 'Otra', code: 'ac-001' })).toThrow(/ya está en uso/);
    expect(validateEntity({ name: 'Otra', code: 'AC-001' }).valid).toBe(false);
  });

  it('updates an entity', () => {
    const e = addEntity({ name: 'X', code: 'X-1' });
    const updated = updateEntity(e.id, { name: 'X2' });
    expect(updated.name).toBe('X2');
    expect(updated.updatedAt >= updated.createdAt).toBe(true);
  });

  it('preserves identity fields when updating', () => {
    const e = addEntity({ name: 'X', code: 'X-1' });
    const updated = updateEntity(e.id, { name: 'X2', code: 'X-2' });
    expect(updated.id).toBe(e.id);
    expect(updated.entity_id).toBe(e.entity_id);
    expect(updated.createdAt).toBe(e.createdAt);
  });

  it('rejects an invalid update without changing the stored record', () => {
    const e = addEntity({ name: 'X', code: 'X-1', email: 'ok@dominio.mx' });
    expect(() => updateEntity(e.id, { email: 'not-an-email' })).toThrow(/correo electrónico/);
    expect(loadEntities()[0].email).toBe('ok@dominio.mx');
    expect(() => updateEntity(e.id, { name: '' })).toThrow(/obligatorio/);
  });

  it('rejects an update that would duplicate another entity code', () => {
    addEntity({ name: 'Uno', code: 'DUP-1' });
    const other = addEntity({ name: 'Dos', code: 'DUP-2' });
    expect(() => updateEntity(other.id, { code: 'dup-1' })).toThrow(/ya está en uso/);
    expect(loadEntities().find((x) => x.id === other.id).code).toBe('DUP-2');
  });

  it('throws when updating or deleting a missing entity', () => {
    expect(() => updateEntity('nope', { name: 'X' })).toThrow(/no existe/);
    expect(() => deleteEntity('nope')).toThrow(/no existe/);
  });

  it('deletes an entity', () => {
    const e1 = addEntity({ name: 'A', code: 'A-1' });
    const e2 = addEntity({ name: 'C', code: 'C-1' });
    deleteEntity(e1.id);
    const all = loadEntities();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(e2.id);
  });

  it('persists ERP identity and contact fields', () => {
    const e = addEntity({
      name: 'Acme',
      code: 'AC-001',
      taxId: 'RFC800101AB1',
      email: 'ventas@acme.mx',
      phone: '555-1234',
      address: 'Av. Reforma 100',
    });
    const saved = loadEntities()[0];
    expect(saved.taxId).toBe('RFC800101AB1');
    expect(saved.email).toBe('ventas@acme.mx');
    expect(saved.phone).toBe('555-1234');
    expect(saved.address).toBe('Av. Reforma 100');
    const updated = updateEntity(e.id, { phone: '555-9999' });
    expect(updated.phone).toBe('555-9999');
  });

  it('rejects a malformed email address', () => {
    const res = validateEntity({ name: 'A', code: 'B', email: 'not-an-email' });
    expect(res.valid).toBe(false);
    expect(res.errors.email).toContain('correo electrónico');
    expect(validateEntity({ name: 'A', code: 'B', email: 'ventas@acme.mx' }).valid).toBe(true);
    expect(validateEntity({ name: 'A', code: 'B', email: '' }).valid).toBe(true);
  });

  it('validates the credit limit as a non-negative number', () => {
    expect(validateEntity({ name: 'A', code: 'B', creditLimit: -1 }).valid).toBe(false);
    expect(validateEntity({ name: 'A', code: 'B', creditLimit: -1 }).errors.creditLimit).toContain(
      'no negativo'
    );
    expect(validateEntity({ name: 'A', code: 'B', creditLimit: 5000 }).valid).toBe(true);
    addEntity({ name: 'A', code: 'B', creditLimit: '5000' });
    expect(loadEntities()[0].creditLimit).toBe(5000);
  });

  it('accepts an empty target date but rejects an invalid one', () => {
    expect(validateEntity({ name: 'A', code: 'B', targetDate: '' }).valid).toBe(true);
    expect(validateEntity({ name: 'A', code: 'B', targetDate: '2026-08-06' }).valid).toBe(true);
    const res = validateEntity({ name: 'A', code: 'B', targetDate: '2026-13-45' });
    expect(res.valid).toBe(false);
    expect(res.errors.targetDate).toBeDefined();
  });

  it('persists target date on create and update', () => {
    const e = addEntity({ name: 'Acme', code: 'AC-001', targetDate: '2026-09-01' });
    expect(loadEntities()[0].targetDate).toBe('2026-09-01');
    const updated = updateEntity(e.id, { targetDate: '2026-10-01' });
    expect(updated.targetDate).toBe('2026-10-01');
  });

  it('searches by target date, tax id and email', () => {
    addEntity({ name: 'Acme', code: 'AC-001', targetDate: '2026-09-01', taxId: 'RFC800101AB1', email: 'ventas@acme.mx' });
    addEntity({ name: 'Globex', code: 'GL-002', targetDate: '2026-11-20', taxId: 'RFC991231CD2', email: 'hola@globex.mx' });
    expect(searchEntities('2026-09-01').length).toBe(1);
    expect(searchEntities('2026-09-01')[0].name).toBe('Acme');
    expect(searchEntities('RFC800101AB1').length).toBe(1);
    expect(searchEntities('ventas@acme.mx').length).toBe(1);
    expect(searchEntities('globex.mx').length).toBe(1);
  });

  it('normalizes text so searches ignore tildes and case', () => {
    addEntity({ name: 'Materia Prima', code: 'MP-1', category: 'Materia prima' });
    expect(searchEntities('MATERIA').length).toBe(1);
    expect(searchEntities('prima').length).toBe(1);
    expect(searchEntities('MÁTERIA').length).toBe(1);
  });

  it('validates required custom fields declared in configuration', () => {
    setActiveConfig({
      ...normalizeConfig(undefined),
      customFields: [{ target: 'entity', key: 'riesgo', label: 'Riesgo', type: 'number', required: true }],
    });
    const res = validateEntity({ name: 'A', code: 'B' });
    expect(res.valid).toBe(false);
    expect(res.errors.riesgo).toContain('obligatorio');
    expect(validateEntity({ name: 'A', code: 'B', riesgo: 500 }).valid).toBe(true);
  });

  it('rejects non-numeric values for number custom fields', () => {
    setActiveConfig({
      ...normalizeConfig(undefined),
      customFields: [{ target: 'entity', key: 'riesgo', label: 'Riesgo', type: 'number' }],
    });
    const res = validateEntity({ name: 'A', code: 'B', riesgo: 'alto' });
    expect(res.valid).toBe(false);
    expect(res.errors.riesgo).toContain('numérico');
  });

  it('persists custom field values alongside base fields without schema changes', () => {
    setActiveConfig({
      ...normalizeConfig(undefined),
      customFields: [{ target: 'entity', key: 'region', label: 'Region', type: 'text' }],
    });
    const e = addEntity({ name: 'Acme', code: 'AC-001', region: 'EMEA' });
    expect(loadEntities()[0].region).toBe('EMEA');
    const updated = updateEntity(e.id, { region: 'APAC' });
    expect(updated.region).toBe('APAC');
    expect(updated.name).toBe('Acme');
  });

  it('includes custom field values in search results', () => {
    setActiveConfig({
      ...normalizeConfig(undefined),
      customFields: [{ target: 'entity', key: 'region', label: 'Region', type: 'text' }],
    });
    addEntity({ name: 'Acme', code: 'AC-001', region: 'EMEA' });
    addEntity({ name: 'Globex', code: 'GL-002', region: 'APAC' });
    const results = searchEntities('emea');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Acme');
  });

  it('ignores undeclared custom keys when persisting', () => {
    const e = addEntity({ name: 'Acme', code: 'AC-001', rogueField: 'x' });
    expect(e.rogueField).toBeUndefined();
  });

  it('stores html payloads as inert plain text (no se interpretan en la persistencia)', () => {
    const payload = '<img src=x onerror="alert(1)">';
    addEntity({ name: payload, code: 'XSS-1' });
    expect(loadEntities()[0].name).toBe(payload);
    expect(searchEntities('onerror').length).toBe(1);
    expect(validateEntity({ name: payload, code: 'XSS-2' }).valid).toBe(true);
  });
});

describe('document storage', () => {
  let entity;
  beforeEach(() => {
    entity = addEntity({ name: 'Acme', code: 'AC-001' });
  });

  const base = (extra = {}) => ({
    entity_id: entity.entity_id,
    type: 'remision',
    folio: 1,
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    ...extra,
  });

  it('validates a document against base rules', () => {
    expect(validateDocument(base()).valid).toBe(true);
    expect(validateDocument(base({ entity_id: 'missing' })).valid).toBe(false);
    expect(validateDocument(base({ folio: '' })).valid).toBe(false);
    expect(validateDocument(base({ endDate: '2026-08-01', startDate: '2026-08-05' })).valid).toBe(false);
    expect(validateDocument(base({ quantity: 0 })).valid).toBe(false);
    expect(validateDocument(base({ quantity: 2.5 })).valid).toBe(false);
    expect(validateDocument(base({ quantity: 3 })).valid).toBe(true);
    expect(validateDocument(base({ totalAmount: -1 })).valid).toBe(false);
    expect(validateDocument(base({ totalAmount: 99.5 })).valid).toBe(true);
  });

  it('requires a document type from the supported list', () => {
    expect(validateDocument({ ...base(), type: '' }).errors.type).toContain('obligatorio');
    expect(validateDocument({ ...base(), type: 'factura' }).errors.type).toContain('no soportado');
    expect(validateDocument({ ...base(), type: 'orden-compra' }).valid).toBe(true);
  });

  it('requires a positive integer folio', () => {
    const withoutFolio = base();
    delete withoutFolio.folio;
    expect(validateDocument(withoutFolio).errors.folio).toContain('obligatorio');
    expect(validateDocument(base({ folio: 0 })).errors.folio).toContain('entero positivo');
    expect(validateDocument(base({ folio: 2.5 })).errors.folio).toContain('entero positivo');
    expect(validateDocument(base({ folio: '1001' })).valid).toBe(true);
  });

  it('validates subtotal, discount, tax and their relationship', () => {
    expect(validateDocument(base({ subtotal: -5 })).errors.subtotal).toContain('no negativo');
    expect(validateDocument(base({ discount: -1 })).errors.discount).toContain('no negativo');
    expect(validateDocument(base({ taxAmount: -2 })).errors.taxAmount).toContain('no negativo');
    expect(validateDocument(base({ subtotal: 100, discount: 200 })).valid).toBe(false);
    expect(validateDocument(base({ subtotal: 100, discount: 150 })).errors.discount).toContain(
      'superar el subtotal'
    );
    expect(
      validateDocument(base({ subtotal: 100, discount: 16, taxAmount: 13.44, totalAmount: 97.44 })).valid
    ).toBe(true);
  });

  it('adds and loads documents linked by entity_id', () => {
    const d = addDocument(
      base({
        series: 'FAC',
        folio: 1001,
        quantity: 2,
        subtotal: 500,
        discount: 50,
        taxAmount: 72.8,
        totalAmount: 522.8,
        currency: 'MXN',
        status: 'emitida',
        paymentTerms: 'neto 30',
        notes: 'Entrega en almacén',
      })
    );
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d.id);
    expect(all[0].entity_id).toBe(entity.entity_id);
    expect(all[0].type).toBe('remision');
    expect(all[0].series).toBe('FAC');
    expect(all[0].folio).toBe(1001);
    expect(all[0].quantity).toBe(2);
    expect(all[0].subtotal).toBe(500);
    expect(all[0].discount).toBe(50);
    expect(all[0].taxAmount).toBe(72.8);
    expect(all[0].totalAmount).toBe(522.8);
    expect(all[0].paymentTerms).toBe('neto 30');
    expect(all[0].notes).toBe('Entrega en almacén');
    expect(documentNumber(all[0])).toBe('FAC-1001');
  });

  it('updates a document', () => {
    const d = addDocument(base({ folio: 1001 }));
    const updated = updateDocument(d.id, { folio: 1002 });
    expect(updated.folio).toBe(1002);
  });

  it('deletes a document', () => {
    const d1 = addDocument(base({ folio: 1 }));
    const d2 = addDocument(base({ folio: 2, startDate: '2026-08-02', endDate: '2026-08-06' }));
    deleteDocument(d1.id);
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(d2.id);
  });

  it('deletes documents for an entity', () => {
    const other = addEntity({ name: 'Globex', code: 'GL-002' });
    addDocument(base({ folio: 1 }));
    addDocument(base({ folio: 2, startDate: '2026-08-02', endDate: '2026-08-06' }));
    addDocument({ entity_id: other.entity_id, type: 'remision', folio: 3, startDate: '2026-08-03', endDate: '2026-08-07' });
    deleteDocumentsForEntity(entity.entity_id);
    const all = loadDocuments();
    expect(all.length).toBe(1);
    expect(all[0].entity_id).toBe(other.entity_id);
  });

  it('cascades document deletion when an entity is deleted', () => {
    const other = addEntity({ name: 'Globex', code: 'GL-002' });
    addDocument(base({ folio: 1 }));
    addDocument({ entity_id: other.entity_id, type: 'remision', folio: 2, startDate: '2026-08-02', endDate: '2026-08-06' });
    deleteEntity(entity.id);
    const docs = loadDocuments();
    expect(docs.length).toBe(1);
    expect(docs[0].entity_id).toBe(other.entity_id);
  });

  it('persists declared document custom fields', () => {
    setActiveConfig({
      ...normalizeConfig(undefined),
      customFields: [
        { target: 'document', key: 'metodoEnvio', label: 'Método de envío', type: 'select', options: ['estándar', 'exprés'] },
      ],
    });
    addDocument(base({ metodoEnvio: 'exprés' }));
    expect(loadDocuments()[0].metodoEnvio).toBe('exprés');
    expect(validateDocument(base({ metodoEnvio: 'urgentemente' })).errors.metodoEnvio).toContain(
      'debe ser uno de'
    );
  });
});

describe('document status lifecycle', () => {
  let entity;
  beforeEach(() => {
    entity = addEntity({ name: 'Acme', code: 'AC-001' });
  });

  const base = (extra = {}) => ({
    entity_id: entity.entity_id,
    type: 'remision',
    folio: 1,
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    ...extra,
  });

  const lifecycleConfig = () =>
    normalizeConfig({
      statusLifecycle: {
        documents: {
          'orden-compra': {
            statuses: ['cotización', 'pedido', 'facturado'],
            transitions: { cotización: ['pedido'], pedido: ['facturado'], facturado: [] },
          },
        },
      },
    });

  it('keeps status free-form when the document type has no lifecycle', () => {
    const d = addDocument(base({ status: 'libre' }));
    expect(loadDocuments()[0].status).toBe('libre');
    const updated = updateDocument(d.id, { status: 'otro estado' });
    expect(updated.status).toBe('otro estado');
  });

  it('rejects unknown statuses on creation when a lifecycle is configured', () => {
    setActiveConfig(lifecycleConfig());
    const res = validateDocument(
      base({ type: 'orden-compra', status: 'inventado' })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.status).toContain('debe ser uno de');
  });

  it('assigns the first configured status when none is given', () => {
    setActiveConfig(lifecycleConfig());
    const d = addDocument(base({ type: 'orden-compra' }));
    expect(loadDocuments()[0].status).toBe('cotización');
    expect(d.status).toBe('cotización');
  });

  it('enforces permitted transitions on update regardless of how a change is submitted', () => {
    setActiveConfig(lifecycleConfig());
    const d = addDocument(base({ type: 'orden-compra', status: 'cotización' }));
    expect(() => updateDocument(d.id, { status: 'facturado' })).toThrow(/Transición de estado inválida/);
    expect(loadDocuments()[0].status).toBe('cotización');
    const updated = updateDocument(d.id, { status: 'pedido' });
    expect(updated.status).toBe('pedido');
    expect(updateDocument(d.id, { status: 'facturado' }).status).toBe('facturado');
  });

  it('allows keeping the same status on update', () => {
    setActiveConfig(lifecycleConfig());
    const d = addDocument(base({ type: 'orden-compra', status: 'cotización' }));
    expect(updateDocument(d.id, { folio: 11 }).status).toBe('cotización');
  });
});

describe('clearAll', () => {
  it('empties both stores', () => {
    const e = addEntity({ name: 'A', code: 'A-1' });
    addDocument({ entity_id: e.entity_id, type: 'remision', folio: 1, startDate: '2026-08-01', endDate: '2026-08-02' });
    clearAll();
    expect(loadEntities().length).toBe(0);
    expect(loadDocuments().length).toBe(0);
  });
});

describe('warehouse storage', () => {
  it('validates required code and name', () => {
    expect(validateWarehouse({ code: '', name: '' }).valid).toBe(false);
    expect(validateWarehouse({ code: '', name: '' }).errors.code).toContain('obligatorio');
    expect(validateWarehouse({ code: 'B-01', name: '' }).errors.name).toContain('obligatorio');
    expect(validateWarehouse({ code: 'B-01', name: 'Central' }).valid).toBe(true);
  });

  it('adds warehouses with a unique id and defaults them to active', () => {
    const w = addWarehouse({ code: 'B-01', name: 'Central' });
    expect(w.id).toBeDefined();
    expect(w.active).toBe(true);
    expect(loadWarehouses()).toHaveLength(1);
    expect(getWarehouse('B-01').id).toBe(w.id);
    expect(getWarehouse(w.id).name).toBe('Central');
  });

  it('rejects a duplicated warehouse code even when the original is deactivated', () => {
    const w = addWarehouse({ code: 'B-01', name: 'Central' });
    updateWarehouse(w.id, { active: false });
    expect(() => addWarehouse({ code: 'b-01', name: 'Otra' })).toThrow(/ya está en uso/);
    expect(loadWarehouses()).toHaveLength(1);
  });

  it('updates warehouse fields without touching historical movements', () => {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const w = addWarehouse({ code: 'B-01', name: 'Central' });
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: w.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });
    const updated = updateWarehouse(w.id, { name: 'Central 2', active: false });
    expect(updated.name).toBe('Central 2');
    expect(updated.active).toBe(false);
    expect(loadMovements()).toHaveLength(1);
  });

  it('rejects deleting a warehouse that has movements and suggests deactivating it', () => {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const w = addWarehouse({ code: 'B-01', name: 'Central' });
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: w.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });
    expect(() => deleteWarehouse(w.id)).toThrow(/Desactívala/);
    expect(loadWarehouses()).toHaveLength(1);
  });

  it('deletes a warehouse that has no movements', () => {
    const w = addWarehouse({ code: 'B-01', name: 'Central' });
    expect(deleteWarehouse(w.id)).toEqual({ deleted: w.id });
    expect(loadWarehouses()).toHaveLength(0);
  });

  it('blocks movements against a deactivated warehouse', () => {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const w = addWarehouse({ code: 'B-01', name: 'Central', active: false });
    expect(() =>
      addMovement({
        entity_id: entity.entity_id,
        warehouse_id: w.id,
        type: 'entrada',
        quantity: 5,
        movementDate: '2026-08-01',
      })
    ).toThrow(/desactivada/);
    expect(loadMovements()).toHaveLength(0);
  });

  it('reactivates a warehouse so it can receive movements again', () => {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const w = addWarehouse({ code: 'B-01', name: 'Central', active: false });
    updateWarehouse(w.id, { active: true });
    const movement = addMovement({
      entity_id: entity.entity_id,
      warehouse_id: w.id,
      type: 'entrada',
      quantity: 3,
      movementDate: '2026-08-01',
    });
    expect(movement.id).toBeDefined();
    expect(loadMovements()).toHaveLength(1);
  });
});

describe('stock movement storage', () => {
  function seed() {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const wh1 = addWarehouse({ code: 'B-01', name: 'Central' });
    const wh2 = addWarehouse({ code: 'B-02', name: 'Sucursal' });
    return { entity, wh1, wh2 };
  }

  it('validates required movement fields', () => {
    const res = validateMovement({});
    expect(res.valid).toBe(false);
    expect(res.errors.entity_id).toContain('obligatorio');
    expect(res.errors.warehouse_id).toContain('obligator');
    expect(res.errors.type).toContain('obligatorio');
    expect(res.errors.movementDate).toContain('AAAA-MM-DD');
    expect(res.errors.quantity).toContain('entero positivo');
  });

  it('rejects invalid quantities, dates and movement types', () => {
    const { entity, wh1 } = seed();
    const base = { entity_id: entity.entity_id, warehouse_id: wh1.id, movementDate: '2026-08-01' };
    expect(validateMovement({ ...base, type: 'entrada', quantity: 0 }).errors.quantity).toContain('entero positivo');
    expect(validateMovement({ ...base, type: 'entrada', quantity: 2.5 }).errors.quantity).toContain('entero positivo');
    expect(validateMovement({ ...base, type: 'entrada', quantity: -3 }).errors.quantity).toContain('entero positivo');
    expect(validateMovement({ ...base, type: 'entrada', quantity: 1, movementDate: 'no-fecha' }).errors.movementDate).toContain('AAAA-MM-DD');
    expect(validateMovement({ ...base, type: 'inventado', quantity: 1 }).errors.type).toContain('no soportado');
  });

  it('rejects transfer movements created outside a transfer and adjustments without direction', () => {
    const { entity, wh1 } = seed();
    const base = { entity_id: entity.entity_id, warehouse_id: wh1.id, quantity: 1, movementDate: '2026-08-01' };
    expect(validateMovement({ ...base, type: 'traslado' }).errors.type).toContain('traslado entre bodegas');
    expect(validateMovement({ ...base, type: 'ajuste' }).errors.direction).toContain('aumenta');
  });

  it('derives the direction from the movement type', () => {
    const { entity, wh1 } = seed();
    const entrada = addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'entrada', quantity: 5, movementDate: '2026-08-01' });
    const salida = addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'salida', quantity: 2, movementDate: '2026-08-02' });
    const ajuste = addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'ajuste', direction: 'out', quantity: 1, movementDate: '2026-08-03' });
    expect(entrada.direction).toBe('in');
    expect(salida.direction).toBe('out');
    expect(ajuste.direction).toBe('out');
  });

  it('computes the stock per product and warehouse as the sum of its movements', () => {
    const { entity, wh1, wh2 } = seed();
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'entrada', quantity: 10, movementDate: '2026-08-01' });
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'salida', quantity: 3, movementDate: '2026-08-02' });
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh2.id, type: 'entrada', quantity: 5, movementDate: '2026-08-03' });

    expect(calculateStock(entity.entity_id)).toBe(12);
    expect(calculateStock(entity.entity_id, wh1.id)).toBe(7);
    expect(calculateStock(entity.entity_id, wh2.id)).toBe(5);
    expect(getStockByWarehouse(entity.entity_id)).toEqual({ [wh1.id]: 7, [wh2.id]: 5 });
  });

  it('rejects a salida that would make the stock negative, reporting the available balance', () => {
    const { entity, wh1 } = seed();
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'entrada', quantity: 6, movementDate: '2026-08-01' });
    expect(() =>
      addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'salida', quantity: 999, movementDate: '2026-08-02' })
    ).toThrow(/Saldo insuficiente: hay 6 unidades disponibles/);
    expect(calculateStock(entity.entity_id)).toBe(6);
    expect(loadMovements()).toHaveLength(1);
  });

  it('does not expose functions to edit or delete saved movements', () => {
    expect(storageApi.updateMovement).toBeUndefined();
    expect(storageApi.deleteMovement).toBeUndefined();
  });

  it('blocks deleting an entity that has inventory movements', () => {
    const { entity, wh1 } = seed();
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh1.id, type: 'entrada', quantity: 5, movementDate: '2026-08-01' });
    expect(() => deleteEntity(entity.entity_id)).toThrow(/movimientos de inventario/);
    expect(loadEntities()).toHaveLength(1);
  });
});

describe('lot storage', () => {
  function seed() {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const other = addEntity({ name: 'Tinta', code: 'T-1' });
    const wh = addWarehouse({ code: 'B-01', name: 'Central' });
    return { entity, other, wh };
  }

  it('requires a product and a lot number', () => {
    expect(validateLot({}).valid).toBe(false);
    expect(validateLot({}).errors.entity_id).toContain('obligatorio');
    expect(validateLot({}).errors.lotNumber).toContain('obligatorio');
    const { entity } = seed();
    expect(validateLot({ entity_id: entity.entity_id, lotNumber: 'L-1' }).valid).toBe(true);
  });

  it('rejects a duplicated lot number for the same product but allows it on another product', () => {
    const { entity, other } = seed();
    addLot({ entity_id: entity.entity_id, lotNumber: 'L-1' });
    expect(() => addLot({ entity_id: entity.entity_id, lotNumber: 'l-1' })).toThrow(/ya existe para este producto/);
    expect(() => addLot({ entity_id: other.entity_id, lotNumber: 'L-1' })).not.toThrow();
    expect(loadLots()).toHaveLength(2);
  });

  it('rejects invalid dates and an expiry date before the manufacture date', () => {
    const { entity } = seed();
    expect(
      validateLot({ entity_id: entity.entity_id, lotNumber: 'L-1', manufactureDate: 'no-fecha' }).errors.manufactureDate
    ).toContain('AAAA-MM-DD');
    expect(
      validateLot({ entity_id: entity.entity_id, lotNumber: 'L-1', expiryDate: 'no-fecha' }).errors.expiryDate
    ).toContain('AAAA-MM-DD');
    const res = validateLot({
      entity_id: entity.entity_id,
      lotNumber: 'L-1',
      manufactureDate: '2026-05-01',
      expiryDate: '2026-04-01',
    });
    expect(res.valid).toBe(false);
    expect(res.errors.expiryDate).toContain('no puede ser anterior');
  });

  it('derives the lot balance from its movements', () => {
    const { entity, wh } = seed();
    const lot = addLot({ entity_id: entity.entity_id, lotNumber: 'L-1' });
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh.id, type: 'entrada', quantity: 8, movementDate: '2026-08-01', lot_id: lot.id });
    addMovement({ entity_id: entity.entity_id, warehouse_id: wh.id, type: 'salida', quantity: 3, movementDate: '2026-08-02', lot_id: lot.id });
    expect(lotBalance(lot.id)).toBe(5);
  });

  it('marks expired lots', () => {
    expect(isLotExpired({ expiryDate: '2000-01-01' })).toBe(true);
    expect(isLotExpired({ expiryDate: '2999-01-01' })).toBe(false);
    expect(isLotExpired({ expiryDate: '' })).toBe(false);
  });

  it('suggests lots in FEFO order, excluding expired and empty ones', () => {
    const { entity, wh } = seed();
    const late = addLot({ entity_id: entity.entity_id, lotNumber: 'L-LATE', expiryDate: '2999-06-30' });
    const early = addLot({ entity_id: entity.entity_id, lotNumber: 'L-EARLY', expiryDate: '2999-01-01' });
    const expired = addLot({ entity_id: entity.entity_id, lotNumber: 'L-OLD', expiryDate: '2000-01-01' });
    const empty = addLot({ entity_id: entity.entity_id, lotNumber: 'L-EMPTY', expiryDate: '2998-01-01' });

    for (const lot of [late, early, expired]) {
      addMovement({ entity_id: entity.entity_id, warehouse_id: wh.id, type: 'entrada', quantity: 4, movementDate: '2026-08-01', lot_id: lot.id });
    }

    const suggested = suggestLotsFEFO(entity.entity_id);
    expect(suggested.map((l) => l.id)).toEqual([early.id, late.id]);
    expect(suggested.map((l) => l.id)).not.toContain(expired.id);
    expect(suggested.map((l) => l.id)).not.toContain(empty.id);
    expect(suggested[0].balance).toBe(4);
  });
});

describe('Historia de Usuario 12 - transiciones de estado', () => {
  function seed() {
    const entity = addEntity({ name: 'Papel', code: 'P-1' });
    const origin = addWarehouse({ code: 'ORI', name: 'Origen' });
    const destination = addWarehouse({ code: 'DES', name: 'Destino' });
    addMovement({
      entity_id: entity.entity_id,
      warehouse_id: origin.id,
      type: 'entrada',
      quantity: 50,
      movementDate: '2026-08-01',
    });
    return { entity, origin, destination };
  }

  function addOrden() {
    const { entity } = seed();
    return addDocument({
      entity_id: entity.entity_id,
      type: 'orden-compra',
      series: 'OC',
      folio: 1,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
    });
  }

  function seedTransfer(quantity = 20) {
    const { entity, origin, destination } = seed();
    const transfer = storageApi.createTransfer({
      origin_warehouse_id: origin.id,
      destination_warehouse_id: destination.id,
      date: '2026-08-02',
      lines: [{ entity_id: entity.entity_id, quantity }],
    });
    return { entity, origin, destination, transfer };
  }

  it('avanza una orden de compra solo por transiciones válidas y registra la fecha del cambio', () => {
    const doc = addOrden();
    expect(doc.status).toBe('Borrador');

    const updated = storageApi.updateDocumentStatus(doc.id, 'Aprobada');
    expect(updated.status).toBe('Aprobada');
    expect(updated.statusChangedAt).toBeDefined();

    expect(() => storageApi.updateDocumentStatus(doc.id, 'Recibida')).toThrow(
      /Transición de estado inválida/
    );
    expect(() => storageApi.updateDocumentStatus(doc.id, 'Recibida')).toThrow(
      /Enviada por proveedor, Cancelada/
    );
  });

  it('rechaza una transición inválida enviada por cualquier vía', () => {
    const doc = addOrden();
    expect(() => updateDocument(doc.id, { status: 'Cerrada' })).toThrow(
      /Transición de estado inválida/
    );
    expect(loadDocuments().find((d) => d.id === doc.id).status).toBe('Borrador');
  });

  it('no ofrece transiciones en estados finales', () => {
    const doc = addOrden();
    storageApi.updateDocumentStatus(doc.id, 'Aprobada');
    storageApi.updateDocumentStatus(doc.id, 'Enviada por proveedor');
    storageApi.updateDocumentStatus(doc.id, 'Recibida');
    storageApi.updateDocumentStatus(doc.id, 'Cerrada');

    expect(() => storageApi.updateDocumentStatus(doc.id, 'Borrador')).toThrow(
      /ninguno \(estado final\)/
    );
  });

  it('mantiene el estado como texto libre cuando no hay ciclo de vida', () => {
    const { entity, origin } = seed();
    const movement = addMovement({
      entity_id: entity.entity_id,
      warehouse_id: origin.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-03',
    });
    expect(movement.status).toBe('');

    const updated = storageApi.updateMovementStatus(movement.id, 'Revisión interna');
    expect(updated.status).toBe('Revisión interna');
    expect(updated.statusChangedAt).toBeDefined();
  });

  it('rechaza cancelar un movimiento ya despachado e indica registrar una devolución', () => {
    const { transfer } = seedTransfer();
    storageApi.updateTransferStatus(transfer.id, 'Despachado');

    expect(() => storageApi.updateTransferStatus(transfer.id, 'Cancelado')).toThrow(/devolución/);
    expect(loadTransfersById(transfer.id).status).toBe('Despachado');
  });

  it('no cambia el stock al cancelar un traslado antes de despacharlo', () => {
    const { entity, origin, transfer } = seedTransfer(20);
    expect(calculateStock(entity.entity_id, origin.id)).toBe(50);

    storageApi.updateTransferStatus(transfer.id, 'Cancelado');

    expect(calculateStock(entity.entity_id, origin.id)).toBe(50);
    expect(storageApi.transferLines(transfer.id).every((m) => m.status === 'Cancelado')).toBe(true);
  });

  it('sincroniza el estado de los tramos con el traslado al despachar y recibir', () => {
    const { transfer } = seedTransfer();

    storageApi.updateTransferStatus(transfer.id, 'Despachado');
    expect(storageApi.transferLines(transfer.id).map((m) => m.status)).toEqual([
      'Despachado',
      'Despachado',
    ]);

    storageApi.updateTransferStatus(transfer.id, 'Recibido');
    expect(storageApi.transferLines(transfer.id).map((m) => m.status)).toEqual([
      'Recibido',
      'Recibido',
    ]);
  });

  function loadTransfersById(id) {
    return loadTransfers().find((t) => t.id === id);
  }
});

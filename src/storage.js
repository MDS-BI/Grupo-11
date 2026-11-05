import {
  lifecycleFor,
  returnsLifecycle,
  nextStates,
  RETURN_REASONS,
  getActiveConfig,
  BASE_FIELD_KEYS,
} from './module-config.js';

const KEY_PREFIX = 'erp_base_module:';
const KEYS = {
  entities: KEY_PREFIX + 'entities',
  documents: KEY_PREFIX + 'documents',
  warehouses: KEY_PREFIX + 'warehouses',
  lots: KEY_PREFIX + 'lots',
  movements: KEY_PREFIX + 'movements',
  transfers: KEY_PREFIX + 'transfers',
  returns: KEY_PREFIX + 'returns',
};

const MOVEMENT_TYPES = ['entrada', 'salida', 'ajuste', 'traslado'];
export const DOCUMENT_TYPES = ['orden-compra', 'remision'];
const RETURN_KINDS = ['movement', 'transfer'];
const CANCEL_LIKE = /cancel|rechaz|anul/i;
const COMMITTED_STATUSES = ['Despachado', 'En tránsito', 'Recibido', 'Recibida', 'Entregado'];

function invalidTransitionError(current, target, allowed) {
  if (CANCEL_LIKE.test(target) && COMMITTED_STATUSES.includes(current)) {
    return new Error(
      `No se puede cancelar una vez en "${current}": el movimiento ya fue entregado o recibido. Registre una devolución o un ajuste para corregirlo.`
    );
  }
  const options = allowed.length ? allowed.join(', ') : 'ninguno (estado final)';
  return new Error(`Transición de estado inválida: "${current}" → "${target}". Estados permitidos: ${options}.`);
}

let memoryStorage = null;

function getStorage() {
  try {
    const ls = globalThis.localStorage;
    if (ls && typeof ls.getItem === 'function') return ls;
  } catch {
    /* localStorage no disponible */
  }
  if (!memoryStorage) {
    const map = new Map();
    memoryStorage = {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => {
        map.set(k, String(v));
      },
      removeItem: (k) => {
        map.delete(k);
      },
      clear: () => {
        map.clear();
      },
    };
  }
  return memoryStorage;
}

function readList(key) {
  try {
    const raw = getStorage().getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  getStorage().setItem(key, JSON.stringify(list));
}

export function now() {
  return new Date().toISOString();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

function newId(prefix) {
  const uuid =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function firstError(errors) {
  const first = Object.values(errors)[0];
  return typeof first === 'string' ? first : 'Datos inválidos.';
}

function fail(errors) {
  throw new Error(firstError(errors));
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function optionalNumber(value, { integer = false, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null };
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return { ok: false };
  if (integer && !Number.isInteger(num)) return { ok: false };
  if (num < min) return { ok: false };
  return { ok: true, value: num };
}

function customFieldsFor(target, config = getActiveConfig()) {
  return (config?.customFields ?? []).filter((f) => f.target === target);
}

export function validateCustomFields(target, data, config = getActiveConfig()) {
  const errors = {};
  for (const field of customFieldsFor(target, config)) {
    const raw = data?.[field.key];
    const empty = raw === undefined || raw === null || String(raw).trim() === '';
    if (field.required && empty) {
      errors[field.key] = `El campo "${field.label}" es obligatorio.`;
      continue;
    }
    if (empty) continue;
    const text = String(raw).trim();
    if (field.type === 'number') {
      const num = Number(text);
      if (!Number.isFinite(num)) errors[field.key] = `El campo "${field.label}" debe ser numérico.`;
    } else if (field.type === 'date') {
      if (!isValidDate(text)) errors[field.key] = `El campo "${field.label}" debe ser una fecha válida (AAAA-MM-DD).`;
    } else if (field.type === 'select') {
      if (!field.options.includes(text)) {
        errors[field.key] = `El campo "${field.label}" debe ser uno de: ${field.options.join(', ')}.`;
      }
    }
  }
  return errors;
}

function applyCustomFields(target, data, config = getActiveConfig()) {
  const out = {};
  for (const field of customFieldsFor(target, config)) {
    const raw = data?.[field.key];
    if (raw === undefined || raw === null || String(raw).trim() === '') {
      out[field.key] = null;
      continue;
    }
    const text = String(raw).trim();
    out[field.key] = field.type === 'number' ? Number(text) : text;
  }
  return out;
}

export function customFieldSearchText(record) {
  const base = new Set(BASE_FIELD_KEYS);
  return Object.entries(record ?? {})
    .filter(([key]) => !base.has(key))
    .map(([, value]) => normalizeText(value))
    .join(' ');
}

function matchesQuery(fields, query) {
  if (!query || !String(query).trim()) return true;
  const needle = normalizeText(query);
  return fields.some((field) => normalizeText(field).includes(needle));
}

/* ========================= Entidades ========================= */

const ENTITY_OPTIONAL_STRINGS = ['taxId', 'email', 'phone', 'address', 'category', 'description', 'paymentTerms'];

export function validateEntity(data = {}, { ignoreId = null } = {}) {
  const errors = {};
  const value = {};

  value.name = trimString(data.name);
  if (!value.name) errors.name = 'El nombre es obligatorio.';

  value.code = trimString(data.code);
  if (!value.code) {
    errors.code = 'El código es obligatorio.';
  } else {
    const duplicate = loadEntities().some(
      (e) => normalizeText(e.code) === normalizeText(value.code) && e.id !== ignoreId
    );
    if (duplicate) errors.code = `El código "${value.code}" ya está en uso.`;
  }

  for (const key of ENTITY_OPTIONAL_STRINGS) value[key] = trimString(data[key]);

  if (value.email && !isEmail(value.email)) errors.email = 'El correo electrónico no tiene un formato válido.';

  const creditLimit = optionalNumber(data.creditLimit);
  if (!creditLimit.ok) errors.creditLimit = 'El límite de crédito debe ser un número no negativo.';
  value.creditLimit = creditLimit.value;

  const stockMin = optionalNumber(data.stockMin, { integer: true });
  if (!stockMin.ok) errors.stockMin = 'El stock mínimo debe ser un entero no negativo o quedar vacío.';
  value.stockMin = stockMin.value;

  value.targetDate = trimString(data.targetDate);
  if (value.targetDate && !isValidDate(value.targetDate)) {
    errors.targetDate = 'La fecha objetivo debe ser una fecha válida (AAAA-MM-DD).';
  }

  Object.assign(value, applyCustomFields('entity', data));
  Object.assign(errors, validateCustomFields('entity', data));

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadEntities() {
  return readList(KEYS.entities);
}

function saveEntities(list) {
  writeList(KEYS.entities, list);
}

export function getEntity(ref) {
  return loadEntities().find((e) => e.id === ref || e.entity_id === ref) ?? null;
}

export function addEntity(data) {
  const { valid, errors, value } = validateEntity(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const entity = {
    ...value,
    id: newId('ent'),
    entity_id: newId('eid'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveEntities([...loadEntities(), entity]);
  return entity;
}

export function updateEntity(ref, updates = {}) {
  const list = loadEntities();
  const index = list.findIndex((e) => e.id === ref || e.entity_id === ref);
  if (index === -1) throw new Error('El producto no existe.');
  const merged = { ...list[index], ...updates, id: list[index].id, entity_id: list[index].entity_id };
  const { valid, errors, value } = validateEntity(merged, { ignoreId: list[index].id });
  if (!valid) fail(errors);
  const updated = {
    ...list[index],
    ...value,
    id: list[index].id,
    entity_id: list[index].entity_id,
    createdAt: list[index].createdAt,
    updatedAt: now(),
  };
  list[index] = updated;
  saveEntities(list);
  return updated;
}

export function deleteEntity(ref) {
  const list = loadEntities();
  const index = list.findIndex((e) => e.id === ref || e.entity_id === ref);
  if (index === -1) throw new Error('El producto no existe.');
  const entity = list[index];
  const hasMovements = loadMovements().some((m) => m.entity_id === entity.entity_id);
  if (hasMovements) {
    throw new Error('No se puede eliminar: el producto tiene movimientos de inventario.');
  }
  saveEntities(list.filter((_, i) => i !== index));
  deleteDocumentsForEntity(entity.entity_id);
  const lots = loadLots();
  writeList(
    KEYS.lots,
    lots.filter((lot) => lot.entity_id !== entity.entity_id)
  );
  return { deleted: entity.id };
}

export function searchEntities(query = '', filters = {}) {
  let results = loadEntities();
  if (filters.category) {
    results = results.filter((e) => normalizeText(e.category) === normalizeText(filters.category));
  }
  if (filters.targetDateFrom) {
    results = results.filter((e) => e.targetDate && e.targetDate >= filters.targetDateFrom);
  }
  if (filters.targetDateTo) {
    results = results.filter((e) => e.targetDate && e.targetDate <= filters.targetDateTo);
  }
  if (filters.stockStatus === 'low') results = results.filter((e) => isLowStock(e));
  if (filters.stockStatus === 'ok') results = results.filter((e) => !isLowStock(e));
  if (filters.inStock) results = results.filter((e) => calculateStock(e.entity_id) > 0);
  if (filters.warehouse_id) {
    results = results.filter((e) => calculateStock(e.entity_id, filters.warehouse_id) > 0);
  }
  if (!matchesQuery([], query)) {
    results = results.filter((e) =>
      matchesQuery(
        [
          e.name,
          e.code,
          e.taxId,
          e.email,
          e.phone,
          e.address,
          e.category,
          e.description,
          e.targetDate,
          e.paymentTerms,
          customFieldSearchText(e),
          String(e.stockMin ?? ''),
        ],
        query
      )
    );
  }
  return clone(results);
}

/* ========================= Documentos ========================= */

export function validateDocument(data = {}) {
  const errors = {};
  const value = {};

  value.entity_id = trimString(data.entity_id);
  if (!value.entity_id) {
    errors.entity_id = 'La entidad es obligatoria.';
  } else if (!getEntity(value.entity_id)) {
    errors.entity_id = 'La entidad referenciada no existe.';
  }

  value.type = trimString(data.type);
  if (!value.type) {
    errors.type = 'El tipo de documento es obligatorio.';
  } else if (!DOCUMENT_TYPES.includes(value.type)) {
    errors.type = `Tipo de documento no soportado "${value.type}". Use: ${DOCUMENT_TYPES.join(', ')}.`;
  }

  const folio = optionalNumber(data.folio, { integer: true, min: 1 });
  if (data.folio === undefined || data.folio === null || data.folio === '') {
    errors.folio = 'El folio es obligatorio.';
  } else if (!folio.ok) {
    errors.folio = 'El folio debe ser un entero positivo.';
  }
  value.folio = folio.value;

  value.series = trimString(data.series);

  value.startDate = trimString(data.startDate);
  if (!value.startDate || !isValidDate(value.startDate)) {
    errors.startDate = 'La fecha de inicio es obligatoria y debe ser válida (AAAA-MM-DD).';
  }
  value.endDate = trimString(data.endDate);
  if (!value.endDate || !isValidDate(value.endDate)) {
    errors.endDate = 'La fecha de fin es obligatoria y debe ser válida (AAAA-MM-DD).';
  }
  if (!errors.startDate && !errors.endDate && value.endDate < value.startDate) {
    errors.endDate = 'La fecha de fin no puede ser anterior a la fecha de inicio.';
  }

  for (const key of ['quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount']) {
    const num =
      key === 'quantity'
        ? optionalNumber(data[key], { integer: true, min: 1 })
        : optionalNumber(data[key]);
    if (!num.ok) {
      errors[key] =
        key === 'quantity'
          ? 'La cantidad debe ser un entero positivo.'
          : `El campo ${key} debe ser un número no negativo.`;
    }
    value[key] = num.value;
  }

  if (!errors.discount && !errors.subtotal && value.discount != null && value.subtotal != null) {
    if (value.discount > value.subtotal) {
      errors.discount = 'El descuento no puede superar el subtotal.';
    }
  }

  value.currency = trimString(data.currency);
  value.paymentTerms = trimString(data.paymentTerms);
  value.notes = trimString(data.notes);
  value.status = trimString(data.status);

  const statusLifecycle = lifecycleFor('documents', value.type);
  if (value.status && statusLifecycle && !statusLifecycle.statuses.includes(value.status)) {
    errors.status = `El estado "${value.status}" debe ser uno de: ${statusLifecycle.statuses.join(', ')}.`;
  }

  Object.assign(value, applyCustomFields('document', data));
  Object.assign(errors, validateCustomFields('document', data));

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadDocuments() {
  return readList(KEYS.documents);
}

function saveDocuments(list) {
  writeList(KEYS.documents, list);
}

export function getDocument(ref) {
  return loadDocuments().find((d) => d.id === ref) ?? null;
}

export function documentNumber(doc) {
  if (!doc) return '';
  return doc.series ? `${doc.series}-${doc.folio}` : String(doc.folio);
}

function initialDocumentStatus(type) {
  const lifecycle = lifecycleFor('documents', type);
  return lifecycle ? lifecycle.statuses[0] : '';
}

export function addDocument(data) {
  const { valid, errors, value } = validateDocument(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const document = {
    ...value,
    status: value.status || initialDocumentStatus(value.type),
    id: newId('doc'),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveDocuments([...loadDocuments(), document]);
  return document;
}

export function updateDocument(ref, updates = {}) {
  const list = loadDocuments();
  const index = list.findIndex((d) => d.id === ref);
  if (index === -1) throw new Error('El documento no existe.');
  const current = list[index];
  if (updates.status !== undefined && trimString(updates.status) !== current.status) {
    const target = trimString(updates.status);
    const lifecycle = lifecycleFor('documents', current.type);
    if (lifecycle) {
      const allowed = nextStates(current.status, lifecycle);
      if (!allowed.includes(target)) {
        const options = allowed.length ? allowed.join(', ') : 'ninguno (estado final)';
        throw new Error(
          `Transición de estado inválida: "${current.status}" → "${target}". Estados permitidos: ${options}.`
        );
      }
    }
  }
  const statusChanged = updates.status !== undefined && trimString(updates.status) !== current.status;
  const timestamp = now();
  const merged = { ...current, ...updates, id: current.id };
  const { valid, errors, value } = validateDocument(merged);
  if (!valid) fail(errors);
  const updated = {
    ...list[index],
    ...value,
    status: value.status || list[index].status,
    id: list[index].id,
    createdAt: list[index].createdAt,
    updatedAt: timestamp,
    ...(statusChanged ? { statusChangedAt: timestamp } : {}),
  };
  list[index] = updated;
  saveDocuments(list);
  return updated;
}

export function deleteDocument(ref) {
  const list = loadDocuments();
  const index = list.findIndex((d) => d.id === ref);
  if (index === -1) throw new Error('El documento no existe.');
  saveDocuments(list.filter((_, i) => i !== index));
  return { deleted: ref };
}

export function deleteDocumentsForEntity(entityId) {
  const list = loadDocuments();
  const remaining = list.filter((d) => d.entity_id !== entityId);
  if (remaining.length !== list.length) saveDocuments(remaining);
  return list.length - remaining.length;
}

export function updateDocumentStatus(ref, nextStatus) {
  const list = loadDocuments();
  const index = list.findIndex((d) => d.id === ref);
  if (index === -1) throw new Error('El documento no existe.');
  const doc = list[index];
  const lifecycle = lifecycleFor('documents', doc.type);
  const target = trimString(nextStatus);
  if (!target) throw new Error('El estado no puede estar vacío.');
  if (lifecycle) {
    const allowed = nextStates(doc.status, lifecycle);
    if (!allowed.includes(target)) {
      throw invalidTransitionError(doc.status, target, allowed);
    }
  }
  const timestamp = now();
  const updated = { ...doc, status: target, statusChangedAt: timestamp, updatedAt: timestamp };
  list[index] = updated;
  saveDocuments(list);
  return updated;
}

export function searchDocuments(query = '', filters = {}) {
  let results = loadDocuments();
  if (filters.type) results = results.filter((d) => d.type === filters.type);
  if (filters.entity_id) results = results.filter((d) => d.entity_id === filters.entity_id);
  if (!matchesQuery([], query)) {
    results = results.filter((d) => {
      const entity = getEntity(d.entity_id);
      return matchesQuery(
        [
          documentNumber(d),
          String(d.folio),
          d.series,
          d.type,
          d.status,
          d.startDate,
          d.endDate,
          d.notes,
          d.currency,
          entity ? entity.name : '',
          entity ? entity.code : '',
          customFieldSearchText(d),
        ],
        query
      );
    });
  }
  return clone(results);
}

/* ========================= Bodegas ========================= */

export function validateWarehouse(data = {}, { ignoreId = null } = {}) {
  const errors = {};
  const value = {};

  value.code = trimString(data.code);
  if (!value.code) {
    errors.code = 'El código de la bodega es obligatorio.';
  } else {
    const duplicate = loadWarehouses().some(
      (w) => normalizeText(w.code) === normalizeText(value.code) && w.id !== ignoreId
    );
    if (duplicate) errors.code = `El código "${value.code}" ya está en uso.`;
  }

  value.name = trimString(data.name);
  if (!value.name) errors.name = 'El nombre de la bodega es obligatorio.';

  value.address = trimString(data.address);
  value.description = trimString(data.description);
  value.active = data.active === undefined ? true : Boolean(data.active);

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadWarehouses() {
  return readList(KEYS.warehouses);
}

function saveWarehouses(list) {
  writeList(KEYS.warehouses, list);
}

export function getWarehouse(ref) {
  return loadWarehouses().find((w) => w.id === ref || w.code === ref) ?? null;
}

export function addWarehouse(data) {
  const { valid, errors, value } = validateWarehouse(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const warehouse = { ...value, id: newId('wh'), createdAt: timestamp, updatedAt: timestamp };
  saveWarehouses([...loadWarehouses(), warehouse]);
  return warehouse;
}

export function updateWarehouse(ref, updates = {}) {
  const list = loadWarehouses();
  const index = list.findIndex((w) => w.id === ref || w.code === ref);
  if (index === -1) throw new Error('La bodega no existe.');
  const merged = { ...list[index], ...updates, id: list[index].id };
  const { valid, errors, value } = validateWarehouse(merged, { ignoreId: list[index].id });
  if (!valid) fail(errors);
  const updated = { ...list[index], ...value, id: list[index].id, updatedAt: now() };
  list[index] = updated;
  saveWarehouses(list);
  return updated;
}

export function deleteWarehouse(ref) {
  const list = loadWarehouses();
  const index = list.findIndex((w) => w.id === ref || w.code === ref);
  if (index === -1) throw new Error('La bodega no existe.');
  const warehouse = list[index];
  const inUse =
    loadMovements().some((m) => m.warehouse_id === warehouse.id) ||
    loadTransfers().some(
      (t) => t.origin_warehouse_id === warehouse.id || t.destination_warehouse_id === warehouse.id
    );
  if (inUse) {
    throw new Error(
      'No se puede eliminar: la bodega tiene movimientos o traslados registrados. Desactívala para conservar el histórico.'
    );
  }
  saveWarehouses(list.filter((_, i) => i !== index));
  return { deleted: warehouse.id };
}

/* ========================= Lotes ========================= */

export function validateLot(data = {}, { ignoreId = null } = {}) {
  const errors = {};
  const value = {};

  value.entity_id = trimString(data.entity_id);
  if (!value.entity_id) {
    errors.entity_id = 'El producto es obligatorio.';
  } else if (!getEntity(value.entity_id)) {
    errors.entity_id = 'El producto referenciado no existe.';
  }

  value.lotNumber = trimString(data.lotNumber);
  if (!value.lotNumber) {
    errors.lotNumber = 'El número de lote es obligatorio.';
  } else if (
    loadLots().some(
      (l) =>
        l.entity_id === value.entity_id &&
        normalizeText(l.lotNumber) === normalizeText(value.lotNumber) &&
        l.id !== ignoreId
    )
  ) {
    errors.lotNumber = `El lote "${value.lotNumber}" ya existe para este producto.`;
  }

  value.manufactureDate = trimString(data.manufactureDate);
  if (value.manufactureDate && !isValidDate(value.manufactureDate)) {
    errors.manufactureDate = 'La fecha de fabricación debe ser válida (AAAA-MM-DD).';
  }
  value.expiryDate = trimString(data.expiryDate);
  if (value.expiryDate && !isValidDate(value.expiryDate)) {
    errors.expiryDate = 'La fecha de vencimiento debe ser válida (AAAA-MM-DD).';
  }
  if (!errors.manufactureDate && !errors.expiryDate && value.expiryDate && value.manufactureDate) {
    if (value.expiryDate < value.manufactureDate) {
      errors.expiryDate = 'La fecha de vencimiento no puede ser anterior a la de fabricación.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadLots() {
  return readList(KEYS.lots);
}

function saveLots(list) {
  writeList(KEYS.lots, list);
}

export function getLot(ref) {
  return loadLots().find((l) => l.id === ref || l.lotNumber === ref) ?? null;
}

export function addLot(data) {
  const { valid, errors, value } = validateLot(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const lot = { ...value, id: newId('lot'), createdAt: timestamp, updatedAt: timestamp };
  saveLots([...loadLots(), lot]);
  return lot;
}

export function updateLot(ref, updates = {}) {
  const list = loadLots();
  const index = list.findIndex((l) => l.id === ref);
  if (index === -1) throw new Error('El lote no existe.');
  const merged = { ...list[index], ...updates, id: list[index].id };
  const { valid, errors, value } = validateLot(merged, { ignoreId: list[index].id });
  if (!valid) fail(errors);
  const updated = { ...list[index], ...value, id: list[index].id, updatedAt: now() };
  list[index] = updated;
  saveLots(list);
  return updated;
}

export function deleteLot() {
  throw new Error('Los lotes no se pueden eliminar (política de trazabilidad).');
}

export function lotsForProduct(entityId) {
  return loadLots().filter((l) => l.entity_id === entityId);
}

export function isLotExpired(lot) {
  return Boolean(lot?.expiryDate) && lot.expiryDate < today();
}

export function lotBalance(lotId) {
  return loadMovements()
    .filter((m) => m.lot_id === lotId && isEffectiveMovement(m))
    .reduce((sum, m) => sum + (m.direction === 'in' ? m.quantity : -m.quantity), 0);
}

export function suggestLotsFEFO(entityId) {
  return lotsForProduct(entityId)
    .filter((lot) => !isLotExpired(lot) && lotBalance(lot.id) > 0)
    .map((lot) => ({ ...lot, balance: lotBalance(lot.id) }))
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
}

/* ========================= Movimientos ========================= */

export function isEffectiveMovement(movement) {
  const status = movement?.status || '';
  if (CANCEL_LIKE.test(status)) return false;
  if (movement.type === 'traslado') {
    if (movement.leg === 'origin') {
      return ['Despachado', 'En tránsito', 'Recibido'].includes(status);
    }
    return status === 'Recibido';
  }
  const lifecycle = lifecycleFor('movements', movement.type);
  if (!lifecycle) return true;
  const committed =
    movement.type === 'salida'
      ? ['Despachado', 'Entregado']
      : ['Recibido', 'Recibida', 'Aplicado', 'Confirmado'];
  if (committed.includes(status)) return true;
  const targets = lifecycle.transitions[status];
  return Array.isArray(targets) && targets.length === 0;
}

export function calculateStock(entityId, warehouseId = null) {
  return loadMovements().reduce((sum, m) => {
    if (m.entity_id !== entityId) return sum;
    if (warehouseId && m.warehouse_id !== warehouseId) return sum;
    if (!isEffectiveMovement(m)) return sum;
    return sum + (m.direction === 'in' ? m.quantity : -m.quantity);
  }, 0);
}

export function getStockByWarehouse(entityId) {
  const balances = {};
  for (const warehouse of loadWarehouses()) {
    balances[warehouse.id] = calculateStock(entityId, warehouse.id);
  }
  return balances;
}

export function getInTransit(entityId = null) {
  return loadTransfers()
    .filter((t) => ['Despachado', 'En tránsito'].includes(t.status))
    .reduce((sum, t) => {
      const lines = transferLines(t.id);
      return (
        sum +
        lines
          .filter((m) => m.leg === 'origin' && (!entityId || m.entity_id === entityId))
          .reduce((lineSum, m) => lineSum + m.quantity, 0)
      );
    }, 0);
}

export function isLowStock(entity) {
  if (!entity || entity.stockMin == null) return false;
  return calculateStock(entity.entity_id) < entity.stockMin;
}

export function validateMovement(data = {}, { internal = false } = {}) {
  const errors = {};
  const value = {};

  value.entity_id = trimString(data.entity_id);
  if (!value.entity_id) {
    errors.entity_id = 'El producto es obligatorio.';
  } else if (!getEntity(value.entity_id)) {
    errors.entity_id = 'El producto referenciado no existe.';
  }

  value.warehouse_id = trimString(data.warehouse_id);
  if (!value.warehouse_id) {
    errors.warehouse_id = 'La bodega es obligatoria.';
  } else {
    const warehouse = getWarehouse(value.warehouse_id);
    if (!warehouse) {
      errors.warehouse_id = 'La bodega referenciada no existe.';
    } else if (!warehouse.active) {
      errors.warehouse_id = `La bodega "${warehouse.name}" está desactivada.`;
    }
  }

  value.type = trimString(data.type);
  if (!value.type) {
    errors.type = 'El tipo de movimiento es obligatorio.';
  } else if (!MOVEMENT_TYPES.includes(value.type)) {
    errors.type = `Tipo de movimiento no soportado "${value.type}".`;
  } else if (value.type === 'traslado' && !internal) {
    errors.type = 'Los movimientos de traslado se crean desde un traslado entre bodegas.';
  }

  const quantity = optionalNumber(data.quantity, { integer: true, min: 1 });
  if (!quantity.ok || quantity.value === null) {
    errors.quantity = 'La cantidad debe ser un entero positivo.';
  }
  value.quantity = quantity.value;

  value.movementDate = trimString(data.movementDate);
  if (!value.movementDate || !isValidDate(value.movementDate)) {
    errors.movementDate = 'La fecha del movimiento es obligatoria y debe ser válida (AAAA-MM-DD).';
  }

  value.lot_id = trimString(data.lot_id);
  if (value.lot_id) {
    const lot = getLot(value.lot_id);
    if (!lot) {
      errors.lot_id = 'El lote referenciado no existe.';
    } else if (lot.entity_id !== value.entity_id) {
      errors.lot_id = 'El lote pertenece a otro producto.';
    } else if ((value.type === 'salida' || value.type === 'traslado') && isLotExpired(lot)) {
      errors.lot_id = `El lote "${lot.lotNumber}" está vencido y no puede despacharse.`;
    }
  }

  value.document_id = trimString(data.document_id);
  if (value.document_id && !getDocument(value.document_id)) {
    errors.document_id = 'El documento referenciado no existe.';
  }

  if (value.type === 'entrada') {
    value.direction = 'in';
  } else if (value.type === 'salida') {
    value.direction = 'out';
  } else if (value.type === 'ajuste') {
    const dir = trimString(data.direction);
    if (dir !== 'in' && dir !== 'out') {
      errors.direction = 'El ajuste debe indicar si aumenta (in) o disminuye (out) el saldo.';
    }
    value.direction = dir;
  }

  const unitCost = optionalNumber(data.unitCost);
  if (!unitCost.ok) errors.unitCost = 'El costo unitario debe ser un número no negativo.';
  value.unitCost = unitCost.value;

  value.notes = trimString(data.notes);
  value.status = trimString(data.status);

  if (!errors.quantity && !errors.warehouse_id && value.type === 'salida') {
    const available = calculateStock(value.entity_id, value.warehouse_id);
    if (value.quantity > available) {
      errors.quantity = `Saldo insuficiente: hay ${available} unidades disponibles en la bodega y se requieren ${value.quantity}.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadMovements() {
  return readList(KEYS.movements);
}

function saveMovements(list) {
  writeList(KEYS.movements, list);
}

export function getMovement(ref) {
  return loadMovements().find((m) => m.id === ref) ?? null;
}

function initialMovementStatus(type) {
  const lifecycle = lifecycleFor('movements', type);
  return lifecycle ? lifecycle.statuses[0] : '';
}

export function addMovement(data) {
  const { valid, errors, value } = validateMovement(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const lifecycle = lifecycleFor('movements', value.type);
  const movement = {
    ...value,
    status: value.status || initialMovementStatus(value.type),
    id: newId('mov'),
    createdAt: timestamp,
  };
  if (lifecycle) movement.statusChangedAt = timestamp;
  const list = loadMovements();
  list.push(movement);
  saveMovements(list);
  return movement;
}

function addMovementInternal(data) {
  const { valid, errors, value } = validateMovement(data, { internal: true });
  if (!valid) fail(errors);
  const timestamp = now();
  const movement = { ...value, status: trimString(data.status), id: newId('mov'), createdAt: timestamp };
  if (data.statusChangedAt) movement.statusChangedAt = data.statusChangedAt;
  if (data.returnId) movement.returnId = data.returnId;
  const list = loadMovements();
  list.push(movement);
  saveMovements(list);
  return movement;
}

export function updateMovementStatus(ref, nextStatus) {
  const list = loadMovements();
  const index = list.findIndex((m) => m.id === ref);
  if (index === -1) throw new Error('El movimiento no existe.');
  const movement = list[index];
  const lifecycle = lifecycleFor('movements', movement.type);
  const target = trimString(nextStatus);
  if (!target) throw new Error('El estado no puede estar vacío.');
  if (lifecycle) {
    const allowed = nextStates(movement.status, lifecycle);
    if (!allowed.includes(target)) {
      throw invalidTransitionError(movement.status, target, allowed);
    }
  }
  const updated = { ...movement, status: target, statusChangedAt: now() };
  list[index] = updated;
  saveMovements(list);
  return updated;
}

export function searchMovements(query = '', filters = {}) {
  let results = loadMovements();
  if (filters.entity_id) results = results.filter((m) => m.entity_id === filters.entity_id);
  if (filters.warehouse_id) results = results.filter((m) => m.warehouse_id === filters.warehouse_id);
  if (filters.type) results = results.filter((m) => m.type === filters.type);
  if (filters.from) results = results.filter((m) => m.movementDate >= filters.from);
  if (filters.to) results = results.filter((m) => m.movementDate <= filters.to);
  if (!matchesQuery([], query)) {
    results = results.filter((m) => {
      const entity = getEntity(m.entity_id);
      const warehouse = getWarehouse(m.warehouse_id);
      const lot = m.lot_id ? getLot(m.lot_id) : null;
      return matchesQuery(
        [
          m.movementDate,
          m.type,
          m.status,
          String(m.quantity),
          m.notes,
          entity ? entity.name : '',
          entity ? entity.code : '',
          warehouse ? warehouse.name : '',
          warehouse ? warehouse.code : '',
          lot ? lot.lotNumber : '',
        ],
        query
      );
    });
  }
  return clone(results);
}

/* ========================= Traslados ========================= */

export function validateTransfer(data = {}) {
  const errors = {};
  const value = {};

  value.origin_warehouse_id = trimString(data.origin_warehouse_id);
  value.destination_warehouse_id = trimString(data.destination_warehouse_id);
  if (!value.origin_warehouse_id) errors.origin_warehouse_id = 'La bodega de origen es obligatoria.';
  if (!value.destination_warehouse_id) errors.destination_warehouse_id = 'La bodega de destino es obligatoria.';
  if (!errors.origin_warehouse_id && !errors.destination_warehouse_id) {
    if (value.origin_warehouse_id === value.destination_warehouse_id) {
      errors.destination_warehouse_id = 'El origen y el destino deben ser bodegas distintas.';
    }
    const origin = getWarehouse(value.origin_warehouse_id);
    const destination = getWarehouse(value.destination_warehouse_id);
    if (!origin) errors.origin_warehouse_id = 'La bodega de origen no existe.';
    else if (!origin.active) errors.origin_warehouse_id = `La bodega "${origin.name}" está desactivada.`;
    if (!destination) errors.destination_warehouse_id = 'La bodega de destino no existe.';
    else if (!destination.active) errors.destination_warehouse_id = `La bodega "${destination.name}" está desactivada.`;
  }

  value.date = trimString(data.date) || today();
  if (!isValidDate(value.date)) errors.date = 'La fecha del traslado debe ser válida (AAAA-MM-DD).';

  value.notes = trimString(data.notes);

  const lines = Array.isArray(data.lines) ? data.lines : [];
  const cleanLines = [];
  if (lines.length === 0) {
    errors.lines = 'El traslado debe incluir al menos una línea.';
  } else {
    const shortages = [];
    const seen = new Set();
    lines.forEach((line, i) => {
      const entity_id = trimString(line?.entity_id);
      const quantity = optionalNumber(line?.quantity, { integer: true, min: 1 });
      const lot_id = trimString(line?.lot_id);
      if (!entity_id || !getEntity(entity_id)) {
        errors[`lines.${i}`] = `Línea ${i + 1}: el producto no existe.`;
        return;
      }
      if (!quantity.ok) {
        errors[`lines.${i}`] = `Línea ${i + 1}: la cantidad debe ser un entero positivo.`;
        return;
      }
      if (lot_id) {
        const lot = getLot(lot_id);
        if (!lot) {
          errors[`lines.${i}`] = `Línea ${i + 1}: el lote no existe.`;
          return;
        }
        if (lot.entity_id !== entity_id) {
          errors[`lines.${i}`] = `Línea ${i + 1}: el lote pertenece a otro producto.`;
          return;
        }
        if (isLotExpired(lot)) {
          errors[`lines.${i}`] = `Línea ${i + 1}: el lote "${lot.lotNumber}" está vencido.`;
          return;
        }
      }
      if (seen.has(entity_id)) {
        errors[`lines.${i}`] = `Línea ${i + 1}: producto duplicado en el traslado.`;
        return;
      }
      seen.add(entity_id);
      cleanLines.push({ entity_id, quantity: quantity.value, lot_id });
    });
    if (Object.keys(errors).length === 0 && !errors.origin_warehouse_id && !errors.destination_warehouse_id) {
      const totals = {};
      for (const line of cleanLines) totals[line.entity_id] = (totals[line.entity_id] ?? 0) + line.quantity;
      for (const [entity_id, needed] of Object.entries(totals)) {
        const available = calculateStock(entity_id, value.origin_warehouse_id);
        if (needed > available) {
          const entity = getEntity(entity_id);
          shortages.push(
            `Saldo insuficiente en la bodega de origen para "${entity?.name ?? entity_id}": hay ${available} y se requieren ${needed}.`
          );
        }
      }
      if (shortages.length) errors.lines = shortages.join(' ');
    }
  }

  value.lines = cleanLines;
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadTransfers() {
  return readList(KEYS.transfers);
}

function saveTransfers(list) {
  writeList(KEYS.transfers, list);
}

export function getTransfer(ref) {
  return loadTransfers().find((t) => t.id === ref || t.reference === ref) ?? null;
}

export function transferLines(transferId) {
  return loadMovements().filter((m) => m.type === 'traslado' && m.transferId === transferId);
}

function nextReference() {
  let n = loadTransfers().length + 1;
  let reference = `TR-${String(n).padStart(4, '0')}`;
  while (loadTransfers().some((t) => t.reference === reference)) {
    n += 1;
    reference = `TR-${String(n).padStart(4, '0')}`;
  }
  return reference;
}

export function createTransfer(data) {
  const { valid, errors, value } = validateTransfer(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const lifecycle = lifecycleFor('movements', 'traslado');
  const status = lifecycle ? lifecycle.statuses[0] : 'Solicitado';
  const transfer = {
    id: newId('trf'),
    reference: nextReference(),
    origin_warehouse_id: value.origin_warehouse_id,
    destination_warehouse_id: value.destination_warehouse_id,
    date: value.date,
    notes: value.notes,
    status,
    statusChangedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const legs = [];
  for (const line of value.lines) {
    legs.push({
      entity_id: line.entity_id,
      warehouse_id: value.origin_warehouse_id,
      lot_id: line.lot_id,
      document_id: '',
      type: 'traslado',
      leg: 'origin',
      transferId: transfer.id,
      direction: 'out',
      quantity: line.quantity,
      unitCost: null,
      movementDate: value.date,
      notes: `Traslado ${transfer.reference} — origen`,
      status,
      statusChangedAt: timestamp,
      id: newId('mov'),
      createdAt: timestamp,
    });
    legs.push({
      entity_id: line.entity_id,
      warehouse_id: value.destination_warehouse_id,
      lot_id: line.lot_id,
      document_id: '',
      type: 'traslado',
      leg: 'destination',
      transferId: transfer.id,
      direction: 'in',
      quantity: line.quantity,
      unitCost: null,
      movementDate: value.date,
      notes: `Traslado ${transfer.reference} — destino`,
      status,
      statusChangedAt: timestamp,
      id: newId('mov'),
      createdAt: timestamp,
    });
  }
  saveTransfers([...loadTransfers(), transfer]);
  saveMovements([...loadMovements(), ...legs]);
  return transfer;
}

function assertTransferWarehousesActive(transfer) {
  const origin = getWarehouse(transfer.origin_warehouse_id);
  const destination = getWarehouse(transfer.destination_warehouse_id);
  if (!origin || !origin.active) {
    throw new Error('No se puede despachar: la bodega de origen está desactivada.');
  }
  if (!destination || !destination.active) {
    throw new Error('No se puede despachar: la bodega de destino está desactivada.');
  }
}

function assertTransferAvailability(transfer) {
  const totals = {};
  for (const line of transferLines(transfer.id)) {
    if (line.leg !== 'origin') continue;
    totals[line.entity_id] = (totals[line.entity_id] ?? 0) + line.quantity;
  }
  for (const [entity_id, needed] of Object.entries(totals)) {
    const available = calculateStock(entity_id, transfer.origin_warehouse_id);
    if (needed > available) {
      const entity = getEntity(entity_id);
      throw new Error(
        `Saldo insuficiente en la bodega de origen para "${entity?.name ?? entity_id}": hay ${available} y se requieren ${needed}.`
      );
    }
  }
}

export function updateTransferStatus(transferId, nextStatus) {
  const list = loadTransfers();
  const index = list.findIndex((t) => t.id === transferId || t.reference === transferId);
  if (index === -1) throw new Error('El traslado no existe.');
  const transfer = list[index];
  const lifecycle = lifecycleFor('movements', 'traslado');
  const target = trimString(nextStatus);
  if (!target) throw new Error('El estado no puede estar vacío.');
  if (lifecycle) {
    const allowed = nextStates(transfer.status, lifecycle);
    if (!allowed.includes(target)) {
      throw invalidTransitionError(transfer.status, target, allowed);
    }
  }
  if (target === 'Despachado') {
    assertTransferWarehousesActive(transfer);
    assertTransferAvailability(transfer);
  }
  if (target === 'Recibido') {
    assertTransferWarehousesActive(transfer);
  }
  const timestamp = now();
  const updated = { ...transfer, status: target, statusChangedAt: timestamp, updatedAt: timestamp };
  list[index] = updated;
  saveTransfers(list);

  const movements = loadMovements();
  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];
    if (m.type === 'traslado' && m.transferId === updated.id) {
      movements[i] = { ...m, status: target, statusChangedAt: timestamp };
    }
  }
  saveMovements(movements);
  return updated;
}

export function searchTransfers(query = '', filters = {}) {
  let results = loadTransfers();
  if (filters.status) results = results.filter((t) => t.status === filters.status);
  if (!matchesQuery([], query)) {
    results = results.filter((t) => {
      const origin = getWarehouse(t.origin_warehouse_id);
      const destination = getWarehouse(t.destination_warehouse_id);
      const lineNames = transferLines(t.id).map((m) => {
        const entity = getEntity(m.entity_id);
        return entity ? `${entity.name} ${entity.code}` : '';
      });
      return matchesQuery(
        [
          t.reference,
          t.status,
          t.date,
          t.notes,
          origin ? origin.name : '',
          destination ? destination.name : '',
          ...lineNames,
        ],
        query
      );
    });
  }
  return clone(results);
}

/* ========================= Devoluciones ========================= */

function dispatchedQuantity(movementKind, referenceId, entityId) {
  if (movementKind === 'movement') {
    const movement = getMovement(referenceId);
    return movement ? movement.quantity : 0;
  }
  return transferLines(referenceId)
    .filter((m) => m.leg === 'origin' && (!entityId || m.entity_id === entityId))
    .reduce((sum, m) => sum + m.quantity, 0);
}

function alreadyReturned(movementKind, referenceId, entityId, ignoreId = null) {
  return loadReturns()
    .filter(
      (r) =>
        r.id !== ignoreId &&
        r.movement_kind === movementKind &&
        r.movement_id === referenceId &&
        r.status !== 'Rechazada' &&
        (movementKind === 'movement' || !entityId || r.entity_id === entityId)
    )
    .reduce((sum, r) => sum + r.quantity_good + r.quantity_damaged, 0);
}

export function validateReturn(data = {}, { ignoreId = null } = {}) {
  const errors = {};
  const value = {};

  value.movement_kind = trimString(data.movement_kind);
  if (!RETURN_KINDS.includes(value.movement_kind)) {
    errors.movement_kind = 'La referencia debe ser una salida o un traslado.';
  }

  value.movement_id = trimString(data.movement_id);
  if (!value.movement_id) {
    errors.movement_id = 'Debe indicar el movimiento o traslado original.';
  } else if (value.movement_kind === 'movement') {
    const movement = getMovement(value.movement_id);
    if (!movement) {
      errors.movement_id = 'El movimiento original no existe.';
    } else if (movement.type !== 'salida') {
      errors.movement_id = 'Solo se pueden devolver movimientos de tipo salida.';
    } else {
      const lifecycle = lifecycleFor('movements', 'salida');
      if (lifecycle && movement.status !== 'Entregado') {
        errors.movement_id = `La salida debe estar en estado "Entregado" para devolverla (estado actual: ${movement.status || 'sin estado'}).`;
      }
      value.entity_id = movement.entity_id;
      value.warehouse_id = movement.warehouse_id;
    }
  } else if (value.movement_kind === 'transfer') {
    const transfer = getTransfer(value.movement_id);
    if (!transfer) {
      errors.movement_id = 'El traslado original no existe.';
    } else if (transfer.status !== 'Recibido') {
      errors.movement_id = `El traslado debe estar en estado "Recibido" para devolverlo (estado actual: ${transfer.status}).`;
    } else {
      const requested = trimString(data.entity_id);
      const lines = transferLines(transfer.id).filter((m) => m.leg === 'origin');
      const distinct = [...new Set(lines.map((m) => m.entity_id))];
      if (requested) {
        if (!distinct.includes(requested)) {
          errors.entity_id = 'El producto no forma parte de este traslado.';
        } else {
          value.entity_id = requested;
        }
      } else if (distinct.length === 1) {
        value.entity_id = distinct[0];
      } else {
        errors.entity_id = 'Debe indicar qué producto del traslado se devuelve.';
      }
      value.warehouse_id = transfer.origin_warehouse_id;
      value.destination_warehouse_id = transfer.destination_warehouse_id;
    }
  }

  value.reason = trimString(data.reason);
  if (!value.reason) {
    errors.reason = 'El motivo de la devolución es obligatorio.';
  } else if (!RETURN_REASONS.includes(value.reason)) {
    errors.reason = `Motivo no permitido. Use uno de: ${RETURN_REASONS.join(', ')}.`;
  }

  const good = optionalNumber(data.quantity_good, { integer: true, min: 0 });
  const damaged = optionalNumber(data.quantity_damaged, { integer: true, min: 0 });
  if (!good.ok) errors.quantity_good = 'La cantidad en condiciones debe ser un entero no negativo.';
  if (!damaged.ok) errors.quantity_damaged = 'La cantidad dañada debe ser un entero no negativo.';
  value.quantity_good = good.value ?? 0;
  value.quantity_damaged = damaged.value ?? 0;
  if (!errors.quantity_good && !errors.quantity_damaged) {
    if (value.quantity_good + value.quantity_damaged < 1) {
      errors.quantity_good = 'La devolución debe indicar al menos una unidad.';
    } else if (!errors.movement_id && !errors.entity_id) {
      const dispatched = dispatchedQuantity(value.movement_kind, value.movement_id, value.entity_id);
      const prior = alreadyReturned(value.movement_kind, value.movement_id, value.entity_id, ignoreId);
      const remaining = dispatched - prior;
      if (value.quantity_good + value.quantity_damaged > remaining) {
        errors.quantity_good = `La cantidad devuelta (${value.quantity_good + value.quantity_damaged}) supera la cantidad despachada disponible (${remaining}).`;
      }
    }
  }

  value.notes = trimString(data.notes);

  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function loadReturns() {
  return readList(KEYS.returns);
}

function saveReturns(list) {
  writeList(KEYS.returns, list);
}

export function getReturn(ref) {
  return loadReturns().find((r) => r.id === ref) ?? null;
}

function createReturnAdjustment(record, direction, warehouseId, quantity) {
  if (quantity <= 0) return;
  addMovementInternal({
    entity_id: record.entity_id,
    warehouse_id: warehouseId,
    type: 'ajuste',
    direction,
    quantity,
    movementDate: today(),
    notes: `Devolución ${record.id.slice(0, 12)} — ${record.reason}`,
    status: '',
    returnId: record.id,
  });
}

export function createReturn(data) {
  const { valid, errors, value } = validateReturn(data);
  if (!valid) fail(errors);
  const timestamp = now();
  const lifecycle = returnsLifecycle();
  const record = {
    ...value,
    status: lifecycle ? lifecycle.statuses[0] : 'Solicitada',
    stockApplied: false,
    id: newId('ret'),
    statusChangedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  saveReturns([...loadReturns(), record]);
  return record;
}

function applyReturnStock(record) {
  if (record.stockApplied || record.quantity_good <= 0) return record;
  if (record.movement_kind === 'movement') {
    const movement = getMovement(record.movement_id);
    if (movement) createReturnAdjustment(record, 'in', movement.warehouse_id, record.quantity_good);
  } else {
    const transfer = getTransfer(record.movement_id);
    if (transfer) {
      createReturnAdjustment(record, 'out', transfer.destination_warehouse_id, record.quantity_good);
      createReturnAdjustment(record, 'in', transfer.origin_warehouse_id, record.quantity_good);
    }
  }
  return { ...record, stockApplied: true };
}

export function updateReturnStatus(ref, nextStatus) {
  const list = loadReturns();
  const index = list.findIndex((r) => r.id === ref);
  if (index === -1) throw new Error('La devolución no existe.');
  const record = list[index];
  const lifecycle = returnsLifecycle();
  const target = trimString(nextStatus);
  if (!target) throw new Error('El estado no puede estar vacío.');
  if (lifecycle) {
    const allowed = nextStates(record.status, lifecycle);
    if (!allowed.includes(target)) {
      const options = allowed.length ? allowed.join(', ') : 'ninguno (estado final)';
      throw new Error(`Transición de estado inválida: "${record.status}" → "${target}". Estados permitidos: ${options}.`);
    }
  }
  const timestamp = now();
  let updated = { ...record, status: target, statusChangedAt: timestamp, updatedAt: timestamp };
  if (target === 'Recibida en bodega') {
    updated = applyReturnStock(updated);
    updated.updatedAt = timestamp;
  }
  list[index] = updated;
  saveReturns(list);
  return updated;
}

export function searchReturns(query = '', filters = {}) {
  let results = loadReturns();
  if (filters.status) results = results.filter((r) => r.status === filters.status);
  if (!matchesQuery([], query)) {
    results = results.filter((r) => {
      const entity = r.entity_id ? getEntity(r.entity_id) : null;
      const reference =
        r.movement_kind === 'movement'
          ? getMovement(r.movement_id)?.notes ?? ''
          : getTransfer(r.movement_id)?.reference ?? '';
      return matchesQuery(
        [r.reason, r.status, r.notes, String(r.quantity_good), String(r.quantity_damaged), entity?.name ?? '', reference],
        query
      );
    });
  }
  return clone(results);
}

/* ========================= Utilidades generales ========================= */

export function clearAll() {
  for (const key of Object.values(KEYS)) getStorage().removeItem(key);
}

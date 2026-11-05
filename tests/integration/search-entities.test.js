import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addWarehouse, addMovement, loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
}

function resultRows() {
  return [...qs('search-results-list').querySelectorAll('.record-item')];
}

function resultCodes() {
  return resultRows().map((row) => row.dataset.entityId);
}

function typeQuery(value) {
  const input = qs('search-input');
  input.value = value;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

function setFilter(id, value) {
  const el = qs(id);
  el.value = value;
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

function toggleLowFilter() {
  const el = qs('search-filter-low');
  el.checked = !el.checked;
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
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
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 11 - pantalla de búsqueda de productos', () => {
  it('abre la pantalla de búsqueda con el campo enfocado', () => {
    qs('nav-search').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(document.activeElement).toBe(qs('search-input'));
  });

  it('encuentra productos por SKU y por nombre sin distinguir tildes ni mayúsculas', () => {
    addEntity({ name: 'Papel Acrílico', code: 'PAP-001', category: 'Materia prima' });
    addEntity({ name: 'Tornillo', code: 'TOR-002', category: 'Insumo' });
    qs('nav-search').click();

    typeQuery('pap-001');
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].textContent).toContain('Papel Acrílico');

    typeQuery('ACRILICO');
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].textContent).toContain('PAP-001');

    typeQuery('tornillo');
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].textContent).toContain('TOR-002');
  });

  it('filtra por categoría, almacén y solo stock bajo de forma combinada', () => {
    const central = addWarehouse({ code: 'CEN', name: 'Central' });
    const norte = addWarehouse({ code: 'NOR', name: 'Norte' });
    const papel = addEntity({ name: 'Papel', code: 'P-1', category: 'Materia prima', stockMin: 10 });
    const tinta = addEntity({ name: 'Tinta', code: 'T-2', category: 'Materia prima', stockMin: 10 });
    const clavo = addEntity({ name: 'Clavo', code: 'C-3', category: 'Insumo', stockMin: 10 });
    addMovement({
      entity_id: papel.entity_id,
      warehouse_id: central.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });
    addMovement({
      entity_id: tinta.entity_id,
      warehouse_id: central.id,
      type: 'entrada',
      quantity: 20,
      movementDate: '2026-08-01',
    });
    addMovement({
      entity_id: clavo.entity_id,
      warehouse_id: norte.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });

    qs('nav-search').click();

    setFilter('search-filter-category', 'Materia prima');
    toggleLowFilter();
    expect(resultCodes()).toEqual([papel.entity_id]);

    setFilter('search-filter-warehouse', central.id);
    expect(resultCodes()).toEqual([papel.entity_id]);

    toggleLowFilter();
    expect(new Set(resultCodes())).toEqual(new Set([papel.entity_id, tinta.entity_id]));

    setFilter('search-filter-category', 'Insumo');
    setFilter('search-filter-warehouse', norte.id);
    expect(resultCodes()).toEqual([clavo.entity_id]);
  });

  it('muestra el stock actual y la marca de stock bajo en los resultados', () => {
    const central = addWarehouse({ code: 'CEN', name: 'Central' });
    const bajo = addEntity({ name: 'Papel', code: 'P-1', stockMin: 10 });
    const igual = addEntity({ name: 'Tinta', code: 'T-2', stockMin: 5 });
    addMovement({
      entity_id: bajo.entity_id,
      warehouse_id: central.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });
    addMovement({
      entity_id: igual.entity_id,
      warehouse_id: central.id,
      type: 'entrada',
      quantity: 5,
      movementDate: '2026-08-01',
    });

    qs('nav-search').click();
    const bajoRow = resultRows().find((row) => row.textContent.includes('P-1'));
    const igualRow = resultRows().find((row) => row.textContent.includes('T-2'));

    expect(bajoRow.textContent).toContain('Stock: 5');
    expect(bajoRow.querySelector('.badge.low').textContent).toBe('Stock bajo');
    expect(igualRow.textContent).toContain('Stock: 5');
    expect(igualRow.querySelector('.badge.low')).toBeNull();
  });

  it('muestra un estado vacío claro cuando no hay coincidencias', () => {
    addEntity({ name: 'Acme', code: 'AC-001' });
    qs('nav-search').click();
    expect(qs('search-empty').hidden).toBe(true);
    expect(resultRows()).toHaveLength(1);

    typeQuery('zzz-nothing');
    expect(qs('search-empty').hidden).toBe(false);
    expect(qs('search-results-list').children).toHaveLength(0);

    typeQuery('acme');
    expect(qs('search-empty').hidden).toBe(true);
    expect(resultRows()).toHaveLength(1);
  });

  it('muestra los resultados de forma segura sin interpretar HTML', () => {
    const malicioso = addEntity({
      name: '<img src="x" onerror="window.__xss=1">',
      code: 'X-1',
    });

    qs('nav-search').click();
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].querySelector('img')).toBeNull();
    expect(resultRows()[0].textContent).toContain('<img src="x"');
    expect(globalThis.window.__xss).toBeUndefined();
    expect(loadEntities()[0].entity_id).toBe(malicioso.entity_id);
  });

  it('responde con prontitud ante 500 productos', () => {
    for (let i = 0; i < 500; i++) {
      addEntity({ name: `Item ${i}`, code: `IT-${String(i).padStart(4, '0')}` });
    }
    qs('nav-search').click();
    const start = Date.now();
    typeQuery('IT-0499');
    const elapsed = Date.now() - start;
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].textContent).toContain('IT-0499');
    expect(elapsed).toBeLessThan(1000);
  });

  it('abre el detalle en modo solo lectura desde un resultado y vuelve a la búsqueda', () => {
    const producto = addEntity({ name: 'Papel Acrílico', code: 'PAP-001' });
    qs('nav-search').click();
    typeQuery('pap-001');

    resultRows()[0].querySelector('[data-action="open"]').click();
    expect(qs('view-product').hidden).toBe(false);
    expect(qs('view-product').querySelector('h1').textContent).toBe('Papel Acrílico');
    expect(qs('product-stock')).toBeTruthy();
    expect(qs('entity-form')).toBeNull();
    expect(qs('view-product').querySelector('[data-action="edit"]')).toBeNull();

    qs('btn-back-entities').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(qs('search-input').value).toBe('pap-001');
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].dataset.entityId).toBe(producto.entity_id);
  });

  it('mantiene los resultados sincronizados al crear productos', () => {
    qs('nav-search').click();
    expect(qs('search-empty').hidden).toBe(false);
    expect(resultRows()).toHaveLength(0);

    qs('nav-dashboard').click();
    addEntity({ name: 'Producto Tarde', code: 'LT-9' });
    qs('nav-search').click();
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0].textContent).toContain('Producto Tarde');
    expect(qs('search-empty').hidden).toBe(true);
  });
});

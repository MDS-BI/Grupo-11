import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, loadDocuments, addWarehouse } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;
let product;

function qs(id) {
  return document.getElementById(id);
}

function submitDocumentForm() {
  qs('document-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function fillDocument(overrides = {}) {
  qs('document-type').value = 'orden-compra';
  qs('document-series').value = 'OC';
  qs('document-folio').value = '1001';
  qs('document-start-date').value = '2026-08-01';
  qs('document-end-date').value = '2026-08-05';
  for (const [id, value] of Object.entries(overrides)) {
    qs(id).value = value;
  }
}

function documentRow(text) {
  return [...qs('document-list').querySelectorAll('.record-item')].find((item) =>
    item.textContent.includes(text)
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
});

afterEach(() => {
  dom.window.close();
});

function openProductDocuments() {
  app.navigate('product', { entity_id: product.entity_id });
}

describe('Historia de Usuario 10 - documentos de respaldo de logística', () => {
  it('abre los documentos en el detalle del producto con lista y formulario', async () => {
    openProductDocuments();
    expect(qs('document-form')).toBeTruthy();
    expect(qs('document-list')).toBeTruthy();
    expect(qs('document-list-empty').hidden).toBe(false);
    expect(qs('document-list-empty').textContent).toContain('Papel');
  });

  it('crea una orden de compra con serie, folio y fechas validadas', async () => {
    openProductDocuments();
    fillDocument();
    submitDocumentForm();

    expect(qs('document-form-feedback').textContent).toBe('Documento guardado correctamente.');
    expect(loadDocuments()).toHaveLength(1);
    expect(loadDocuments()[0].entity_id).toBe(product.entity_id);
    expect(loadDocuments()[0].folio).toBe(1001);

    const row = documentRow('OC-1001');
    expect(row).toBeTruthy();
    expect(row.textContent).toContain('Orden de compra');
    expect(row.querySelector('.badge').textContent).toBe('Borrador');
    expect(qs('document-list-empty').hidden).toBe(true);
  });

  it('valida tipo, folio y fechas obligatorias con folio entero positivo', async () => {
    openProductDocuments();
    fillDocument({ 'document-folio': '', 'document-start-date': '', 'document-end-date': '' });
    qs('document-type').value = '';
    submitDocumentForm();

    expect(qs('error-document-type').textContent).toContain('obligatorio');
    expect(qs('error-document-folio').textContent).toContain('obligatorio');
    expect(qs('error-document-start-date').textContent).toContain('AAAA-MM-DD');
    expect(qs('error-document-end-date').textContent).toContain('AAAA-MM-DD');
    expect(loadDocuments()).toHaveLength(0);

    fillDocument({ 'document-folio': '0' });
    submitDocumentForm();
    expect(qs('error-document-folio').textContent).toContain('entero positivo');

    fillDocument({ 'document-folio': '2.5' });
    submitDocumentForm();
    expect(qs('error-document-folio').textContent).toContain('entero positivo');
    expect(loadDocuments()).toHaveLength(0);
  });

  it('rechaza una fecha de fin anterior a la de inicio', async () => {
    openProductDocuments();
    fillDocument({ 'document-end-date': '2026-07-01' });
    submitDocumentForm();

    expect(qs('error-document-end-date').textContent).toContain('no puede ser anterior');
    expect(loadDocuments()).toHaveLength(0);
  });

  it('edita un documento existente con el formulario precargado', async () => {
    openProductDocuments();
    fillDocument();
    submitDocumentForm();

    documentRow('OC-1001').querySelector('[data-action="edit"]').click();
    expect(qs('document-form-title').textContent).toBe('Actualizar documento');
    expect(qs('document-folio').value).toBe('1001');
    expect(qs('document-cancel').hidden).toBe(false);

    qs('document-folio').value = '1002';
    submitDocumentForm();

    expect(qs('document-form-feedback').textContent).toBe('Documento actualizado correctamente.');
    expect(loadDocuments()[0].folio).toBe(1002);
    expect(documentRow('OC-1002')).toBeTruthy();
  });

  it('elimina un documento con confirmación', async () => {
    openProductDocuments();
    fillDocument();
    submitDocumentForm();

    documentRow('OC-1001').querySelector('[data-action="delete"]').click();
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(loadDocuments()).toHaveLength(0);
    expect(qs('document-list-feedback').textContent).toBe('Documento eliminado correctamente.');
    expect(qs('document-list-empty').hidden).toBe(false);
  });

  it('elimina los documentos en cascada al eliminar el producto', async () => {
    const other = addEntity({ name: 'Tinta', code: 'T-1' });
    openProductDocuments();
    fillDocument();
    submitDocumentForm();

    const { addDocument } = await import('../../src/storage.js');
    addDocument({
      entity_id: other.entity_id,
      type: 'remision',
      folio: 2001,
      startDate: '2026-08-02',
      endDate: '2026-08-06',
    });
    expect(loadDocuments()).toHaveLength(2);

    app.navigate('entities');
    const row = [...qs('entity-list').querySelectorAll('.record-item')].find((item) =>
      item.textContent.includes('Papel')
    );
    row.querySelector('[data-action="delete"]').click();

    const docs = loadDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].entity_id).toBe(other.entity_id);
  });

  it('permite vincular opcionalmente un movimiento al documento que lo origina', async () => {
    openProductDocuments();
    fillDocument();
    submitDocumentForm();
    const documentId = loadDocuments()[0].id;

    const warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
    app.navigate('movements');
    qs('movement-product').value = product.entity_id;
    qs('movement-product').dispatchEvent(new dom.window.Event('change', { bubbles: true }));

    const options = [...qs('movement-document').options].map((o) => o.value);
    expect(options).toContain(documentId);

    qs('movement-type').value = 'entrada';
    qs('movement-warehouse').value = warehouse.id;
    qs('movement-quantity').value = '5';
    qs('movement-date').value = '2026-08-01';
    qs('movement-document').value = documentId;
    qs('movement-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));

    expect(loadDocuments()).toHaveLength(1);
    const movement = (await import('../../src/storage.js')).loadMovements()[0];
    expect(movement.document_id).toBe(documentId);
    expect(movement.entity_id).toBe(product.entity_id);
  });
});

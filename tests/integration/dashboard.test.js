import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
}

const ventasConfig = {
  moduleName: 'Ventas',
  labels: {
    entity: 'Cliente',
    entities: 'Clientes',
    document: 'Pedido de Venta',
    documents: 'Pedidos de Venta',
  },
};

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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride) {
  await app.initApp(normalizeConfig(configOverride));
}

function submitEntityForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Historia de Usuario 3 - panel con acciones rápidas y estadísticas', () => {
  it('abre en el panel con las demás vistas ocultas', async () => {
    await bootWith(undefined);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('view-movements').hidden).toBe(true);
    expect(qs('view-warehouses').hidden).toBe(true);
    expect(qs('view-search').hidden).toBe(true);
  });

  it('muestra al menos cuatro acciones rápidas con las etiquetas por defecto de Logística e Inventario', async () => {
    await bootWith(undefined);
    expect(document.querySelectorAll('.action-grid .action-btn').length).toBeGreaterThanOrEqual(4);
    expect(qs('action-new-entity-title').textContent).toBe('Nuevo producto');
    expect(qs('action-new-movement-title').textContent).toBe('Nuevo movimiento');
    expect(qs('action-open-entities-title').textContent).toBe('Gestionar productos');
    expect(qs('action-find-title').textContent).toBe('Buscar registros');
  });

  it('usa la terminología configurada en las acciones y las tarjetas de estadísticas', async () => {
    await bootWith(ventasConfig);
    expect(qs('action-new-entity-title').textContent).toBe('Nuevo cliente');
    expect(qs('action-open-entities-title').textContent).toBe('Gestionar clientes');
    expect(qs('stat-entities-label').textContent).toBe('Clientes');
    expect(qs('stat-documents-label').textContent).toBe('Pedidos de Venta');
  });

  it('muestra estadísticas vivas que coinciden con los registros almacenados', async () => {
    await bootWith(undefined);
    expect(qs('stat-entities').textContent).toBe('0');
    expect(qs('stat-documents').textContent).toBe('0');

    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addEntity({ name: 'Globex', code: 'GL-002' });
    addDocument({
      entity_id: entity.entity_id,
      type: 'remision',
      folio: 1001,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
    });

    qs('nav-dashboard').click();
    expect(qs('stat-entities').textContent).toBe('2');
    expect(qs('stat-documents').textContent).toBe('1');
  });

  it('refresca las estadísticas después de crear registros en otras pantallas', async () => {
    await bootWith(undefined);
    qs('nav-entities').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitEntityForm();
    expect(loadEntities().length).toBe(1);

    qs('nav-dashboard').click();
    expect(qs('stat-entities').textContent).toBe('1');
  });

  it('abre la gestión de productos con el formulario vacío y el foco en el nombre', async () => {
    await bootWith(undefined);
    qs('nav-entities').click();
    qs('name').value = 'Borrador sin guardar';
    qs('nav-dashboard').click();

    qs('action-new-entity').click();
    expect(qs('view-entities').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(true);
    expect(qs('name').value).toBe('');
    expect(document.activeElement).toBe(qs('name'));
  });

  it('abre la pantalla de movimientos con la acción rápida correspondiente', async () => {
    await bootWith(undefined);
    qs('action-new-movement').click();
    expect(qs('view-movements').hidden).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(true);
    expect(qs('nav-movements').getAttribute('aria-current')).toBe('page');
  });

  it('abre la pantalla de búsqueda con el campo enfocado mediante la acción rápida', async () => {
    await bootWith(undefined);
    qs('action-find').click();
    expect(qs('view-search').hidden).toBe(false);
    expect(document.activeElement).toBe(qs('search-input'));
  });
});

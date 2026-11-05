import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { loadEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
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
});

afterEach(() => {
  dom.window.close();
});

function submitForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Historia de Usuario 13 - reetiquetado desde la configuración (FR-029, XR-002)', () => {
  it('habla la terminología por defecto de Logística e Inventario en todas las pantallas', async () => {
    await app.initApp(normalizeConfig(undefined));
    expect(qs('brand-name').textContent).toBe('Logística e Inventario');
    expect(qs('nav-dashboard-label').textContent).toBe('Panel');
    expect(qs('nav-entities-label').textContent).toBe('Productos');
    expect(qs('nav-movements-label').textContent).toBe('Movimientos');
    expect(qs('nav-warehouses-label').textContent).toBe('Bodegas');
    expect(qs('nav-search-label').textContent).toBe('Buscar');

    app.navigate('entities');
    expect(qs('view-entities').querySelector('h1').textContent).toBe('Productos');
    expect(qs('entity-form-title').textContent).toBe('Nuevo Producto');
    expect(qs('btn-new-entity').textContent).toBe('Nuevo producto');
    expect(qs('entity-list-empty').hidden).toBe(false);
    expect(qs('entity-list-empty').textContent).toBe('No hay Productos todavía.');

    qs('name').value = 'Papel';
    qs('code').value = 'P-1';
    submitForm();
    expect(qs('entity-form-feedback').textContent).toBe('Producto guardado correctamente.');
    expect(qs('entity-list-empty').hidden).toBe(true);
    expect(loadEntities().length).toBe(1);
  });

  it('aplica los términos configurados a barra lateral, formularios, listas y mensajes', async () => {
    await app.initApp(
      normalizeConfig({
        moduleName: 'Ventas',
        labels: {
          entity: 'Cliente',
          entities: 'Clientes',
          movement: 'Pedido',
          movements: 'Pedidos',
          warehouse: 'Sucursal',
          warehouses: 'Sucursales',
        },
      })
    );
    expect(qs('brand-name').textContent).toBe('Ventas');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('nav-movements-label').textContent).toBe('Pedidos');
    expect(qs('nav-warehouses-label').textContent).toBe('Sucursales');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');

    app.navigate('entities');
    expect(qs('view-entities').querySelector('h1').textContent).toBe('Clientes');
    expect(qs('entity-form-title').textContent).toBe('Nuevo Cliente');
    expect(qs('btn-new-entity').textContent).toBe('Nuevo cliente');

    qs('name').value = 'Acme';
    qs('code').value = 'AC-1';
    submitForm();
    expect(qs('entity-form-feedback').textContent).toBe('Cliente guardado correctamente.');
    expect(qs('entity-list').textContent).toContain('Acme');
    expect(loadEntities().length).toBe(1);

    const { deleteEntity } = await import('../../src/storage.js');
    deleteEntity(loadEntities()[0].id);
    app.navigate('dashboard');
    app.navigate('entities');
    expect(qs('entity-list-empty').textContent).toBe('No hay Clientes todavía.');
  });

  it('deriva las etiquetas de navegación y acciones rápidas cuando no se proporcionan', async () => {
    await app.initApp(normalizeConfig({ labels: { entity: 'Producto terminado', entities: 'Productos terminados' } }));
    expect(qs('nav-entities-label').textContent).toBe('Productos terminados');
    app.navigate('entities');
    expect(qs('btn-new-entity').textContent).toBe('Nuevo producto terminado');
  });
});

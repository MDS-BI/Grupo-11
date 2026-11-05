import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities, loadDocuments } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
const css = fs.readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
}

const brandedConfig = {
  moduleName: 'Sales Suite',
  theme: { accentColor: '#0f62fe' },
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
  await app.initApp(normalizeConfig(brandedConfig));
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 13 - marco del espacio de trabajo ERP', () => {
  it('muestra la barra superior con logotipo SVG derivado y el nombre del módulo en cada pantalla', () => {
    expect(qs('logo-mark').querySelector('svg')).not.toBeNull();
    expect(qs('brand-name').textContent).toBe('Sales Suite');
    expect(document.querySelector('.topbar .brand')).not.toBeNull();

    for (const route of ['entities', 'movements', 'warehouses', 'search', 'dashboard']) {
      app.navigate(route);
      expect(qs('logo-mark').querySelector('svg')).not.toBeNull();
      expect(qs('brand-name').textContent).toBe('Sales Suite');
      expect(document.querySelector('.topbar')).not.toBeNull();
    }
  });

  it('deriva las iniciales del monograma a partir del nombre del módulo', () => {
    expect(qs('logo-mark').querySelector('svg text').textContent).toBe('SS');
  });

  it('ofrece los cinco botones de módulo en la barra lateral con la terminología configurada', () => {
    expect(qs('nav-dashboard-label').textContent).toBe('Panel');
    expect(qs('nav-entities-label').textContent).toBe('Productos');
    expect(qs('nav-movements-label').textContent).toBe('Movimientos');
    expect(qs('nav-warehouses-label').textContent).toBe('Bodegas');
    expect(qs('nav-search-label').textContent).toBe('Buscar');
    expect(document.querySelectorAll('.nav-module').length).toBe(5);
  });

  it('usa términos reetiquetados en la barra lateral para módulos adaptados', async () => {
    vi.resetModules();
    const fresh = await import('../../src/app.js');
    await fresh.initApp(
      normalizeConfig({
        moduleName: 'Ventas',
        labels: { entity: 'Cliente', entities: 'Clientes', movement: 'Pedido', movements: 'Pedidos' },
      })
    );
    expect(qs('brand-name').textContent).toBe('Ventas');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('nav-movements-label').textContent).toBe('Pedidos');
  });

  it('mantiene una etiqueta accesible en cada botón de módulo para la contracción a iconos', () => {
    document.querySelectorAll('.nav-module').forEach((button) => {
      const label = button.querySelector('.nav-label');
      expect(label).not.toBeNull();
      expect(label.textContent.length).toBeGreaterThan(0);
    });
  });

  it('resalta el módulo activo al navegar por todas las pantallas', () => {
    const activeModule = () => document.querySelector('.nav-module[aria-current="page"]').dataset.module;

    expect(activeModule()).toBe('dashboard');
    expect(qs('view-dashboard').hidden).toBe(false);

    qs('nav-entities').click();
    expect(activeModule()).toBe('entities');
    expect(qs('view-entities').hidden).toBe(false);

    qs('nav-movements').click();
    expect(activeModule()).toBe('movements');
    expect(qs('view-movements').hidden).toBe(false);

    qs('nav-warehouses').click();
    expect(activeModule()).toBe('warehouses');
    expect(qs('view-warehouses').hidden).toBe(false);

    qs('nav-search').click();
    expect(activeModule()).toBe('search');
    expect(qs('view-search').hidden).toBe(false);

    qs('nav-dashboard').click();
    expect(activeModule()).toBe('dashboard');
    expect(qs('view-dashboard').hidden).toBe(false);
  });

  it('conserva todos los datos almacenados al navegar entre módulos', () => {
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addDocument({
      entity_id: entity.entity_id,
      type: 'remision',
      folio: 1001,
      startDate: '2026-08-01',
      endDate: '2026-08-05',
    });

    qs('nav-entities').click();
    qs('nav-movements').click();
    qs('nav-warehouses').click();
    qs('nav-search').click();
    qs('nav-dashboard').click();

    expect(loadEntities().length).toBe(1);
    expect(loadDocuments().length).toBe(1);
    expect(loadEntities()[0].name).toBe('Acme');
  });

  it('aplica el color de acento configurado a la raíz del documento', () => {
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#0f62fe');
  });

  it('retrocede al color de acento predeterminado cuando el valor no es válido', async () => {
    vi.resetModules();
    const fresh = await import('../../src/app.js');
    await fresh.initApp(normalizeConfig({ moduleName: 'X', theme: { accentColor: 'not-a-color' } }));
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#2563eb');
  });

  it('define la contracción de la barra lateral a columna de iconos en pantallas estrechas (FR-039)', () => {
    expect(css).toMatch(/@media \(max-width:\s*768px\)/);
    expect(css).toMatch(/\.sidebar \.nav-label/);
    expect(qs('sidebar')).not.toBeNull();
  });
});

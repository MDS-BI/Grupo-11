import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import {
  addEntity,
  addWarehouse,
  addDocument,
  loadEntities,
  loadWarehouses,
  loadDocuments,
} from '../../src/storage.js';
import { isLoggedIn } from '../../src/auth.js';
import { SEED_PRODUCTS } from '../../src/seed.js';
import { seedSession } from '../helpers/auth.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let app;

function qs(id) {
  return document.getElementById(id);
}

function seedBusinessData() {
  const entity = addEntity({ name: 'Acme', code: 'AC-001' });
  addWarehouse({ code: 'B-99', name: 'Bodega Extra' });
  addDocument({
    entity_id: entity.entity_id,
    type: 'remision',
    folio: 1001,
    startDate: '2026-08-01',
    endDate: '2026-08-05',
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
  seedSession();
  vi.resetModules();
  app = await import('../../src/app.js');
  await app.initApp(normalizeConfig(undefined));
});

afterEach(() => {
  dom.window.close();
});

describe('Restablecer datos locales desde la barra superior', () => {
  it('ofrece el botón de restablecer junto al de cerrar sesión', () => {
    expect(qs('reset-data-btn')).not.toBeNull();
    expect(qs('reset-data-btn').hidden).toBe(false);
    expect(qs('reset-data-btn').textContent.trim()).toBe('Restablecer datos');
    expect(document.querySelector('.topbar-actions #logout-btn')).not.toBeNull();
  });

  it('limpia los datos de negocio, repone la siembra de demostración y conserva la sesión', () => {
    seedBusinessData();
    expect(loadEntities().length).toBe(1);

    qs('reset-data-btn').click();

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    const names = loadEntities().map((entity) => entity.name);
    expect(names.sort()).toEqual(SEED_PRODUCTS.map((product) => product.name).sort());
    expect(names).not.toContain('Acme');
    expect(loadWarehouses()).toEqual([]);
    expect(loadDocuments()).toEqual([]);
    expect(isLoggedIn()).toBe(true);
    expect(qs('login-screen')).toBeNull();
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('reset-data-btn').hidden).toBe(false);
  });

  it('no borra nada cuando el usuario cancela la confirmación', () => {
    seedBusinessData();
    globalThis.confirm = vi.fn(() => false);

    qs('reset-data-btn').click();

    expect(globalThis.confirm).toHaveBeenCalledTimes(1);
    expect(loadEntities().map((entity) => entity.name)).toEqual(['Acme']);
    expect(loadWarehouses().length).toBe(1);
    expect(loadDocuments().length).toBe(1);
  });

  it('no aparece en la pantalla de inicio de sesión', async () => {
    dom = new JSDOM(html, { url: 'http://localhost/' });
    const w = dom.window;
    globalThis.window = w;
    globalThis.document = w.document;
    globalThis.localStorage = w.localStorage;
    w.localStorage.clear();
    vi.resetModules();
    const fresh = await import('../../src/app.js');
    await fresh.initApp(normalizeConfig(undefined));

    expect(qs('login-screen')).not.toBeNull();
    expect(qs('reset-data-btn').hidden).toBe(true);
    expect(document.querySelector('.topbar').hidden).toBe(true);
  });
});

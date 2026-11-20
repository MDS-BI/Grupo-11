import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { loadEntities, searchEntities } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
}

const configWithFields = {
  customFields: [
    { target: 'entity', key: 'ingresosAnuales', label: 'Ingresos anuales', type: 'number', required: true },
    { target: 'entity', key: 'region', label: 'Región', type: 'select', options: ['EMEA', 'APAC'] },
  ],
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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride) {
  vi.resetModules();
  const { initApp, navigate } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride ?? configWithFields));
  navigate('entities');
}

function submitForm() {
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Historia de Usuario 1 - campos personalizados declarados (FR-026, FR-027, FR-028)', () => {
  it('renderiza los campos declarados con los tipos de entrada correctos', async () => {
    await bootWith();
    const numberInput = qs('cf-ingresosAnuales');
    expect(numberInput).not.toBeNull();
    expect(numberInput.getAttribute('type')).toBe('number');
    expect(numberInput.closest('.custom-field').querySelector('label').textContent).toBe(
      'Ingresos anuales *'
    );
    const select = qs('cf-region');
    expect(select.tagName).toBe('SELECT');
    expect([...select.options].map((o) => o.value)).toEqual(['', 'EMEA', 'APAC']);
  });

  it('bloquea el guardado con un campo personalizado obligatorio en blanco y explica por qué', async () => {
    await bootWith();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitForm();
    expect(loadEntities().length).toBe(0);
    expect(qs('error-cf-ingresosAnuales').textContent).toContain('obligatorio');
  });

  it('persiste los valores personalizados y los muestra en la lista con sus etiquetas', async () => {
    await bootWith();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('cf-ingresosAnuales').value = '5000';
    qs('cf-region').value = 'EMEA';
    submitForm();
    const saved = loadEntities()[0];
    expect(saved.ingresosAnuales).toBe(5000);
    expect(saved.region).toBe('EMEA');

    const item = qs('entity-list').querySelector('.record-item');
    expect(item.textContent).toContain('Ingresos anuales: 5000');
    expect(item.textContent).toContain('Región: EMEA');
  });

  it('incluye los valores personalizados en la búsqueda (FR-028)', async () => {
    await bootWith();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('cf-ingresosAnuales').value = '5000';
    qs('cf-region').value = 'EMEA';
    submitForm();
    expect(searchEntities('emea').length).toBe(1);
    expect(searchEntities('5000').length).toBe(1);
  });

  it('se comporta igual que la base sin campos declarados', async () => {
    await bootWith({});
    expect(qs('entity-custom-fields').hidden).toBe(true);
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    submitForm();
    expect(loadEntities().length).toBe(1);
    expect(searchEntities('acme').length).toBe(1);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, addWarehouse, addMovement, searchEntities, clearAll } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function percentile(samples, p) {
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  dom.window.localStorage.clear();
  vi.resetModules();
  clearAll();
});

afterEach(() => {
  dom.window.close();
});

describe('Historia de Usuario 11 - rendimiento de búsqueda (FR-032, SC-004)', () => {
  it('mantiene la búsqueda con 500 productos por debajo de 200 ms (p95)', () => {
    const warehouse = addWarehouse({ code: 'B-01', name: 'Central' });
    const ids = [];
    for (let i = 0; i < 500; i += 1) {
      const created = addEntity({
        name: `Producto ${i}`,
        code: `P-${String(i).padStart(4, '0')}`,
        category: i % 2 === 0 ? 'Oficina' : 'Limpieza',
      });
      ids.push(created.entity_id);
    }
    for (let i = 0; i < 250; i += 1) {
      addMovement({
        entity_id: ids[i],
        warehouse_id: warehouse.id,
        type: 'entrada',
        quantity: 5 + (i % 20),
        movementDate: '2026-08-01',
      });
    }

    const queries = ['producto', 'producto 1', 'p-0250', '', 'limpieza'];
    const samples = [];

    for (let round = 0; round < 12; round += 1) {
      for (const query of queries) {
        const start = performance.now();
        searchEntities(query, { stockStatus: round % 2 === 0 ? 'low' : undefined });
        samples.push(performance.now() - start);
      }
    }

    const p95 = percentile(samples, 95);
    expect(p95).toBeLessThan(200);
  });
});

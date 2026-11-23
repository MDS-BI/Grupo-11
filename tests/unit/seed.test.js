import { describe, it, expect, beforeEach } from 'vitest';
import { hasStoredEntities, loadEntities, clearAll, addEntity, deleteEntity } from '../../src/storage.js';
import { SEED_PRODUCTS, seedDemoProducts } from '../../src/seed.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

beforeEach(() => {
  store.clear();
  clearAll();
});

describe('hasStoredEntities', () => {
  it('devuelve false en el primer arranque', () => {
    expect(hasStoredEntities()).toBe(false);
  });

  it('devuelve true cuando la clave de entidades existe aunque la lista esté vacía', () => {
    addEntity({ name: 'Único', code: 'UN-1' });
    clearAll();
    globalThis.localStorage.setItem('erp_base_module:entities', '[]');
    expect(hasStoredEntities()).toBe(true);
  });
});

describe('seedDemoProducts', () => {
  it('siembra los tres productos de supermercado en el primer arranque', () => {
    const created = seedDemoProducts();
    expect(created).toBe(3);
    const entities = loadEntities();
    expect(entities.map((e) => e.code)).toEqual(['AR-1001', 'LE-1002', 'AC-1003']);
    expect(entities.map((e) => e.name)).toEqual([
      'Arroz Blanco 1 kg',
      'Leche Entera 1 L',
      'Aceite Vegetal 900 ml',
    ]);
    for (const entity of entities) {
      expect(entity.category).toBe('Producto terminado');
      expect(entity.stockMin).toBeNull();
      expect(entity.id).toBeDefined();
      expect(entity.entity_id).toBeDefined();
      expect(entity.createdAt).toBeDefined();
      expect(entity.updatedAt).toBeDefined();
    }
  });

  it('no hace nada si la clave de entidades ya existe', () => {
    addEntity({ name: 'Previo', code: 'PRE-1' });
    expect(seedDemoProducts()).toBe(0);
    const entities = loadEntities();
    expect(entities.length).toBe(1);
    expect(entities[0].code).toBe('PRE-1');
  });

  it('no recrea los productos si el usuario los elimina todos', () => {
    seedDemoProducts();
    for (const entity of loadEntities()) deleteEntity(entity.id);
    expect(loadEntities().length).toBe(0);
    expect(seedDemoProducts()).toBe(0);
    expect(loadEntities().length).toBe(0);
  });

  it('es idempotente: dos llamadas seguidas crean los productos una sola vez', () => {
    expect(seedDemoProducts()).toBe(3);
    expect(seedDemoProducts()).toBe(0);
    expect(loadEntities().length).toBe(3);
  });
});

describe('SEED_PRODUCTS', () => {
  it('define tres productos con código único y sin stock mínimo', () => {
    expect(SEED_PRODUCTS).toHaveLength(3);
    const codes = SEED_PRODUCTS.map((p) => p.code);
    expect(new Set(codes).size).toBe(3);
    for (const product of SEED_PRODUCTS) {
      expect(product.name).toBeTruthy();
      expect(product.code).toBeTruthy();
      expect(product.category).toBe('Producto terminado');
      expect(product.stockMin).toBeUndefined();
    }
  });
});

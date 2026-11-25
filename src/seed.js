import { addEntity, hasStoredEntities } from './storage.js';

export const SEED_PRODUCTS = [
  {
    name: 'Arroz Blanco 1 kg',
    code: 'AR-1001',
    category: 'Producto terminado',
    unit: 'Kg',
    description: 'Arroz blanco envasado, grano largo. Producto de no perecedero.',
  },
  {
    name: 'Leche Entera 1 L',
    code: 'LE-1002',
    category: 'Producto terminado',
    unit: 'L',
    description: 'Leche entera pasteurizada en caja de 1 litro.',
  },
  {
    name: 'Aceite Vegetal 900 ml',
    code: 'AC-1003',
    category: 'Producto terminado',
    unit: 'ml',
    description: 'Aceite vegetal comestible en botella de 900 ml.',
  },
];

/**
 * Siembra los productos de demostración en el primer arranque
 * (Clarifications 2026-11-23): solo se ejecuta si localStorage aún no
 * contiene la clave de entidades. Idempotente: si el usuario elimina los
 * productos, no los vuelve a crear. Nunca bloquea el arranque.
 */
export function seedDemoProducts() {
  try {
    if (hasStoredEntities()) return 0;
    let created = 0;
    for (const product of SEED_PRODUCTS) {
      addEntity({ ...product, stockMin: null });
      created += 1;
    }
    return created;
  } catch {
    return 0;
  }
}

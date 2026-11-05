import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeConfig,
  setActiveConfig,
  getActiveConfig,
  DEFAULT_ACCENT,
} from '../../src/module-config.js';

describe('module config loading (FR-023, FR-024, FR-025, FR-038)', () => {
  beforeEach(() => {
    setActiveConfig(normalizeConfig(undefined));
  });

  it('falls back to the built-in Logística e Inventario defaults without configuration', () => {
    const config = normalizeConfig(undefined);
    expect(config.moduleName).toBe('Logística e Inventario');
    expect(config.labels.entity).toBe('Producto');
    expect(config.labels.entities).toBe('Productos');
    expect(config.labels.movement).toBe('Movimiento');
    expect(config.labels.warehouse).toBe('Bodega');
    expect(config.labels.nav).toEqual({
      dashboard: 'Panel',
      entities: 'Productos',
      movements: 'Movimientos',
      warehouses: 'Bodegas',
      search: 'Buscar',
    });
    expect(config.labels.quickActions).toEqual({
      newEntity: 'Nuevo producto',
      newMovement: 'Nuevo movimiento',
      manageEntities: 'Gestionar productos',
      searchRecords: 'Buscar registros',
    });
    expect(config.theme.accentColor).toBe(DEFAULT_ACCENT);
    expect(config.customFields).toEqual([]);
    expect(config.errors).toEqual([]);
  });

  it('merges a partial configuration over the defaults', () => {
    const config = normalizeConfig({
      moduleName: 'Ventas',
      labels: { entity: 'Cliente', entities: 'Clientes' },
      theme: { accentColor: '#0f62fe' },
    });
    expect(config.moduleName).toBe('Ventas');
    expect(config.labels.entity).toBe('Cliente');
    expect(config.labels.entities).toBe('Clientes');
    expect(config.labels.document).toBe('Documento de respaldo');
    expect(config.labels.nav.search).toBe('Buscar');
    expect(config.theme.accentColor).toBe('#0f62fe');
    expect(config.errors).toEqual([]);
  });

  it('rejects an invalid accent color, falls back and reports the error clearly', () => {
    const config = normalizeConfig({ theme: { accentColor: 'not-a-color' } });
    expect(config.theme.accentColor).toBe(DEFAULT_ACCENT);
    expect(config.errors.length).toBeGreaterThan(0);
    expect(config.errors.join(' ')).toMatch(/accentColor/i);
  });

  it('drops custom fields whose key collides with a base field name', () => {
    const config = normalizeConfig({
      customFields: [
        { target: 'entity', key: 'name', label: 'Nombre', type: 'text' },
        { target: 'entity', key: 'unidadMedida', label: 'Unidad', type: 'text' },
      ],
    });
    expect(config.customFields.map((f) => f.key)).toEqual(['unidadMedida']);
    expect(config.errors.join(' ')).toMatch(/unidadMedida|colis/i);
  });

  it('drops custom fields with an unknown declared type', () => {
    const config = normalizeConfig({
      customFields: [
        { target: 'entity', key: 'peso', label: 'Peso', type: 'richtext' },
        { target: 'entity', key: 'proveedor', label: 'Proveedor', type: 'text' },
      ],
    });
    expect(config.customFields.map((f) => f.key)).toEqual(['proveedor']);
    expect(config.errors.length).toBeGreaterThan(0);
  });

  it('drops an invalid lifecycle definition instead of failing silently', () => {
    const config = normalizeConfig({
      statusLifecycle: {
        movements: {
          traslado: {
            statuses: ['A', 'B'],
            transitions: { A: ['C'], B: [] },
          },
        },
      },
    });
    expect(config.statusLifecycle.movements.traslado).toBeNull();
    expect(config.errors.length).toBeGreaterThan(0);
  });

  it('keeps a valid configured lifecycle and the returns lifecycle', () => {
    const config = normalizeConfig({
      statusLifecycle: {
        movements: {
          traslado: {
            statuses: ['Solicitado', 'Despachado', 'Recibido'],
            transitions: {
              Solicitado: ['Despachado'],
              Despachado: ['Recibido'],
              Recibido: [],
            },
          },
        },
      },
    });
    expect(config.statusLifecycle.movements.traslado.statuses).toEqual([
      'Solicitado',
      'Despachado',
      'Recibido',
    ]);
    expect(config.statusLifecycle.returns.statuses).toContain('Recibida en bodega');
  });

  it('defines the reference lifecycles for orden de compra, traslado and salida', () => {
    const config = normalizeConfig(undefined);
    expect(config.statusLifecycle.references['orden-compra'].statuses[0]).toBe('Borrador');
    expect(config.statusLifecycle.references.traslado.statuses).toContain('En tránsito');
    expect(config.statusLifecycle.references.salida.statuses).toContain('Preparado');
    expect(config.statusLifecycle.movements.traslado).not.toBeNull();
    expect(config.statusLifecycle.movements.salida).toBeNull();
    expect(config.statusLifecycle.documents['orden-compra']).not.toBeNull();
  });

  it('stores the active config for the rest of the application', () => {
    const config = normalizeConfig({ moduleName: 'Almacén Sur' });
    setActiveConfig(config);
    expect(getActiveConfig().moduleName).toBe('Almacén Sur');
    setActiveConfig(normalizeConfig(undefined));
    expect(getActiveConfig().moduleName).toBe('Logística e Inventario');
  });
});

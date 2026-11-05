export const DEFAULT_ACCENT = '#2563eb';

export const BASE_FIELD_KEYS = [
  'id',
  'entity_id',
  'name',
  'code',
  'taxId',
  'email',
  'phone',
  'address',
  'category',
  'description',
  'targetDate',
  'creditLimit',
  'paymentTerms',
  'stockMin',
  'series',
  'folio',
  'startDate',
  'endDate',
  'quantity',
  'subtotal',
  'discount',
  'taxAmount',
  'totalAmount',
  'currency',
  'notes',
  'status',
  'statusChangedAt',
  'warehouse_id',
  'movementDate',
  'type',
  'direction',
  'lot_id',
  'transferId',
  'leg',
  'reason',
  'quantity_good',
  'quantity_damaged',
  'createdAt',
  'updatedAt',
];

const FIELD_TYPES = ['text', 'number', 'date', 'select'];

const DEFAULT_LIFECYCLE_ORDEN = {
  statuses: ['Borrador', 'Aprobada', 'Enviada por proveedor', 'Recibida', 'Cerrada', 'Cancelada'],
  transitions: {
    Borrador: ['Aprobada', 'Cancelada'],
    Aprobada: ['Enviada por proveedor', 'Cancelada'],
    'Enviada por proveedor': ['Recibida', 'Cancelada'],
    Recibida: ['Cerrada'],
    Cerrada: [],
    Cancelada: [],
  },
};

const DEFAULT_LIFECYCLE_TRASLADO = {
  statuses: ['Solicitado', 'Despachado', 'En tránsito', 'Recibido', 'Cancelado'],
  transitions: {
    Solicitado: ['Despachado', 'Cancelado'],
    Despachado: ['En tránsito', 'Recibido'],
    'En tránsito': ['Recibido'],
    Recibido: [],
    Cancelado: [],
  },
};

const DEFAULT_LIFECYCLE_SALIDA = {
  statuses: ['Pendiente', 'Preparado', 'Despachado', 'Entregado', 'Cancelado'],
  transitions: {
    Pendiente: ['Preparado', 'Cancelado'],
    Preparado: ['Despachado', 'Cancelado'],
    Despachado: ['Entregado', 'Cancelado'],
    Entregado: [],
    Cancelado: [],
  },
};

const DEFAULT_LIFECYCLE_RETURNS = {
  statuses: ['Solicitada', 'Aprobada', 'Recibida en bodega', 'Cerrada', 'Rechazada'],
  transitions: {
    Solicitada: ['Aprobada', 'Rechazada'],
    Aprobada: ['Recibida en bodega', 'Rechazada'],
    'Recibida en bodega': ['Cerrada'],
    Cerrada: [],
    Rechazada: [],
  },
};

export const RETURN_REASONS = ['Dañado', 'Error de pedido', 'Rechazo del cliente', 'Vencido'];

export const DEFAULT_CONFIG = {
  moduleName: 'Logística e Inventario',
  labels: {
    entity: 'Producto',
    entities: 'Productos',
    document: 'Documento de respaldo',
    documents: 'Documentos de respaldo',
    movement: 'Movimiento',
    movements: 'Movimientos',
    warehouse: 'Bodega',
    warehouses: 'Bodegas',
    lot: 'Lote',
    lots: 'Lotes',
    transfer: 'Traslado',
    transfers: 'Traslados',
    return: 'Devolución',
    returns: 'Devoluciones',
    stock: 'Stock',
    lowStock: 'Stock bajo',
    nav: {
      dashboard: 'Panel',
      entities: 'Productos',
      movements: 'Movimientos',
      warehouses: 'Bodegas',
      search: 'Buscar',
    },
    quickActions: {
      newEntity: 'Nuevo producto',
      newMovement: 'Nuevo movimiento',
      manageEntities: 'Gestionar productos',
      searchRecords: 'Buscar registros',
    },
  },
  categories: ['General', 'Materia prima', 'Producto terminado', 'Insumo'],
  customFields: [],
  statusLifecycle: {
    references: {
      'orden-compra': DEFAULT_LIFECYCLE_ORDEN,
      traslado: DEFAULT_LIFECYCLE_TRASLADO,
      salida: DEFAULT_LIFECYCLE_SALIDA,
    },
    documents: {
      'orden-compra': DEFAULT_LIFECYCLE_ORDEN,
      remision: null,
    },
    movements: {
      entrada: null,
      salida: null,
      ajuste: null,
      traslado: DEFAULT_LIFECYCLE_TRASLADO,
    },
    returns: DEFAULT_LIFECYCLE_RETURNS,
  },
  theme: { accentColor: DEFAULT_ACCENT },
};

const KNOWN_LABEL_KEYS = Object.keys(DEFAULT_CONFIG.labels);
const KNOWN_QUICK_ACTION_KEYS = Object.keys(DEFAULT_CONFIG.labels.quickActions);
const KNOWN_NAV_KEYS = Object.keys(DEFAULT_CONFIG.labels.nav);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidColor(value) {
  if (typeof value !== 'string') return false;
  const str = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(str)) return true;
  if (/^rgba?\(\s*[\d.%\s,]+\s*\)$/i.test(str)) return true;
  if (/^hsla?\(\s*[\d.%\s,]+\s*\)$/i.test(str)) return true;
  return false;
}

function normalizeLifecycle(raw, errors, context) {
  if (raw === null) return null;
  if (!isPlainObject(raw)) {
    errors.push(`Ciclo de vida inválido en ${context}: se esperaba un objeto o null.`);
    return null;
  }
  const statuses = raw.statuses;
  const transitions = raw.transitions;
  if (!Array.isArray(statuses) || statuses.length === 0 || statuses.some((s) => typeof s !== 'string' || !s.trim())) {
    errors.push(`Ciclo de vida inválido en ${context}: "statuses" debe ser una lista de textos no vacíos.`);
    return null;
  }
  if (!isPlainObject(transitions)) {
    errors.push(`Ciclo de vida inválido en ${context}: "transitions" debe ser un objeto.`);
    return null;
  }
  const unique = [...new Set(statuses.map((s) => s.trim()))];
  for (const [from, targets] of Object.entries(transitions)) {
    if (!unique.includes(from)) {
      errors.push(`Ciclo de vida inválido en ${context}: la transición parte del estado desconocido "${from}".`);
      return null;
    }
    if (!Array.isArray(targets) || targets.some((t) => !unique.includes(t))) {
      errors.push(`Ciclo de vida inválido en ${context}: destino de transición desconocido en "${from}".`);
      return null;
    }
  }
  return { statuses: unique, transitions: Object.fromEntries(Object.entries(transitions).map(([k, v]) => [k, [...v]])) };
}

function normalizeCustomField(raw, errors) {
  if (!isPlainObject(raw)) {
    errors.push('Campo personalizado inválido: se esperaba un objeto.');
    return null;
  }
  const key = typeof raw.key === 'string' ? raw.key.trim() : '';
  if (!key) {
    errors.push('Campo personalizado inválido: falta la clave "key".');
    return null;
  }
  if (BASE_FIELD_KEYS.includes(key)) {
    errors.push(`Campo personalizado inválido: la clave "${key}" colisiona con un nombre de campo base.`);
    return null;
  }
  if (raw.target !== 'entity' && raw.target !== 'document') {
    errors.push(`Campo personalizado inválido en "${key}": "target" debe ser "entity" o "document".`);
    return null;
  }
  if (!FIELD_TYPES.includes(raw.type)) {
    errors.push(`Campo personalizado inválido en "${key}": tipo de dato desconocido "${raw.type}".`);
    return null;
  }
  const field = {
    target: raw.target,
    key,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : key,
    type: raw.type,
    required: raw.required === true,
  };
  if (raw.type === 'select') {
    if (!Array.isArray(raw.options) || raw.options.length === 0 || raw.options.some((o) => typeof o !== 'string' || !o.trim())) {
      errors.push(`Campo personalizado inválido en "${key}": el tipo "select" requiere una lista "options".`);
      return null;
    }
    field.options = raw.options.map((o) => o.trim());
  }
  return field;
}

export function normalizeConfig(raw) {
  const errors = [];
  const out = deepClone(DEFAULT_CONFIG);

  if (raw === undefined || raw === null) {
    out.errors = errors;
    return out;
  }
  if (!isPlainObject(raw)) {
    errors.push('Configuración inválida: se esperaba un objeto; se usan los valores por defecto.');
    out.errors = errors;
    return out;
  }

  if (raw.moduleName !== undefined) {
    if (typeof raw.moduleName === 'string' && raw.moduleName.trim()) {
      out.moduleName = raw.moduleName.trim();
    } else {
      errors.push('Configuración inválida: "moduleName" debe ser un texto no vacío.');
    }
  }

  if (raw.labels !== undefined) {
    if (!isPlainObject(raw.labels)) {
      errors.push('Configuración inválida: "labels" debe ser un objeto.');
    } else {
      for (const key of KNOWN_LABEL_KEYS) {
        if (key === 'nav' || key === 'quickActions') continue;
        const value = raw.labels[key];
        if (value === undefined) continue;
        if (typeof value === 'string' && value.trim()) out.labels[key] = value.trim();
        else errors.push(`Etiqueta inválida en "labels.${key}": debe ser un texto no vacío.`);
      }
      if (raw.labels.nav !== undefined) {
        if (!isPlainObject(raw.labels.nav)) {
          errors.push('Configuración inválida: "labels.nav" debe ser un objeto.');
        } else {
          for (const key of KNOWN_NAV_KEYS) {
            const value = raw.labels.nav[key];
            if (value === undefined) continue;
            if (typeof value === 'string' && value.trim()) out.labels.nav[key] = value.trim();
            else errors.push(`Etiqueta inválida en "labels.nav.${key}": debe ser un texto no vacío.`);
          }
        }
      }
      if (raw.labels.quickActions !== undefined) {
        if (!isPlainObject(raw.labels.quickActions)) {
          errors.push('Configuración inválida: "labels.quickActions" debe ser un objeto.');
        } else {
          for (const key of KNOWN_QUICK_ACTION_KEYS) {
            const value = raw.labels.quickActions[key];
            if (value === undefined) continue;
            if (typeof value === 'string' && value.trim()) out.labels.quickActions[key] = value.trim();
            else errors.push(`Etiqueta inválida en "labels.quickActions.${key}": debe ser un texto no vacío.`);
          }
        }
      }
    }
  }

  const rawLabels = isPlainObject(raw.labels) ? raw.labels : {};
  const rawNav = isPlainObject(rawLabels.nav) ? rawLabels.nav : {};
  if (rawNav.entities === undefined) out.labels.nav.entities = out.labels.entities;
  if (rawNav.movements === undefined) out.labels.nav.movements = out.labels.movements;
  if (rawNav.warehouses === undefined) out.labels.nav.warehouses = out.labels.warehouses;
  const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);
  const rawQuick = isPlainObject(rawLabels.quickActions) ? rawLabels.quickActions : {};
  if (rawQuick.newEntity === undefined) {
    out.labels.quickActions.newEntity = `Nuevo ${lowerFirst(out.labels.entity)}`;
  }
  if (rawQuick.newMovement === undefined) {
    out.labels.quickActions.newMovement = `Nuevo ${lowerFirst(out.labels.movement)}`;
  }
  if (rawQuick.manageEntities === undefined) {
    out.labels.quickActions.manageEntities = `Gestionar ${out.labels.entities.toLowerCase()}`;
  }

  if (raw.categories !== undefined) {
    if (!Array.isArray(raw.categories) || raw.categories.length === 0 || raw.categories.some((c) => typeof c !== 'string' || !c.trim())) {
      errors.push('Configuración inválida: "categories" debe ser una lista de textos no vacíos.');
    } else {
      out.categories = [...new Set(raw.categories.map((c) => c.trim()))];
    }
  }

  if (raw.customFields !== undefined) {
    if (!Array.isArray(raw.customFields)) {
      errors.push('Configuración inválida: "customFields" debe ser una lista.');
    } else {
      const seen = new Set();
      const valid = [];
      for (const field of raw.customFields) {
        const normalized = normalizeCustomField(field, errors);
        if (!normalized) continue;
        const composite = `${normalized.target}:${normalized.key}`;
        if (seen.has(composite)) {
          errors.push(`Campo personalizado inválido: clave "${normalized.key}" duplicada en el mismo destino.`);
          continue;
        }
        seen.add(composite);
        valid.push(normalized);
      }
      out.customFields = valid;
    }
  }

  if (raw.statusLifecycle !== undefined) {
    if (!isPlainObject(raw.statusLifecycle)) {
      errors.push('Configuración inválida: "statusLifecycle" debe ser un objeto.');
    } else {
      const { documents, movements, returns, references } = raw.statusLifecycle;
      if (documents !== undefined) {
        if (!isPlainObject(documents)) {
          errors.push('Configuración inválida: "statusLifecycle.documents" debe ser un objeto.');
        } else {
          const cleaned = { ...out.statusLifecycle.documents };
          for (const [key, value] of Object.entries(documents)) {
            cleaned[key] = value === null ? null : normalizeLifecycle(value, errors, `statusLifecycle.documents.${key}`);
          }
          out.statusLifecycle.documents = cleaned;
        }
      }
      if (movements !== undefined) {
        if (!isPlainObject(movements)) {
          errors.push('Configuración inválida: "statusLifecycle.movements" debe ser un objeto.');
        } else {
          const cleaned = { ...out.statusLifecycle.movements };
          for (const [key, value] of Object.entries(movements)) {
            cleaned[key] = value === null ? null : normalizeLifecycle(value, errors, `statusLifecycle.movements.${key}`);
          }
          out.statusLifecycle.movements = cleaned;
        }
      }
      if (returns !== undefined) {
        if (returns === null || isPlainObject(returns)) {
          out.statusLifecycle.returns = returns === null ? null : normalizeLifecycle(returns, errors, 'statusLifecycle.returns');
        } else {
          errors.push('Configuración inválida: "statusLifecycle.returns" debe ser un objeto o null.');
        }
      }
      if (references !== undefined) {
        if (!isPlainObject(references)) {
          errors.push('Configuración inválida: "statusLifecycle.references" debe ser un objeto.');
        } else {
          const cleaned = { ...out.statusLifecycle.references };
          for (const [key, value] of Object.entries(references)) {
            cleaned[key] = normalizeLifecycle(value, errors, `statusLifecycle.references.${key}`);
          }
          out.statusLifecycle.references = cleaned;
        }
      }
    }
  }

  if (raw.theme !== undefined) {
    if (!isPlainObject(raw.theme)) {
      errors.push('Configuración inválida: "theme" debe ser un objeto.');
    } else if (raw.theme.accentColor !== undefined) {
      if (isValidColor(raw.theme.accentColor)) {
        out.theme.accentColor = raw.theme.accentColor.trim();
      } else {
        errors.push(`Configuración inválida: accentColor "${raw.theme.accentColor}" no es un color válido; se usa ${DEFAULT_ACCENT}.`);
      }
    }
  }

  out.errors = errors;
  return out;
}

let activeConfig = normalizeConfig(undefined);

export function setActiveConfig(config) {
  activeConfig = config && typeof config === 'object' ? config : normalizeConfig(undefined);
  return activeConfig;
}

export function getActiveConfig() {
  return activeConfig;
}

export function lifecycleFor(kind, key, config = getActiveConfig()) {
  const section = config?.statusLifecycle?.[kind];
  if (!section) return null;
  return section[key] ?? null;
}

export function returnsLifecycle(config = getActiveConfig()) {
  return config?.statusLifecycle?.returns ?? null;
}

export function nextStates(currentStatus, lifecycle) {
  if (!lifecycle || currentStatus == null) return [];
  return lifecycle.transitions[currentStatus] ?? [];
}

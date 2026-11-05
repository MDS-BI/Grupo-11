import { lifecycleFor, nextStates } from '../module-config.js';
import { loadReturns } from '../storage.js';

const TYPE_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  traslado: 'Traslado',
  ajuste: 'Ajuste',
};

const CANCEL_LIKE = /cancel|rechaz|anul/i;

function entityName(movement, entities) {
  const entity = entities[movement.entity_id];
  return entity ? entity.name : movement.entity_id;
}

function warehouseName(movement, warehouses) {
  const warehouse = warehouses[movement.warehouse_id];
  return warehouse ? warehouse.name : movement.warehouse_id;
}

function returnedTotal(movementId) {
  return loadReturns()
    .filter((r) => r.movement_kind === 'movement' && r.movement_id === movementId && r.status !== 'Rechazada')
    .reduce((sum, r) => sum + r.quantity_good + r.quantity_damaged, 0);
}

export function renderMovementList(
  container,
  movements,
  { entities = {}, warehouses = {}, onTransition = null, onReturn = null } = {}
) {
  container.textContent = '';

  for (const movement of [...movements].reverse()) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.movementId = movement.id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    const sign = movement.direction === 'out' ? '-' : '+';
    title.textContent = `${TYPE_LABELS[movement.type] ?? movement.type} · ${sign}${movement.quantity}`;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    meta.textContent = `${movement.movementDate} · ${entityName(movement, entities)} · ${warehouseName(movement, warehouses)}`;
    main.appendChild(meta);

    if (movement.status) {
      const badge = document.createElement('span');
      badge.className = 'badge accent';
      badge.textContent = movement.status;
      main.appendChild(badge);
    }

    const returned = movement.type === 'salida' ? returnedTotal(movement.id) : 0;
    if (returned > 0) {
      const returnedLine = document.createElement('span');
      returnedLine.className = 'record-meta record-returned';
      returnedLine.dataset.returned = String(returned);
      returnedLine.textContent = `Devuelto: ${returned}`;
      main.appendChild(returnedLine);
    }

    item.appendChild(main);

    const lifecycle = lifecycleFor('movements', movement.type);
    const next = lifecycle ? nextStates(movement.status, lifecycle) : [];
    const canReturn = onReturn && movement.type === 'salida';
    if ((onTransition && next.length) || canReturn) {
      const actions = document.createElement('div');
      actions.className = 'record-actions';
      for (const state of next) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = CANCEL_LIKE.test(state) ? 'btn btn-sm btn-danger' : 'btn btn-sm';
        button.dataset.action = 'transition';
        button.dataset.status = state;
        button.textContent = state;
        button.addEventListener('click', () => onTransition(movement, state));
        actions.appendChild(button);
      }
      if (canReturn) {
        const returnButton = document.createElement('button');
        returnButton.type = 'button';
        returnButton.className = 'btn btn-sm';
        returnButton.dataset.action = 'return';
        returnButton.textContent = 'Devolver';
        returnButton.addEventListener('click', () => onReturn(movement));
        actions.appendChild(returnButton);
      }
      item.appendChild(actions);
    }

    container.appendChild(item);
  }
}

export function renderStockSummary(container, warehouses = [], balances = {}) {
  container.textContent = '';

  if (!Object.keys(balances).length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Seleccione un producto para ver sus saldos por bodega.';
    container.appendChild(empty);
    return;
  }

  let total = 0;
  for (const warehouse of warehouses) {
    const balance = balances[warehouse.id] ?? 0;
    total += balance;
    const line = document.createElement('p');
    line.className = 'stock-line';
    line.dataset.warehouseId = warehouse.id;
    line.textContent = `${warehouse.name}: ${balance}`;
    container.appendChild(line);
  }

  const totalLine = document.createElement('p');
  totalLine.className = 'stock-line stock-total';
  totalLine.textContent = `Total: ${total}`;
  container.appendChild(totalLine);
}

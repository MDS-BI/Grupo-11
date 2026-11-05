const TYPE_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  traslado: 'Traslado',
  ajuste: 'Ajuste',
};

const CANCEL_LIKE = /cancel|anul/i;

function warehouseName(row, warehouses) {
  const warehouse = warehouses[row.movement.warehouse_id];
  return warehouse ? warehouse.name : row.movement.warehouse_id;
}

export function renderKardex(
  container,
  { entity, rows = [], filters = {}, warehouses = {}, onFilterChange = null } = {}
) {
  container.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.id = 'kardex-title';
  heading.textContent = `Kárdex · ${entity.name}`;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.id = 'btn-back-product';
  back.textContent = 'Volver al producto';
  header.append(heading, back);
  container.appendChild(header);

  const filterPanel = document.createElement('div');
  filterPanel.className = 'panel';
  const filterGrid = document.createElement('div');
  filterGrid.className = 'form-grid';

  const typeField = document.createElement('div');
  typeField.className = 'field';
  const typeLabel = document.createElement('label');
  typeLabel.setAttribute('for', 'kardex-type');
  typeLabel.textContent = 'Tipo de movimiento';
  const typeSelect = document.createElement('select');
  typeSelect.id = 'kardex-type';
  const allTypes = document.createElement('option');
  allTypes.value = '';
  allTypes.textContent = '— Todos —';
  typeSelect.appendChild(allTypes);
  for (const [value, label] of Object.entries(TYPE_LABELS)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  }
  typeSelect.value = filters.type ?? '';
  typeField.append(typeLabel, typeSelect);
  filterGrid.appendChild(typeField);

  const fromField = document.createElement('div');
  fromField.className = 'field';
  const fromLabel = document.createElement('label');
  fromLabel.setAttribute('for', 'kardex-date-from');
  fromLabel.textContent = 'Desde';
  const fromInput = document.createElement('input');
  fromInput.type = 'date';
  fromInput.id = 'kardex-date-from';
  fromInput.value = filters.from ?? '';
  fromField.append(fromLabel, fromInput);
  filterGrid.appendChild(fromField);

  const toField = document.createElement('div');
  toField.className = 'field';
  const toLabel = document.createElement('label');
  toLabel.setAttribute('for', 'kardex-date-to');
  toLabel.textContent = 'Hasta';
  const toInput = document.createElement('input');
  toInput.type = 'date';
  toInput.id = 'kardex-date-to';
  toInput.value = filters.to ?? '';
  toField.append(toLabel, toInput);
  filterGrid.appendChild(toField);

  filterPanel.appendChild(filterGrid);
  container.appendChild(filterPanel);

  if (onFilterChange) {
    typeSelect.addEventListener('change', () => {
      onFilterChange({ type: typeSelect.value, from: fromInput.value, to: toInput.value });
    });
    fromInput.addEventListener('change', () => {
      onFilterChange({ type: typeSelect.value, from: fromInput.value, to: toInput.value });
    });
    toInput.addEventListener('change', () => {
      onFilterChange({ type: typeSelect.value, from: fromInput.value, to: toInput.value });
    });
  }

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = 'Historial de movimientos';
  const list = document.createElement('ul');
  list.id = 'kardex-list';
  list.className = 'record-list';
  const empty = document.createElement('p');
  empty.id = 'kardex-empty';
  empty.className = 'empty-state';
  empty.hidden = rows.length > 0;
  empty.textContent = rows.length > 0 ? '' : `${entity.name} aún no tiene movimientos registrados.`;
  listPanel.append(listTitle, list, empty);
  container.appendChild(listPanel);

  for (const row of rows) {
    const movement = row.movement;
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
    meta.textContent = `${movement.movementDate} · ${warehouseName(row, warehouses)}`;
    main.appendChild(meta);

    if (row.annulled) {
      const badge = document.createElement('span');
      badge.className = 'badge danger';
      badge.textContent = CANCEL_LIKE.test(movement.status ?? '') ? 'Anulado' : movement.status || 'Sin efecto';
      main.appendChild(badge);
    } else if (movement.status) {
      const badge = document.createElement('span');
      badge.className = 'badge accent';
      badge.textContent = movement.status;
      main.appendChild(badge);
    }

    const balance = document.createElement('span');
    balance.className = 'kardex-balance stock-value';
    balance.textContent = `Saldo: ${row.balanceAfter}`;
    main.appendChild(balance);

    item.appendChild(main);
    list.appendChild(item);
  }
}

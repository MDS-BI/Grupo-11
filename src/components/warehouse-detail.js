import { calculateStock } from '../storage.js';

export function renderWarehouseDetail(
  section,
  { warehouse, products = [], onBack = null, onOpenProduct = null } = {}
) {
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = warehouse ? warehouse.name : 'Bodega';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.id = 'warehouse-detail-back';
  back.textContent = 'Volver';
  header.append(heading, back);
  section.appendChild(header);
  if (onBack) back.addEventListener('click', onBack);

  if (!warehouse) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Bodega no encontrada.';
    section.appendChild(empty);
    return;
  }

  const infoPanel = document.createElement('div');
  infoPanel.className = 'panel';
  const infoTitle = document.createElement('h2');
  infoTitle.textContent = 'Información';
  infoPanel.appendChild(infoTitle);

  const infoList = document.createElement('dl');
  infoList.className = 'detail-list';
  const addDetail = (term, value) => {
    if (value === undefined || value === null || value === '') return;
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    infoList.append(dt, dd);
  };
  addDetail('Código', warehouse.code);
  addDetail('Dirección', warehouse.address);
  addDetail('Descripción', warehouse.description);
  const statusTerm = document.createElement('dt');
  statusTerm.textContent = 'Estado';
  const statusValue = document.createElement('dd');
  const statusBadge = document.createElement('span');
  statusBadge.className = warehouse.active ? 'badge ok' : 'badge danger';
  statusBadge.textContent = warehouse.active ? 'Activa' : 'Desactivada';
  statusValue.appendChild(statusBadge);
  infoList.append(statusTerm, statusValue);
  infoPanel.appendChild(infoList);
  section.appendChild(infoPanel);

  const stockPanel = document.createElement('div');
  stockPanel.className = 'panel';
  const stockTitle = document.createElement('h2');
  stockTitle.textContent = 'Productos en esta bodega';
  stockPanel.appendChild(stockTitle);

  const list = document.createElement('ul');
  list.id = 'warehouse-detail-stock';
  list.className = 'record-list';
  stockPanel.appendChild(list);

  const empty = document.createElement('p');
  empty.id = 'warehouse-detail-empty';
  empty.className = 'empty-state';
  stockPanel.appendChild(empty);
  section.appendChild(stockPanel);

  const rows = products
    .map((entity) => ({ entity, stock: calculateStock(entity.entity_id, warehouse.id) }))
    .filter((row) => row.stock > 0);

  for (const { entity, stock } of rows) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.warehouseId = warehouse.id;
    item.dataset.entityId = entity.entity_id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    title.textContent = entity.name;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    const parts = [entity.code];
    if (entity.unit) parts.push(entity.unit);
    meta.textContent = parts.filter(Boolean).join(' · ');
    main.appendChild(meta);

    const stockLabel = document.createElement('span');
    stockLabel.className = 'stock-value';
    stockLabel.textContent = `Stock: ${stock}`;
    main.appendChild(stockLabel);

    if (entity.stockMin !== undefined && entity.stockMin !== null && stock < entity.stockMin) {
      const badge = document.createElement('span');
      badge.className = 'badge danger';
      badge.textContent = 'Stock bajo';
      main.appendChild(badge);
    }

    item.appendChild(main);

    if (onOpenProduct) {
      const actions = document.createElement('div');
      actions.className = 'record-actions';
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'btn btn-sm';
      open.dataset.action = 'open-product';
      open.textContent = 'Ver producto';
      open.addEventListener('click', () => onOpenProduct(entity));
      actions.appendChild(open);
      item.appendChild(actions);
    }

    list.appendChild(item);
  }

  empty.hidden = rows.length > 0;
  empty.textContent = rows.length > 0 ? '' : 'No hay productos con stock en esta bodega.';

  return { list, empty };
}

import { calculateStock, isLowStock } from '../storage.js';

function metaLine(entity) {
  const parts = [];
  if (entity.code) parts.push(entity.code);
  if (entity.category) parts.push(entity.category);
  return parts.join(' · ');
}

export function renderEntityList(container, entities, { config = {}, onEdit = null, onDelete = null, onOpen = null } = {}) {
  container.textContent = '';
  const customFields = (config.customFields ?? []).filter((f) => f.target === 'entity');

  for (const entity of entities) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.entityId = entity.entity_id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    title.textContent = entity.name;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    meta.textContent = metaLine(entity);
    main.appendChild(meta);

    const stock = document.createElement('span');
    stock.className = 'record-meta record-stock';
    stock.textContent = `Stock: ${calculateStock(entity.entity_id)}`;
    main.appendChild(stock);

    if (isLowStock(entity)) {
      const badge = document.createElement('span');
      badge.className = 'badge low';
      badge.textContent = 'Stock bajo';
      main.appendChild(badge);
    }

    for (const field of customFields) {
      const value = entity[field.key];
      if (value === undefined || value === null || String(value).trim() === '') continue;
      const line = document.createElement('span');
      line.className = 'record-meta record-custom';
      line.dataset.fieldKey = field.key;
      line.textContent = `${field.label}: ${value}`;
      main.appendChild(line);
    }

    item.appendChild(main);

    const actions = document.createElement('div');
    actions.className = 'record-actions';
    if (onOpen) {
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'btn btn-sm';
      open.dataset.action = 'open';
      open.textContent = 'Ver detalle';
      open.addEventListener('click', () => onOpen(entity));
      actions.appendChild(open);
    }
    if (onEdit) {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-sm';
      edit.dataset.action = 'edit';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => onEdit(entity));
      actions.appendChild(edit);
    }
    if (onDelete) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-sm btn-danger';
      remove.dataset.action = 'delete';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => onDelete(entity));
      actions.appendChild(remove);
    }
    item.appendChild(actions);

    container.appendChild(item);
  }
}

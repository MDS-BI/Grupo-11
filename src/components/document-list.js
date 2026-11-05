const TYPE_LABELS = {
  'orden-compra': 'Orden de compra',
  remision: 'Remisión',
};

export function renderDocumentList(container, documents, { onEdit = null, onDelete = null, numberFor = null } = {}) {
  container.textContent = '';

  for (const doc of documents) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.documentId = doc.id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    const number = numberFor ? numberFor(doc) : String(doc.folio);
    title.textContent = `${TYPE_LABELS[doc.type] ?? doc.type} ${number}`;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    const parts = [`${doc.startDate} → ${doc.endDate}`];
    if (doc.series) parts.unshift(doc.series);
    meta.textContent = parts.join(' · ');
    main.appendChild(meta);

    if (doc.status) {
      const badge = document.createElement('span');
      badge.className = 'badge accent';
      badge.textContent = doc.status;
      main.appendChild(badge);
    }

    item.appendChild(main);

    const actions = document.createElement('div');
    actions.className = 'record-actions';
    if (onEdit) {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-sm';
      edit.dataset.action = 'edit';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => onEdit(doc));
      actions.appendChild(edit);
    }
    if (onDelete) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-sm btn-danger';
      remove.dataset.action = 'delete';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => onDelete(doc));
      actions.appendChild(remove);
    }

    item.appendChild(actions);
    container.appendChild(item);
  }
}

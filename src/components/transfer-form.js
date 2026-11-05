const KEY_TO_FIELD = {
  origin_warehouse_id: 'transfer-origin',
  destination_warehouse_id: 'transfer-destination',
  date: 'transfer-date',
  notes: 'transfer-notes',
  lines: 'transfer-lines',
};

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function fillOptions(select, options, blankLabel) {
  select.textContent = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = blankLabel;
  select.appendChild(blank);
  for (const option of options) {
    const node = document.createElement('option');
    node.value = option.value;
    node.textContent = option.label;
    select.appendChild(node);
  }
}

function labeledSelect(id, labelText, { required = false } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  wrapper.id = `${id}-field`;

  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  if (required) {
    const marker = document.createElement('span');
    marker.className = 'required';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ' *';
    label.appendChild(marker);
  }
  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  if (required) select.required = true;

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-${id}`;
  error.setAttribute('aria-live', 'polite');

  wrapper.append(label, select, error);
  select.setAttribute('aria-describedby', error.id);
  return { wrapper, select };
}

function renderLines(form, productLabels) {
  const container = form.querySelector('#transfer-lines');
  container.textContent = '';
  const lines = form.transferLines ?? [];
  lines.forEach((line, index) => {
    const item = document.createElement('li');
    item.className = 'record-item';
    const main = document.createElement('div');
    main.className = 'record-main';
    const title = document.createElement('span');
    title.className = 'record-title';
    const name = productLabels[line.entity_id] ?? line.entity_id;
    title.textContent = `${name} · ${line.quantity}`;
    const meta = document.createElement('span');
    meta.className = 'record-meta';
    meta.textContent = line.lot_id ? 'Con lote (FEFO)' : 'Sin lote';
    main.append(title, meta);
    item.appendChild(main);

    const actions = document.createElement('div');
    actions.className = 'record-actions';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-sm btn-danger';
    remove.dataset.action = 'remove-line';
    remove.dataset.index = String(index);
    remove.textContent = 'Quitar';
    remove.addEventListener('click', () => {
      form.transferLines.splice(index, 1);
      clearTransferFormErrors(form);
      renderLines(form, productLabels);
    });
    actions.appendChild(remove);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

export function renderTransferForm(container, { products = [], warehouses = [], lots = [] } = {}) {
  container.textContent = '';
  const productLabels = Object.fromEntries(
    products.map((p) => [p.entity_id, p.code ? `${p.name} (${p.code})` : p.name])
  );
  const warehouseOptions = warehouses.map((w) => ({
    value: w.id,
    label: w.active === false ? `${w.name} (desactivada)` : w.name,
  }));

  const form = document.createElement('form');
  form.id = 'transfer-form';
  form.noValidate = true;
  form.transferLines = [];
  form.transferProductLabels = productLabels;

  const grid = document.createElement('div');
  grid.className = 'form-grid';

  const origin = labeledSelect('transfer-origin', 'Bodega origen', { required: true });
  fillOptions(origin.select, warehouseOptions, '— Seleccione —');
  grid.appendChild(origin.wrapper);

  const destination = labeledSelect('transfer-destination', 'Bodega destino', { required: true });
  fillOptions(destination.select, warehouseOptions, '— Seleccione —');
  grid.appendChild(destination.wrapper);

  const dateField = document.createElement('div');
  dateField.className = 'field';
  const dateLabel = document.createElement('label');
  dateLabel.setAttribute('for', 'transfer-date');
  dateLabel.textContent = 'Fecha';
  const dateMarker = document.createElement('span');
  dateMarker.className = 'required';
  dateMarker.setAttribute('aria-hidden', 'true');
  dateMarker.textContent = ' *';
  dateLabel.appendChild(dateMarker);
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'transfer-date';
  dateInput.name = 'transfer-date';
  dateInput.required = true;
  dateInput.value = todayString();
  const dateError = document.createElement('span');
  dateError.className = 'field-error';
  dateError.id = 'error-transfer-date';
  dateError.setAttribute('aria-live', 'polite');
  dateField.append(dateLabel, dateInput, dateError);
  dateInput.setAttribute('aria-describedby', dateError.id);
  grid.appendChild(dateField);

  const notesField = document.createElement('div');
  notesField.className = 'field';
  const notesLabel = document.createElement('label');
  notesLabel.setAttribute('for', 'transfer-notes');
  notesLabel.textContent = 'Notas';
  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.id = 'transfer-notes';
  notesInput.name = 'transfer-notes';
  const notesError = document.createElement('span');
  notesError.className = 'field-error';
  notesError.id = 'error-transfer-notes';
  notesField.append(notesLabel, notesInput, notesError);
  grid.appendChild(notesField);

  form.appendChild(grid);

  const linesTitle = document.createElement('h3');
  linesTitle.textContent = 'Líneas del traslado';
  form.appendChild(linesTitle);

  const lineGrid = document.createElement('div');
  lineGrid.className = 'form-grid';

  const product = labeledSelect('transfer-line-product', 'Producto', { required: true });
  fillOptions(
    product.select,
    products.map((p) => ({ value: p.entity_id, label: p.code ? `${p.name} (${p.code})` : p.name })),
    '— Seleccione —'
  );
  lineGrid.appendChild(product.wrapper);

  const quantityField = document.createElement('div');
  quantityField.className = 'field';
  const quantityLabel = document.createElement('label');
  quantityLabel.setAttribute('for', 'transfer-line-quantity');
  quantityLabel.textContent = 'Cantidad';
  const quantityMarker = document.createElement('span');
  quantityMarker.className = 'required';
  quantityMarker.setAttribute('aria-hidden', 'true');
  quantityMarker.textContent = ' *';
  quantityLabel.appendChild(quantityMarker);
  const quantityInput = document.createElement('input');
  quantityInput.type = 'number';
  quantityInput.id = 'transfer-line-quantity';
  quantityInput.name = 'transfer-line-quantity';
  quantityInput.min = '1';
  quantityInput.step = '1';
  const quantityError = document.createElement('span');
  quantityError.className = 'field-error';
  quantityError.id = 'error-transfer-line-quantity';
  quantityField.append(quantityLabel, quantityInput, quantityError);
  lineGrid.appendChild(quantityField);

  const lot = labeledSelect('transfer-line-lot', 'Lote (FEFO)');
  fillOptions(
    lot.select,
    lots.map((l) => ({ value: l.id, label: l.lotNumber })),
    '— Sin lote —'
  );
  lineGrid.appendChild(lot.wrapper);

  const addField = document.createElement('div');
  addField.className = 'field';
  addField.id = 'transfer-line-add-field';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'btn';
  addButton.id = 'transfer-line-add';
  addButton.textContent = 'Agregar línea';
  addField.appendChild(addButton);
  lineGrid.appendChild(addField);

  form.appendChild(lineGrid);

  const linesList = document.createElement('ul');
  linesList.id = 'transfer-lines';
  linesList.className = 'record-list';
  form.appendChild(linesList);

  const linesError = document.createElement('span');
  linesError.className = 'field-error';
  linesError.id = 'error-transfer-lines';
  linesError.setAttribute('aria-live', 'polite');
  form.appendChild(linesError);

  addButton.addEventListener('click', () => {
    clearTransferFormErrors(form);
    const entity_id = form.elements['transfer-line-product'].value;
    const quantityRaw = form.elements['transfer-line-quantity'].value;
    if (!entity_id) {
      showTransferFormErrors(form, { lines: 'Seleccione un producto para la línea.' });
      return;
    }
    const quantity = Number(quantityRaw);
    if (quantityRaw === '' || !Number.isInteger(quantity) || quantity < 1) {
      showTransferFormErrors(form, { lines: 'La cantidad debe ser un entero positivo.' });
      return;
    }
    if (form.transferLines.some((line) => line.entity_id === entity_id)) {
      showTransferFormErrors(form, { lines: 'Producto duplicado en el traslado.' });
      return;
    }
    form.transferLines.push({
      entity_id,
      quantity,
      lot_id: form.elements['transfer-line-lot'].value,
    });
    form.elements['transfer-line-product'].value = '';
    form.elements['transfer-line-quantity'].value = '';
    form.elements['transfer-line-lot'].value = '';
    renderLines(form, productLabels);
  });

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'transfer-submit';
  submit.textContent = 'Crear traslado';
  actions.appendChild(submit);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'transfer-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  renderLines(form, productLabels);
  container.appendChild(form);
  return form;
}

export function getTransferFormValues(form) {
  return {
    origin_warehouse_id: form.elements['transfer-origin'].value,
    destination_warehouse_id: form.elements['transfer-destination'].value,
    date: form.elements['transfer-date'].value,
    notes: form.elements['transfer-notes'].value,
    lines: [...(form.transferLines ?? [])],
  };
}

export function setTransferLineLots(form, lots = []) {
  fillOptions(
    form.elements['transfer-line-lot'],
    lots.map((l) => ({ value: l.id, label: l.lotNumber })),
    '— Sin lote —'
  );
}

export function clearTransferFormErrors(form) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, select')) {
    input.removeAttribute('aria-invalid');
  }
}

export function showTransferFormErrors(form, errors = {}) {
  clearTransferFormErrors(form);
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = key.startsWith('lines') ? 'transfer-lines' : (KEY_TO_FIELD[key] ?? key);
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  const feedback = form.querySelector('#transfer-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetTransferForm(form) {
  form.reset();
  form.transferLines = [];
  renderLines(form, form.transferProductLabels ?? {});
  clearTransferFormErrors(form);
  const feedback = form.querySelector('#transfer-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showTransferFormSuccess(form, message) {
  const feedback = form.querySelector('#transfer-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

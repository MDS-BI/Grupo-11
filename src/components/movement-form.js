const MOVEMENT_TYPES = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'ajuste', label: 'Ajuste' },
];

function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

const KEY_TO_FIELD = {
  entity_id: 'movement-product',
  warehouse_id: 'movement-warehouse',
  type: 'movement-type',
  direction: 'movement-direction',
  quantity: 'movement-quantity',
  movementDate: 'movement-date',
  lot_id: 'movement-lot',
  document_id: 'movement-document',
  unitCost: 'movement-unit-cost',
  notes: 'movement-notes',
};

function fieldWrapper(id) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';
  wrapper.id = `${id}-field`;
  return wrapper;
}

function labeledSelect(id, labelText, { required = false } = {}) {
  const wrapper = fieldWrapper(id);
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
  wrapper.appendChild(label);

  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  if (required) select.required = true;
  wrapper.appendChild(select);

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-${id}`;
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);
  select.setAttribute('aria-describedby', error.id);

  return { wrapper, select };
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

export function setMovementProducts(form, products = []) {
  fillOptions(
    form.elements['movement-product'],
    products.map((p) => ({ value: p.entity_id, label: p.code ? `${p.name} (${p.code})` : p.name })),
    '— Seleccione —'
  );
}

export function setMovementWarehouses(form, warehouses = []) {
  fillOptions(
    form.elements['movement-warehouse'],
    warehouses.filter((w) => w.active !== false).map((w) => ({ value: w.id, label: w.name })),
    '— Seleccione —'
  );
}

export function setMovementLots(form, lots = []) {
  fillOptions(
    form.elements['movement-lot'],
    lots.map((lot) => ({ value: lot.id, label: lot.lotNumber })),
    '— Sin lote —'
  );
}

export function setMovementDocuments(form, documents = []) {
  fillOptions(
    form.elements['movement-document'],
    documents.map((doc) => ({
      value: doc.id,
      label: `${doc.type === 'orden-compra' ? 'Orden de compra' : 'Remisión'} ${doc.folio}`,
    })),
    '— Sin documento —'
  );
}

export function renderMovementForm(container, { products = [], warehouses = [], lots = [], documents = [] } = {}) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'movement-form';
  form.noValidate = true;

  const grid = document.createElement('div');
  grid.className = 'form-grid';

  const product = labeledSelect('movement-product', 'Producto', { required: true });
  fillOptions(
    product.select,
    products.map((p) => ({ value: p.entity_id, label: p.code ? `${p.name} (${p.code})` : p.name })),
    '— Seleccione —'
  );
  grid.appendChild(product.wrapper);

  const type = labeledSelect('movement-type', 'Tipo de movimiento', { required: true });
  fillOptions(type.select, MOVEMENT_TYPES, '— Seleccione —');
  grid.appendChild(type.wrapper);

  const direction = labeledSelect('movement-direction', 'Efecto del ajuste');
  fillOptions(
    direction.select,
    [
      { value: 'in', label: 'Aumenta el saldo' },
      { value: 'out', label: 'Disminuye el saldo' },
    ],
    '— Seleccione —'
  );
  direction.wrapper.hidden = true;
  grid.appendChild(direction.wrapper);

  const warehouse = labeledSelect('movement-warehouse', 'Bodega', { required: true });
  fillOptions(
    warehouse.select,
    warehouses.filter((w) => w.active !== false).map((w) => ({ value: w.id, label: w.name })),
    '— Seleccione —'
  );
  grid.appendChild(warehouse.wrapper);

  const quantityWrapper = fieldWrapper('movement-quantity');
  const quantityLabel = document.createElement('label');
  quantityLabel.setAttribute('for', 'movement-quantity');
  quantityLabel.textContent = 'Cantidad';
  const quantityMarker = document.createElement('span');
  quantityMarker.className = 'required';
  quantityMarker.setAttribute('aria-hidden', 'true');
  quantityMarker.textContent = ' *';
  quantityLabel.appendChild(quantityMarker);
  const quantity = document.createElement('input');
  quantity.type = 'number';
  quantity.id = 'movement-quantity';
  quantity.name = 'movement-quantity';
  quantity.min = '1';
  quantity.step = '1';
  quantity.required = true;
  const quantityError = document.createElement('span');
  quantityError.className = 'field-error';
  quantityError.id = 'error-movement-quantity';
  quantityError.setAttribute('aria-live', 'polite');
  quantity.setAttribute('aria-describedby', quantityError.id);
  quantityWrapper.append(quantityLabel, quantity, quantityError);
  grid.appendChild(quantityWrapper);

  const dateWrapper = fieldWrapper('movement-date');
  const dateLabel = document.createElement('label');
  dateLabel.setAttribute('for', 'movement-date');
  dateLabel.textContent = 'Fecha';
  const dateMarker = document.createElement('span');
  dateMarker.className = 'required';
  dateMarker.setAttribute('aria-hidden', 'true');
  dateMarker.textContent = ' *';
  dateLabel.appendChild(dateMarker);
  const date = document.createElement('input');
  date.type = 'date';
  date.id = 'movement-date';
  date.name = 'movement-date';
  date.required = true;
  date.value = todayString();
  const dateError = document.createElement('span');
  dateError.className = 'field-error';
  dateError.id = 'error-movement-date';
  dateError.setAttribute('aria-live', 'polite');
  date.setAttribute('aria-describedby', dateError.id);
  dateWrapper.append(dateLabel, date, dateError);
  grid.appendChild(dateWrapper);

  const lot = labeledSelect('movement-lot', 'Lote');
  fillOptions(
    lot.select,
    lots.map((item) => ({ value: item.id, label: item.lotNumber })),
    '— Sin lote —'
  );
  grid.appendChild(lot.wrapper);

  const documentField = labeledSelect('movement-document', 'Documento de origen');
  fillOptions(
    documentField.select,
    documents.map((doc) => ({
      value: doc.id,
      label: `${doc.type === 'orden-compra' ? 'Orden de compra' : 'Remisión'} ${doc.folio}`,
    })),
    '— Sin documento —'
  );
  grid.appendChild(documentField.wrapper);

  const costWrapper = fieldWrapper('movement-unit-cost');
  const costLabel = document.createElement('label');
  costLabel.setAttribute('for', 'movement-unit-cost');
  costLabel.textContent = 'Costo unitario';
  const cost = document.createElement('input');
  cost.type = 'number';
  cost.id = 'movement-unit-cost';
  cost.name = 'movement-unit-cost';
  cost.min = '0';
  cost.step = '0.01';
  const costError = document.createElement('span');
  costError.className = 'field-error';
  costError.id = 'error-movement-unit-cost';
  costError.setAttribute('aria-live', 'polite');
  cost.setAttribute('aria-describedby', costError.id);
  costWrapper.append(costLabel, cost, costError);
  grid.appendChild(costWrapper);

  const notesWrapper = fieldWrapper('movement-notes');
  const notesLabel = document.createElement('label');
  notesLabel.setAttribute('for', 'movement-notes');
  notesLabel.textContent = 'Notas';
  const notes = document.createElement('textarea');
  notes.id = 'movement-notes';
  notes.name = 'movement-notes';
  notes.rows = 3;
  notesWrapper.append(notesLabel, notes);
  grid.appendChild(notesWrapper);

  form.appendChild(grid);

  type.select.addEventListener('change', () => {
    direction.wrapper.hidden = type.select.value !== 'ajuste';
  });

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'movement-submit';
  submit.textContent = 'Registrar movimiento';
  actions.appendChild(submit);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'movement-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  return form;
}

export function getMovementFormValues(form) {
  return {
    entity_id: form.elements['movement-product'].value,
    type: form.elements['movement-type'].value,
    direction: form.elements['movement-direction'].value,
    warehouse_id: form.elements['movement-warehouse'].value,
    quantity: form.elements['movement-quantity'].value === '' ? '' : Number(form.elements['movement-quantity'].value),
    movementDate: form.elements['movement-date'].value,
    lot_id: form.elements['movement-lot'].value,
    document_id: form.elements['movement-document'].value,
    unitCost: form.elements['movement-unit-cost'].value === '' ? '' : Number(form.elements['movement-unit-cost'].value),
    notes: form.elements['movement-notes'].value,
  };
}

export function clearMovementFormErrors(form) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, select, textarea')) {
    input.removeAttribute('aria-invalid');
  }
}

export function showMovementFormErrors(form, errors = {}) {
  clearMovementFormErrors(form);
  let firstMessage = '';
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = KEY_TO_FIELD[key] ?? key;
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
    if (!firstMessage) firstMessage = message;
  }
  const feedback = form.querySelector('#movement-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = firstMessage || 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetMovementForm(form, { keepContext = false } = {}) {
  const product = form.elements['movement-product'].value;
  const warehouse = form.elements['movement-warehouse'].value;
  form.reset();
  clearMovementFormErrors(form);
  form.elements['movement-date'].value = todayString();
  const wrapper = form.querySelector('#movement-direction-field');
  if (wrapper) wrapper.hidden = true;
  if (keepContext) {
    form.elements['movement-product'].value = product;
    form.elements['movement-warehouse'].value = warehouse;
  }
  const feedback = form.querySelector('#movement-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showMovementFormSuccess(form, message) {
  const feedback = form.querySelector('#movement-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

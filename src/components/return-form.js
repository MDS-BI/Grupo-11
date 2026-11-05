import { RETURN_REASONS } from '../module-config.js';

const KEY_TO_FIELD = {
  movement_kind: 'return-movement-id',
  movement_id: 'return-movement-id',
  entity_id: 'return-entity',
  reason: 'return-reason',
  quantity_good: 'return-quantity-good',
  quantity_damaged: 'return-quantity-damaged',
  notes: 'return-notes',
};

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

export function renderReturnForm(container) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'return-form';
  form.noValidate = true;

  const reference = document.createElement('p');
  reference.className = 'form-note';
  reference.id = 'return-reference';
  reference.textContent = 'Seleccione un movimiento para registrar una devolución.';
  form.appendChild(reference);

  const grid = document.createElement('div');
  grid.className = 'form-grid';

  const entityField = document.createElement('div');
  entityField.className = 'field';
  entityField.id = 'return-entity-field';
  entityField.hidden = true;
  const entityLabel = document.createElement('label');
  entityLabel.setAttribute('for', 'return-entity');
  entityLabel.textContent = 'Producto';
  const entitySelect = document.createElement('select');
  entitySelect.id = 'return-entity';
  entitySelect.name = 'return-entity';
  const entityError = document.createElement('span');
  entityError.className = 'field-error';
  entityError.id = 'error-return-entity';
  entityField.append(entityLabel, entitySelect, entityError);
  grid.appendChild(entityField);

  const reasonField = document.createElement('div');
  reasonField.className = 'field';
  const reasonLabel = document.createElement('label');
  reasonLabel.setAttribute('for', 'return-reason');
  reasonLabel.textContent = 'Motivo';
  const reasonMarker = document.createElement('span');
  reasonMarker.className = 'required';
  reasonMarker.setAttribute('aria-hidden', 'true');
  reasonMarker.textContent = ' *';
  reasonLabel.appendChild(reasonMarker);
  const reasonSelect = document.createElement('select');
  reasonSelect.id = 'return-reason';
  reasonSelect.name = 'return-reason';
  fillOptions(
    reasonSelect,
    RETURN_REASONS.map((reason) => ({ value: reason, label: reason })),
    '— Seleccione —'
  );
  const reasonError = document.createElement('span');
  reasonError.className = 'field-error';
  reasonError.id = 'error-return-reason';
  reasonError.setAttribute('aria-live', 'polite');
  reasonField.append(reasonLabel, reasonSelect, reasonError);
  grid.appendChild(reasonField);

  const goodField = document.createElement('div');
  goodField.className = 'field';
  const goodLabel = document.createElement('label');
  goodLabel.setAttribute('for', 'return-quantity-good');
  goodLabel.textContent = 'Cantidad en buen estado';
  const goodInput = document.createElement('input');
  goodInput.type = 'number';
  goodInput.id = 'return-quantity-good';
  goodInput.name = 'return-quantity-good';
  goodInput.min = '0';
  goodInput.step = '1';
  goodInput.value = '1';
  const goodError = document.createElement('span');
  goodError.className = 'field-error';
  goodError.id = 'error-return-quantity-good';
  goodError.setAttribute('aria-live', 'polite');
  goodField.append(goodLabel, goodInput, goodError);
  grid.appendChild(goodField);

  const damagedField = document.createElement('div');
  damagedField.className = 'field';
  const damagedLabel = document.createElement('label');
  damagedLabel.setAttribute('for', 'return-quantity-damaged');
  damagedLabel.textContent = 'Cantidad dañada (merma)';
  const damagedInput = document.createElement('input');
  damagedInput.type = 'number';
  damagedInput.id = 'return-quantity-damaged';
  damagedInput.name = 'return-quantity-damaged';
  damagedInput.min = '0';
  damagedInput.step = '1';
  const damagedError = document.createElement('span');
  damagedError.className = 'field-error';
  damagedError.id = 'error-return-quantity-damaged';
  damagedField.append(damagedLabel, damagedInput, damagedError);
  grid.appendChild(damagedField);

  const notesField = document.createElement('div');
  notesField.className = 'field';
  const notesLabel = document.createElement('label');
  notesLabel.setAttribute('for', 'return-notes');
  notesLabel.textContent = 'Notas';
  const notesInput = document.createElement('input');
  notesInput.type = 'text';
  notesInput.id = 'return-notes';
  notesInput.name = 'return-notes';
  const notesError = document.createElement('span');
  notesError.className = 'field-error';
  notesError.id = 'error-return-notes';
  notesField.append(notesLabel, notesInput, notesError);
  grid.appendChild(notesField);

  form.appendChild(grid);

  const kindInput = document.createElement('input');
  kindInput.type = 'hidden';
  kindInput.id = 'return-movement-kind';
  kindInput.name = 'return-movement-kind';
  const movementInput = document.createElement('input');
  movementInput.type = 'hidden';
  movementInput.id = 'return-movement-id';
  movementInput.name = 'return-movement-id';
  form.append(kindInput, movementInput);

  const targetError = document.createElement('span');
  targetError.className = 'field-error';
  targetError.id = 'error-return-movement-id';
  targetError.setAttribute('aria-live', 'polite');
  form.appendChild(targetError);

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'return-submit';
  submit.textContent = 'Registrar devolución';
  actions.appendChild(submit);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'return-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  return form;
}

export function setReturnTarget(form, { kind = '', movementId = '', label = '', products = [] } = {}) {
  form.elements['return-movement-kind'].value = kind;
  form.elements['return-movement-id'].value = movementId;
  form.querySelector('#return-reference').textContent = label;
  const entityField = form.querySelector('#return-entity-field');
  const entitySelect = form.elements['return-entity'];
  if (kind === 'transfer' && products.length) {
    fillOptions(
      entitySelect,
      products.map((p) => ({ value: p.entity_id, label: p.label })),
      '— Seleccione —'
    );
    if (products.length === 1) entitySelect.value = products[0].entity_id;
    entityField.hidden = false;
  } else {
    fillOptions(entitySelect, [], '— Seleccione —');
    entityField.hidden = true;
  }
  clearReturnFormErrors(form);
}

export function getReturnFormValues(form) {
  return {
    movement_kind: form.elements['return-movement-kind'].value,
    movement_id: form.elements['return-movement-id'].value,
    entity_id: form.elements['return-entity'].value,
    reason: form.elements['return-reason'].value,
    quantity_good: form.elements['return-quantity-good'].value,
    quantity_damaged: form.elements['return-quantity-damaged'].value,
    notes: form.elements['return-notes'].value,
  };
}

export function clearReturnFormErrors(form) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, select')) {
    input.removeAttribute('aria-invalid');
  }
}

export function showReturnFormErrors(form, errors = {}) {
  clearReturnFormErrors(form);
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = KEY_TO_FIELD[key] ?? key;
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  const feedback = form.querySelector('#return-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo registrar: corrija los errores marcados.';
  }
}

export function resetReturnForm(form) {
  form.reset();
  form.querySelector('#return-reference').textContent = 'Seleccione un movimiento para registrar una devolución.';
  form.elements['return-movement-kind'].value = '';
  form.elements['return-movement-id'].value = '';
  form.querySelector('#return-entity-field').hidden = true;
  clearReturnFormErrors(form);
  const feedback = form.querySelector('#return-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showReturnFormSuccess(form, message) {
  const feedback = form.querySelector('#return-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

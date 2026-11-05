import {
  renderCustomFields,
  readCustomFieldValues,
  showCustomFieldErrors,
} from './custom-fields.js';

const BASE_FIELDS = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'code', label: 'Código', type: 'text', required: true },
  { name: 'taxId', label: 'Identificación fiscal', type: 'text' },
  { name: 'email', label: 'Correo electrónico', type: 'email' },
  { name: 'phone', label: 'Teléfono', type: 'text' },
  { name: 'address', label: 'Dirección', type: 'text' },
  { name: 'category', label: 'Categoría', type: 'select' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'targetDate', label: 'Fecha objetivo', type: 'date' },
  { name: 'creditLimit', label: 'Límite de crédito', type: 'number' },
  { name: 'stockMin', label: 'Stock mínimo', type: 'number', step: '1' },
  { name: 'paymentTerms', label: 'Condiciones de pago', type: 'text' },
];

function buildField(spec, categories) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

  const label = document.createElement('label');
  label.setAttribute('for', spec.name);
  label.textContent = spec.label;
  if (spec.required) {
    const marker = document.createElement('span');
    marker.className = 'required';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ' *';
    label.appendChild(marker);
  }
  wrapper.appendChild(label);

  let input;
  if (spec.type === 'select') {
    input = document.createElement('select');
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Seleccione —';
    input.appendChild(blank);
    for (const option of categories) {
      const node = document.createElement('option');
      node.value = option;
      node.textContent = option;
      input.appendChild(node);
    }
  } else if (spec.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = spec.type;
    if (spec.type === 'number') {
      input.min = '0';
      input.step = spec.step ?? '0.01';
    }
  }
  input.id = spec.name;
  input.name = spec.name;
  if (spec.required) input.required = true;
  wrapper.appendChild(input);

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-${spec.name}`;
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);
  input.setAttribute('aria-describedby', error.id);

  return wrapper;
}

export function renderEntityForm(container, { categories = [], customFields = [], labels = {} }) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'entity-form';
  form.noValidate = true;

  const grid = document.createElement('div');
  grid.className = 'form-grid';
  for (const spec of BASE_FIELDS) {
    grid.appendChild(buildField(spec, categories));
  }
  form.appendChild(grid);

  const customContainer = document.createElement('div');
  customContainer.id = 'entity-custom-fields';
  customContainer.className = 'form-grid';
  customContainer.hidden = customFields.length === 0;
  renderCustomFields(customContainer, customFields);
  form.appendChild(customContainer);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'entity-submit';
  submit.textContent = 'Guardar';
  actions.appendChild(submit);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.id = 'entity-cancel';
  cancel.hidden = true;
  cancel.textContent = 'Cancelar';
  actions.appendChild(cancel);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'entity-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  void labels;
  return form;
}

export function getEntityFormValues(form, customFields = []) {
  const values = {};
  for (const spec of BASE_FIELDS) {
    const input = form.elements[spec.name];
    values[spec.name] = input ? String(input.value ?? '').trim() : '';
  }
  Object.assign(values, readCustomFieldValues(form, customFields));
  return values;
}

export function setEntityFormValues(form, values = {}, customFields = []) {
  for (const spec of BASE_FIELDS) {
    const input = form.elements[spec.name];
    if (input) input.value = values[spec.name] ?? '';
  }
  for (const field of customFields) {
    const wrapper = Array.from(form.querySelectorAll('.custom-field')).find(
      (el) => el.dataset.fieldKey === field.key
    );
    const input = wrapper ? wrapper.querySelector('input, select') : null;
    if (input) input.value = values[field.key] ?? '';
  }
}

export function clearEntityFormErrors(form, customFields = []) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, select, textarea')) {
    input.removeAttribute('aria-invalid');
  }
  showCustomFieldErrors(form, {});
  void customFields;
}

export function showEntityFormErrors(form, errors = {}, customFields = []) {
  clearEntityFormErrors(form, customFields);
  for (const [key, message] of Object.entries(errors)) {
    const errorNode = form.querySelector(`#error-${key}`);
    const input = form.elements[key] ?? form.querySelector(`[name="${key}"]`);
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  showCustomFieldErrors(form, errors);
  const feedback = form.querySelector('#entity-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetEntityForm(form) {
  form.reset();
  clearEntityFormErrors(form);
  const feedback = form.querySelector('#entity-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showEntityFormSuccess(form, message) {
  const feedback = form.querySelector('#entity-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

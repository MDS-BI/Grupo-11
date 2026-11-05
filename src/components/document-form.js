import { renderCustomFields, readCustomFieldValues, showCustomFieldErrors } from './custom-fields.js';
import { DOCUMENT_TYPES } from '../storage.js';

const TYPE_LABELS = {
  'orden-compra': 'Orden de compra',
  remision: 'Remisión',
};

const KEY_TO_FIELD = {
  type: 'document-type',
  series: 'document-series',
  folio: 'document-folio',
  startDate: 'document-start-date',
  endDate: 'document-end-date',
  notes: 'document-notes',
  status: 'document-status',
};

function buildField(id, labelText, { type = 'text', required = false } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field';

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

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = id;
  if (required) input.required = true;
  if (type === 'number') {
    input.min = '1';
    input.step = '1';
  }
  wrapper.appendChild(input);

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-${id}`;
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);
  input.setAttribute('aria-describedby', error.id);

  return wrapper;
}

export function renderDocumentForm(container, { customFields = [] } = {}) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'document-form';
  form.noValidate = true;

  const grid = document.createElement('div');
  grid.className = 'form-grid';

  const typeField = document.createElement('div');
  typeField.className = 'field';
  const typeLabel = document.createElement('label');
  typeLabel.setAttribute('for', 'document-type');
  typeLabel.textContent = 'Tipo';
  const typeMarker = document.createElement('span');
  typeMarker.className = 'required';
  typeMarker.setAttribute('aria-hidden', 'true');
  typeMarker.textContent = ' *';
  typeLabel.appendChild(typeMarker);
  const typeSelect = document.createElement('select');
  typeSelect.id = 'document-type';
  typeSelect.name = 'document-type';
  typeSelect.required = true;
  const blankType = document.createElement('option');
  blankType.value = '';
  blankType.textContent = '— Seleccione —';
  typeSelect.appendChild(blankType);
  for (const value of DOCUMENT_TYPES) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = TYPE_LABELS[value] ?? value;
    typeSelect.appendChild(option);
  }
  const typeError = document.createElement('span');
  typeError.className = 'field-error';
  typeError.id = 'error-document-type';
  typeError.setAttribute('aria-live', 'polite');
  typeField.append(typeLabel, typeSelect, typeError);
  typeSelect.setAttribute('aria-describedby', typeError.id);
  grid.appendChild(typeField);

  grid.appendChild(buildField('document-series', 'Serie'));
  grid.appendChild(buildField('document-folio', 'Folio', { type: 'number', required: true }));
  grid.appendChild(buildField('document-start-date', 'Fecha de inicio', { type: 'date', required: true }));
  grid.appendChild(buildField('document-end-date', 'Fecha de fin', { type: 'date', required: true }));
  grid.appendChild(buildField('document-notes', 'Notas'));

  const statusField = document.createElement('div');
  statusField.className = 'field';
  statusField.id = 'document-status-field';
  statusField.hidden = true;
  const statusLabel = document.createElement('label');
  statusLabel.setAttribute('for', 'document-status');
  statusLabel.textContent = 'Estado';
  const statusSelect = document.createElement('select');
  statusSelect.id = 'document-status';
  statusSelect.name = 'document-status';
  const statusError = document.createElement('span');
  statusError.className = 'field-error';
  statusError.id = 'error-document-status';
  statusError.setAttribute('aria-live', 'polite');
  statusField.append(statusLabel, statusSelect, statusError);
  statusSelect.setAttribute('aria-describedby', statusError.id);
  grid.appendChild(statusField);

  form.appendChild(grid);

  const customContainer = document.createElement('div');
  customContainer.id = 'document-custom-fields';
  customContainer.className = 'form-grid';
  customContainer.hidden = customFields.length === 0;
  renderCustomFields(customContainer, customFields);
  form.appendChild(customContainer);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'document-submit';
  submit.textContent = 'Guardar';
  actions.appendChild(submit);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.id = 'document-cancel';
  cancel.hidden = true;
  cancel.textContent = 'Cancelar';
  actions.appendChild(cancel);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'document-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  return form;
}

export function getDocumentFormValues(form, customFields = []) {
  const folioRaw = form.elements['document-folio'].value;
  const statusField = form.querySelector('#document-status-field');
  return {
    type: form.elements['document-type'].value,
    series: form.elements['document-series'].value.trim(),
    folio: folioRaw === '' ? '' : Number(folioRaw),
    startDate: form.elements['document-start-date'].value,
    endDate: form.elements['document-end-date'].value,
    notes: form.elements['document-notes'].value,
    ...(statusField && !statusField.hidden ? { status: form.elements['document-status'].value } : {}),
    ...readCustomFieldValues(form, customFields),
  };
}

export function setDocumentStatusOptions(form, { current = '', next = [] } = {}) {
  const field = form.querySelector('#document-status-field');
  const select = form.elements['document-status'];
  if (!field || !select) return;
  select.textContent = '';
  const addOption = (value, selected) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = selected;
    select.appendChild(option);
  };
  if (current) addOption(current, true);
  for (const state of next) {
    if (state !== current) addOption(state, false);
  }
  field.hidden = false;
}

export function clearDocumentStatus(form) {
  const field = form.querySelector('#document-status-field');
  const select = form.elements['document-status'];
  if (field) field.hidden = true;
  if (select) select.textContent = '';
}

export function setDocumentFormValues(form, doc, customFields = []) {
  form.elements['document-type'].value = doc.type ?? '';
  form.elements['document-series'].value = doc.series ?? '';
  form.elements['document-folio'].value = doc.folio ?? '';
  form.elements['document-start-date'].value = doc.startDate ?? '';
  form.elements['document-end-date'].value = doc.endDate ?? '';
  form.elements['document-notes'].value = doc.notes ?? '';
  for (const field of customFields) {
    const wrapper = Array.from(form.querySelectorAll('.custom-field')).find(
      (el) => el.dataset.fieldKey === field.key
    );
    const input = wrapper ? wrapper.querySelector('input, select') : null;
    if (input) input.value = doc[field.key] ?? '';
  }
}

export function clearDocumentFormErrors(form, customFields = []) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, select, textarea')) {
    input.removeAttribute('aria-invalid');
  }
  showCustomFieldErrors(form, {});
  void customFields;
}

export function showDocumentFormErrors(form, errors = {}, customFields = []) {
  clearDocumentFormErrors(form, customFields);
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = KEY_TO_FIELD[key] ?? key;
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  showCustomFieldErrors(form, errors);
  const feedback = form.querySelector('#document-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetDocumentForm(form, customFields = []) {
  form.reset();
  clearDocumentFormErrors(form, customFields);
  clearDocumentStatus(form);
  const feedback = form.querySelector('#document-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showDocumentFormSuccess(form, message) {
  const feedback = form.querySelector('#document-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

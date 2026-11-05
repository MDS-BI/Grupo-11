import { isLotExpired } from '../storage.js';

const SOON_DAYS = 30;

function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

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
  wrapper.appendChild(input);

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-${id}`;
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);
  input.setAttribute('aria-describedby', error.id);

  return wrapper;
}

const KEY_TO_FIELD = {
  lotNumber: 'lot-number',
  manufactureDate: 'lot-manufacture-date',
  expiryDate: 'lot-expiry-date',
};

export function renderLotForm(container) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'lot-form';
  form.noValidate = true;

  const grid = document.createElement('div');
  grid.className = 'form-grid';
  grid.appendChild(buildField('lot-number', 'Número de lote', { required: true }));
  grid.appendChild(buildField('lot-manufacture-date', 'Fecha de fabricación', { type: 'date' }));
  grid.appendChild(buildField('lot-expiry-date', 'Fecha de vencimiento', { type: 'date' }));
  form.appendChild(grid);

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'lot-submit';
  submit.textContent = 'Guardar lote';
  actions.appendChild(submit);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'lot-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  return form;
}

export function getLotFormValues(form) {
  return {
    lotNumber: form.elements['lot-number'].value.trim(),
    manufactureDate: form.elements['lot-manufacture-date'].value,
    expiryDate: form.elements['lot-expiry-date'].value,
  };
}

export function clearLotFormErrors(form) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input')) input.removeAttribute('aria-invalid');
}

export function showLotFormErrors(form, errors = {}) {
  clearLotFormErrors(form);
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = KEY_TO_FIELD[key] ?? key;
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  const feedback = form.querySelector('#lot-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetLotForm(form) {
  form.reset();
  clearLotFormErrors(form);
  const feedback = form.querySelector('#lot-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showLotFormSuccess(form, message) {
  const feedback = form.querySelector('#lot-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

function sortFEFO(lots) {
  return [...lots].sort((a, b) => {
    if (!a.expiryDate && !b.expiryDate) return 0;
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });
}

export function renderLotList(container, lots, { balances = {} } = {}) {
  container.textContent = '';

  for (const lot of sortFEFO(lots)) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.lotId = lot.id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    title.textContent = lot.lotNumber;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    const parts = [];
    if (lot.manufactureDate) parts.push(`Fabricado: ${lot.manufactureDate}`);
    if (lot.expiryDate) parts.push(`Vence: ${lot.expiryDate}`);
    meta.textContent = parts.join(' · ');
    main.appendChild(meta);

    if (isLotExpired(lot)) {
      const badge = document.createElement('span');
      badge.className = 'badge danger';
      badge.textContent = 'Vencido';
      main.appendChild(badge);
    } else if (lot.expiryDate && daysUntil(lot.expiryDate) <= SOON_DAYS) {
      const badge = document.createElement('span');
      badge.className = 'badge low';
      badge.textContent = 'Próximo a vencer';
      main.appendChild(badge);
    }

    const balance = document.createElement('span');
    balance.className = 'stock-value';
    balance.textContent = `Saldo: ${balances[lot.id] ?? 0}`;
    main.appendChild(balance);

    item.appendChild(main);
    container.appendChild(item);
  }
}

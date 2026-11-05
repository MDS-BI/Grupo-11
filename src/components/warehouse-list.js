const FORM_FIELDS = [
  { name: 'warehouse-code', label: 'Código', required: true },
  { name: 'warehouse-name', label: 'Nombre', required: true },
  { name: 'warehouse-address', label: 'Dirección', required: false },
  { name: 'warehouse-description', label: 'Descripción', required: false, textarea: true },
];

function buildField(spec) {
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
  if (spec.textarea) {
    input = document.createElement('textarea');
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = 'text';
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

export function renderWarehouseForm(container) {
  container.textContent = '';
  const form = document.createElement('form');
  form.id = 'warehouse-form';
  form.noValidate = true;

  const grid = document.createElement('div');
  grid.className = 'form-grid';
  for (const spec of FORM_FIELDS) {
    grid.appendChild(buildField(spec));
  }
  form.appendChild(grid);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn btn-primary';
  submit.id = 'warehouse-submit';
  submit.textContent = 'Guardar';
  actions.appendChild(submit);

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'btn';
  cancel.id = 'warehouse-cancel';
  cancel.hidden = true;
  cancel.textContent = 'Cancelar';
  actions.appendChild(cancel);
  form.appendChild(actions);

  const feedback = document.createElement('div');
  feedback.className = 'form-feedback';
  feedback.id = 'warehouse-form-feedback';
  feedback.hidden = true;
  feedback.setAttribute('role', 'status');
  form.appendChild(feedback);

  container.appendChild(form);
  return form;
}

export function getWarehouseFormValues(form) {
  const values = {};
  for (const spec of FORM_FIELDS) {
    const input = form.elements[spec.name];
    values[spec.name.replace(/^warehouse-/, '')] = input ? String(input.value ?? '').trim() : '';
  }
  return values;
}

export function setWarehouseFormValues(form, warehouse = {}) {
  form.elements['warehouse-code'].value = warehouse.code ?? '';
  form.elements['warehouse-name'].value = warehouse.name ?? '';
  form.elements['warehouse-address'].value = warehouse.address ?? '';
  form.elements['warehouse-description'].value = warehouse.description ?? '';
}

export function clearWarehouseFormErrors(form) {
  for (const error of form.querySelectorAll('.field-error')) error.textContent = '';
  for (const input of form.querySelectorAll('input, textarea')) {
    input.removeAttribute('aria-invalid');
  }
}

export function showWarehouseFormErrors(form, errors = {}) {
  clearWarehouseFormErrors(form);
  const keyMap = {
    code: 'warehouse-code',
    name: 'warehouse-name',
    address: 'warehouse-address',
    description: 'warehouse-description',
  };
  for (const [key, message] of Object.entries(errors)) {
    const fieldName = keyMap[key] ?? key;
    const errorNode = form.querySelector(`#error-${fieldName}`);
    const input = form.elements[fieldName];
    if (errorNode) errorNode.textContent = message;
    if (input) input.setAttribute('aria-invalid', 'true');
  }
  const feedback = form.querySelector('#warehouse-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback error';
    feedback.textContent = 'No se pudo guardar: corrija los errores marcados.';
  }
}

export function resetWarehouseForm(form) {
  form.reset();
  clearWarehouseFormErrors(form);
  const feedback = form.querySelector('#warehouse-form-feedback');
  if (feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

export function showWarehouseFormSuccess(form, message) {
  const feedback = form.querySelector('#warehouse-form-feedback');
  if (feedback) {
    feedback.hidden = false;
    feedback.className = 'form-feedback success';
    feedback.textContent = message;
  }
}

export function renderWarehouseList(container, warehouses, { onEdit = null, onToggle = null, onDelete = null } = {}) {
  container.textContent = '';

  for (const warehouse of warehouses) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.warehouseId = warehouse.id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    title.textContent = warehouse.name;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    const parts = [warehouse.code];
    if (warehouse.address) parts.push(warehouse.address);
    meta.textContent = parts.filter(Boolean).join(' · ');
    main.appendChild(meta);

    const badge = document.createElement('span');
    badge.className = warehouse.active ? 'badge ok' : 'badge danger';
    badge.textContent = warehouse.active ? 'Activa' : 'Desactivada';
    main.appendChild(badge);

    item.appendChild(main);

    const actions = document.createElement('div');
    actions.className = 'record-actions';

    if (onEdit) {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-sm';
      edit.dataset.action = 'edit';
      edit.textContent = 'Editar';
      edit.addEventListener('click', () => onEdit(warehouse));
      actions.appendChild(edit);
    }
    if (onToggle) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'btn btn-sm';
      toggle.dataset.action = 'toggle';
      toggle.textContent = warehouse.active ? 'Desactivar' : 'Reactivar';
      toggle.addEventListener('click', () => onToggle(warehouse));
      actions.appendChild(toggle);
    }
    if (onDelete) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-sm btn-danger';
      remove.dataset.action = 'delete';
      remove.textContent = 'Eliminar';
      remove.addEventListener('click', () => onDelete(warehouse));
      actions.appendChild(remove);
    }

    item.appendChild(actions);
    container.appendChild(item);
  }
}

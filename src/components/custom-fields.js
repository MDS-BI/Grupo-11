export function renderCustomFields(container, fields, values = {}) {
  const list = Array.isArray(fields) ? fields : [];
  for (const field of list) {
    container.appendChild(renderCustomFieldInput(field, values[field.key]));
  }
}

export function renderCustomFieldInput(field, value = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'field custom-field';
  wrapper.dataset.fieldKey = field.key;

  const label = document.createElement('label');
  label.setAttribute('for', `cf-${field.key}`);
  label.textContent = field.label;
  if (field.required) {
    const marker = document.createElement('span');
    marker.className = 'required';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ' *';
    label.appendChild(marker);
  }
  wrapper.appendChild(label);

  let input;
  if (field.type === 'select') {
    input = document.createElement('select');
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Seleccione —';
    input.appendChild(blank);
    for (const optionValue of field.options ?? []) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      input.appendChild(option);
    }
    if (value != null && String(value) !== '') input.value = String(value);
  } else {
    input = document.createElement('input');
    input.type = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
    if (field.type === 'number') input.step = 'any';
    if (value != null) input.value = String(value);
  }
  input.id = `cf-${field.key}`;
  input.name = field.key;
  if (field.required) input.required = true;
  wrapper.appendChild(input);

  const error = document.createElement('span');
  error.className = 'field-error';
  error.id = `error-cf-${field.key}`;
  error.setAttribute('aria-live', 'polite');
  wrapper.appendChild(error);

  input.setAttribute('aria-describedby', error.id);
  return wrapper;
}

export function readCustomFieldValues(container, fields) {
  const values = {};
  for (const field of Array.isArray(fields) ? fields : []) {
    const wrapper = Array.from(container.querySelectorAll('.custom-field')).find(
      (el) => el.dataset.fieldKey === field.key
    );
    const input = wrapper ? wrapper.querySelector('input, select') : null;
    values[field.key] = input ? input.value : '';
  }
  return values;
}

export function showCustomFieldErrors(container, errors = {}) {
  for (const fieldError of container.querySelectorAll('.custom-field')) {
    const key = fieldError.dataset.fieldKey;
    const errorNode = fieldError.querySelector('.field-error');
    const input = fieldError.querySelector('input, select');
    const message = errors[key] ?? '';
    if (errorNode) errorNode.textContent = message;
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }
}

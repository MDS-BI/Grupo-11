import { login, GENERIC_LOGIN_ERROR } from '../auth.js';

function clearFieldError(input, error) {
  input.removeAttribute('aria-invalid');
  input.removeAttribute('aria-describedby');
  if (error) error.textContent = '';
}

function missingFields(username, password) {
  const missing = [];
  if (!String(username ?? '').trim()) missing.push('usuario');
  if (!String(password ?? '').trim()) missing.push('contraseña');
  return missing;
}

export function renderLogin(root, { onSuccess } = {}) {
  if (!root) return null;
  root.querySelectorAll('#login-screen').forEach((node) => node.remove());

  const screen = document.createElement('section');
  screen.id = 'login-screen';
  screen.className = 'login-screen';
  screen.setAttribute('aria-labelledby', 'login-title');

  const card = document.createElement('div');
  card.className = 'login-card';

  const title = document.createElement('h1');
  title.id = 'login-title';
  title.className = 'login-title';
  title.textContent = 'Iniciar sesión';
  card.appendChild(title);

  const form = document.createElement('form');
  form.id = 'login-form';
  form.className = 'login-form';
  form.noValidate = true;

  const errorBox = document.createElement('p');
  errorBox.id = 'login-error';
  errorBox.className = 'login-error';
  errorBox.setAttribute('role', 'alert');
  errorBox.hidden = true;
  form.appendChild(errorBox);

  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.id = 'login-username';
  usernameInput.name = 'username';
  usernameInput.className = 'login-input';
  usernameInput.autocomplete = 'username';
  usernameInput.setAttribute('aria-label', 'Usuario');
  usernameInput.setAttribute('aria-describedby', 'login-error');

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'login-password';
  passwordInput.name = 'password';
  passwordInput.className = 'login-input';
  passwordInput.autocomplete = 'current-password';
  passwordInput.setAttribute('aria-label', 'Contraseña');
  passwordInput.setAttribute('aria-describedby', 'login-error');

  for (const [labelText, input] of [
    ['Usuario', usernameInput],
    ['Contraseña', passwordInput],
  ]) {
    const field = document.createElement('div');
    field.className = 'login-field';
    const label = document.createElement('label');
    label.className = 'login-label';
    label.setAttribute('for', input.id);
    label.textContent = labelText;
    field.appendChild(label);
    field.appendChild(input);
    form.appendChild(field);
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.id = 'login-submit';
  submit.className = 'login-submit';
  submit.textContent = 'Entrar';
  form.appendChild(submit);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;
    clearFieldError(usernameInput, errorBox);
    clearFieldError(passwordInput, errorBox);
    errorBox.hidden = true;
    errorBox.textContent = '';

    const missing = missingFields(username, password);
    if (missing.length > 0) {
      errorBox.hidden = false;
      errorBox.textContent = `Complete los campos obligatorios: ${missing.join(', ')}.`;
      usernameInput.setAttribute('aria-invalid', String(!String(username ?? '').trim()));
      passwordInput.setAttribute('aria-invalid', String(!String(password ?? '').trim()));
      usernameInput.focus();
      return;
    }

    const session = login(username, password);
    if (!session) {
      errorBox.hidden = false;
      errorBox.textContent = GENERIC_LOGIN_ERROR;
      usernameInput.setAttribute('aria-invalid', 'true');
      passwordInput.setAttribute('aria-invalid', 'true');
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }

    if (typeof onSuccess === 'function') onSuccess(session);
  });

  card.appendChild(form);
  screen.appendChild(card);
  root.appendChild(screen);
  usernameInput.focus();
  return screen;
}

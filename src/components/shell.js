import { getActiveConfig } from '../module-config.js';

export function moduleInitials(moduleName) {
  const words = String(moduleName ?? '')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 1);
  const source = words.length ? words : String(moduleName ?? '').trim().split(/\s+/);
  return source
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

export function createMonogram(moduleName) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('width', '32');
  svg.setAttribute('height', '32');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Logotipo de ${moduleName}`);

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '2');
  rect.setAttribute('y', '2');
  rect.setAttribute('width', '36');
  rect.setAttribute('height', '36');
  rect.setAttribute('rx', '8');
  rect.setAttribute('fill', 'var(--accent)');
  svg.appendChild(rect);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '20');
  text.setAttribute('y', '26');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '15');
  text.setAttribute('font-weight', '700');
  text.setAttribute('fill', 'var(--accent-contrast)');
  text.textContent = moduleInitials(moduleName);
  svg.appendChild(text);

  return svg;
}

const NAV_LABEL_IDS = {
  dashboard: 'nav-dashboard-label',
  entities: 'nav-entities-label',
  movements: 'nav-movements-label',
  warehouses: 'nav-warehouses-label',
  search: 'nav-search-label',
};

export function initShell({ onNavigate } = {}) {
  const config = getActiveConfig();

  const brandName = document.getElementById('brand-name');
  if (brandName) brandName.textContent = config.moduleName;

  const mark = document.getElementById('logo-mark');
  if (mark) {
    mark.textContent = '';
    mark.appendChild(createMonogram(config.moduleName));
  }

  const navLabels = config.labels?.nav ?? {};
  for (const [route, id] of Object.entries(NAV_LABEL_IDS)) {
    const node = document.getElementById(id);
    if (node) node.textContent = navLabels[route] ?? node.textContent;
  }

  for (const button of document.querySelectorAll('.nav-module')) {
    const route = button.dataset.module;
    if (!route) continue;
    button.onclick = () => {
      if (onNavigate) onNavigate(route);
    };
  }
}

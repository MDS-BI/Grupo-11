import { getActiveConfig } from '../module-config.js';

function actionButton(id, title, description) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'action-btn';
  button.id = id;

  const titleNode = document.createElement('span');
  titleNode.className = 'action-title';
  titleNode.id = `${id}-title`;
  titleNode.textContent = title;
  button.appendChild(titleNode);

  const descriptionNode = document.createElement('span');
  descriptionNode.className = 'action-description';
  descriptionNode.textContent = description;
  button.appendChild(descriptionNode);

  return button;
}

function statCard(id, label, value) {
  const card = document.createElement('div');
  card.className = 'stat-card';

  const labelNode = document.createElement('span');
  labelNode.className = 'stat-label';
  labelNode.id = `${id}-label`;
  labelNode.textContent = label;
  card.appendChild(labelNode);

  const valueNode = document.createElement('span');
  valueNode.className = 'stat-value';
  valueNode.id = id;
  valueNode.textContent = String(value);
  card.appendChild(valueNode);

  return card;
}

export function renderDashboard(container, { stats = { entities: 0, documents: 0 } } = {}) {
  const config = getActiveConfig();
  container.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.nav.dashboard;
  header.appendChild(heading);
  container.appendChild(header);

  const actions = document.createElement('div');
  actions.className = 'panel';
  const actionsTitle = document.createElement('h2');
  actionsTitle.textContent = 'Acciones rápidas';
  actions.appendChild(actionsTitle);

  const grid = document.createElement('div');
  grid.className = 'action-grid';
  grid.appendChild(
    actionButton('action-new-entity', config.labels.quickActions.newEntity, 'Abrir el formulario con datos vacíos')
  );
  grid.appendChild(
    actionButton('action-new-movement', config.labels.quickActions.newMovement, 'Registrar una entrada, salida o ajuste')
  );
  grid.appendChild(
    actionButton('action-open-entities', config.labels.quickActions.manageEntities, 'Ver y editar los registros guardados')
  );
  grid.appendChild(
    actionButton('action-find', config.labels.quickActions.searchRecords, 'Recuperar registros por nombre o código')
  );
  actions.appendChild(grid);
  container.appendChild(actions);

  const statsPanel = document.createElement('div');
  statsPanel.className = 'panel';
  const statsTitle = document.createElement('h2');
  statsTitle.textContent = 'Estadísticas';
  statsPanel.appendChild(statsTitle);

  const statGrid = document.createElement('div');
  statGrid.className = 'stat-grid';
  statGrid.appendChild(statCard('stat-entities', config.labels.entities, stats.entities));
  statGrid.appendChild(statCard('stat-documents', config.labels.documents, stats.documents));
  statsPanel.appendChild(statGrid);
  container.appendChild(statsPanel);
}

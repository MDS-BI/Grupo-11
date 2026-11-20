import { normalizeConfig, setActiveConfig, getActiveConfig, DEFAULT_ACCENT, lifecycleFor, returnsLifecycle, nextStates } from './module-config.js';
import { initShell } from './components/shell.js';
import {
  loadEntities,
  addEntity,
  updateEntity,
  deleteEntity,
  validateEntity,
  getEntity,
  loadDocuments,
  loadWarehouses,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouse,
  validateWarehouse,
  searchEntities,
  validateMovement,
  addMovement,
  loadMovements,
  getStockByWarehouse,
  lotsForProduct,
  calculateStock,
  isEffectiveMovement,
  validateLot,
  addLot,
  lotBalance,
  isLotExpired,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  documentNumber,
  validateDocument,
  updateMovementStatus,
  updateTransferStatus,
  createTransfer,
  loadTransfers,
  transferLines,
  validateTransfer,
  createReturn,
  loadReturns,
  updateReturnStatus,
  validateReturn,
} from './storage.js';
import { renderDashboard } from './components/dashboard.js';
import {
  renderEntityForm,
  getEntityFormValues,
  setEntityFormValues,
  showEntityFormErrors,
  resetEntityForm,
  showEntityFormSuccess,
  clearEntityFormErrors,
} from './components/entity-form.js';
import { renderEntityList } from './components/entity-list.js';
import {
  renderWarehouseForm,
  getWarehouseFormValues,
  setWarehouseFormValues,
  showWarehouseFormErrors,
  resetWarehouseForm,
  showWarehouseFormSuccess,
  clearWarehouseFormErrors,
  renderWarehouseList,
} from './components/warehouse-list.js';
import {
  renderMovementForm,
  getMovementFormValues,
  showMovementFormErrors,
  resetMovementForm,
  showMovementFormSuccess,
  clearMovementFormErrors,
  setMovementLots,
  setMovementDocuments,
} from './components/movement-form.js';
import { renderMovementList, renderStockSummary } from './components/movement-list.js';
import { renderKardex } from './components/kardex-view.js';
import {
  renderLotForm,
  getLotFormValues,
  clearLotFormErrors,
  showLotFormErrors,
  resetLotForm,
  showLotFormSuccess,
  renderLotList,
} from './components/lot-list.js';
import {
  renderDocumentForm,
  getDocumentFormValues,
  setDocumentFormValues,
  clearDocumentFormErrors,
  showDocumentFormErrors,
  resetDocumentForm,
  showDocumentFormSuccess,
  setDocumentStatusOptions,
} from './components/document-form.js';
import { renderDocumentList } from './components/document-list.js';
import { renderSearchBar } from './components/search-bar.js';
import {
  renderTransferForm,
  getTransferFormValues,
  setTransferLineLots,
  clearTransferFormErrors,
  showTransferFormErrors,
  resetTransferForm,
  showTransferFormSuccess,
} from './components/transfer-form.js';
import {
  renderReturnForm,
  getReturnFormValues,
  setReturnTarget,
  clearReturnFormErrors,
  showReturnFormErrors,
  resetReturnForm,
  showReturnFormSuccess,
} from './components/return-form.js';

const VIEW_IDS = {
  dashboard: 'view-dashboard',
  entities: 'view-entities',
  movements: 'view-movements',
  warehouses: 'view-warehouses',
  search: 'view-search',
  product: 'view-product',
  kardex: 'view-kardex',
  lots: 'view-lots',
  transfers: 'view-transfers',
  documents: 'view-documents',
};

const MODULE_OF_ROUTE = {
  dashboard: 'dashboard',
  entities: 'entities',
  product: 'entities',
  kardex: 'entities',
  lots: 'entities',
  documents: 'entities',
  movements: 'movements',
  transfers: 'movements',
  warehouses: 'warehouses',
  search: 'search',
};

const renderers = {};
let currentRoute = 'dashboard';
let currentParams = {};
let rootElement = null;
let editingEntityId = null;

function entityCustomFields() {
  return (getActiveConfig().customFields ?? []).filter((f) => f.target === 'entity');
}

function entityFormTitle() {
  const labels = getActiveConfig().labels;
  return editingEntityId ? `Editar ${labels.entity}` : `Nuevo ${labels.entity}`;
}

function refreshEntityList(section) {
  const config = getActiveConfig();
  const list = section.querySelector('#entity-list');
  const empty = section.querySelector('#entity-list-empty');
  if (!list || !empty) return;
  renderEntityList(list, loadEntities(), {
    config,
    onOpen: (entity) => navigate('product', { entity_id: entity.entity_id }),
    onEdit: (entity) => startEditEntity(section, entity),
    onDelete: (entity) => handleEntityDelete(section, entity),
  });
  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : `No hay ${config.labels.entities} todavía.`;
  const feedback = section.querySelector('#entity-list-feedback');
  if (feedback) feedback.hidden = true;
}

function handleEntityDelete(section, entity) {
  const config = getActiveConfig();
  if (!confirm(`¿Eliminar el producto "${entity.name}"? Esta acción no se puede deshacer.`)) return;
  try {
    deleteEntity(entity.id);
    if (editingEntityId === entity.id) stopEditing(section);
    refreshEntityList(section);
    showListFeedback(section, `${config.labels.entity} eliminado correctamente.`, 'success');
  } catch (error) {
    showListFeedback(section, error.message, 'error');
  }
}

function showListFeedback(section, message, kind = 'error', feedbackId = 'entity-list-feedback') {
  const feedback = section.querySelector(`#${feedbackId}`);
  if (!feedback) return;
  feedback.hidden = false;
  feedback.className = kind === 'error' ? 'form-feedback error' : 'form-feedback success';
  feedback.textContent = message;
}

function startEditEntity(section, entity) {
  editingEntityId = entity.id;
  const form = section.querySelector('#entity-form');
  const title = section.querySelector('#entity-form-title');
  const cancel = section.querySelector('#entity-cancel');
  const submit = section.querySelector('#entity-submit');
  if (!form) return;
  setEntityFormValues(form, entity, entityCustomFields());
  clearEntityFormErrors(form, entityCustomFields());
  if (title) title.textContent = entityFormTitle();
  if (cancel) cancel.hidden = false;
  if (submit) submit.textContent = 'Actualizar';
  const feedback = form.querySelector('#entity-form-feedback');
  if (feedback) feedback.hidden = true;
  form.elements.name?.focus();
}

function stopEditing(section) {
  editingEntityId = null;
  const form = section.querySelector('#entity-form');
  const title = section.querySelector('#entity-form-title');
  const cancel = section.querySelector('#entity-cancel');
  const submit = section.querySelector('#entity-submit');
  if (form) resetEntityForm(form);
  if (title) title.textContent = entityFormTitle();
  if (cancel) cancel.hidden = true;
  if (submit) submit.textContent = 'Guardar';
}

function handleEntitySubmit(section, form, event) {
  event.preventDefault();
  const config = getActiveConfig();
  const customFields = entityCustomFields();
  clearEntityFormErrors(form, customFields);
  const values = getEntityFormValues(form, customFields);

  try {
    if (editingEntityId) {
      const existing = getEntity(editingEntityId);
      if (!existing) {
        stopEditing(section);
        return;
      }
      const { valid, errors } = validateEntity({ ...existing, ...values }, { ignoreId: existing.id });
      if (!valid) {
        showEntityFormErrors(form, errors, customFields);
        return;
      }
      updateEntity(editingEntityId, values);
      stopEditing(section);
      showEntityFormSuccess(form, `${config.labels.entity} actualizado correctamente.`);
    } else {
      const { valid, errors } = validateEntity(values);
      if (!valid) {
        showEntityFormErrors(form, errors, customFields);
        return;
      }
      addEntity(values);
      resetEntityForm(form);
      showEntityFormSuccess(form, `${config.labels.entity} guardado correctamente.`);
    }
  } catch (error) {
    showEntityFormErrors(form, { name: error.message }, customFields);
    return;
  }
  refreshEntityList(section);
}

function renderEntitiesView(section) {
  editingEntityId = null;
  const config = getActiveConfig();
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.entities;
  const newButton = document.createElement('button');
  newButton.type = 'button';
  newButton.className = 'btn';
  newButton.id = 'btn-new-entity';
  newButton.textContent = config.labels.quickActions.newEntity;
  header.append(heading, newButton);
  section.appendChild(header);

  const formPanel = document.createElement('div');
  formPanel.className = 'panel';
  const formTitle = document.createElement('h2');
  formTitle.id = 'entity-form-title';
  formTitle.textContent = entityFormTitle();
  const formMount = document.createElement('div');
  formMount.id = 'entity-form-mount';
  formPanel.append(formTitle, formMount);
  section.appendChild(formPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = config.labels.entities;
  const list = document.createElement('ul');
  list.id = 'entity-list';
  list.className = 'record-list';
  const empty = document.createElement('p');
  empty.id = 'entity-list-empty';
  empty.className = 'empty-state';
  const listFeedback = document.createElement('div');
  listFeedback.id = 'entity-list-feedback';
  listFeedback.className = 'form-feedback';
  listFeedback.hidden = true;
  listFeedback.setAttribute('role', 'status');
  listPanel.append(listTitle, listFeedback, list, empty);
  section.appendChild(listPanel);

  const form = renderEntityForm(formMount, {
    categories: config.categories,
    customFields: entityCustomFields(),
    labels: config.labels,
  });

  form.addEventListener('submit', (event) => handleEntitySubmit(section, form, event));
  newButton.addEventListener('click', () => {
    stopEditing(section);
    form.elements.name?.focus();
  });
  const cancel = form.querySelector('#entity-cancel');
  cancel.addEventListener('click', () => stopEditing(section));

  refreshEntityList(section);
}

registerView('entities', renderEntitiesView);

let editingWarehouseId = null;

function warehouseFormTitle() {
  return editingWarehouseId ? 'Actualizar bodega' : 'Nueva bodega';
}

function refreshWarehouseList(section) {
  const config = getActiveConfig();
  const list = section.querySelector('#warehouse-list');
  const empty = section.querySelector('#warehouse-list-empty');
  if (!list || !empty) return;
  renderWarehouseList(list, loadWarehouses(), {
    onEdit: (warehouse) => startEditWarehouse(section, warehouse),
    onToggle: (warehouse) => handleWarehouseToggle(section, warehouse),
    onDelete: (warehouse) => handleWarehouseDelete(section, warehouse),
  });
  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : `No hay ${config.labels.warehouses} todavía.`;
  const feedback = section.querySelector('#warehouse-list-feedback');
  if (feedback) feedback.hidden = true;
}

function startEditWarehouse(section, warehouse) {
  editingWarehouseId = warehouse.id;
  const form = section.querySelector('#warehouse-form');
  const title = section.querySelector('#warehouse-form-title');
  const cancel = section.querySelector('#warehouse-cancel');
  const submit = section.querySelector('#warehouse-submit');
  if (!form) return;
  setWarehouseFormValues(form, warehouse);
  clearWarehouseFormErrors(form);
  if (title) title.textContent = warehouseFormTitle();
  if (cancel) cancel.hidden = false;
  if (submit) submit.textContent = 'Actualizar';
  const feedback = form.querySelector('#warehouse-form-feedback');
  if (feedback) feedback.hidden = true;
  form.elements['warehouse-name']?.focus();
}

function stopEditingWarehouse(section) {
  editingWarehouseId = null;
  const form = section.querySelector('#warehouse-form');
  const title = section.querySelector('#warehouse-form-title');
  const cancel = section.querySelector('#warehouse-cancel');
  const submit = section.querySelector('#warehouse-submit');
  if (form) resetWarehouseForm(form);
  if (title) title.textContent = warehouseFormTitle();
  if (cancel) cancel.hidden = true;
  if (submit) submit.textContent = 'Guardar';
}

function handleWarehouseToggle(section, warehouse) {
  try {
    updateWarehouse(warehouse.id, { active: !warehouse.active });
    refreshWarehouseList(section);
    showListFeedback(
      section,
      warehouse.active ? 'Bodega desactivada correctamente.' : 'Bodega reactivada correctamente.',
      'success',
      'warehouse-list-feedback'
    );
  } catch (error) {
    showListFeedback(section, error.message, 'error', 'warehouse-list-feedback');
  }
}

function handleWarehouseDelete(section, warehouse) {
  if (!confirm(`¿Eliminar la bodega "${warehouse.name}"? Esta acción no se puede deshacer.`)) return;
  try {
    deleteWarehouse(warehouse.id);
    if (editingWarehouseId === warehouse.id) stopEditingWarehouse(section);
    refreshWarehouseList(section);
    showListFeedback(section, 'Bodega eliminada correctamente.', 'success', 'warehouse-list-feedback');
  } catch (error) {
    showListFeedback(section, error.message, 'error', 'warehouse-list-feedback');
  }
}

function handleWarehouseSubmit(section, form, event) {
  event.preventDefault();
  clearWarehouseFormErrors(form);
  const values = getWarehouseFormValues(form);

  try {
    if (editingWarehouseId) {
      const existing = getWarehouse(editingWarehouseId);
      if (!existing) {
        stopEditingWarehouse(section);
        return;
      }
      const { valid, errors } = validateWarehouse({ ...existing, ...values }, { ignoreId: existing.id });
      if (!valid) {
        showWarehouseFormErrors(form, errors);
        return;
      }
      updateWarehouse(editingWarehouseId, values);
      stopEditingWarehouse(section);
      showWarehouseFormSuccess(form, 'Bodega actualizada correctamente.');
    } else {
      const { valid, errors } = validateWarehouse(values);
      if (!valid) {
        showWarehouseFormErrors(form, errors);
        return;
      }
      addWarehouse(values);
      resetWarehouseForm(form);
      showWarehouseFormSuccess(form, 'Bodega guardada correctamente.');
    }
  } catch (error) {
    showWarehouseFormErrors(form, { code: error.message });
    return;
  }
  refreshWarehouseList(section);
}

function renderWarehousesView(section) {
  editingWarehouseId = null;
  const config = getActiveConfig();
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.warehouses;
  const newButton = document.createElement('button');
  newButton.type = 'button';
  newButton.className = 'btn';
  newButton.id = 'btn-new-warehouse';
  newButton.textContent = 'Nueva bodega';
  header.append(heading, newButton);
  section.appendChild(header);

  const formPanel = document.createElement('div');
  formPanel.className = 'panel';
  const formTitle = document.createElement('h2');
  formTitle.id = 'warehouse-form-title';
  formTitle.textContent = warehouseFormTitle();
  const formMount = document.createElement('div');
  formMount.id = 'warehouse-form-mount';
  formPanel.append(formTitle, formMount);
  section.appendChild(formPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = config.labels.warehouses;
  const list = document.createElement('ul');
  list.id = 'warehouse-list';
  list.className = 'record-list';
  const empty = document.createElement('p');
  empty.id = 'warehouse-list-empty';
  empty.className = 'empty-state';
  const listFeedback = document.createElement('div');
  listFeedback.id = 'warehouse-list-feedback';
  listFeedback.className = 'form-feedback';
  listFeedback.hidden = true;
  listFeedback.setAttribute('role', 'status');
  listPanel.append(listTitle, listFeedback, list, empty);
  section.appendChild(listPanel);

  const form = renderWarehouseForm(formMount);
  form.addEventListener('submit', (event) => handleWarehouseSubmit(section, form, event));
  newButton.addEventListener('click', () => {
    stopEditingWarehouse(section);
    form.elements['warehouse-code']?.focus();
  });
  form.querySelector('#warehouse-cancel').addEventListener('click', () => stopEditingWarehouse(section));

  refreshWarehouseList(section);
}

registerView('warehouses', renderWarehousesView);

function refreshMovementList(section) {
  const config = getActiveConfig();
  const list = section.querySelector('#movement-list');
  const empty = section.querySelector('#movement-list-empty');
  if (!list || !empty) return;
  const entities = Object.fromEntries(loadEntities().map((e) => [e.entity_id, e]));
  const warehouses = Object.fromEntries(loadWarehouses().map((w) => [w.id, w]));
  renderMovementList(list, loadMovements(), {
    entities,
    warehouses,
    onTransition: (movement, status) => handleMovementTransition(section, movement, status),
    onReturn: (movement) => openReturnTarget(section, movementReturnTarget(movement)),
  });
  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : `No hay ${config.labels.movements} todavía.`;
}

function showMovementListFeedback(section, message, kind) {
  const feedback = section.querySelector('#movement-list-feedback');
  if (!feedback) return;
  feedback.hidden = false;
  feedback.className = `form-feedback ${kind}`;
  feedback.textContent = message;
}

function handleMovementTransition(section, movement, status) {
  try {
    if (movement.transferId) updateTransferStatus(movement.transferId, status);
    else updateMovementStatus(movement.id, status);
  } catch (error) {
    showMovementListFeedback(section, error.message, 'error');
    return;
  }
  showMovementListFeedback(section, `Estado actualizado a "${status}".`, 'success');
  refreshMovementList(section);
  refreshStockSummary(section);
}

function refreshStockSummary(section) {
  const summary = section.querySelector('#stock-summary');
  const form = section.querySelector('#movement-form');
  if (!summary || !form) return;
  const productId = form.elements['movement-product'].value;
  if (!productId) {
    renderStockSummary(summary, loadWarehouses(), {});
    return;
  }
  renderStockSummary(summary, loadWarehouses(), getStockByWarehouse(productId));
}

function handleMovementSubmit(section, form, event) {
  event.preventDefault();
  clearMovementFormErrors(form);
  const values = getMovementFormValues(form);

  const { valid, errors } = validateMovement(values);
  if (!valid) {
    showMovementFormErrors(form, errors);
    return;
  }
  try {
    addMovement(values);
  } catch (error) {
    showMovementFormErrors(form, { quantity: error.message });
    return;
  }
  resetMovementForm(form, { keepContext: true });
  showMovementFormSuccess(form, 'Movimiento registrado correctamente.');
  refreshMovementList(section);
  refreshStockSummary(section);
}

function renderMovementsView(section) {
  const config = getActiveConfig();
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.nav.movements;
  const transfersButton = document.createElement('button');
  transfersButton.type = 'button';
  transfersButton.className = 'btn';
  transfersButton.id = 'btn-open-transfers';
  transfersButton.textContent = 'Gestionar traslados';
  header.append(heading, transfersButton);
  section.appendChild(header);
  transfersButton.addEventListener('click', () => navigate('transfers'));

  const formPanel = document.createElement('div');
  formPanel.className = 'panel';
  const formTitle = document.createElement('h2');
  formTitle.textContent = 'Registrar movimiento';
  const formMount = document.createElement('div');
  formMount.id = 'movement-form-mount';
  formPanel.append(formTitle, formMount);
  section.appendChild(formPanel);

  const stockPanel = document.createElement('div');
  stockPanel.className = 'panel';
  const stockTitle = document.createElement('h2');
  stockTitle.textContent = 'Saldo por bodega';
  const summary = document.createElement('div');
  summary.id = 'stock-summary';
  stockPanel.append(stockTitle, summary);
  section.appendChild(stockPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = config.labels.movements;
  const note = document.createElement('p');
  note.id = 'movements-immutable-note';
  note.className = 'form-note';
  note.textContent =
    'Los movimientos no se pueden editar ni eliminar. Si hay un error, la corrección se registra con un ajuste.';
  const list = document.createElement('ul');
  list.id = 'movement-list';
  list.className = 'record-list';
  const listFeedback = document.createElement('div');
  listFeedback.id = 'movement-list-feedback';
  listFeedback.className = 'form-feedback';
  listFeedback.hidden = true;
  listFeedback.setAttribute('role', 'status');
  const empty = document.createElement('p');
  empty.id = 'movement-list-empty';
  empty.className = 'empty-state';
  listPanel.append(listTitle, note, listFeedback, list, empty);
  section.appendChild(listPanel);

  const returnPanel = document.createElement('div');
  returnPanel.className = 'panel';
  const returnTitle = document.createElement('h2');
  returnTitle.id = 'returns-title';
  returnTitle.textContent = 'Devoluciones';
  const returnNote = document.createElement('p');
  returnNote.className = 'form-note';
  returnNote.textContent =
    'Registre devoluciones parciales sobre salidas y traslados. La merma no vuelve al stock: solo se abona al recibirla en bodega.';
  const returnFeedback = document.createElement('div');
  returnFeedback.id = 'return-list-feedback';
  returnFeedback.className = 'form-feedback';
  returnFeedback.hidden = true;
  returnFeedback.setAttribute('role', 'status');
  const returnMount = document.createElement('div');
  returnMount.id = 'return-form-mount';
  const returnList = document.createElement('ul');
  returnList.id = 'return-list';
  returnList.className = 'record-list';
  const returnEmpty = document.createElement('p');
  returnEmpty.id = 'return-list-empty';
  returnEmpty.className = 'empty-state';
  returnPanel.append(returnTitle, returnNote, returnFeedback, returnMount, returnList, returnEmpty);
  section.appendChild(returnPanel);

  const form = renderMovementForm(formMount, {
    products: loadEntities(),
    warehouses: loadWarehouses(),
    documents: [],
  });

  form.addEventListener('submit', (event) => handleMovementSubmit(section, form, event));
  form.elements['movement-product'].addEventListener('change', () => {
    const productId = form.elements['movement-product'].value;
    setMovementLots(form, fefoLots(productId));
    setMovementDocuments(
      form,
      loadDocuments().filter((doc) => doc.entity_id === productId)
    );
    refreshStockSummary(section);
  });

  refreshMovementList(section);
  refreshStockSummary(section);

  const returnForm = renderReturnForm(returnMount);
  returnForm.addEventListener('submit', (event) => handleReturnSubmit(section, returnForm, event));
  refreshReturnList(section);

  if (pendingReturnTarget) {
    const target = pendingReturnTarget;
    pendingReturnTarget = null;
    openReturnTarget(section, target);
  }
}

let pendingReturnTarget = null;

function movementReturnTarget(movement) {
  const entity = getEntity(movement.entity_id);
  return {
    kind: 'movement',
    movementId: movement.id,
    label: `Salida · ${entity?.name ?? movement.entity_id} · ${movement.quantity} unidades · ${movement.movementDate}`,
    products: [],
  };
}

function transferReturnTarget(transfer) {
  const warehouses = Object.fromEntries(loadWarehouses().map((w) => [w.id, w]));
  const entities = Object.fromEntries(loadEntities().map((e) => [e.entity_id, e]));
  const products = transferLines(transfer.id)
    .filter((m) => m.leg === 'origin')
    .map((m) => ({
      entity_id: m.entity_id,
      label: `${entities[m.entity_id]?.name ?? m.entity_id} × ${m.quantity}`,
    }));
  const originName = warehouses[transfer.origin_warehouse_id]?.name ?? transfer.origin_warehouse_id;
  const destinationName =
    warehouses[transfer.destination_warehouse_id]?.name ?? transfer.destination_warehouse_id;
  return {
    kind: 'transfer',
    movementId: transfer.id,
    label: `Traslado ${transfer.reference} · ${originName} → ${destinationName} · ${transfer.status}`,
    products,
  };
}

function openReturnTarget(section, target) {
  const form = section.querySelector('#return-form');
  if (!form) return;
  setReturnTarget(form, target);
  form.querySelector('#return-reason')?.focus();
}

function openTransferReturn(transfer) {
  pendingReturnTarget = transferReturnTarget(transfer);
  navigate('movements');
}

function showReturnListFeedback(section, message, kind) {
  const feedback = section.querySelector('#return-list-feedback');
  if (!feedback) return;
  feedback.hidden = false;
  feedback.className = `form-feedback ${kind}`;
  feedback.textContent = message;
}

function handleReturnSubmit(section, form, event) {
  event.preventDefault();
  clearReturnFormErrors(form);
  const values = getReturnFormValues(form);
  if (!values.movement_id) {
    showReturnFormErrors(form, { movement_id: 'Seleccione un movimiento con el botón "Devolver".' });
    return;
  }
  const { valid, errors } = validateReturn(values);
  if (!valid) {
    showReturnFormErrors(form, errors);
    return;
  }
  try {
    createReturn(values);
  } catch (error) {
    showReturnFormErrors(form, { movement_id: error.message });
    return;
  }
  resetReturnForm(form);
  refreshReturnList(section);
  refreshMovementList(section);
  showReturnFormSuccess(form, 'Devolución registrada correctamente.');
  showReturnListFeedback(section, 'Devolución registrada correctamente.', 'success');
}

function handleReturnTransition(section, record, status) {
  try {
    updateReturnStatus(record.id, status);
  } catch (error) {
    showReturnListFeedback(section, error.message, 'error');
    return;
  }
  refreshReturnList(section);
  refreshMovementList(section);
  refreshStockSummary(section);
  showReturnListFeedback(section, `Devolución actualizada a "${status}".`, 'success');
}

function refreshReturnList(section) {
  const list = section.querySelector('#return-list');
  const empty = section.querySelector('#return-list-empty');
  if (!list || !empty) return;
  const entities = Object.fromEntries(loadEntities().map((e) => [e.entity_id, e]));
  const lifecycle = returnsLifecycle();
  list.textContent = '';

  for (const record of [...loadReturns()].reverse()) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.returnId = record.id;

    const main = document.createElement('div');
    main.className = 'record-main';

    const title = document.createElement('span');
    title.className = 'record-title';
    const kindLabel = record.movement_kind === 'movement' ? 'Salida' : 'Traslado';
    title.textContent = `Devolución · ${kindLabel} · ${entities[record.entity_id]?.name ?? record.entity_id}`;
    main.appendChild(title);

    const meta = document.createElement('span');
    meta.className = 'record-meta';
    meta.textContent = `Motivo: ${record.reason} · Buen estado: ${record.quantity_good} · Dañado: ${record.quantity_damaged}`;
    main.appendChild(meta);

    const badge = document.createElement('span');
    badge.className = 'badge accent';
    badge.textContent = record.status;
    main.appendChild(badge);
    item.appendChild(main);

    const next = lifecycle ? nextStates(record.status, lifecycle) : [];
    if (next.length) {
      const actions = document.createElement('div');
      actions.className = 'record-actions';
      for (const state of next) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = /rechaz|cancel/i.test(state) ? 'btn btn-sm btn-danger' : 'btn btn-sm';
        button.dataset.action = 'transition';
        button.dataset.status = state;
        button.textContent = state;
        button.addEventListener('click', () => handleReturnTransition(section, record, state));
        actions.appendChild(button);
      }
      item.appendChild(actions);
    }

    list.appendChild(item);
  }

  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : 'No hay devoluciones registradas todavía.';
}

registerView('movements', renderMovementsView);

function refreshTransferList(section) {
  const list = section.querySelector('#transfer-list');
  const empty = section.querySelector('#transfer-list-empty');
  if (!list || !empty) return;
  const entities = Object.fromEntries(loadEntities().map((e) => [e.entity_id, e]));
  const warehouses = Object.fromEntries(loadWarehouses().map((w) => [w.id, w]));
  const lifecycle = lifecycleFor('movements', 'traslado');
  list.textContent = '';

  for (const transfer of [...loadTransfers()].reverse()) {
    const item = document.createElement('li');
    item.className = 'record-item';
    item.dataset.transferId = transfer.id;

    const main = document.createElement('div');
    main.className = 'record-main';
    const title = document.createElement('span');
    title.className = 'record-title';
    title.textContent = transfer.reference;
    const originName = warehouses[transfer.origin_warehouse_id]?.name ?? transfer.origin_warehouse_id;
    const destinationName =
      warehouses[transfer.destination_warehouse_id]?.name ?? transfer.destination_warehouse_id;
    const meta = document.createElement('span');
    meta.className = 'record-meta';
    meta.textContent = `${originName} → ${destinationName} · ${transfer.date}`;
    const linesMeta = document.createElement('span');
    linesMeta.className = 'record-meta';
    linesMeta.textContent = transferLines(transfer.id)
      .filter((m) => m.leg === 'origin')
      .map((m) => `${entities[m.entity_id]?.name ?? m.entity_id} × ${m.quantity}`)
      .join(', ');
    const badge = document.createElement('span');
    badge.className = 'badge accent';
    badge.textContent = transfer.status;
    main.append(title, meta, linesMeta, badge);
    item.appendChild(main);

    const next = lifecycle ? nextStates(transfer.status, lifecycle) : [];
    const actions = document.createElement('div');
    actions.className = 'record-actions';
    for (const state of next) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = /cancel|rechaz|anul/i.test(state) ? 'btn btn-sm btn-danger' : 'btn btn-sm';
      button.dataset.action = 'transition';
      button.dataset.status = state;
      button.textContent = state;
      button.addEventListener('click', () => handleTransferTransition(section, transfer, state));
      actions.appendChild(button);
    }
    const returnButton = document.createElement('button');
    returnButton.type = 'button';
    returnButton.className = 'btn btn-sm';
    returnButton.dataset.action = 'return';
    returnButton.textContent = 'Devolver';
    returnButton.addEventListener('click', () => openTransferReturn(transfer));
    actions.appendChild(returnButton);
    item.appendChild(actions);

    list.appendChild(item);
  }

  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : 'No hay traslados registrados todavía.';
  const feedback = section.querySelector('#transfer-list-feedback');
  if (feedback) feedback.hidden = true;
}

function refreshInTransit(section) {
  const container = section.querySelector('#transfers-in-transit');
  if (!container) return;
  const entities = Object.fromEntries(loadEntities().map((e) => [e.entity_id, e]));
  const totals = {};
  for (const transfer of loadTransfers()) {
    if (!['Despachado', 'En tránsito'].includes(transfer.status)) continue;
    for (const line of transferLines(transfer.id)) {
      if (line.leg !== 'origin') continue;
      totals[line.entity_id] = (totals[line.entity_id] ?? 0) + line.quantity;
    }
  }
  container.textContent = '';
  const entries = Object.entries(totals);
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No hay unidades en tránsito.';
    container.appendChild(empty);
    return;
  }
  for (const [entityId, quantity] of entries) {
    const line = document.createElement('p');
    line.className = 'stock-line';
    line.dataset.entityId = entityId;
    line.textContent = `${entities[entityId]?.name ?? entityId}: ${quantity} unidades`;
    container.appendChild(line);
  }
}

function showTransferListFeedback(section, message, kind) {
  const feedback = section.querySelector('#transfer-list-feedback');
  if (!feedback) return;
  feedback.hidden = false;
  feedback.className = `form-feedback ${kind}`;
  feedback.textContent = message;
}

function handleTransferTransition(section, transfer, status) {
  try {
    updateTransferStatus(transfer.id, status);
  } catch (error) {
    showTransferListFeedback(section, error.message, 'error');
    return;
  }
  showTransferListFeedback(section, `Traslado ${transfer.reference}: estado "${status}".`, 'success');
  refreshTransferList(section);
  refreshInTransit(section);
}

function handleTransferSubmit(section, form, event) {
  event.preventDefault();
  clearTransferFormErrors(form);
  const values = getTransferFormValues(form);
  const { valid, errors } = validateTransfer(values);
  if (!valid) {
    showTransferFormErrors(form, errors);
    return;
  }
  try {
    const transfer = createTransfer(values);
    resetTransferForm(form);
    setTransferLineLots(form, []);
    showTransferFormSuccess(form, `Traslado ${transfer.reference} creado correctamente.`);
  } catch (error) {
    showTransferFormErrors(form, { lines: error.message });
    return;
  }
  refreshTransferList(section);
  refreshInTransit(section);
}

function renderTransfersView(section) {
  const config = getActiveConfig();
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.transfers ?? 'Traslados';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.id = 'btn-back-movements';
  back.textContent = 'Volver';
  header.append(heading, back);
  section.appendChild(header);
  back.addEventListener('click', () => navigate('movements'));

  const formPanel = document.createElement('div');
  formPanel.className = 'panel';
  const formTitle = document.createElement('h2');
  formTitle.textContent = 'Nuevo traslado';
  const formMount = document.createElement('div');
  formMount.id = 'transfer-form-mount';
  formPanel.append(formTitle, formMount);
  section.appendChild(formPanel);

  const transitPanel = document.createElement('div');
  transitPanel.className = 'panel';
  const transitTitle = document.createElement('h2');
  transitTitle.textContent = 'En tránsito';
  const transitBody = document.createElement('div');
  transitBody.id = 'transfers-in-transit';
  transitPanel.append(transitTitle, transitBody);
  section.appendChild(transitPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = 'Traslados';
  const listFeedback = document.createElement('div');
  listFeedback.id = 'transfer-list-feedback';
  listFeedback.className = 'form-feedback';
  listFeedback.hidden = true;
  listFeedback.setAttribute('role', 'status');
  const list = document.createElement('ul');
  list.id = 'transfer-list';
  list.className = 'record-list';
  const empty = document.createElement('p');
  empty.id = 'transfer-list-empty';
  empty.className = 'empty-state';
  listPanel.append(listTitle, listFeedback, list, empty);
  section.appendChild(listPanel);

  const form = renderTransferForm(formMount, {
    products: loadEntities(),
    warehouses: loadWarehouses(),
    lots: [],
  });
  form.addEventListener('submit', (event) => handleTransferSubmit(section, form, event));
  form.elements['transfer-line-product'].addEventListener('change', () => {
    setTransferLineLots(form, fefoLots(form.elements['transfer-line-product'].value));
  });

  refreshTransferList(section);
  refreshInTransit(section);
}

registerView('transfers', renderTransfersView);

function renderProductView(section, params) {
  const config = getActiveConfig();
  const entity = params.entity_id ? getEntity(params.entity_id) : null;
  editingDocumentId = null;
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = entity ? entity.name : config.labels.entity;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.id = 'btn-back-entities';
  back.textContent = 'Volver';
  header.append(heading, back);
  section.appendChild(header);
  back.addEventListener('click', () => navigate(params.from === 'search' ? 'search' : 'entities'));

  if (!entity) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Producto no encontrado.';
    section.appendChild(empty);
    return;
  }

  const infoPanel = document.createElement('div');
  infoPanel.className = 'panel';
  const infoTitle = document.createElement('h2');
  infoTitle.textContent = 'Información';
  infoPanel.appendChild(infoTitle);

  const infoList = document.createElement('dl');
  infoList.className = 'detail-list';
  const addDetail = (term, value) => {
    if (value === undefined || value === null || value === '') return;
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    infoList.append(dt, dd);
  };
  addDetail('Código', entity.code);
  addDetail('Categoría', entity.category);
  addDetail('Descripción', entity.description);
  if (entity.stockMin !== undefined && entity.stockMin !== null) {
    addDetail('Stock mínimo', entity.stockMin);
  }
  const stockTerm = document.createElement('dt');
  stockTerm.textContent = 'Stock total';
  const stockValue = document.createElement('dd');
  stockValue.id = 'product-stock';
  stockValue.className = 'stock-value';
  stockValue.textContent = String(calculateStock(entity.entity_id));
  infoList.append(stockTerm, stockValue);
  infoPanel.appendChild(infoList);
  section.appendChild(infoPanel);

  const stockPanel = document.createElement('div');
  stockPanel.className = 'panel';
  const stockTitle = document.createElement('h2');
  stockTitle.textContent = 'Saldo por bodega';
  const summary = document.createElement('div');
  summary.id = 'product-stock-summary';
  stockPanel.append(stockTitle, summary);
  section.appendChild(stockPanel);
  renderStockSummary(summary, loadWarehouses(), getStockByWarehouse(entity.entity_id));

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const lotsButton = document.createElement('button');
  lotsButton.type = 'button';
  lotsButton.className = 'btn';
  lotsButton.id = 'btn-open-lots';
  lotsButton.textContent = 'Ver lotes';
  const kardexButton = document.createElement('button');
  kardexButton.type = 'button';
  kardexButton.className = 'btn btn-primary';
  kardexButton.id = 'btn-open-kardex';
  kardexButton.textContent = 'Ver kárdex';
  actions.append(lotsButton, kardexButton);
  section.appendChild(actions);
  lotsButton.addEventListener('click', () => navigate('lots', { entity_id: entity.entity_id }));
  kardexButton.addEventListener('click', () => navigate('kardex', { entity_id: entity.entity_id }));

  const documentsPanel = document.createElement('div');
  documentsPanel.className = 'panel';
  const documentsTitle = document.createElement('h2');
  documentsTitle.id = 'documents-title';
  documentsTitle.textContent = config.labels.documents;
  const documentFormTitleNode = document.createElement('h3');
  documentFormTitleNode.id = 'document-form-title';
  documentFormTitleNode.textContent = documentFormTitle();
  const documentsMount = document.createElement('div');
  documentsMount.id = 'document-form-mount';
  const documentsList = document.createElement('ul');
  documentsList.id = 'document-list';
  documentsList.className = 'record-list';
  const documentsEmpty = document.createElement('p');
  documentsEmpty.id = 'document-list-empty';
  documentsEmpty.className = 'empty-state';
  const documentsFeedback = document.createElement('div');
  documentsFeedback.id = 'document-list-feedback';
  documentsFeedback.className = 'form-feedback';
  documentsFeedback.hidden = true;
  documentsFeedback.setAttribute('role', 'status');
  documentsPanel.append(
    documentsTitle,
    documentFormTitleNode,
    documentsMount,
    documentsFeedback,
    documentsList,
    documentsEmpty
  );
  section.appendChild(documentsPanel);

  const documentForm = renderDocumentForm(documentsMount, { customFields: documentCustomFields() });
  documentForm.addEventListener('submit', (event) =>
    handleDocumentSubmit(section, entity, documentForm, event)
  );
  documentForm
    .querySelector('#document-cancel')
    .addEventListener('click', () => stopEditingDocument(section));
  refreshDocumentList(section, entity);
}

let editingDocumentId = null;

function documentCustomFields() {
  return (getActiveConfig().customFields ?? []).filter((f) => f.target === 'document');
}

function documentFormTitle() {
  return editingDocumentId ? 'Actualizar documento' : 'Nuevo documento';
}

function refreshDocumentList(section, entity) {
  const list = section.querySelector('#document-list');
  const empty = section.querySelector('#document-list-empty');
  if (!list || !empty) return;
  const documents = loadDocuments().filter((doc) => doc.entity_id === entity.entity_id);
  renderDocumentList(list, documents, {
    numberFor: documentNumber,
    onEdit: (doc) => startEditDocument(section, doc),
    onDelete: (doc) => handleDocumentDelete(section, doc),
  });
  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : `${entity.name} aún no tiene documentos de respaldo.`;
  const feedback = section.querySelector('#document-list-feedback');
  if (feedback) feedback.hidden = true;
}

function startEditDocument(section, doc) {
  editingDocumentId = doc.id;
  const form = section.querySelector('#document-form');
  const title = section.querySelector('#document-form-title');
  const cancel = section.querySelector('#document-cancel');
  const submit = section.querySelector('#document-submit');
  if (!form) return;
  setDocumentFormValues(form, doc, documentCustomFields());
  clearDocumentFormErrors(form, documentCustomFields());
  const lifecycle = lifecycleFor('documents', doc.type);
  setDocumentStatusOptions(form, {
    current: doc.status ?? '',
    next: lifecycle ? nextStates(doc.status, lifecycle) : [],
  });
  if (title) title.textContent = documentFormTitle();
  if (cancel) cancel.hidden = false;
  if (submit) submit.textContent = 'Actualizar';
  const feedback = form.querySelector('#document-form-feedback');
  if (feedback) feedback.hidden = true;
  form.elements['document-folio']?.focus();
}

function stopEditingDocument(section) {
  editingDocumentId = null;
  const form = section.querySelector('#document-form');
  const title = section.querySelector('#document-form-title');
  const cancel = section.querySelector('#document-cancel');
  const submit = section.querySelector('#document-submit');
  if (form) resetDocumentForm(form, documentCustomFields());
  if (title) title.textContent = documentFormTitle();
  if (cancel) cancel.hidden = true;
  if (submit) submit.textContent = 'Guardar';
}

function handleDocumentDelete(section, doc) {
  if (!confirm(`¿Eliminar el documento "${documentNumber(doc)}"? Esta acción no se puede deshacer.`)) return;
  try {
    deleteDocument(doc.id);
    if (editingDocumentId === doc.id) stopEditingDocument(section);
    refreshDocumentList(section, getEntity(doc.entity_id));
    showListFeedback(section, 'Documento eliminado correctamente.', 'success', 'document-list-feedback');
  } catch (error) {
    showListFeedback(section, error.message, 'error', 'document-list-feedback');
  }
}

function handleDocumentSubmit(section, entity, form, event) {
  event.preventDefault();
  const customFields = documentCustomFields();
  clearDocumentFormErrors(form, customFields);
  const values = getDocumentFormValues(form, customFields);

  try {
    if (editingDocumentId) {
      const existing = getDocument(editingDocumentId);
      if (!existing) {
        stopEditingDocument(section);
        return;
      }
      const { valid, errors } = validateDocument({ ...existing, ...values });
      if (!valid) {
        showDocumentFormErrors(form, errors, customFields);
        return;
      }
      updateDocument(editingDocumentId, values);
      stopEditingDocument(section);
      showDocumentFormSuccess(form, 'Documento actualizado correctamente.');
    } else {
      const { valid, errors } = validateDocument({ entity_id: entity.entity_id, ...values });
      if (!valid) {
        showDocumentFormErrors(form, errors, customFields);
        return;
      }
      addDocument({ entity_id: entity.entity_id, ...values });
      resetDocumentForm(form, customFields);
      showDocumentFormSuccess(form, 'Documento guardado correctamente.');
    }
  } catch (error) {
    const feedback = form.querySelector('#document-form-feedback');
    if (feedback) {
      feedback.hidden = false;
      feedback.className = 'form-feedback error';
      feedback.textContent = error.message;
    }
    return;
  }
  refreshDocumentList(section, entity);
}

registerView('product', renderProductView);

function renderKardexRoute(section, params) {
  const entity = params.entity_id ? getEntity(params.entity_id) : null;
  if (!entity) {
    placeholder(section, params);
    return;
  }

  const all = loadMovements()
    .filter((m) => m.entity_id === entity.entity_id)
    .sort((a, b) =>
      a.movementDate === b.movementDate
        ? String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
        : a.movementDate.localeCompare(b.movementDate)
    );

  let balance = 0;
  const rows = all.map((movement) => {
    const effective = isEffectiveMovement(movement);
    if (effective) balance += movement.direction === 'in' ? movement.quantity : -movement.quantity;
    return { movement, balanceAfter: balance, annulled: !effective };
  });

  const filtered = rows.filter(
    (row) =>
      (!params.type || row.movement.type === params.type) &&
      (!params.from || row.movement.movementDate >= params.from) &&
      (!params.to || row.movement.movementDate <= params.to)
  );

  renderKardex(section, {
    entity,
    rows: filtered,
    filters: params,
    warehouses: Object.fromEntries(loadWarehouses().map((w) => [w.id, w])),
    onFilterChange: (patch) => navigate('kardex', { entity_id: entity.entity_id, ...patch }),
  });
  section.querySelector('#btn-back-product')?.addEventListener('click', () => {
    navigate('product', { entity_id: entity.entity_id });
  });
}

registerView('kardex', renderKardexRoute);

function fefoLots(productId) {
  if (!productId) return [];
  return lotsForProduct(productId)
    .filter((lot) => !isLotExpired(lot))
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });
}

function refreshLotList(section, entity) {
  const list = section.querySelector('#lot-list');
  const empty = section.querySelector('#lot-list-empty');
  if (!list || !empty) return;
  const lots = lotsForProduct(entity.entity_id);
  const balances = Object.fromEntries(lots.map((lot) => [lot.id, lotBalance(lot.id)]));
  renderLotList(list, lots, { balances });
  const count = list.querySelectorAll('.record-item').length;
  empty.hidden = count > 0;
  empty.textContent = count > 0 ? '' : `${entity.name} aún no tiene lotes registrados.`;
}

function handleLotSubmit(section, entity, form, event) {
  event.preventDefault();
  clearLotFormErrors(form);
  const values = getLotFormValues(form);
  const { valid, errors } = validateLot({ entity_id: entity.entity_id, ...values });
  if (!valid) {
    showLotFormErrors(form, errors);
    return;
  }
  try {
    addLot({ entity_id: entity.entity_id, ...values });
  } catch (error) {
    showLotFormErrors(form, { lotNumber: error.message });
    return;
  }
  resetLotForm(form);
  showLotFormSuccess(form, 'Lote guardado correctamente.');
  refreshLotList(section, entity);
}

function renderLotsView(section, params) {
  const entity = params.entity_id ? getEntity(params.entity_id) : null;
  if (!entity) {
    placeholder(section, params);
    return;
  }
  section.textContent = '';

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = `Lotes · ${entity.name}`;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn';
  back.id = 'btn-back-lots';
  back.textContent = 'Volver al producto';
  header.append(heading, back);
  section.appendChild(header);
  back.addEventListener('click', () => navigate('product', { entity_id: entity.entity_id }));

  const note = document.createElement('p');
  note.id = 'lots-note';
  note.className = 'form-note';
  note.textContent = 'Los lotes no se pueden eliminar (política de trazabilidad).';
  section.appendChild(note);

  const formPanel = document.createElement('div');
  formPanel.className = 'panel';
  const formTitle = document.createElement('h2');
  formTitle.textContent = 'Nuevo lote';
  const formMount = document.createElement('div');
  formMount.id = 'lot-form-mount';
  formPanel.append(formTitle, formMount);
  section.appendChild(formPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel';
  const listTitle = document.createElement('h2');
  listTitle.textContent = 'Lotes del producto';
  const list = document.createElement('ul');
  list.id = 'lot-list';
  list.className = 'record-list';
  const empty = document.createElement('p');
  empty.id = 'lot-list-empty';
  empty.className = 'empty-state';
  listPanel.append(listTitle, list, empty);
  section.appendChild(listPanel);

  const form = renderLotForm(formMount);
  form.addEventListener('submit', (event) => handleLotSubmit(section, entity, form, event));

  refreshLotList(section, entity);
}

registerView('lots', renderLotsView);

function renderDashboardView(section) {
  section.textContent = '';
  renderDashboard(section, {
    stats: { entities: loadEntities().length, documents: loadDocuments().length },
  });
  section.querySelector('#action-new-entity')?.addEventListener('click', () => {
    navigate('entities');
    document.querySelector('#entity-form')?.elements.name?.focus();
  });
  section.querySelector('#action-new-movement')?.addEventListener('click', () => {
    navigate('movements');
  });
  section.querySelector('#action-open-entities')?.addEventListener('click', () => {
    navigate('entities');
  });
  section.querySelector('#action-find')?.addEventListener('click', () => {
    navigate('search');
    document.getElementById('search-input')?.focus();
  });
}

registerView('dashboard', renderDashboardView);

let lastSearchState = { query: '', category: '', warehouse: '', low: false };

function renderSearchView(section) {
  section.textContent = '';
  const config = getActiveConfig();

  const header = document.createElement('div');
  header.className = 'view-header';
  const heading = document.createElement('h1');
  heading.textContent = config.labels.nav.search;
  header.appendChild(heading);
  section.appendChild(header);

  const bar = renderSearchBar(section, {
    categories: config.categories ?? [],
    warehouses: loadWarehouses(),
  });

  bar.input.value = lastSearchState.query;
  bar.categoryFilter.value = lastSearchState.category;
  bar.warehouseFilter.value = lastSearchState.warehouse;
  bar.lowFilter.checked = lastSearchState.low;

  const runSearch = () => {
    lastSearchState = {
      query: bar.input.value,
      category: bar.categoryFilter.value,
      warehouse: bar.warehouseFilter.value,
      low: bar.lowFilter.checked,
    };
    const results = searchEntities(lastSearchState.query, {
      category: lastSearchState.category || undefined,
      stockStatus: lastSearchState.low ? 'low' : undefined,
      warehouse_id: lastSearchState.warehouse || undefined,
    });
    renderEntityList(bar.results, results, {
      config,
      onOpen: (entity) => navigate('product', { entity_id: entity.entity_id, from: 'search' }),
    });
    bar.empty.hidden = results.length > 0;
  };

  bar.input.addEventListener('input', runSearch);
  bar.categoryFilter.addEventListener('change', runSearch);
  bar.warehouseFilter.addEventListener('change', runSearch);
  bar.lowFilter.addEventListener('change', runSearch);
  runSearch();
  bar.input.focus();
}

registerView('search', renderSearchView);

export function registerView(route, renderer) {
  renderers[route] = renderer;
}

export function getRoute() {
  return currentRoute;
}

export function getParams() {
  return currentParams;
}

export function applyTheme(config = getActiveConfig()) {
  const color = config?.theme?.accentColor || DEFAULT_ACCENT;
  document.documentElement.style.setProperty('--accent', color);
}

function ensureFrame(root) {
  if (document.getElementById('workspace-content')) return;
  const main = document.createElement('main');
  main.id = 'workspace-content';
  for (const id of Object.values(VIEW_IDS)) {
    const section = document.createElement('section');
    section.id = id;
    section.hidden = true;
    main.appendChild(section);
  }
  root.appendChild(main);
}

function placeholder(section, params) {
  section.textContent = '';
  const empty = document.createElement('p');
  empty.className = 'empty-state';
  empty.textContent = 'Vista en construcción.';
  section.appendChild(empty);
  void params;
}

function updateNavActive(route) {
  const moduleName = MODULE_OF_ROUTE[route] ?? route;
  for (const button of document.querySelectorAll('.nav-module')) {
    if (button.dataset.module === moduleName) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  }
}

export function navigate(route, params = {}) {
  if (!VIEW_IDS[route]) route = 'dashboard';
  currentRoute = route;
  currentParams = params;
  const content = document.getElementById('workspace-content');
  if (!content) return;
  for (const section of content.querySelectorAll(':scope > section')) {
    section.hidden = true;
  }
  let section = document.getElementById(VIEW_IDS[route]);
  if (!section) {
    section = document.createElement('section');
    section.id = VIEW_IDS[route];
    content.appendChild(section);
  }
  section.hidden = false;
  const renderer = renderers[route] ?? placeholder;
  renderer(section, params);
  updateNavActive(route);
}

export function refreshCurrentView() {
  navigate(currentRoute, currentParams);
}

export async function initApp(rawConfig) {
  const config = setActiveConfig(normalizeConfig(rawConfig));
  rootElement = document.getElementById('app') ?? document.body;
  applyTheme(config);
  ensureFrame(rootElement);
  initShell({ onNavigate: (route) => navigate(route) });
  navigate('dashboard');
  return config;
}

export function getConfig() {
  return getActiveConfig();
}

export function getRoot() {
  return rootElement;
}

export function renderSearchBar(mount, { categories = [], warehouses = [] } = {}) {
  mount.textContent = '';

  const panel = document.createElement('div');
  panel.className = 'panel';

  const field = document.createElement('div');
  field.className = 'field';
  const label = document.createElement('label');
  label.setAttribute('for', 'search-input');
  label.textContent = 'Buscar productos';
  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'search-input';
  input.placeholder = 'SKU, nombre, categoría o dirección';
  field.append(label, input);
  panel.appendChild(field);

  const filters = document.createElement('div');
  filters.className = 'form-grid';

  const categoryField = document.createElement('div');
  categoryField.className = 'field';
  const categoryLabel = document.createElement('label');
  categoryLabel.setAttribute('for', 'search-filter-category');
  categoryLabel.textContent = 'Categoría';
  const categoryFilter = document.createElement('select');
  categoryFilter.id = 'search-filter-category';
  const allCategories = document.createElement('option');
  allCategories.value = '';
  allCategories.textContent = 'Todas las categorías';
  categoryFilter.appendChild(allCategories);
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  }
  categoryField.append(categoryLabel, categoryFilter);

  const warehouseField = document.createElement('div');
  warehouseField.className = 'field';
  const warehouseLabel = document.createElement('label');
  warehouseLabel.setAttribute('for', 'search-filter-warehouse');
  warehouseLabel.textContent = 'Almacén';
  const warehouseFilter = document.createElement('select');
  warehouseFilter.id = 'search-filter-warehouse';
  const allWarehouses = document.createElement('option');
  allWarehouses.value = '';
  allWarehouses.textContent = 'Todas las bodegas';
  warehouseFilter.appendChild(allWarehouses);
  for (const warehouse of warehouses) {
    const option = document.createElement('option');
    option.value = warehouse.id;
    option.textContent = warehouse.name;
    warehouseFilter.appendChild(option);
  }
  warehouseField.append(warehouseLabel, warehouseFilter);

  const lowField = document.createElement('div');
  lowField.className = 'field';
  const lowLabel = document.createElement('label');
  lowLabel.setAttribute('for', 'search-filter-low');
  lowLabel.textContent = 'Solo stock bajo';
  const lowFilter = document.createElement('input');
  lowFilter.type = 'checkbox';
  lowFilter.id = 'search-filter-low';
  lowField.append(lowLabel, lowFilter);

  filters.append(categoryField, warehouseField, lowField);
  panel.appendChild(filters);

  const results = document.createElement('ul');
  results.id = 'search-results-list';
  results.className = 'record-list';
  panel.appendChild(results);

  const empty = document.createElement('p');
  empty.id = 'search-empty';
  empty.className = 'empty-state';
  empty.textContent = 'Sin productos que coincidan con la búsqueda.';
  empty.hidden = true;
  panel.appendChild(empty);

  mount.appendChild(panel);

  return { input, categoryFilter, warehouseFilter, lowFilter, results, empty };
}

document.addEventListener('DOMContentLoaded', () => {
  fetchBeers();
  loadBrewerySuggestions();
});

let beersData = [];

// Fetch and render all beers
async function fetchBeers() {
  try {
    const res = await fetch('/api/beers');
    beersData = await res.json();
    populateStyleFilter(beersData);
    applyFilters();
  } catch (err) {
    console.error('Error fetching beers:', err);
  }
}

// Populate style dropdown based on unique available styles
function populateStyleFilter(beers) {
  const styleSelect = document.getElementById('style-filter');
  if (!styleSelect) return;

  const currentSelection = styleSelect.value;
  const styles = [...new Set(beers.map(b => b.style).filter(Boolean))].sort();

  styleSelect.innerHTML = '<option value="">All Styles</option>' + 
    styles.map(s => `<option value="${s}">${s}</option>`).join('');
    
  styleSelect.value = currentSelection;
}

// Apply Search, Filter, and Sort logic
function applyFilters() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();
  const selectedStyle = document.getElementById('style-filter')?.value || '';
  const sortBy = document.getElementById('sort-by')?.value || 'newest';

  let filtered = beersData.filter(beer => {
    const matchesSearch = (beer.beer_name || '').toLowerCase().includes(query) ||
                          (beer.brewery_name || '').toLowerCase().includes(query);
    const matchesStyle = !selectedStyle || beer.style === selectedStyle;
    return matchesSearch && matchesStyle;
  });

  // Sort results
  filtered.sort((a, b) => {
    if (sortBy === 'name') return (a.beer_name || '').localeCompare(b.beer_name || '');
    if (sortBy === 'brewery') return (a.brewery_name || '').localeCompare(b.brewery_name || '');
    if (sortBy === 'rank-high') return (parseFloat(b.rank) || 0) - (parseFloat(a.rank) || 0);
    if (sortBy === 'rank-low') return (parseFloat(a.rank) || 0) - (parseFloat(b.rank) || 0);
    return b.id - a.id; // 'newest' default
  });

  renderBeers(filtered);
}

// Populate datalist dropdowns for brewery suggestions
async function loadBrewerySuggestions() {
  try {
    const res = await fetch('/api/breweries');
    const breweries = await res.json();

    const addDatalist = document.getElementById('brewery-list');
    const editDatalist = document.getElementById('brewery-list-edit');

    const optionsHtml = breweries.map(b => `<option value="${b.brewery_name}"></option>`).join('');
    if (addDatalist) addDatalist.innerHTML = optionsHtml;
    if (editDatalist) editDatalist.innerHTML = optionsHtml;
  } catch (err) {
    console.error('Error loading breweries:', err);
  }
}

// Render beers to page
function renderBeers(beers) {
  const container = document.getElementById('beer-list');
  if (!container) return;

  if (beers.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px 0;">No beers found matching criteria.</p>`;
    return;
  }

  container.innerHTML = beers.map(beer => `
    <div class="beer-card">
      <h3>${beer.beer_name}</h3>
      <p class="brewery">${beer.brewery_name}</p>
      <p><strong>Style:</strong> ${beer.style || 'N/A'}</p>
      <p><strong>Rank:</strong> ${beer.rank || 'N/A'}</p>
      <button class="btn btn-sm btn-primary" onclick='openEditModal(${JSON.stringify(beer)})'>Edit</button>
    </div>
  `).join('');
}

// Modal controls
function openAddModal() {
  document.getElementById('add-beer-form').reset();
  document.getElementById('add-modal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('add-modal').style.display = 'none';
}

function openEditModal(beer) {
  document.getElementById('edit-beer-id').value = beer.id;
  document.getElementById('edit-beer-name').value = beer.beer_name || '';
  document.getElementById('edit-brewery-name').value = beer.brewery_name || '';
  document.getElementById('edit-style').value = beer.style || '';
  document.getElementById('edit-rank').value = beer.rank || '';
  document.getElementById('edit-abv').value = beer.abv || '';
  document.getElementById('edit-ibu').value = beer.ibu || '';
  document.getElementById('edit-srm').value = beer.srm || '';
  document.getElementById('edit-state').value = beer.state || '';
  document.getElementById('edit-country').value = beer.country || '';
  document.getElementById('edit-owned-by').value = beer.owned_by || '';
  document.getElementById('edit-date').value = beer.date ? beer.date.split('T')[0] : '';
  document.getElementById('edit-location').value = beer.location || '';
  document.getElementById('edit-aka').value = beer.aka || '';
  document.getElementById('edit-collaborators').value = beer.collaborators || '';

  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-modal').style.display = 'none';
}

// Form Handlers
async function handleAddBeer(e) {
  e.preventDefault();

  const payload = {
    beer_name: document.getElementById('add-beer-name').value,
    brewery_name: document.getElementById('add-brewery-name').value,
    style: document.getElementById('add-style').value,
    rank: document.getElementById('add-rank').value,
    abv: document.getElementById('add-abv').value,
    ibu: document.getElementById('add-ibu').value,
    srm: document.getElementById('add-srm').value,
    state: document.getElementById('add-state').value,
    country: document.getElementById('add-country').value,
    date: document.getElementById('add-date').value,
    location: document.getElementById('add-location').value
  };

  try {
    const res = await fetch('/api/beers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      closeAddModal();
      fetchBeers();
      loadBrewerySuggestions();
    }
  } catch (err) {
    console.error('Error adding beer:', err);
  }
}

async function handleEditBeer(e) {
  e.preventDefault();

  const id = document.getElementById('edit-beer-id').value;
  const payload = {
    beer_name: document.getElementById('edit-beer-name').value,
    brewery_name: document.getElementById('edit-brewery-name').value,
    style: document.getElementById('edit-style').value,
    rank: document.getElementById('edit-rank').value,
    abv: document.getElementById('edit-abv').value,
    ibu: document.getElementById('edit-ibu').value,
    srm: document.getElementById('edit-srm').value,
    state: document.getElementById('edit-state').value,
    country: document.getElementById('edit-country').value,
    owned_by: document.getElementById('edit-owned-by').value,
    date: document.getElementById('edit-date').value,
    location: document.getElementById('edit-location').value,
    aka: document.getElementById('edit-aka').value,
    collaborators: document.getElementById('edit-collaborators').value
  };

  try {
    const res = await fetch(`/api/beers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      closeEditModal();
      fetchBeers();
      loadBrewerySuggestions();
    }
  } catch (err) {
    console.error('Error updating beer:', err);
  }
}
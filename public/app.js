document.addEventListener('DOMContentLoaded', () => {
  fetchBeers();
  loadBrewerySuggestions();

  // Attach auto-complete listeners for brewery fields
  const addBreweryInput = document.getElementById('add-brewery-name');
  if (addBreweryInput) {
    addBreweryInput.addEventListener('input', handleBrewerySelectAdd);
    addBreweryInput.addEventListener('change', handleBrewerySelectAdd);
  }

  const editBreweryInput = document.getElementById('edit-brewery-name');
  if (editBreweryInput) {
    editBreweryInput.addEventListener('input', handleBrewerySelectEdit);
    editBreweryInput.addEventListener('change', handleBrewerySelectEdit);
  }
});

let beersData = [];
let breweriesData = []; // Cache brewery list with State/Country info

// Fetch and render all beers
async function fetchBeers() {
  try {
    const res = await fetch('/api/beers');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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
    return (b.id || 0) - (a.id || 0);
  });

  renderBeers(filtered);
}

// Fetch breweries and store metadata
async function loadBrewerySuggestions() {
  try {
    const res = await fetch('/api/breweries');
    if (!res.ok) return;
    breweriesData = await res.json();

    const addDatalist = document.getElementById('brewery-list');
    const editDatalist = document.getElementById('brewery-list-edit');

    const optionsHtml = breweriesData.map(b => `<option value="${b.brewery_name}"></option>`).join('');
    if (addDatalist) addDatalist.innerHTML = optionsHtml;
    if (editDatalist) editDatalist.innerHTML = optionsHtml;
  } catch (err) {
    console.error('Error loading breweries:', err);
  }
}

// Auto-fill State and Country when typing/selecting existing Brewery (Add Form)
function handleBrewerySelectAdd(e) {
  const val = e.target.value.trim().toLowerCase();
  const found = breweriesData.find(b => (b.brewery_name || '').toLowerCase() === val);
  if (found) {
    if (found.state) document.getElementById('add-state').value = found.state;
    if (found.country) document.getElementById('add-country').value = found.country;
  }
}

// Auto-fill State, Country, and Owned By when typing/selecting existing Brewery (Edit Form)
function handleBrewerySelectEdit(e) {
  const val = e.target.value.trim().toLowerCase();
  const found = breweriesData.find(b => (b.brewery_name || '').toLowerCase() === val);
  if (found) {
    if (found.state) document.getElementById('edit-state').value = found.state;
    if (found.country) document.getElementById('edit-country').value = found.country;
    if (found.owned_by) document.getElementById('edit-owned-by').value = found.owned_by;
  }
}

// Render beers to page
function renderBeers(beers) {
  const container = document.getElementById('beer-list');
  if (!container) return;

  if (beers.length === 0) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #94A3B8; padding: 40px 0;">No beers found matching criteria.</p>`;
    return;
  }

  container.innerHTML = beers.map(beer => `
    <div class="beer-card">
      <h3>${beer.beer_name}</h3>
      <p class="brewery">${beer.brewery_name}</p>
      <p><strong>Style:</strong> ${beer.style || 'N/A'}</p>
      <p><strong>Rank:</strong> ${beer.rank || 'N/A'}</p>
      <button class="btn btn-sm btn-primary" onclick='openEditModal(${JSON.stringify(beer).replace(/'/g, "&#39;")})'>Edit</button>
    </div>
  `).join('');
}

// Notification Helper
function showNotification(message, type = 'success', modalId = 'add-modal') {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  let notifEl = modal.querySelector('.form-notification');
  if (!notifEl) {
    notifEl = document.createElement('div');
    notifEl.className = 'form-notification';
    const content = modal.querySelector('.modal-content');
    content.insertBefore(notifEl, content.children[2]);
  }
  
  notifEl.style.cssText = `
    padding: 12px 16px;
    margin-bottom: 15px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 0.95rem;
    background-color: ${type === 'success' ? '#00A3A3' : '#E53E3E'};
    color: ${type === 'success' ? '#071322' : '#FFFFFF'};
    text-align: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  notifEl.textContent = message;
  notifEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      notifEl.style.display = 'none';
    }, 4000);
  }
}

// Modal controls
function openAddModal() {
  document.getElementById('add-beer-form').reset();
  const notif = document.querySelector('#add-modal .form-notification');
  if (notif) notif.style.display = 'none';
  document.getElementById('add-modal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('add-modal').style.display = 'none';
}

function openEditModal(beer) {
  const notif = document.querySelector('#edit-modal .form-notification');
  if (notif) notif.style.display = 'none';

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

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  const payload = {
    beer_name: document.getElementById('add-beer-name').value.trim(),
    brewery_name: document.getElementById('add-brewery-name').value.trim(),
    style: document.getElementById('add-style').value.trim() || null,
    rank: document.getElementById('add-rank').value ? parseFloat(document.getElementById('add-rank').value) : null,
    abv: document.getElementById('add-abv').value ? parseFloat(document.getElementById('add-abv').value) : null,
    ibu: document.getElementById('add-ibu').value ? parseInt(document.getElementById('add-ibu').value, 10) : null,
    srm: document.getElementById('add-srm').value ? parseInt(document.getElementById('add-srm').value, 10) : null,
    state: document.getElementById('add-state').value.trim() || null,
    country: document.getElementById('add-country').value.trim() || null,
    date: document.getElementById('add-date').value || null,
    location: document.getElementById('add-location').value.trim() || null
  };

  try {
    const res = await fetch('/api/beers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      data = { message: responseText || res.statusText };
    }

    if (res.ok) {
      await fetchBeers();
      await loadBrewerySuggestions();

      const beerNumber = data.id || beersData.length;
      showNotification(`Beer #${beerNumber} was added successfully!`, 'success', 'add-modal');
      
      document.getElementById('add-beer-form').reset();

      setTimeout(() => {
        closeAddModal();
      }, 1500);
    } else {
      console.error('Server error response:', res.status, responseText);
      const errDetail = data.error || data.message || `HTTP ${res.status}`;
      showNotification(`Failed to save beer: ${errDetail}`, 'error', 'add-modal');
    }
  } catch (err) {
    console.error('Network or JS error adding beer:', err);
    showNotification(`Error saving beer: ${err.message}`, 'error', 'add-modal');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

async function handleEditBeer(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating...';

  const id = document.getElementById('edit-beer-id').value;
  const payload = {
    beer_name: document.getElementById('edit-beer-name').value.trim(),
    brewery_name: document.getElementById('edit-brewery-name').value.trim(),
    style: document.getElementById('edit-style').value.trim() || null,
    rank: document.getElementById('edit-rank').value ? parseFloat(document.getElementById('edit-rank').value) : null,
    abv: document.getElementById('edit-abv').value ? parseFloat(document.getElementById('edit-abv').value) : null,
    ibu: document.getElementById('edit-ibu').value ? parseInt(document.getElementById('edit-ibu').value, 10) : null,
    srm: document.getElementById('edit-srm').value ? parseInt(document.getElementById('edit-srm').value, 10) : null,
    state: document.getElementById('edit-state').value.trim() || null,
    country: document.getElementById('edit-country').value.trim() || null,
    owned_by: document.getElementById('edit-owned-by').value.trim() || null,
    date: document.getElementById('edit-date').value || null,
    location: document.getElementById('edit-location').value.trim() || null,
    aka: document.getElementById('edit-aka').value.trim() || null,
    collaborators: document.getElementById('edit-collaborators').value.trim() || null
  };

  try {
    const res = await fetch(`/api/beers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      data = { message: responseText || res.statusText };
    }

    if (res.ok) {
      showNotification(`Beer #${id} updated successfully!`, 'success', 'edit-modal');
      await fetchBeers();
      await loadBrewerySuggestions();

      setTimeout(() => {
        closeEditModal();
      }, 1200);
    } else {
      console.error('Server error response:', res.status, responseText);
      const errDetail = data.error || data.message || `HTTP ${res.status}`;
      showNotification(`Failed to update beer: ${errDetail}`, 'error', 'edit-modal');
    }
  } catch (err) {
    console.error('Error updating beer:', err);
    showNotification(`Error updating beer: ${err.message}`, 'error', 'edit-modal');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}
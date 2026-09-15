let beers = [];
let editingBeerId = null;

// DOM Elements
const beerGrid = document.getElementById('beerGrid');
const searchInput = document.getElementById('searchInput');
const styleFilter = document.getElementById('styleFilter');
const sortSelect = document.getElementById('sortSelect');
const beerModal = document.getElementById('beerModal');
const beerForm = document.getElementById('beerForm');
const modalTitle = document.getElementById('modalTitle');
const modalError = document.getElementById('modalError');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  fetchBeers();

  searchInput.addEventListener('input', renderGrid);
  styleFilter.addEventListener('change', renderGrid);
  sortSelect.addEventListener('change', renderGrid);
  beerForm.addEventListener('submit', handleFormSubmit);
});

// Fetch All Beers
async function fetchBeers() {
  try {
    const res = await fetch('/api/beers');
    if (!res.ok) throw new Error('Failed to load beers');
    beers = await res.json();
    populateStyleFilter();
    renderGrid();
  } catch (err) {
    console.error('Error fetching beers:', err);
  }
}

// Populate Filter Dropdown
function populateStyleFilter() {
  const styles = [...new Set(beers.map(b => b.style || b.beer_style).filter(Boolean))].sort();
  styleFilter.innerHTML = '<option value="">All Styles</option>';
  styles.forEach(style => {
    const opt = document.createElement('option');
    opt.value = style;
    opt.textContent = style;
    styleFilter.appendChild(opt);
  });
}

// Render Card Grid
function renderGrid() {
  const searchVal = searchInput.value.toLowerCase().trim();
  const selectedStyle = styleFilter.value;
  const sortBy = sortSelect.value;

  let filtered = beers.filter(beer => {
    const nameStr = (beer.beer_name || '').toLowerCase();
    const breweryStr = (beer.brewery_name || '').toLowerCase();
    const matchesSearch = nameStr.includes(searchVal) || breweryStr.includes(searchVal);
    
    const beerStyle = beer.style || beer.beer_style || '';
    const matchesStyle = !selectedStyle || beerStyle === selectedStyle;

    return matchesSearch && matchesStyle;
  });

  // Sorting Logic
  filtered.sort((a, b) => {
    const numA = Number(a.beer_number ?? a.id);
    const numB = Number(b.beer_number ?? b.id);

    if (sortBy === 'recent') return numB - numA;
    if (sortBy === 'rank-desc') return (b.rank || 0) - (a.rank || 0);
    if (sortBy === 'name-asc') return (a.beer_name || '').localeCompare(b.beer_name || '');
    if (sortBy === 'number-asc') return numB - numA;
    return 0;
  });

  if (filtered.length === 0) {
    beerGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a0aec0;">No beers found matching your criteria.</p>';
    return;
  }

  beerGrid.innerHTML = filtered.map(beer => createBeerCardHtml(beer)).join('');
}

// Generate Beer Card HTML matching exact current UI styling
function createBeerCardHtml(beer) {
  const badgeNum = beer.beer_number ?? beer.id ?? '';
  const displayStyle = beer.style || beer.beer_style || 'N/A';
  const displayRank = beer.rank !== null && beer.rank !== undefined ? Number(beer.rank).toFixed(1) : 'N/A';

  return `
    <div class="beer-card">
      <span class="beer-badge">#${badgeNum}</span>

      <h3>${escapeHtml(beer.beer_name)}</h3>
      <div class="brewery-title">${escapeHtml(beer.brewery_name)}</div>
      
      <div class="card-meta">
        <p><strong>Style:</strong> ${escapeHtml(displayStyle)}</p>
        <p><strong>Rank:</strong> ${displayRank}</p>
        ${beer.abv ? `<p><strong>ABV:</strong> ${Number(beer.abv).toFixed(2)}%</p>` : ''}
        ${beer.location ? `<p><strong>Location:</strong> ${escapeHtml(beer.location)}</p>` : ''}
      </div>

      <div class="card-actions">
        <button class="btn-edit" onclick="openEditModal(${beer.id})">Edit</button>
      </div>
    </div>
  `;
}

// Modal Handlers
function openModal(mode, beerId = null) {
  modalError.classList.add('hidden');
  modalError.textContent = '';
  beerForm.reset();

  if (mode === 'add') {
    editingBeerId = null;
    document.getElementById('beerId').value = '';
    modalTitle.textContent = 'Add New Beer';
  } else if (mode === 'edit') {
    editingBeerId = beerId;
    const beer = beers.find(b => b.id === beerId);
    if (!beer) return;

    modalTitle.textContent = 'Edit Beer Entry';
    document.getElementById('beerId').value = beer.id;
    document.getElementById('beer_name').value = beer.beer_name || '';
    document.getElementById('brewery_name').value = beer.brewery_name || '';
    document.getElementById('style').value = beer.style || beer.beer_style || '';
    document.getElementById('rank').value = beer.rank ?? '';
    document.getElementById('abv').value = beer.abv ?? '';
    document.getElementById('ibu').value = beer.ibu ?? '';
    document.getElementById('srm').value = beer.srm ?? '';
    document.getElementById('state').value = beer.state || '';
    document.getElementById('country').value = beer.country || '';
    document.getElementById('location').value = beer.location || '';
    document.getElementById('aka').value = beer.aka || beer.aka_beer_name || '';

    if (beer.date || beer.consumption_date) {
      const rawDate = beer.date || beer.consumption_date;
      const formattedDate = new Date(rawDate).toISOString().split('T')[0];
      document.getElementById('date').value = formattedDate;
    }
  }

  beerModal.classList.remove('hidden');
}

function openEditModal(id) {
  openModal('edit', id);
}

function closeModal() {
  beerModal.classList.add('hidden');
}

// Submit Form
async function handleFormSubmit(e) {
  e.preventDefault();
  modalError.classList.add('hidden');

  const payload = {
    beer_name: document.getElementById('beer_name').value,
    brewery_name: document.getElementById('brewery_name').value,
    style: document.getElementById('style').value,
    rank: document.getElementById('rank').value,
    abv: document.getElementById('abv').value,
    ibu: document.getElementById('ibu').value,
    srm: document.getElementById('srm').value,
    state: document.getElementById('state').value,
    country: document.getElementById('country').value,
    date: document.getElementById('date').value,
    location: document.getElementById('location').value,
    aka: document.getElementById('aka').value
  };

  const isEdit = editingBeerId !== null;
  const url = isEdit ? `/api/beers/${editingBeerId}` : '/api/beers';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to save beer entry.');
    }

    closeModal();
    await fetchBeers();
  } catch (err) {
    console.error('Form submission error:', err);
    modalError.textContent = err.message;
    modalError.classList.remove('hidden');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
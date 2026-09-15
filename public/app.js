let beers = [];
let breweries = [];
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

const detailModal = document.getElementById('detailModal');
const detailTitle = document.getElementById('detailTitle');
const detailBody = document.getElementById('detailBody');
const detailEditBtn = document.getElementById('detailEditBtn');

const breweryInput = document.getElementById('brewery_name');
const breweryDatalist = document.getElementById('breweryList');
const stateInput = document.getElementById('state');
const countryInput = document.getElementById('country');
const ownedByInput = document.getElementById('owned_by');
const akaContainer = document.getElementById('akaContainer');

document.addEventListener('DOMContentLoaded', () => {
  fetchBeers();
  fetchBreweries();

  searchInput.addEventListener('input', renderGrid);
  styleFilter.addEventListener('change', renderGrid);
  sortSelect.addEventListener('change', renderGrid);
  beerForm.addEventListener('submit', handleFormSubmit);

  breweryInput.addEventListener('input', handleBreweryAutofill);
});

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

async function fetchBreweries() {
  try {
    const res = await fetch('/api/breweries');
    if (!res.ok) throw new Error('Failed to load breweries');
    breweries = await res.json();

    breweryDatalist.innerHTML = breweries.map(b => 
      `<option value="${escapeHtml(b.brewery_name)}"></option>`
    ).join('');
  } catch (err) {
    console.error('Error fetching breweries:', err);
  }
}

function handleBreweryAutofill() {
  const currentVal = breweryInput.value.trim().toLowerCase();
  if (!currentVal) return;

  const match = breweries.find(b => (b.brewery_name || '').toLowerCase() === currentVal);
  if (match) {
    if (match.state) stateInput.value = match.state;
    if (match.country) countryInput.value = match.country;
    if (match.owned_by) ownedByInput.value = match.owned_by;
  }
}

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

// Color gradient calculation for Rank (Red -> Yellow -> Green)
function getRankColor(rank) {
  if (rank === null || rank === undefined || isNaN(rank)) return '#8a99ad';
  const clamped = Math.min(Math.max(Number(rank), 1), 5);
  // Maps 1.0 -> 0deg (Red), 3.0 -> 60deg (Yellow), 5.0 -> 120deg (Green)
  const hue = ((clamped - 1) / 4) * 120;
  return `hsl(${hue}, 85%, 55%)`;
}

// Render 5-Star Rating Element
function renderStarRating(rank) {
  if (rank === null || rank === undefined || isNaN(rank)) return '<span style="color: #8a99ad;">N/A</span>';
  
  const numericRank = Number(rank);
  const color = getRankColor(numericRank);
  let starsHtml = '';

  for (let i = 1; i <= 5; i++) {
    let fillPercentage = 0;
    if (numericRank >= i) {
      fillPercentage = 100;
    } else if (numericRank > i - 1) {
      fillPercentage = (numericRank - (i - 1)) * 100;
    }

    starsHtml += `
      <span class="star-wrapper" title="${numericRank.toFixed(1)} / 5.0">
        <span class="star empty">&#9733;</span>
        <span class="star fill" style="width: ${fillPercentage}%; color: ${color};">&#9733;</span>
      </span>
    `;
  }

  return `
    <div class="star-rating-container">
      ${starsHtml}
      <span class="rank-value-text" style="color: ${color}; font-weight: 700; margin-left: 0.4rem;">
        ${numericRank.toFixed(1)}
      </span>
    </div>
  `;
}

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

  filtered.sort((a, b) => {
    const numA = Number(a.beer_number ?? a.id);
    const numB = Number(b.beer_number ?? b.id);

    if (sortBy === 'recent') return numB - numA;
    if (sortBy === 'rank-desc') return (b.rank || 0) - (a.rank || 0);
    if (sortBy === 'name-asc') return (a.beer_name || '').localeCompare(b.beer_name || '');
    return 0;
  });

  if (filtered.length === 0) {
    beerGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a0aec0;">No beers found matching your criteria.</p>';
    return;
  }

  beerGrid.innerHTML = filtered.map(beer => createBeerCardHtml(beer)).join('');
}

function createBeerCardHtml(beer) {
  const badgeNum = beer.beer_number ?? beer.id ?? '';
  const displayStyle = beer.style || beer.beer_style || 'N/A';
  const starDisplay = renderStarRating(beer.rank);

  return `
    <div class="beer-card" onclick="openDetailModal(${beer.id})">
      <span class="beer-badge">#${badgeNum}</span>
      <h3>${escapeHtml(beer.beer_name)}</h3>
      <div class="brewery-title">${escapeHtml(beer.brewery_name)}</div>
      
      <div class="card-meta">
        <p><strong>Style:</strong> ${escapeHtml(displayStyle)}</p>
        <div class="card-rank-row">
          <strong>Rank:</strong> ${starDisplay}
        </div>
        ${beer.abv ? `<p><strong>ABV:</strong> ${Number(beer.abv).toFixed(2)}%</p>` : ''}
        ${beer.location ? `<p><strong>Location:</strong> ${escapeHtml(beer.location)}</p>` : ''}
      </div>

      <div class="card-actions">
        <button class="btn-edit" onclick="event.stopPropagation(); openEditModal(${beer.id})">Edit</button>
      </div>
    </div>
  `;
}

// Open Detailed View Modal
function openDetailModal(id) {
  const beer = beers.find(b => b.id === id);
  if (!beer) return;

  const badgeNum = beer.beer_number ?? beer.id ?? '';
  detailTitle.textContent = `#${badgeNum} - ${beer.beer_name}`;

  const fields = [
    { label: 'Beer Name', value: beer.beer_name },
    { label: 'Brewery', value: beer.brewery_name },
    { label: 'Style', value: beer.style || beer.beer_style },
    { label: 'Rank', value: beer.rank !== null && beer.rank !== undefined ? `${renderStarRating(beer.rank)}` : null, isHtml: true },
    { label: 'ABV', value: beer.abv ? `${Number(beer.abv).toFixed(2)}%` : null },
    { label: 'IBU', value: beer.ibu },
    { label: 'SRM', value: beer.srm },
    { label: 'Location', value: beer.location },
    { label: 'State', value: beer.state },
    { label: 'Country', value: beer.country },
    { label: 'Owned By', value: beer.owned_by },
    { label: 'Date', value: beer.date || beer.consumption_date ? new Date(beer.date || beer.consumption_date).toLocaleDateString() : null },
    { label: 'AKA / Alternate Name', value: beer.aka || beer.aka_beer_name },
    { label: 'Database ID', value: beer.id }
  ];

  detailBody.innerHTML = fields.map(f => {
    let valHtml = '<em style="color:#5a6e85;">N/A</em>';
    if (f.value !== null && f.value !== undefined && String(f.value).trim() !== '') {
      valHtml = f.isHtml ? f.value : escapeHtml(String(f.value));
    }
    return `
      <div class="detail-item">
        <span>${escapeHtml(f.label)}</span>
        <p>${valHtml}</p>
      </div>
    `;
  }).join('');

  detailEditBtn.onclick = () => {
    closeDetailModal();
    openEditModal(beer.id);
  };

  detailModal.classList.remove('hidden');
}

function closeDetailModal() {
  detailModal.classList.add('hidden');
}

function clearFormInputs() {
  beerForm.reset();
  document.getElementById('beerId').value = '';
  document.getElementById('beer_name').value = '';
  document.getElementById('brewery_name').value = '';
  document.getElementById('style').value = '';
  document.getElementById('rank').value = '';
  document.getElementById('abv').value = '';
  document.getElementById('ibu').value = '';
  document.getElementById('srm').value = '';
  document.getElementById('state').value = '';
  document.getElementById('country').value = '';
  document.getElementById('owned_by').value = '';
  document.getElementById('date').value = '';
  document.getElementById('location').value = '';
  document.getElementById('aka').value = '';
}

function openModal(mode, beerId = null) {
  modalError.classList.add('hidden');
  modalError.textContent = '';
  clearFormInputs();

  if (mode === 'add') {
    editingBeerId = null;
    modalTitle.textContent = 'Add New Beer';
    akaContainer.classList.add('hidden');
  } else if (mode === 'edit') {
    editingBeerId = beerId;
    const beer = beers.find(b => b.id === beerId);
    if (!beer) return;

    modalTitle.textContent = 'Edit Beer Entry';
    akaContainer.classList.remove('hidden');

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
    document.getElementById('owned_by').value = beer.owned_by || '';
    document.getElementById('location').value = beer.location || '';
    document.getElementById('aka').value = beer.aka || beer.aka_beer_name || '';

    if (beer.date || beer.consumption_date) {
      const rawDate = beer.date || beer.consumption_date;
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        document.getElementById('date').value = parsed.toISOString().split('T')[0];
      }
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
    owned_by: document.getElementById('owned_by').value,
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
    if (!res.ok) throw new Error(data.error || 'Failed to save beer entry.');

    closeModal();
    await fetchBeers();
    await fetchBreweries();
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
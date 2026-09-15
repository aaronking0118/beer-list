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

function getRankColor(rank) {
  if (rank === null || rank === undefined || isNaN(rank)) return '#8a99ad';
  const clamped = Math.min(Math.max(Number(rank), 1), 5);
  const hue = ((clamped - 1) / 4) * 120;
  return `hsl(${hue}, 85%, 55%)`;
}

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

// SRM color mapping (2-40) with custom color keyword overrides for red, purple, and green beers
function getBeerLiquidColor(beer) {
  const styleName = (beer.style || beer.beer_style || '').toLowerCase();
  
  if (styleName.includes('purple') || styleName.includes('boysenberry') || styleName.includes('blackberry') || styleName.includes('sour - purple')) {
    return '#8a2be2'; // Vibrant Purple
  }
  if (styleName.includes('green') || styleName.includes('matcha') || styleName.includes('st. patrick')) {
    return '#2e8b57'; // Sea Green
  }
  if (styleName.includes('red ale') || styleName.includes('fruit tart') || styleName.includes('cranberry') || styleName.includes('cherry') || styleName.includes('red')) {
    return '#b22222'; // Firebrick Red
  }

  const srm = beer.srm;
  if (srm === null || srm === undefined || isNaN(srm)) return '#F5E16C'; // Default straw
  const val = Math.max(2, Math.min(Number(srm), 40));

  if (val <= 3) return '#F3F993';
  if (val <= 5) return '#F5E16C';
  if (val <= 7) return '#F7C83C';
  if (val <= 10) return '#E89C17';
  if (val <= 14) return '#D96F0A';
  if (val <= 18) return '#B84506';
  if (val <= 22) return '#943103';
  if (val <= 26) return '#78281F';
  if (val <= 32) return '#512E5F';
  if (val <= 37) return '#273746';
  return '#111111';
}

// Maps style to glassware type
function getGlasswareTypeForStyle(styleName) {
  if (!styleName) return 'pint';
  const lower = styleName.toLowerCase();
  
  if (lower.includes('stout') || lower.includes('porter') || lower.includes('barrel-aged') || lower.includes('barleywine')) {
    return 'snifter';
  }
  if (lower.includes('wheat') || lower.includes('hefeweizen') || lower.includes('witbier')) {
    return 'weizen';
  }
  if (lower.includes('pilsner') || lower.includes('bock') || lower.includes('helles') || lower.includes('kölsch')) {
    return 'flute';
  }
  if (lower.includes('belgian') || lower.includes('saison') || lower.includes('tripel') || lower.includes('quadrupel')) {
    return 'tulip';
  }
  if (lower.includes('märzen') || lower.includes('oktoberfest') || lower.includes('schwarzbier') || lower.includes('amber')) {
    return 'stein';
  }
  return 'pint';
}

// Renders standardized SVG glassware graphics safely padded within viewBox="0 0 24 24"
function renderGlasswareSvg(beer) {
  const liquidColor = getBeerLiquidColor(beer);
  const styleName = beer.style || beer.beer_style || 'N/A';
  const type = getGlasswareTypeForStyle(styleName);
  
  let svgPaths = '';

  if (type === 'weizen') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.5 4.5h9l-1 13.2a1.2 1.2 0 0 1-1.2 1.1h-4.6a1.2 1.2 0 0 1-1.2-1.1L7.5 4.5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M6.8 2.8h10.4l-1.3 15.2a1.8 1.8 0 0 1-1.8 1.6H9.9a1.8 1.8 0 0 1-1.8-1.6L6.8 2.8zm-2-1.8h14.4v2H4.8V1zm3.8 17.2h7.8v1.6H8.6V18.2z" />
      <path fill="#ffffff" opacity="0.85" d="M7.4 3.5h9.2v1.2H7.4z" />
    `;
  } else if (type === 'tulip') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.6 6.2c0-2 1.9-3.2 4.4-3.2s4.4 1.2 4.4 3.2c0 1.8-1 3.2-1.9 4.8l-1.1 7h-2.8l-1.1-7c-.9-1.6-1.9-3-1.9-4.8z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M7.6 2.6c0-1.1.9-2 2-2h4.8c1.1 0 2 .9 2 2 0 1.4-.7 2.6-1.4 3.8-1.1 1.8-1.7 3.2-1.7 5.4v6.2h-3.6V11.8c0-2.2-.6-3.6-1.7-5.4-.7-1.2-1.4-2.4-1.4-3.8zM6 19.2h12v1.6H6v-1.6z" />
      <path fill="#ffffff" opacity="0.85" d="M8.2 3h7.6v1H8.2z" />
    `;
  } else if (type === 'stein') {
    svgPaths = `
      <path fill="${liquidColor}" d="M6.8 4.8h10.4l-0.8 13.2a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1L6.8 4.8z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M5.8 3.2h12.4l-1 14.8a1.5 1.5 0 0 1-1.5 1.4H8.3a1.5 1.5 0 0 1-1.5-1.4L5.8 3.2zm-2-1.8h16.4v2H3.8v-2zm3.8 2.6v14m4-14v14m4-14v14M5.2 19.4h13.6v1.6H5.2v-1.6zm13-10.2c1.8 0 3.2 0.9 3.2 2.8s-1.4 2.8-3.2 2.8" />
      <path fill="#ffffff" opacity="0.85" d="M6.2 4h11.6v1.2H6.2z" />
    `;
  } else if (type === 'snifter') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.2 8.5h9.6a4.4 4.4 0 0 1-4.8 4.4h-0.4a4.4 4.4 0 0 1-4.4-4.4z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M8.4 4.5h7.2a5.4 5.4 0 0 1 5.4 5.4c0 3-2.4 5.4-5.4 5.4h-7.2c-3 0-5.4-2.4-5.4-5.4a5.4 5.4 0 0 1 5.4-5.4zm-2-2h11.2v2H6.4v-2zm3.6 12.2h4v3.6h-4v-3.6zm-2 4.4h8v1.6h-8v-1.6z" />
      <path fill="#ffffff" opacity="0.85" d="M8.8 5.2h6.4v1H8.8z" />
    `;
  } else if (type === 'flute') {
    svgPaths = `
      <path fill="${liquidColor}" d="M8 4.2h8l-0.4 13.5H8.4L8 4.2z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M7.4 2.8h9.2l-0.6 15.2a1 1 0 0 1-1 0.8H9a1 1 0 0 1-1-0.8L7.4 2.8zm-2-1.8h13.2v2H5.4v-2zm4.4 17.2h4.4v2.4H9.8v-2.4z" />
      <path fill="#ffffff" opacity="0.85" d="M8 3.4h8v1H8z" />
    `;
  } else {
    // Pint / Nonic
    svgPaths = `
      <path fill="${liquidColor}" d="M6.5 4.8h11l-1.1 13.4a1.2 1.2 0 0 1-1.2 1.1h-6.4a1.2 1.2 0 0 1-1.2-1.1L6.5 4.8z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M5.5 3h13l-1.4 15a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8L5.5 3zm-2-2h17v2H3.5V1zm3.4 17.2h10.2v1.6H6.9V18.2z" />
      <path fill="#ffffff" opacity="0.85" d="M6 3.8h12v1.2H6z" />
    `;
  }

  return `
    <svg class="glassware-icon" viewBox="0 0 24 24" width="30" height="30" style="overflow: visible; display: inline-block; vertical-align: middle; flex-shrink: 0;" title="Style: ${escapeHtml(styleName)} | Glass: ${type} | SRM: ${beer.srm ?? 'N/A'}">
      ${svgPaths}
    </svg>
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
  const glasswareSvg = renderGlasswareSvg(beer);

  return `
    <div class="beer-card" onclick="openDetailModal(${beer.id})">
      <span class="beer-badge">#${badgeNum}</span>
      <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.2rem;">
        ${glasswareSvg}
        <h3 style="padding-right: 3rem; margin-bottom: 0; line-height: 1.2;">${escapeHtml(beer.beer_name)}</h3>
      </div>
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
    { label: 'Glassware & Color', value: renderGlasswareSvg(beer), isHtml: true },
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
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

  if (searchInput) searchInput.addEventListener('input', renderGrid);
  if (styleFilter) styleFilter.addEventListener('change', renderGrid);
  if (sortSelect) sortSelect.addEventListener('change', renderGrid);
  if (beerForm) beerForm.addEventListener('submit', handleFormSubmit);
  if (breweryInput) breweryInput.addEventListener('input', handleBreweryAutofill);
});

async function fetchBeers() {
  try {
    const res = await fetch('/api/beers');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    beers = await res.json();
    populateStyleFilter();
    updateStats();
    renderGrid();
  } catch (err) {
    console.error('Error fetching beers:', err);
    if (beerGrid) {
      beerGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; color: #fc8181; background: #2d3748; border-radius: 8px; text-align: center;">
          <h3>Error loading beers</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }
}

async function fetchBreweries() {
  try {
    const res = await fetch('/api/breweries');
    if (!res.ok) throw new Error('Failed to load breweries');
    breweries = await res.json();

    if (breweryDatalist) {
      breweryDatalist.innerHTML = breweries.map(b => 
        `<option value="${escapeHtml(b.brewery_name)}"></option>`
      ).join('');
    }
  } catch (err) {
    console.error('Error fetching breweries:', err);
  }
}

function handleBreweryAutofill() {
  if (!breweryInput) return;
  const currentVal = breweryInput.value.trim().toLowerCase();
  if (!currentVal) return;

  const match = breweries.find(b => (b.brewery_name || '').toLowerCase() === currentVal);
  if (match) {
    if (match.state && stateInput) stateInput.value = match.state;
    if (match.country && countryInput) countryInput.value = match.country;
    if (match.owned_by && ownedByInput) ownedByInput.value = match.owned_by;
  }
}

function populateStyleFilter() {
  if (!styleFilter) return;
  const styles = [...new Set(beers.map(b => b.style || b.beer_style).filter(Boolean))].sort();
  styleFilter.innerHTML = '<option value="">All Styles</option>';
  styles.forEach(style => {
    const opt = document.createElement('option');
    opt.value = style;
    opt.textContent = style;
    styleFilter.appendChild(opt);
  });
}

function updateStats() {
  const totalBeersEl = document.getElementById('statTotalBeers');
  const totalBreweriesEl = document.getElementById('statTotalBreweries');
  const avgRatingEl = document.getElementById('statAvgRating');

  if (!totalBeersEl) return;

  const totalBeers = beers.length;
  const uniqueBreweries = new Set(
    beers.map(b => (b.brewery_name || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  const ratedBeers = beers.filter(b => b.rank !== null && b.rank !== undefined && !isNaN(b.rank));
  const avgRating = ratedBeers.length > 0 
    ? (ratedBeers.reduce((sum, b) => sum + Number(b.rank), 0) / ratedBeers.length).toFixed(1) 
    : '0.0';

  totalBeersEl.textContent = totalBeers;
  totalBreweriesEl.textContent = uniqueBreweries;
  avgRatingEl.textContent = avgRating;
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
    <div class="star-rating-container" style="display: inline-flex; align-items: center;">
      ${starsHtml}
      <span class="rank-value-text" style="color: ${color}; font-weight: 700; margin-left: 0.4rem;">
        ${numericRank.toFixed(1)}
      </span>
    </div>
  `;
}

function getBeerLiquidColor(beer) {
  const styleName = (beer.style || beer.beer_style || '').toLowerCase();
  
  if (styleName.includes('purple') || styleName.includes('boysenberry') || styleName.includes('blackberry') || styleName.includes('sour - purple')) {
    return '#8a2be2';
  }
  if (styleName.includes('green') || styleName.includes('matcha') || styleName.includes('st. patrick')) {
    return '#2e8b57';
  }
  if (styleName.includes('red ale') || styleName.includes('fruit tart') || styleName.includes('cranberry') || styleName.includes('cherry') || styleName.includes('red')) {
    return '#b22222';
  }

  const srm = beer.srm;
  if (srm === null || srm === undefined || isNaN(srm)) return '#F5E16C';
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

function renderGlasswareSvg(beer) {
  const liquidColor = getBeerLiquidColor(beer);
  const styleName = beer.style || beer.beer_style || 'N/A';
  const type = getGlasswareTypeForStyle(styleName);
  
  let svgPaths = '';

  if (type === 'weizen') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.5 5h9l-1 22.5a1.2 1.2 0 0 1-1.2 1.2h-4.6a1.2 1.2 0 0 1-1.2-1.2L7.5 5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M6.8 3.2h10.4l-1.3 25.4a1.8 1.8 0 0 1-1.8 1.8H9.9a1.8 1.8 0 0 1-1.8-1.8L6.8 3.2zm-2-1.8h14.4v2H4.8V1.4zm3.8 28h7.8v2H8.6v-2z" />
      <path fill="#ffffff" opacity="0.85" d="M7.4 4h9.2v1.2H7.4z" />
    `;
  } else if (type === 'tulip') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.6 7c0-3.5 1.9-5.5 4.4-5.5s4.4 2 4.4 5.5c0 3-1 5.5-1.9 8.5l-1.1 12.5h-2.8l-1.1-12.5c-.9-3-1.9-5.5-1.9-8.5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M7.6 3.2c0-1.8.9-3.2 2-3.2h4.8c1.1 0 2 1.4 2 3.2 0 2.2-.7 4.2-1.4 6.2-1.1 3.2-1.7 5.8-1.7 9.2v9.4h-3.6V18.6c0-3.4-.6-6-1.7-9.2-.7-2-1.4-4-1.4-6.2zM6 29.4h12v2H6v-2z" />
      <path fill="#ffffff" opacity="0.85" d="M8.2 3.8h7.6v1H8.2z" />
    `;
  } else if (type === 'stein') {
    svgPaths = `
      <path fill="${liquidColor}" d="M6.8 5.5h10.4l-0.8 22.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1L6.8 5.5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M5.8 3.8h12.4l-1 25.5a1.5 1.5 0 0 1-1.5 1.4H8.3a1.5 1.5 0 0 1-1.5-1.4L5.8 3.8zm-2-1.8h16.4v2H3.8v-2zm3.8 3.5v23.5m4-23.5v23.5m4-23.5v23.5M5.2 30.7h13.6v2H5.2v-2zm13-16c1.8 0 3.2 1.4 3.2 3.6s-1.4 3.6-3.2 3.6" />
      <path fill="#ffffff" opacity="0.85" d="M6.2 4.6h11.6v1.2H6.2z" />
    `;
  } else if (type === 'snifter') {
    svgPaths = `
      <path fill="${liquidColor}" d="M7.2 10.5h9.6a4.8 4.8 0 0 1-4.8 4.8h-0.4a4.8 4.8 0 0 1-4.4-4.8z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M8.4 5.5h7.2a6 6 0 0 1 6 6c0 3.8-3 6.8-6 6.8h-7.2c-3 0-6-3-6-6.8a6 6 0 0 1 6-6zm-2-2h11.2v2H6.4v-2zm3.6 15.8h4v8.5h-4v-8.5zm-2 9.5h8v2h-8v-2z" />
      <path fill="#ffffff" opacity="0.85" d="M8.8 6.4h6.4v1H8.8z" />
    `;
  } else if (type === 'flute') {
    svgPaths = `
      <path fill="${liquidColor}" d="M8.2 5h7.6l-0.4 23.5H8.6L8.2 5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M7.6 3.5h8.8l-0.6 25.5a1 1 0 0 1-1 1H9.2a1 1 0 0 1-1-1L7.6 3.5zm-2-1.8h12.8v2H5.6v-2zm4.4 27h4v2.5H10v-2.5z" />
      <path fill="#ffffff" opacity="0.85" d="M8.2 4.2h7.6v1H8.2z" />
    `;
  } else {
    svgPaths = `
      <path fill="${liquidColor}" d="M6.5 5.5h11l-1.1 23a1.2 1.2 0 0 1-1.2 1.2h-6.4a1.2 1.2 0 0 1-1.2-1.2L6.5 5.5z" opacity="0.9" />
      <path fill="none" stroke="#d3dfe9" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="M5.5 3.5h13l-1.4 25.5a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8L5.5 3.5zm-2-2h17v2H3.5V1.5zm3.4 28.5h10.2v2H6.9v-2z" />
      <path fill="#ffffff" opacity="0.85" d="M6 4.4h12v1.2H6z" />
    `;
  }

  return `
    <svg class="glassware-icon" viewBox="0 0 24 36" width="36" height="54" style="overflow: visible; display: block; flex-shrink: 0;" title="Style: ${escapeHtml(styleName)} | Glass: ${type} | SRM: ${beer.srm ?? 'N/A'}">
      ${svgPaths}
    </svg>
  `;
}

function renderGrid() {
  if (!beerGrid) return;

  try {
    const searchVal = (searchInput?.value || '').toLowerCase().trim();
    const selectedStyle = styleFilter?.value || '';
    const sortBy = sortSelect?.value || 'recent';

    let filtered = beers.filter(beer => {
      const nameStr = (beer.beer_name || '').toLowerCase();
      const breweryStr = (beer.brewery_name || '').toLowerCase();
      const matchesSearch = nameStr.includes(searchVal) || breweryStr.includes(searchVal);
      
      const beerStyle = beer.style || beer.beer_style || '';
      const matchesStyle = !selectedStyle || beerStyle === selectedStyle;

      return matchesSearch && matchesStyle;
    });

    filtered.sort((a, b) => {
      const numA = Number(a.beer_number ?? a.id ?? 0);
      const numB = Number(b.beer_number ?? b.id ?? 0);

      if (sortBy === 'recent') return numB - numA;
      if (sortBy === 'rank-desc') return (b.rank || 0) - (a.rank || 0);
      if (sortBy === 'name-asc') return (a.beer_name || '').localeCompare(b.beer_name || '');
      return 0;
    });

    if (filtered.length === 0) {
      beerGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #a0aec0; padding: 2rem;">No beers found matching your criteria.</p>';
      return;
    }

    beerGrid.innerHTML = filtered.map(beer => createBeerCardHtml(beer)).join('');
  } catch (err) {
    console.error('Render grid error:', err);
    beerGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #fc8181;">Error rendering cards: ${escapeHtml(err.message)}</p>`;
  }
}

function createBeerCardHtml(beer) {
  const badgeNum = beer.beer_number ?? beer.id ?? '';
  const displayStyle = beer.style || beer.beer_style || 'N/A';
  const starDisplay = renderStarRating(beer.rank);
  const glasswareSvg = renderGlasswareSvg(beer);

  return `
    <div class="beer-card" onclick="openDetailModal(${beer.id})" style="cursor: pointer;">
      <span class="beer-badge">#${badgeNum}</span>
      <div style="display: flex; align-items: flex-start; gap: 0.8rem; margin-bottom: 0.4rem;">
        <div>${glasswareSvg}</div>
        <div style="flex-grow: 1; min-width: 0;">
          <h3 style="padding-right: 2.5rem; margin-bottom: 0.1rem; line-height: 1.2; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(beer.beer_name)}</h3>
          <div class="brewery-title" style="font-size: 0.85rem; color: #718096; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(beer.brewery_name)}</div>
        </div>
      </div>
      
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
  if (detailTitle) detailTitle.textContent = `#${badgeNum} - ${beer.beer_name}`;

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

  if (detailBody) {
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
  }

  if (detailEditBtn) {
    detailEditBtn.onclick = () => {
      closeDetailModal();
      openEditModal(beer.id);
    };
  }

  if (detailModal) detailModal.classList.remove('hidden');
}

function closeDetailModal() {
  if (detailModal) detailModal.classList.add('hidden');
}

function clearFormInputs() {
  if (beerForm) beerForm.reset();
  const fields = ['beerId', 'beer_name', 'brewery_name', 'style', 'rank', 'abv', 'ibu', 'srm', 'state', 'country', 'owned_by', 'date', 'location', 'aka'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function openModal(mode, beerId = null) {
  if (modalError) {
    modalError.classList.add('hidden');
    modalError.textContent = '';
  }
  clearFormInputs();

  if (mode === 'add') {
    editingBeerId = null;
    if (modalTitle) modalTitle.textContent = 'Add New Beer';
    if (akaContainer) akaContainer.classList.add('hidden');
  } else if (mode === 'edit') {
    editingBeerId = beerId;
    const beer = beers.find(b => b.id === beerId);
    if (!beer) return;

    if (modalTitle) modalTitle.textContent = 'Edit Beer Entry';
    if (akaContainer) akaContainer.classList.remove('hidden');

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? '';
    };

    setVal('beerId', beer.id);
    setVal('beer_name', beer.beer_name);
    setVal('brewery_name', beer.brewery_name);
    setVal('style', beer.style || beer.beer_style);
    setVal('rank', beer.rank);
    setVal('abv', beer.abv);
    setVal('ibu', beer.ibu);
    setVal('srm', beer.srm);
    setVal('state', beer.state);
    setVal('country', beer.country);
    setVal('owned_by', beer.owned_by);
    setVal('location', beer.location);
    setVal('aka', beer.aka || beer.aka_beer_name);

    if (beer.date || beer.consumption_date) {
      const rawDate = beer.date || beer.consumption_date;
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        setVal('date', parsed.toISOString().split('T')[0]);
      }
    }
  }

  if (beerModal) beerModal.classList.remove('hidden');
}

function openEditModal(id) {
  openModal('edit', id);
}

function closeModal() {
  if (beerModal) beerModal.classList.add('hidden');
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (modalError) modalError.classList.add('hidden');

  const getVal = (id) => document.getElementById(id)?.value || '';

  const payload = {
    beer_name: getVal('beer_name'),
    brewery_name: getVal('brewery_name'),
    style: getVal('style'),
    rank: getVal('rank'),
    abv: getVal('abv'),
    ibu: getVal('ibu'),
    srm: getVal('srm'),
    state: getVal('state'),
    country: getVal('country'),
    owned_by: getVal('owned_by'),
    date: getVal('date'),
    location: getVal('location'),
    aka: getVal('aka')
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
    if (modalError) {
      modalError.textContent = err.message;
      modalError.classList.remove('hidden');
    }
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
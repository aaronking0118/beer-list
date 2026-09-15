let currentPage = 1;
const limit = 18;
let breweriesMap = new Map();

// DOM Elements
const searchInput = document.getElementById('searchInput');
const styleSelect = document.getElementById('styleSelect');
const sortSelect = document.getElementById('sortSelect');
const searchBtn = document.getElementById('searchBtn');
const beerGrid = document.getElementById('beerGrid');
const resultsCount = document.getElementById('resultsCount');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageLabel = document.getElementById('currentPageLabel');
const breweriesDatalist = document.getElementById('breweriesDatalist');

// Form Brewery Inputs
const addBreweryInput = document.getElementById('addBreweryInput');
const addStateInput = document.getElementById('addStateInput');
const addCountryInput = document.getElementById('addCountryInput');
const addOwnedByInput = document.getElementById('addOwnedByInput');

const editBreweryNameInput = document.getElementById('editBreweryName');
const editStateInput = document.getElementById('editState');
const editCountryInput = document.getElementById('editCountry');
const editOwnedByInput = document.getElementById('editOwnedBy');

// Modals
const beerModal = document.getElementById('beerModal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

const addBeerModal = document.getElementById('addBeerModal');
const openAddBeerModalBtn = document.getElementById('openAddBeerModal');
const closeAddModalBtn = document.getElementById('closeAddModal');
const addBeerForm = document.getElementById('addBeerForm');

const editBeerModal = document.getElementById('editBeerModal');
const closeEditModalBtn = document.getElementById('closeEditModal');
const editBeerForm = document.getElementById('editBeerForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchStyles();
  fetchBreweries();
  fetchBeers();

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
  styleSelect.addEventListener('change', () => { currentPage = 1; fetchBeers(); });
  sortSelect.addEventListener('change', () => { currentPage = 1; fetchBeers(); });

  prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; fetchBeers(); } });
  nextPageBtn.addEventListener('click', () => { currentPage++; fetchBeers(); });

  closeModal.addEventListener('click', () => beerModal.classList.add('hidden'));
  beerModal.addEventListener('click', (e) => { if (e.target === beerModal) beerModal.classList.add('hidden'); });

  if (openAddBeerModalBtn) openAddBeerModalBtn.addEventListener('click', () => addBeerModal.classList.remove('hidden'));
  if (closeAddModalBtn) closeAddModalBtn.addEventListener('click', () => addBeerModal.classList.add('hidden'));
  if (addBeerModal) addBeerModal.addEventListener('click', (e) => { if (e.target === addBeerModal) addBeerModal.classList.add('hidden'); });
  if (addBeerForm) addBeerForm.addEventListener('submit', handleAddBeerSubmit);

  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => editBeerModal.classList.add('hidden'));
  if (editBeerModal) editBeerModal.addEventListener('click', (e) => { if (e.target === editBeerModal) editBeerModal.classList.add('hidden'); });
  if (editBeerForm) editBeerForm.addEventListener('submit', handleEditBeerSubmit);

  // Bind Brewery Auto-Fill Listeners
  if (addBreweryInput) {
    addBreweryInput.addEventListener('input', () => autoFillBreweryDetails(addBreweryInput.value, addStateInput, addCountryInput, addOwnedByInput));
  }
  if (editBreweryNameInput) {
    editBreweryNameInput.addEventListener('input', () => autoFillBreweryDetails(editBreweryNameInput.value, editStateInput, editCountryInput, editOwnedByInput));
  }
});

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const bgColor = type === 'error' ? 'bg-red-900/90 border-red-500 text-red-200' : 'bg-emerald-900/90 border-emerald-500 text-emerald-200';
  
  toast.className = `pointer-events-auto border px-4 py-3 rounded-lg shadow-xl text-sm flex items-center gap-2 backdrop-blur transition transform duration-300 ${bgColor}`;
  toast.innerHTML = `<span>${type === 'error' ? '⚠️' : '✅'}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Fetch Breweries List for Auto-Suggest & Auto-Fill
async function fetchBreweries() {
  try {
    const res = await fetch('/api/breweries');
    const breweries = await res.json();
    
    breweriesDatalist.innerHTML = '';
    breweriesMap.clear();

    breweries.forEach(item => {
      const option = document.createElement('option');
      option.value = item.brewery_name;
      breweriesDatalist.appendChild(option);
      
      breweriesMap.set(item.brewery_name.toLowerCase().trim(), {
        state: item.state || '',
        country: item.country || '',
        owned_by: item.owned_by || ''
      });
    });
  } catch (err) {
    console.error('Failed to fetch breweries list:', err);
  }
}

// Auto-fill State, Country, and Owned By when a brewery matches existing records
function autoFillBreweryDetails(typedName, stateElem, countryElem, ownedByElem) {
  const match = breweriesMap.get(typedName.toLowerCase().trim());
  if (match) {
    if (match.state) stateElem.value = match.state;
    if (match.country) countryElem.value = match.country;
    if (match.owned_by) ownedByElem.value = match.owned_by;
  }
}

// Fetch Styles Dropdown
async function fetchStyles() {
  try {
    const res = await fetch('/api/styles');
    const styles = await res.json();
    styles.forEach(style => {
      const option = document.createElement('option');
      option.value = style;
      option.textContent = style;
      styleSelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to fetch beer styles:', err);
  }
}

// Fetch Beers
async function fetchBeers() {
  const searchVal = searchInput.value.trim();
  const styleVal = styleSelect.value;
  const sortVal = sortSelect.value;
  const [sortBy, order] = sortVal.split('-');

  const params = new URLSearchParams({
    page: currentPage,
    limit: limit,
    search: searchVal,
    style: styleVal,
    sortBy: sortBy || 'brewery_beer_name',
    order: order || 'asc'
  });

  try {
    beerGrid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">Loading beers...</div>';
    const res = await fetch(`/api/beers?${params.toString()}`);
    const result = await res.json();

    renderBeers(result.data);
    updatePaginationUI(result.pagination);
  } catch (err) {
    console.error('Error fetching beers:', err);
    beerGrid.innerHTML = '<div class="col-span-full text-center py-12 text-red-400">Failed to load beers.</div>';
  }
}

function handleSearch() {
  currentPage = 1;
  fetchBeers();
}

function renderBeers(beers) {
  if (!beers || beers.length === 0) {
    beerGrid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No beers found matching your criteria.</div>';
    return;
  }

  beerGrid.innerHTML = beers.map(beer => `
    <div 
      onclick="openBeerDetails(${beer.id})"
      class="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-amber-500/50 rounded-xl p-5 shadow-lg transition duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div class="flex justify-between items-start mb-2 gap-2">
          <span class="text-xs font-semibold px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
            ${beer.beer_number ? `#${beer.beer_number}` : 'N/A'}
          </span>
          ${beer.abv ? `<span class="text-xs text-gray-400">${beer.abv}% ABV</span>` : ''}
        </div>
        <h3 class="text-lg font-bold text-white mb-1 leading-tight">${beer.beer_name}</h3>
        <p class="text-sm font-medium text-amber-500/90 mb-3">${beer.brewery_name}</p>
      </div>
      <div class="pt-3 border-t border-gray-700/60 flex justify-between items-center text-xs text-gray-400">
        <span>${beer.beer_style || 'Unspecified Style'}</span>
        ${beer.rank ? `<span class="font-bold text-amber-400">★ ${beer.rank}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function updatePaginationUI(pagination) {
  const { totalItems, currentPage: page, totalPages } = pagination;
  resultsCount.textContent = `Showing ${totalItems.toLocaleString()} beers`;
  pageInfo.textContent = `Page ${page} of ${totalPages}`;
  currentPageLabel.textContent = page;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;
}

// Open Details Modal
async function openBeerDetails(id) {
  try {
    modalContent.innerHTML = '<div class="text-center py-8 text-gray-400">Loading details...</div>';
    beerModal.classList.remove('hidden');

    const res = await fetch(`/api/beers/${id}`);
    const beer = await res.json();

    modalContent.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-start">
          <div>
            <span class="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
              ${beer.beer_number ? `Beer #${beer.beer_number}` : 'No Entry ID'}
            </span>
            <h2 class="text-2xl font-bold text-white mt-2">${beer.beer_name}</h2>
            <p class="text-amber-500 font-medium">${beer.brewery_name}</p>
            ${beer.aka_beer_name ? `<p class="text-xs text-gray-400 italic">AKA: ${beer.aka_beer_name}</p>` : ''}
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 text-sm">
          <div><span class="block text-xs text-gray-400">Style</span><span class="font-semibold text-gray-200">${beer.beer_style || '—'}</span></div>
          <div><span class="block text-xs text-gray-400">ABV</span><span class="font-semibold text-gray-200">${beer.abv ? `${beer.abv}%` : '—'}</span></div>
          <div><span class="block text-xs text-gray-400">Rank</span><span class="font-semibold text-amber-400">${beer.rank ? `★ ${beer.rank}` : '—'}</span></div>
          <div><span class="block text-xs text-gray-400">IBU</span><span class="font-semibold text-gray-200">${beer.ibu || '—'}</span></div>
          <div><span class="block text-xs text-gray-400">SRM</span><span class="font-semibold text-gray-200">${beer.srm || '—'}</span></div>
          <div><span class="block text-xs text-gray-400">Location</span><span class="font-semibold text-gray-200">${beer.state ? `${beer.state}, ${beer.country || ''}` : (beer.country || '—')}</span></div>
          ${beer.owned_by ? `<div class="col-span-full"><span class="block text-xs text-gray-400">Owned By</span><span class="font-semibold text-gray-200">${beer.owned_by}</span></div>` : ''}
        </div>

        <div class="pt-4 border-t border-gray-700 flex justify-end gap-3">
          <button onclick='openEditModal(${JSON.stringify(beer).replace(/'/g, "&apos;")})' class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition">
            Edit Beer
          </button>
          <button onclick="deleteBeer(${beer.id}, '${beer.beer_name.replace(/'/g, "\\'")}')" class="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-2 rounded-lg font-medium transition">
            Delete Beer
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error fetching details:', err);
    modalContent.innerHTML = '<div class="text-center py-8 text-red-400">Failed to load beer details.</div>';
  }
}

// Submit Add Beer Form
async function handleAddBeerSubmit(e) {
  e.preventDefault();
  const formData = new FormData(addBeerForm);
  const beerData = Object.fromEntries(formData.entries());

  try {
    const res = await fetch('/api/beers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beerData)
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.error || 'Failed to save beer entry.', 'error');
      return;
    }

    addBeerForm.reset();
    addBeerModal.classList.add('hidden');
    showToast(`Successfully added "${result.beer_name}" as Beer #${result.beer_number}!`);
    
    fetchBreweries(); // Refresh breweries list with any newly added brewery
    currentPage = 1;
    fetchBeers();
  } catch (err) {
    console.error('Error adding beer:', err);
    showToast('Failed to save beer entry.', 'error');
  }
}

// Populate & Open Edit Modal
function openEditModal(beer) {
  beerModal.classList.add('hidden');
  
  document.getElementById('editBeerId').value = beer.id;
  document.getElementById('editBeerName').value = beer.beer_name || '';
  document.getElementById('editBreweryName').value = beer.brewery_name || '';
  document.getElementById('editBeerStyle').value = beer.beer_style || '';
  document.getElementById('editRank').value = beer.rank || '';
  document.getElementById('editAbv').value = beer.abv || '';
  document.getElementById('editIbu').value = beer.ibu || '';
  document.getElementById('editSrm').value = beer.srm || '';
  document.getElementById('editState').value = beer.state || '';
  document.getElementById('editCountry').value = beer.country || '';
  document.getElementById('editOwnedBy').value = beer.owned_by || '';
  document.getElementById('editAka').value = beer.aka_beer_name || '';

  editBeerModal.classList.remove('hidden');
}

// Submit Edit Form
async function handleEditBeerSubmit(e) {
  e.preventDefault();
  const formData = new FormData(editBeerForm);
  const beerData = Object.fromEntries(formData.entries());
  const id = beerData.id;

  try {
    const res = await fetch(`/api/beers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beerData)
    });

    const result = await res.json();

    if (!res.ok) {
      showToast(result.error || 'Failed to update beer entry.', 'error');
      return;
    }

    editBeerModal.classList.add('hidden');
    showToast(`Successfully updated "${result.beer_name}"!`);
    fetchBreweries();
    fetchBeers();
  } catch (err) {
    console.error('Error updating beer:', err);
    showToast('Failed to update beer entry.', 'error');
  }
}

// Delete Beer Function
async function deleteBeer(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

  try {
    const res = await fetch(`/api/beers/${id}`, { method: 'DELETE' });
    const result = await res.json();

    if (!res.ok) {
      showToast(result.error || 'Failed to delete beer.', 'error');
      return;
    }

    beerModal.classList.add('hidden');
    showToast(`Deleted "${name}" from your collection.`);
    fetchBeers();
  } catch (err) {
    console.error('Error deleting beer:', err);
    showToast('Failed to delete beer entry.', 'error');
  }
}
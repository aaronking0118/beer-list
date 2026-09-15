// State management
let currentPage = 1;
const limit = 18;

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

// Detail Modal Elements
const beerModal = document.getElementById('beerModal');
const closeModal = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

// Add Beer Modal Elements
const addBeerModal = document.getElementById('addBeerModal');
const openAddBeerModalBtn = document.getElementById('openAddBeerModal');
const closeAddModalBtn = document.getElementById('closeAddModal');
const addBeerForm = document.getElementById('addBeerForm');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  fetchStyles();
  fetchBeers();

  // Event Listeners for Filters
  searchBtn.addEventListener('click', handleSearch);
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  styleSelect.addEventListener('change', () => {
    currentPage = 1;
    fetchBeers();
  });

  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    fetchBeers();
  });

  // Pagination Controls
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchBeers();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    currentPage++;
    fetchBeers();
  });

  // Detail Modal Controls
  closeModal.addEventListener('click', () => {
    beerModal.classList.add('hidden');
  });

  beerModal.addEventListener('click', (e) => {
    if (e.target === beerModal) beerModal.classList.add('hidden');
  });

  // Add Beer Modal Controls
  if (openAddBeerModalBtn) {
    openAddBeerModalBtn.addEventListener('click', () => {
      addBeerModal.classList.remove('hidden');
    });
  }

  if (closeAddModalBtn) {
    closeAddModalBtn.addEventListener('click', () => {
      addBeerModal.classList.add('hidden');
    });
  }

  if (addBeerModal) {
    addBeerModal.addEventListener('click', (e) => {
      if (e.target === addBeerModal) addBeerModal.classList.add('hidden');
    });
  }

  // Add Beer Form Submission Handler
  if (addBeerForm) {
    addBeerForm.addEventListener('submit', handleAddBeerSubmit);
  }
});

// Fetch Unique Styles for Dropdown
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

// Fetch Paginated & Filtered Beers
async function fetchBeers() {
  const searchVal = searchInput.value.trim();
  const styleVal = styleSelect.value;
  const sortVal = sortSelect.value;
  
  // Parse sortBy and order from select value (e.g. "brewery_beer_name-asc")
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
    beerGrid.innerHTML = '<div class="col-span-full text-center py-12 text-red-400">Failed to load beers. Please try again later.</div>';
  }
}

function handleSearch() {
  currentPage = 1;
  fetchBeers();
}

// Render Card Grid
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

// Update Pagination Labels & Controls
function updatePaginationUI(pagination) {
  const { totalItems, currentPage: page, totalPages } = pagination;
  
  resultsCount.textContent = `Showing ${totalItems.toLocaleString()} beers`;
  pageInfo.textContent = `Page ${page} of ${totalPages}`;
  currentPageLabel.textContent = page;

  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;
}

// Open Details Modal for Selected Beer
async function openBeerDetails(id) {
  try {
    modalContent.innerHTML = '<div class="text-center py-8 text-gray-400">Loading details...</div>';
    beerModal.classList.remove('hidden');

    const res = await fetch(`/api/beers/${id}`);
    const beer = await res.json();

    modalContent.innerHTML = `
      <div class="space-y-4">
        <div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
            ${beer.beer_number ? `Beer #${beer.beer_number}` : 'No Entry ID'}
          </span>
          <h2 class="text-2xl font-bold text-white mt-2">${beer.beer_name}</h2>
          <p class="text-amber-500 font-medium">${beer.brewery_name}</p>
          ${beer.aka_beer_name ? `<p class="text-xs text-gray-400 italic">AKA: ${beer.aka_beer_name}</p>` : ''}
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 text-sm">
          <div>
            <span class="block text-xs text-gray-400">Style</span>
            <span class="font-semibold text-gray-200">${beer.beer_style || '—'}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-400">ABV</span>
            <span class="font-semibold text-gray-200">${beer.abv ? `${beer.abv}%` : '—'}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-400">Rank</span>
            <span class="font-semibold text-amber-400">${beer.rank ? `★ ${beer.rank}` : '—'}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-400">IBU</span>
            <span class="font-semibold text-gray-200">${beer.ibu || '—'}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-400">SRM</span>
            <span class="font-semibold text-gray-200">${beer.srm || '—'}</span>
          </div>
          <div>
            <span class="block text-xs text-gray-400">Location</span>
            <span class="font-semibold text-gray-200">${beer.state ? `${beer.state}, ${beer.country || ''}` : (beer.country || '—')}</span>
          </div>
        </div>

        ${beer.owned_by ? `
          <div class="text-xs text-gray-400">
            <strong class="text-gray-300">Parent/Owner:</strong> ${beer.owned_by}
          </div>
        ` : ''}

        ${beer.collaborators ? `
          <div class="text-xs text-gray-400">
            <strong class="text-gray-300">Collaborators:</strong> ${beer.collaborators}
          </div>
        ` : ''}
      </div>
    `;
  } catch (err) {
    console.error('Error fetching beer details:', err);
    modalContent.innerHTML = '<div class="text-center py-8 text-red-400">Failed to load beer details.</div>';
  }
}

// Submit New Beer Form
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

    if (!res.ok) throw new Error('Failed to post beer entry.');

    addBeerForm.reset();
    addBeerModal.classList.add('hidden');
    
    // Refresh to page 1 to highlight updated list
    currentPage = 1;
    fetchBeers();
  } catch (err) {
    console.error('Error adding beer entry:', err);
    alert('Failed to save beer. Please verify all required inputs.');
  }
}
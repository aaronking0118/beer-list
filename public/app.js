let currentPage = 1;
const limit = 18;
let currentBeers = [];

const beerGrid = document.getElementById('beerGrid');
const searchInput = document.getElementById('searchInput');
const styleSelect = document.getElementById('styleSelect');
const sortSelect = document.getElementById('sortSelect');
const searchBtn = document.getElementById('searchBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageLabel = document.getElementById('currentPageLabel');
const resultsCount = document.getElementById('resultsCount');
const pageInfo = document.getElementById('pageInfo');

const beerModal = document.getElementById('beerModal');
const closeModalBtn = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');

async function loadStyles() {
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
    console.error('Failed to load styles dropdown:', err);
  }
}

async function fetchBeers(page = 1, search = '', style = '') {
  beerGrid.innerHTML = `
    <div class="col-span-full text-center py-12 text-gray-400">
      Fetching beers from database...
    </div>
  `;

  const [sortBy, order] = sortSelect.value.split('-');

  try {
    const url = `/api/beers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&style=${encodeURIComponent(style)}&sortBy=${sortBy}&order=${order}`;
    const res = await fetch(url);
    const result = await res.json();

    currentBeers = result.data;
    renderBeers(currentBeers);
    updatePagination(result.pagination);
  } catch (err) {
    console.error('Failed to fetch beers:', err);
    beerGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-400">
        Error loading beers. Please try again.
      </div>
    `;
  }
}

function renderBeers(beers) {
  if (!beers || beers.length === 0) {
    beerGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-gray-400">
        No beers found matching your query.
      </div>
    `;
    return;
  }

  beerGrid.innerHTML = beers.map(beer => {
    const locationParts = [beer.state, beer.country].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(', ') : null;

    const formattedRank = beer.rank !== null && beer.rank !== undefined 
      ? parseFloat(beer.rank).toFixed(1) 
      : null;

    return `
      <div 
        onclick="openBeerModal(${beer.id})"
        class="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-amber-500 hover:scale-[1.01] transition cursor-pointer flex flex-col justify-between shadow-lg relative group"
      >
        <div>
          <div class="flex justify-between items-start mb-2 gap-2">
            <div class="flex items-center gap-2">
              ${beer.beer_number ? `<span class="text-xs bg-gray-700 text-amber-400 font-bold px-2 py-0.5 rounded-md border border-gray-600">#${beer.beer_number}</span>` : ''}
              <h2 class="text-xl font-bold text-white leading-tight group-hover:text-amber-400 transition">${beer.beer_name || 'Unnamed Beer'}</h2>
            </div>
            ${beer.abv ? `<span class="text-xs bg-amber-500/20 text-amber-400 font-semibold px-2 py-1 rounded-md border border-amber-500/30 whitespace-nowrap">${beer.abv}% ABV</span>` : ''}
          </div>
          
          <p class="text-amber-500 font-medium text-sm mb-2">${beer.brewery_name || 'Unknown Brewery'}</p>
          
          <div class="flex flex-wrap gap-2 mb-3">
            ${beer.beer_style ? `<span class="bg-gray-700 text-gray-300 text-xs px-2.5 py-0.5 rounded-full">${beer.beer_style}</span>` : ''}
            ${locationStr ? `<span class="bg-gray-700/60 text-gray-400 text-xs px-2.5 py-0.5 rounded-full">📍 ${locationStr}</span>` : ''}
          </div>
        </div>

        ${formattedRank !== null ? `
          <div class="mt-4 pt-3 border-t border-gray-700/60 text-xs text-gray-400 flex justify-between items-center">
            <span>Rank</span>
            <span class="font-bold text-amber-400 text-sm">⭐ ${formattedRank}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function openBeerModal(id) {
  const beer = currentBeers.find(b => b.id === id);
  if (!beer) return;

  const locationParts = [beer.state, beer.country].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown';
  const formattedRank = beer.rank !== null && beer.rank !== undefined ? parseFloat(beer.rank).toFixed(1) : 'N/A';
  
  // Format consumption date if available
  let formattedDate = 'N/A';
  if (beer.consumption_date) {
    formattedDate = new Date(beer.consumption_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  modalContent.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      ${beer.beer_number ? `<span class="text-xs bg-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">Beer #${beer.beer_number}</span>` : ''}
      ${beer.beer_style ? `<span class="bg-gray-700 text-gray-300 text-xs px-2.5 py-0.5 rounded-full">${beer.beer_style}</span>` : ''}
    </div>

    <h2 class="text-3xl font-extrabold text-white mb-1">${beer.beer_name || 'Unnamed Beer'}</h2>
    <p class="text-amber-500 font-semibold text-lg mb-4">${beer.brewery_name || 'Unknown Brewery'}</p>

    ${beer.aka_beer_name ? `
      <p class="text-xs text-gray-400 mb-4 bg-gray-700/40 p-2 rounded-lg border border-gray-700">
        <strong class="text-gray-300">AKA:</strong> ${beer.aka_beer_name}
      </p>
    ` : ''}

    <!-- Primary Metrics Grid -->
    <div class="grid grid-cols-3 gap-3 mb-6 bg-gray-900/60 p-4 rounded-xl border border-gray-700/50">
      <div class="text-center">
        <span class="block text-xs text-gray-400 uppercase tracking-wider mb-1">ABV</span>
        <span class="text-lg font-bold text-amber-400">${beer.abv ? beer.abv + '%' : 'N/A'}</span>
      </div>
      <div class="text-center border-x border-gray-700/60">
        <span class="block text-xs text-gray-400 uppercase tracking-wider mb-1">IBU</span>
        <span class="text-lg font-bold text-white">${beer.ibu ?? 'N/A'}</span>
      </div>
      <div class="text-center">
        <span class="block text-xs text-gray-400 uppercase tracking-wider mb-1">SRM</span>
        <span class="text-lg font-bold text-white">${beer.srm ?? 'N/A'}</span>
      </div>
    </div>

    <!-- Additional Details -->
    <div class="space-y-3 text-sm text-gray-300">
      <div class="flex justify-between border-b border-gray-700/60 pb-2">
        <span class="text-gray-400">Rank Score:</span>
        <span class="font-bold text-amber-400">⭐ ${formattedRank}</span>
      </div>
      <div class="flex justify-between border-b border-gray-700/60 pb-2">
        <span class="text-gray-400">Location:</span>
        <span class="font-medium text-white">${locationStr}</span>
      </div>
      <div class="flex justify-between border-b border-gray-700/60 pb-2">
        <span class="text-gray-400">Parent Company:</span>
        <span class="font-medium text-white">${beer.owned_by || 'Independent / Unspecified'}</span>
      </div>
      ${beer.collaborators ? `
        <div class="flex justify-between border-b border-gray-700/60 pb-2">
          <span class="text-gray-400">Collaborators:</span>
          <span class="font-medium text-white">${beer.collaborators}</span>
        </div>
      ` : ''}
      ${beer.location ? `
        <div class="flex justify-between border-b border-gray-700/60 pb-2">
          <span class="text-gray-400">Logged At:</span>
          <span class="font-medium text-white">${beer.location}</span>
        </div>
      ` : ''}
      <div class="flex justify-between pt-1">
        <span class="text-gray-400">Log Date:</span>
        <span class="font-medium text-white">${formattedDate}</span>
      </div>
    </div>
  `;

  beerModal.classList.remove('hidden');
}

function closeModal() {
  beerModal.classList.add('hidden');
}

closeModalBtn.addEventListener('click', closeModal);

beerModal.addEventListener('click', (e) => {
  if (e.target === beerModal) {
    closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !beerModal.classList.contains('hidden')) {
    closeModal();
  }
});

function updatePagination(pagination) {
  currentPage = pagination.currentPage;
  currentPageLabel.textContent = currentPage;
  pageInfo.textContent = `Page ${currentPage} of ${pagination.totalPages || 1}`;
  resultsCount.textContent = `Showing ${pagination.totalItems.toLocaleString()} total beers`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= pagination.totalPages;
}

searchBtn.addEventListener('click', () => {
  currentPage = 1;
  fetchBeers(currentPage, searchInput.value, styleSelect.value);
});

styleSelect.addEventListener('change', () => {
  currentPage = 1;
  fetchBeers(currentPage, searchInput.value, styleSelect.value);
});

sortSelect.addEventListener('change', () => {
  currentPage = 1;
  fetchBeers(currentPage, searchInput.value, styleSelect.value);
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    currentPage = 1;
    fetchBeers(currentPage, searchInput.value, styleSelect.value);
  }
});

prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    fetchBeers(currentPage - 1, searchInput.value, styleSelect.value);
  }
});

nextPageBtn.addEventListener('click', () => {
  fetchBeers(currentPage + 1, searchInput.value, styleSelect.value);
});

loadStyles();
fetchBeers();
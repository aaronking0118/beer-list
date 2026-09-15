let currentPage = 1;
const limit = 18;

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

    renderBeers(result.data);
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
    // Format location string using split country & state columns
    const locationParts = [beer.state, beer.country].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(', ') : null;

    // Format rank to 1 decimal place if numeric
    const formattedRank = beer.rank !== null && beer.rank !== undefined 
      ? parseFloat(beer.rank).toFixed(1) 
      : null;

    return `
      <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between shadow-lg relative">
        <div>
          <div class="flex justify-between items-start mb-2 gap-2">
            <div class="flex items-center gap-2">
              ${beer.beer_number ? `<span class="text-xs bg-gray-700 text-amber-400 font-bold px-2 py-0.5 rounded-md border border-gray-600">#${beer.beer_number}</span>` : ''}
              <h2 class="text-xl font-bold text-white leading-tight">${beer.beer_name || 'Unnamed Beer'}</h2>
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
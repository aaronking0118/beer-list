let currentPage = 1;
const limit = 18;

const beerGrid = document.getElementById('beerGrid');
const searchInput = document.getElementById('searchInput');
const styleSelect = document.getElementById('styleSelect');
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

  try {
    const url = `/api/beers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&style=${encodeURIComponent(style)}`;
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

  beerGrid.innerHTML = beers.map(beer => `
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between shadow-lg">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h2 class="text-xl font-bold text-white leading-tight">${beer.beer_name || 'Unnamed Beer'}</h2>
          ${beer.abv ? `<span class="text-xs bg-amber-500/20 text-amber-400 font-semibold px-2 py-1 rounded-md border border-amber-500/30">${beer.abv}% ABV</span>` : ''}
        </div>
        <p class="text-amber-500 font-medium text-sm mb-3">${beer.brewery_name || 'Unknown Brewery'}</p>
        ${beer.beer_style ? `<span class="inline-block bg-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full mb-3">${beer.beer_style}</span>` : ''}
      </div>
      ${beer.rating ? `<div class="mt-4 pt-3 border-t border-gray-700/60 text-xs text-gray-400 flex justify-between"><span>Rating</span><span class="font-bold text-amber-400">⭐ ${beer.rating}</span></div>` : ''}
    </div>
  `).join('');
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
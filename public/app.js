let beers = [];

async function fetchBeers() {
  try {
    const res = await fetch('/api/beers');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    beers = await res.json();
    populateStyleFilter();
    renderGrid();
  } catch (err) {
    console.error('Error fetching beers:', err);
    const grid = document.getElementById('beerGrid');
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2rem; color: #fc8181; background: #2d3748; border-radius: 8px; text-align: center;">
          <h3>Error loading beers</h3>
          <p>${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }
}

function renderGrid() {
  const grid = document.getElementById('beerGrid');
  if (!grid) return;

  try {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const selectedStyle = document.getElementById('styleFilter')?.value || '';
    const sortBy = document.getElementById('sortSelect')?.value || 'recent';

    let filtered = beers.filter(beer => {
      const name = (beer.beer_name || '').toLowerCase();
      const brewery = (beer.brewery_name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm) || brewery.includes(searchTerm);
      const matchesStyle = !selectedStyle || (beer.style || beer.beer_style) === selectedStyle;
      return matchesSearch && matchesStyle;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        const numA = Number(a.beer_number ?? a.id ?? 0);
        const numB = Number(b.beer_number ?? b.id ?? 0);
        return numB - numA;
      } else if (sortBy === 'rating-desc') {
        return (Number(b.rank) || 0) - (Number(a.rank) || 0);
      } else if (sortBy === 'rating-asc') {
        return (Number(a.rank) || 0) - (Number(b.rank) || 0);
      } else if (sortBy === 'name-asc') {
        return (a.beer_name || '').localeCompare(b.beer_name || '');
      } else if (sortBy === 'name-desc') {
        return (b.beer_name || '').localeCompare(a.beer_name || '');
      }
      return 0;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: #a0aec0;">
          <p style="font-size: 1.1rem;">No beers found matching your criteria.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(beer => createBeerCardHtml(beer)).join('');
  } catch (err) {
    console.error('Error rendering grid:', err);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; color: #fc8181; background: #2d3748; border-radius: 8px; text-align: center;">
        <h3>Error rendering grid</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}
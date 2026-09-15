// Renders a taller, elegant glassware graphic with a 0 0 24 36 viewBox so it spans both beer title and brewery name
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
    // Pint / Nonic
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

function createBeerCardHtml(beer) {
  const badgeNum = beer.beer_number ?? beer.id ?? '';
  const displayStyle = beer.style || beer.beer_style || 'N/A';
  const starDisplay = renderStarRating(beer.rank);
  const glasswareSvg = renderGlasswareSvg(beer);

  return `
    <div class="beer-card" onclick="openDetailModal(${beer.id})">
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
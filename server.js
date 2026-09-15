const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beer_db'
});

app.use(express.json());
app.use(express.static('public'));

const sanitizeStr = (val) => (val && String(val).trim() !== '' ? String(val).trim() : null);
const sanitizeNum = (val) => (val !== null && val !== undefined && val !== '' && !isNaN(val) ? Number(val) : null);
const sanitizeDate = (val) => (val && String(val).trim() !== '' ? val : null);

// GET all beers
app.get('/api/beers', async (req, res) => {
  try {
    const query = `
      SELECT *, 
        ROW_NUMBER() OVER (ORDER BY id ASC) AS computed_beer_number,
        beer_style AS style, 
        consumption_date AS date, 
        aka_beer_name AS aka 
      FROM beers 
      ORDER BY id DESC;
    `;
    const { rows } = await pool.query(query);

    const mappedRows = rows.map(r => ({
      ...r,
      beer_number: r.beer_number || r.computed_beer_number
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('GET /api/beers error:', err);
    res.status(500).json({ error: err.message || 'Error fetching beers' });
  }
});

// GET unique breweries list for autocompletion & auto-filling metadata
app.get('/api/breweries', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (LOWER(TRIM(brewery_name))) 
        brewery_name, state, country, owned_by 
      FROM beers 
      WHERE brewery_name IS NOT NULL AND TRIM(brewery_name) != '' 
      ORDER BY LOWER(TRIM(brewery_name)), id DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/breweries error:', err);
    res.status(500).json({ error: err.message || 'Error fetching breweries' });
  }
});

// POST Add new beer
app.post('/api/beers', async (req, res) => {
  const {
    beer_name, brewery_name, style, rank, abv,
    ibu, srm, state, country, owned_by, date, location
  } = req.body || {};

  if (!beer_name || !brewery_name) {
    return res.status(400).json({ error: 'Beer Name and Brewery Name are required.' });
  }

  const query = `
    INSERT INTO beers (
      beer_name, brewery_name, beer_style, rank, abv,
      ibu, srm, state, country, owned_by, consumption_date, location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *, beer_style AS style, consumption_date AS date, aka_beer_name AS aka;
  `;

  const values = [
    sanitizeStr(beer_name),
    sanitizeStr(brewery_name),
    sanitizeStr(style),
    sanitizeNum(rank),
    sanitizeNum(abv),
    sanitizeNum(ibu),
    sanitizeNum(srm),
    sanitizeStr(state),
    sanitizeStr(country),
    sanitizeStr(owned_by),
    sanitizeDate(date),
    sanitizeStr(location)
  ];

  try {
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/beers error:', err);
    res.status(500).json({ error: err.message || 'Database error occurred.' });
  }
});

// PUT Edit existing beer
app.put('/api/beers/:id', async (req, res) => {
  const { id } = req.params;
  const {
    beer_name, brewery_name, style, rank, abv,
    ibu, srm, state, country, owned_by, date, location, aka
  } = req.body || {};

  if (!beer_name || !brewery_name) {
    return res.status(400).json({ error: 'Beer Name and Brewery Name are required.' });
  }

  const query = `
    UPDATE beers SET 
      beer_name = $1,
      brewery_name = $2,
      beer_style = $3,
      rank = $4,
      abv = $5,
      ibu = $6,
      srm = $7,
      state = $8,
      country = $9,
      owned_by = $10,
      consumption_date = $11,
      location = $12,
      aka_beer_name = $13
    WHERE id = $14
    RETURNING *, beer_style AS style, consumption_date AS date, aka_beer_name AS aka;
  `;

  const values = [
    sanitizeStr(beer_name),
    sanitizeStr(brewery_name),
    sanitizeStr(style),
    sanitizeNum(rank),
    sanitizeNum(abv),
    sanitizeNum(ibu),
    sanitizeNum(srm),
    sanitizeStr(state),
    sanitizeStr(country),
    sanitizeStr(owned_by),
    sanitizeDate(date),
    sanitizeStr(location),
    sanitizeStr(aka),
    id
  ];

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Beer not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(`PUT /api/beers/${id} error:`, err);
    res.status(500).json({ error: err.message || 'Database error occurred.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
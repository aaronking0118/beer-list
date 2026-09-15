const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beer_db'
});

app.use(express.json());
app.use(express.static('public'));

// GET all beers
app.get('/api/beers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM beers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET unique brewery list for auto-suggestions
app.get('/api/breweries', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (LOWER(TRIM(brewery_name))) 
        brewery_name, state, country, owned_by 
      FROM beers 
      WHERE brewery_name IS NOT NULL AND brewery_name != '' 
      ORDER BY LOWER(TRIM(brewery_name));
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Add new beer (11 fields)
app.post('/api/beers', async (req, res) => {
  const {
    beer_name, brewery_name, style, rank, abv,
    ibu, srm, state, country, date, location
  } = req.body;

  const query = `
    INSERT INTO beers (
      beer_name, brewery_name, style, rank, abv,
      ibu, srm, state, country, date, location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
  `;

  const values = [
    beer_name, brewery_name, style || null, rank || null, abv || null,
    ibu || null, srm || null, state || null, country || null, date || null, location || null
  ];

  try {
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Edit existing beer (14 fields)
app.put('/api/beers/:id', async (req, res) => {
  const { id } = req.params;
  const {
    beer_name, brewery_name, style, rank, abv,
    ibu, srm, state, country, owned_by, date,
    location, aka, collaborators
  } = req.body;

  const query = `
    UPDATE beers SET 
      beer_name = $1,
      brewery_name = $2,
      style = $3,
      rank = $4,
      abv = $5,
      ibu = $6,
      srm = $7,
      state = $8,
      country = $9,
      owned_by = $10,
      date = $11,
      location = $12,
      aka = $13,
      collaborators = $14
    WHERE id = $15
    RETURNING *;
  `;

  const values = [
    beer_name, brewery_name, style || null, rank || null, abv || null,
    ibu || null, srm || null, state || null, country || null, owned_by || null,
    date || null, location || null, aka || null, collaborators || null, id
  ];

  try {
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Beer entry not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
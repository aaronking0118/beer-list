require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get Unique Beer Styles Dropdown Options
app.get('/api/styles', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT beer_style FROM beers WHERE beer_style IS NOT NULL AND TRIM(beer_style) != '' ORDER BY beer_style ASC LIMIT 100"
    );
    
    let styles = result.rows.map(row => row.beer_style).filter(Boolean);

    // Fallback default styles if database has no records yet
    if (styles.length === 0) {
      styles = [
        "Lager", "Pilsner", "IPA", "India Pale Ale", "Stout", 
        "Porter", "Ale", "Pale Ale", "Wheat Beer", "Radler", 
        "Sour", "Saison", "Amber Ale"
      ];
    }

    res.json(styles);
  } catch (err) {
    console.error('Error fetching styles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Beers (Supports Pagination, Search, Style Filter, & Multi-Column Sorting)
app.get('/api/beers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const style = req.query.style || '';
    const sortBy = req.query.sortBy || 'brewery_beer_name';
    const order = (req.query.order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Map allowed sorting keys to SQL ORDER BY clauses
    let sortClause = `brewery_name ${order}, beer_name ${order}`;

    if (sortBy === 'beer_number') {
      sortClause = `beer_number ${order} NULLS LAST`;
    } else if (sortBy === 'rank') {
      sortClause = `rank ${order} NULLS LAST`;
    } else if (sortBy === 'abv') {
      sortClause = `abv ${order} NULLS LAST`;
    } else if (sortBy === 'beer_name') {
      sortClause = `beer_name ${order}`;
    } else if (sortBy === 'brewery_beer_name') {
      sortClause = `brewery_name ${order}, beer_name ${order}`;
    }

    // Build WHERE clause dynamic parameters
    let whereClauses = [];
    let params = [];
    let paramIdx = 1;

    if (search) {
      whereClauses.push(`(beer_name ILIKE $${paramIdx} OR brewery_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (style) {
      whereClauses.push(`beer_style ILIKE $${paramIdx}`);
      params.push(`%${style}%`);
      paramIdx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Results for Pagination Metadata
    const countQuery = `SELECT COUNT(*) FROM beers ${whereSql}`;
    const countResult = await db.query(countQuery, params);
    const totalBeers = parseInt(countResult.rows[0].count, 10);

    // Fetch Paginated & Sorted Dataset
    const dataQuery = `
      SELECT * FROM beers 
      ${whereSql} 
      ORDER BY ${sortClause}, id ASC 
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    const dataResult = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      data: dataResult.rows,
      pagination: {
        totalItems: totalBeers,
        currentPage: page,
        totalPages: Math.ceil(totalBeers / limit) || 1,
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error executing beers query:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Single Beer Details by ID
app.get('/api/beers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM beers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching beer by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a New Beer Entry (Always auto-assigns next sequential beer_number)
app.post('/api/beers', async (req, res) => {
  try {
    const {
      beer_name,
      brewery_name,
      aka_beer_name,
      beer_style,
      abv,
      ibu,
      srm,
      country,
      state,
      owned_by,
      collaborators,
      rank,
      consumption_date,
      location
    } = req.body;

    if (!beer_name || !brewery_name) {
      return res.status(400).json({ error: 'Beer name and brewery name are required.' });
    }

    // Always calculate MAX(beer_number) + 1 sequentially
    const maxNumResult = await db.query('SELECT MAX(beer_number) AS max_num FROM beers');
    const maxNum = maxNumResult.rows[0].max_num;
    const nextBeerNumber = maxNum ? parseInt(maxNum, 10) + 1 : 1;

    const query = `
      INSERT INTO beers (
        beer_name, brewery_name, aka_beer_name, beer_style, abv, ibu, srm,
        country, state, owned_by, collaborators, beer_number, rank,
        consumption_date, location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const values = [
      beer_name,
      brewery_name,
      aka_beer_name || null,
      beer_style || null,
      abv && abv.toString().trim() !== '' ? parseFloat(abv) : null,
      ibu && ibu.toString().trim() !== '' ? parseInt(ibu, 10) : null,
      srm && srm.toString().trim() !== '' ? parseInt(srm, 10) : null,
      country || null,
      state || null,
      owned_by || null,
      collaborators || null,
      nextBeerNumber,
      rank && rank.toString().trim() !== '' ? parseFloat(rank) : null,
      consumption_date || null,
      location || null
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating new beer:', err);
    res.status(500).json({ error: 'Failed to create beer entry.' });
  }
});

// Update an Existing Beer Entry by ID
app.put('/api/beers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { beer_number } = req.body;

    let parsedBeerNumber = (beer_number !== undefined && beer_number !== null && beer_number.toString().trim() !== '') 
      ? parseInt(beer_number, 10) 
      : null;

    if (!parsedBeerNumber || isNaN(parsedBeerNumber)) {
      const maxNumResult = await db.query('SELECT MAX(beer_number) AS max_num FROM beers');
      const maxNum = maxNumResult.rows[0].max_num;
      parsedBeerNumber = maxNum ? parseInt(maxNum, 10) + 1 : 1;
    }

    const query = `
      UPDATE beers 
      SET beer_number = $1 
      WHERE id = $2 
      RETURNING *;
    `;

    const result = await db.query(query, [parsedBeerNumber, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beer not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating beer number:', err);
    res.status(500).json({ error: 'Failed to update beer entry.' });
  }
});

// Single Page App Fallback - compatible with path-to-regexp v8 / Express 5 syntax
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 2. Get All Beers (with pagination, search, and style filtering)
// Example: /api/beers?search=IPA&page=1&limit=20
app.get('/api/beers', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const style = req.query.style || '';

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

    // Fetch total count for pagination metadata
    const countQuery = `SELECT COUNT(*) FROM beers ${whereSql}`;
    const countResult = await db.query(countQuery, params);
    const totalBeers = parseInt(countResult.rows[0].count);

    // Fetch paginated results
    const dataQuery = `
      SELECT * FROM beers 
      ${whereSql} 
      ORDER BY id ASC 
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    const dataResult = await db.query(dataQuery, [...params, limit, offset]);

    res.json({
      data: dataResult.rows,
      pagination: {
        totalItems: totalBeers,
        currentPage: page,
        totalPages: Math.ceil(totalBeers / limit),
        pageSize: limit
      }
    });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get Single Beer by ID
app.get('/api/beers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM beers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beer not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching beer', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
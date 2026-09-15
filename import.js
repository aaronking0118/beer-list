require('dotenv').config();

const fs = require('fs');
const { Pool } = require('pg');
const csv = require('csv-parser');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to safely parse numbers
const parseNum = (val, parseFn) => {
  if (!val || typeof val !== 'string' || val.trim() === '') return null;
  const parsed = parseFn(val);
  return isNaN(parsed) ? null : parsed;
};

// Helper function to parse strict dates or convert single years/ranges safely
const parseDate = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '') return null;
  const cleaned = val.trim();

  // If it's a 4-digit year (e.g. "2003"), convert to "2003-01-01"
  if (/^\d{4}$/.test(cleaned)) {
    return `${cleaned}-01-01`;
  }

  // Validate standard date strings
  const parsedTimestamp = Date.parse(cleaned);
  if (isNaN(parsedTimestamp)) return null;

  // Convert valid dates to ISO string YYYY-MM-DD
  return new Date(parsedTimestamp).toISOString().split('T')[0];
};

async function importCSV() {
  const client = await pool.connect();
  const rows = [];

  fs.createReadStream('beers.csv')
    .pipe(csv())
    .on('data', (data) => rows.push(data))
    .on('end', async () => {
      console.log(`Parsed ${rows.length} rows. Starting import...`);

      const queryText = `
        INSERT INTO beers (
          brewery_name, beer_name, aka_beer_name, beer_style, 
          abv, ibu, srm, rank, country_state, owned_by, 
          collaborators, consumption_date, location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
      `;

      try {
        await client.query('BEGIN');

        for (const row of rows) {
          const values = [
            row['brewery_name'] || null,
            row['beer_name'] || null,
            row['aka_beer_name'] || null,
            row['beer_style'] || null,
            parseNum(row['abv'], parseFloat),
            parseNum(row['ibu'], (v) => parseInt(v, 10)),
            parseNum(row['srm'], (v) => parseInt(v, 10)),
            parseNum(row['rank'], (v) => parseInt(v, 10)),
            row['country_state'] || null,
            row['owned_by'] || null,
            row['collaborators'] || null,
            parseDate(row['consumption_date']),
            row['location'] || null
          ];

          await client.query(queryText, values);
        }

        await client.query('COMMIT');
        console.log('Import successful!');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error importing data:', err);
      } finally {
        client.release();
        await pool.end();
      }
    });
}

importCSV();
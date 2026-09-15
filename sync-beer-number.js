require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('./db');

async function syncBeerNumbersCorrectly() {
  const csvFilePath = path.join(__dirname, 'beers.csv');
  const csvBeerNumbers = [];

  console.log('Reading CSV file...');

  // 1. Read all beer numbers from the CSV in exact row order
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const beerNum = row['beer_number'] || row['beer-number'] || row['beer number'];
      if (beerNum) {
        csvBeerNumbers.push(parseInt(beerNum, 10));
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${csvBeerNumbers.length} beer numbers from CSV.`);

      try {
        // 2. Fetch all database IDs in exact table order
        const dbResult = await db.query('SELECT id FROM beers ORDER BY id ASC');
        const dbRows = dbResult.rows;

        console.log(`Found ${dbRows.length} database records. Matching sequentially...`);

        // 3. Build updates pairing row-by-row: CSV Index 0 -> DB Row 0 (id 12)
        const BATCH_SIZE = 500;
        const totalToUpdate = Math.min(csvBeerNumbers.length, dbRows.length);

        for (let i = 0; i < totalToUpdate; i += BATCH_SIZE) {
          const valuesList = [];
          const queryParams = [];

          const sliceEnd = Math.min(i + BATCH_SIZE, totalToUpdate);
          let paramIdx = 1;

          for (let j = i; j < sliceEnd; j++) {
            const dbId = dbRows[j].id;
            const beerNum = csvBeerNumbers[j];

            valuesList.push(`($${paramIdx}::integer, $${paramIdx + 1}::integer)`);
            queryParams.push(dbId, beerNum);
            paramIdx += 2;
          }

          const query = `
            UPDATE beers AS b 
            SET beer_number = c.beer_num 
            FROM (VALUES ${valuesList.join(',')}) AS c(id, beer_num)
            WHERE b.id = c.id;
          `;

          await db.query(query, queryParams);
          console.log(`Updated records ${i + 1} to ${sliceEnd}`);
        }

        console.log('Success! All beer_numbers are now correctly aligned starting from 1.');
      } catch (err) {
        console.error('Error updating records:', err);
      }

      process.exit(0);
    });
}

syncBeerNumbersCorrectly();
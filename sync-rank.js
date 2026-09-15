require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('./db');

async function syncBeerRankById() {
  const csvFilePath = path.join(__dirname, 'beers.csv');
  const csvRanks = [];

  console.log('Reading CSV file...');

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const rankVal = row['rank'] || row['Rank'];
      // Parse as float for decimal support
      const parsedRank = rankVal && !isNaN(parseFloat(rankVal)) ? parseFloat(rankVal) : null;
      csvRanks.push(parsedRank);
    })
    .on('end', async () => {
      console.log(`Parsed ${csvRanks.length} rank values from CSV.`);

      try {
        const dbResult = await db.query('SELECT id FROM beers ORDER BY id ASC');
        const dbRows = dbResult.rows;

        console.log(`Found ${dbRows.length} database records. Updating sequentially...`);

        const BATCH_SIZE = 500;
        const totalToUpdate = Math.min(csvRanks.length, dbRows.length);

        for (let i = 0; i < totalToUpdate; i += BATCH_SIZE) {
          const valuesList = [];
          const queryParams = [];

          const sliceEnd = Math.min(i + BATCH_SIZE, totalToUpdate);
          let paramIdx = 1;

          for (let j = i; j < sliceEnd; j++) {
            const dbId = dbRows[j].id;
            const rankVal = csvRanks[j];

            valuesList.push(`($${paramIdx}::integer, $${paramIdx + 1}::numeric)`);
            queryParams.push(dbId, rankVal);
            paramIdx += 2;
          }

          const query = `
            UPDATE beers AS b 
            SET rank = c.rank_val 
            FROM (VALUES ${valuesList.join(',')}) AS c(id, rank_val)
            WHERE b.id = c.id;
          `;

          await db.query(query, queryParams);
          console.log(`Updated records ${i + 1} to ${sliceEnd}`);
        }

        console.log('Success! All rank decimal values are aligned and updated in Neon.');
      } catch (err) {
        console.error('Error updating rank values:', err);
      }

      process.exit(0);
    });
}

syncBeerRankById();
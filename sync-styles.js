require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Run `npm i csv-parser` if not already installed
const db = require('./db');

async function syncBeerStyles() {
  const csvFilePath = path.join(__dirname, 'beers.csv'); // Ensure beers.csv is in your root folder
  const updates = [];

  console.log('Reading CSV file...');

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      // Access the hyphenated CSV key 'beer-style' and map to beer_name or ID
      const style = row['beer-style'];
      const beerName = row['beer_name'] || row['name'];

      if (style && beerName) {
        updates.push({ beerName, style });
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${updates.length} records. Starting database update...`);

      let updatedCount = 0;
      for (const item of updates) {
        try {
          // Update beer_style in Postgres where beer_name matches
          const res = await db.query(
            'UPDATE beers SET beer_style = $1 WHERE beer_name = $2 AND beer_style IS NULL',
            [item.style, item.beerName]
          );
          updatedCount += res.rowCount;
        } catch (err) {
          console.error(`Failed to update ${item.beerName}:`, err.message);
        }
      }

      console.log(`Successfully updated ${updatedCount} records in Neon!`);
      process.exit(0);
    });
}

syncBeerStyles();
const { Pool } = require (' pg ') ;
const pool = new Pool({connectionString: process.env.DATABASE_URL});
async function queryDatabase() {
try {
const res = await pool.query('SELECT NOW()');
console .log("Current time from database: ", res.rows[0].now);
} catch (err){
console.error('Error executing query', err.stack);
} }
queryDatabase();
pool.end();

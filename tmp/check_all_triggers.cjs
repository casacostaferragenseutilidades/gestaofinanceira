const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkAllTriggers() {
    try {
        const res = await pool.query(`
      SELECT 
        trigger_name, 
        event_object_table, 
        event_object_schema
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' OR event_object_schema = 'public'
    `);
        console.log('All triggers:');
        console.log(JSON.stringify(res.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllTriggers();

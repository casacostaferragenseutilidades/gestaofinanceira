const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkTriggers() {
    try {
        const res = await pool.query(`
      SELECT 
        trigger_name, 
        event_manipulation, 
        event_object_table, 
        event_object_schema,
        action_statement 
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' OR event_object_table = 'users' 
    `);
        console.log('Triggers found on users table:');
        console.log(JSON.stringify(res.rows, null, 2));

        const res2 = await pool.query(`
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        l.lanname as language,
        p.prosrc as function_body
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE p.prosrc ILIKE '%users%' AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      LIMIT 10;
    `);
        console.log('\nPotential trigger functions:');
        console.log(JSON.stringify(res2.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTriggers();

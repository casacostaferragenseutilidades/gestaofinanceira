const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkBody() {
    try {
        const res = await pool.query("SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'");
        if (res.rows.length > 0) {
            console.log('Function body:');
            console.log(res.rows[0].prosrc);
        } else {
            console.log('Function not found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBody();

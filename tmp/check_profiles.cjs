const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
});

async function checkProfiles() {
    try {
        const res = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')");
        console.log('Does public.profiles exist?', res.rows[0].exists);

        if (res.rows[0].exists) {
            const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
            console.log('Columns in profiles:', JSON.stringify(columns.rows, null, 2));
        }

        const usersCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        console.log('Columns in users:', JSON.stringify(usersCols.rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkProfiles();

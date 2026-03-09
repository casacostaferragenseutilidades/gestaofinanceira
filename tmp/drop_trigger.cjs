const pg = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
});

async function fixTrigger() {
    try {
        console.log('Attempting to drop the broken trigger...');
        await pool.query("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;");
        console.log('✓ Trigger on_auth_user_created dropped.');

        console.log('Attempting to drop the broken function...');
        await pool.query("DROP FUNCTION IF EXISTS handle_new_user();");
        console.log('✓ Function handle_new_user dropped.');

        process.exit(0);
    } catch (err) {
        console.error('Error fixing trigger:', err.message);
        process.exit(1);
    }
}

fixTrigger();

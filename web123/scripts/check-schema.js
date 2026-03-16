require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function checkSchema() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        console.log('🔍 Checking stock_units table schema...');
        const res = await db.execute("PRAGMA table_info(stock_units)");
        console.table(res.rows);
    } catch (e) {
        console.error("Check failed:", e);
    }
}

checkSchema();

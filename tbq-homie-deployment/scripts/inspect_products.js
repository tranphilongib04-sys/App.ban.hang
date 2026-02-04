require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        const res = await client.execute("PRAGMA table_info(stock_units)");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}
run();

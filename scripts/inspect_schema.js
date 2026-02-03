
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log("Checking stock_units...");
    const stock = await client.execute("PRAGMA table_info(stock_units)");
    console.log(stock.rows);
}

main();

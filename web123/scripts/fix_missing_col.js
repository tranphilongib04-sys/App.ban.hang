require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('🛠 Fixing Schema: Adding product_name to order_lines...');
    try {
        await db.execute("ALTER TABLE order_lines ADD COLUMN product_name TEXT");
        console.log('✅ Added product_name column.');
    } catch (e) {
        console.log('ℹ️ Column likely exists or error:', e.message);
    }
}

main();

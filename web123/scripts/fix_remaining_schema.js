require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('🛠 Fixing Schema Round 2...');

    // Fix order_allocations: assigned_at
    try {
        await db.execute("ALTER TABLE order_allocations ADD COLUMN assigned_at TEXT");
        console.log('✅ Added assigned_at to order_allocations.');
    } catch (e) {
        if (e.message.includes('duplicate')) {
            console.log('OK: assigned_at exists.');
        } else {
            console.log('ℹ️ order_allocations check:', e.message);
        }
    }

    // Fix order_lines: product_name (in case it failed or I want to be idempotent)
    try {
        await db.execute("ALTER TABLE order_lines ADD COLUMN product_name TEXT");
        console.log('✅ Added product_name to order_lines.');
    } catch (e) { }

    // Verify payments table exists (new table, should be fine)
    try {
        await db.execute("SELECT count(*) FROM payments");
        console.log('✅ payments table exists.');
    } catch (e) {
        console.log('⚠️ payments table might be missing!');
    }

    console.log('Running quick explicit fix for stock_units just in case...');
    try {
        await db.execute("ALTER TABLE stock_units ADD COLUMN password_encrypted TEXT");
    } catch (e) { }
}

main();

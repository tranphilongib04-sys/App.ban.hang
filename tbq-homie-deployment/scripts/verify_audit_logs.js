require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    console.log('🔍 Checking Inventory Logs...');
    try {
        const result = await db.execute('SELECT * FROM inventory_logs ORDER BY id DESC LIMIT 5');
        if (result.rows.length === 0) {
            console.log('⚠️ No logs found yet. (Did you run a create-order test?)');
        } else {
            console.log('✅ Logs found:', result.rows.length);
            result.rows.forEach(row => {
                console.log(`[${row.created_at}] Action: ${row.action} | Actor: ${row.actor} | Order: ${row.order_id}`);
            });
        }
    } catch (e) {
        console.error('❌ Error checking logs:', e);
    }
}

main();

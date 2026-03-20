/**
 * Update ALL SKUs to delivery_type='owner_upgrade' (giao sau).
 * Reason: Store does not have business registration for instant delivery (giao liền).
 * All products will now be manually delivered via Zalo.
 *
 * Usage: node scripts/update-all-to-owner-upgrade.js
 * Requires: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN in .env or environment
 */

require('dotenv').config();
const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not set');
    return createClient({ url, authToken });
}

async function run() {
    const db = getDbClient();

    // 1. Show current state
    console.log('🔍 Current delivery_type distribution:\n');
    const before = await db.execute({
        sql: `SELECT delivery_type, COUNT(*) as cnt FROM skus GROUP BY delivery_type`
    });
    for (const row of before.rows) {
        console.log(`  ${row.delivery_type || 'NULL'}: ${row.cnt} SKU(s)`);
    }

    // 2. Show which SKUs are still 'auto'
    const autoSkus = await db.execute({
        sql: `SELECT sku_code, name, delivery_type FROM skus WHERE delivery_type = 'auto' ORDER BY sku_code`
    });
    if (autoSkus.rows.length === 0) {
        console.log('\n✅ All SKUs already have delivery_type != auto. No changes needed.');
        return;
    }

    console.log(`\n⚠️  Found ${autoSkus.rows.length} SKU(s) with delivery_type='auto':`);
    for (const row of autoSkus.rows) {
        console.log(`  ❌  ${row.sku_code.padEnd(30)} ${row.name}`);
    }

    // 3. Update all auto -> owner_upgrade
    console.log('\n🔄 Updating all auto -> owner_upgrade...');
    const result = await db.execute({
        sql: `UPDATE skus SET delivery_type = 'owner_upgrade' WHERE delivery_type = 'auto'`
    });
    console.log(`✅ Updated ${result.rowsAffected} SKU(s) to delivery_type='owner_upgrade'`);

    // 4. Verify
    console.log('\n📊 After update:');
    const after = await db.execute({
        sql: `SELECT delivery_type, COUNT(*) as cnt FROM skus GROUP BY delivery_type`
    });
    for (const row of after.rows) {
        console.log(`  ${row.delivery_type || 'NULL'}: ${row.cnt} SKU(s)`);
    }

    console.log('\n✅ Done! All SKUs are now owner_upgrade (giao sau).');
}

run().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });

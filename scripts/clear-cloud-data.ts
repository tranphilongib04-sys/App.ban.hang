/**
 * Script để xóa dữ liệu Turso Cloud Database
 * Chạy: npx tsx scripts/clear-cloud-data.ts
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
    process.exit(1);
}

const cloudClient = createClient({
    url,
    authToken,
});

async function main() {
    console.log('');
    console.log('🗑️  CLEARING TURSO CLOUD DATABASE');
    console.log('==================================');
    console.log('');
    console.log('Target: ' + url);
    console.log('');

    const tables = ['warranties', 'deliveries', 'inventory_items', 'subscriptions', 'customers'];

    for (const table of tables) {
        try {
            console.log(`Deleting all data from ${table}...`);
            await cloudClient.execute(`DELETE FROM ${table}`);
            console.log(`✅ ${table} cleared`);
        } catch (e: any) {
            console.log(`⚠️  Could not clear ${table}: ${e.message}`);
        }
    }

    console.log('');
    console.log('✅ Turso Cloud Database cleared!');
    console.log('');
}

main().catch(console.error);

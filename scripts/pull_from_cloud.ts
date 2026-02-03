import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import 'dotenv/config';

// 1. Setup Local DB Connection
const localDbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
console.log(`Reading from local DB: ${localDbPath}`);
const localDb = new Database(localDbPath);

// 2. Setup Cloud DB Connection
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Mising TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.");
    process.exit(1);
}

const cloudClient = createClient({
    url,
    authToken,
});

async function main() {
    console.log("🚀 Starting Cloud -> Local Sync...");
    console.log("   Source: " + url);

    async function migrateTable(tableName: string) {
        process.stdout.write(`\n2️⃣  Pulling [${tableName}] from Cloud... `);

        try {
            const result = await cloudClient.execute(`SELECT * FROM ${tableName}`);
            const rows = result.rows;

            if (rows.length === 0) {
                console.log("Skipped (Empty on Cloud)");
                return;
            }

            console.log(`Found ${rows.length} rows.`);

            let successCount = 0;
            const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');
            const cols = Object.keys(rows[0]).join(', ');

            const stmt = localDb.prepare(`INSERT OR REPLACE INTO ${tableName} (${cols}) VALUES (${placeholders})`);

            // Use transaction for speed and safety
            const runTransaction = localDb.transaction((rowsToInsert) => {
                for (const row of rowsToInsert) {
                    const values = Object.values(row);
                    stmt.run(values);
                    successCount++;
                }
            });

            try {
                runTransaction(rows);
            } catch (err: any) {
                console.error(`   ❌ Update failed: ${err.message}`);
            }

            console.log(` Done! (${successCount}/${rows.length})`);

        } catch (e: any) {
            console.log(`\n   ⚠️  Skipping ${tableName} (Cloud read error or Table missing): ` + e.message);
        }
    }

    await migrateTable("customers");
    await migrateTable("subscriptions");
    await migrateTable("inventory_items");
    await migrateTable("deliveries");
    await migrateTable("warranties");

    console.log("\n✨ SYNC COMPLETE!");
}

main().catch(console.error);

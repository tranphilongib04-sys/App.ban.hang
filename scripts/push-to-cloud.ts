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
    console.log("🚀 Starting Cloud Migration...");
    console.log("   Target: " + url);

    // --- Step A: Create Tables (Schema) ---
    console.log("\n1️⃣  Creating Tables on Cloud...");

    // We reuse the same schema definition from index.ts SQL
    const schemaSql = `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY, -- Keep original IDs
      name TEXT NOT NULL,
      source TEXT,
      contact TEXT,
      tags TEXT,
      note TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL,
      service TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      distribution TEXT,
      revenue REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      renewal_status TEXT,
      payment_status TEXT,
      last_contacted_at TEXT,
      contact_count INTEGER DEFAULT 0,
      note TEXT,
      account_info TEXT,
      category TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY,
      service TEXT NOT NULL,
      distribution TEXT,
      secret_payload TEXT NOT NULL,
      secret_masked TEXT NOT NULL,
      status TEXT,
      import_batch TEXT,
      cost REAL DEFAULT 0,
      note TEXT,
      category TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY,
      subscription_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      delivered_at TEXT NOT NULL,
      delivery_note TEXT
    );

    CREATE TABLE IF NOT EXISTS warranties (
      id INTEGER PRIMARY KEY,
      subscription_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      issue_description TEXT,
      replacement_inventory_id INTEGER,
      resolved_date TEXT,
      cost REAL DEFAULT 0,
      warranty_status TEXT,
      note TEXT,
      created_at TEXT
    );
    `;

    // Split and execute schema commands
    // Simple splitting by ; might fail on triggers/procedures but ok for CREATE TABLE
    const commands = schemaSql.split(';').map(c => c.trim()).filter(c => c.length > 0);

    for (const cmd of commands) {
        try {
            await cloudClient.execute(cmd);
        } catch (e: any) {
            console.error("   ⚠️  Error creating table: " + e.message);
        }
    }
    console.log("   ✅ Tables created.");

    // --- Step B: Migrate Data ---

    // Helper to migrate a table
    async function migrateTable(tableName: string) {
        process.stdout.write(`\n2️⃣  Migrating [${tableName}]... `);

        try {
            const rows: any[] = localDb.prepare(`SELECT * FROM ${tableName}`).all();
            if (rows.length === 0) {
                console.log("Skipped (Empty)");
                return;
            }

            console.log(`Found ${rows.length} rows.`);

            let successCount = 0;
            // LibSQL HTTP stats are better with batched transactions but let's do simple row-by-row or small batches first to be safe
            // For stability, one by one is slow but reliably debuggable.

            for (const row of rows) {
                const keys = Object.keys(row);
                const cols = keys.map(k => k).join(', ');
                const placeholders = keys.map(() => '?').join(', ');
                const values = keys.map(k => row[k]);

                try {
                    await cloudClient.execute({
                        sql: `INSERT OR REPLACE INTO ${tableName} (${cols}) VALUES (${placeholders})`,
                        args: values
                    });
                    successCount++;
                } catch (e: any) {
                    console.error(`Failed row ${row.id}: ${e.message}`);
                    // Stop after a few errors to avoid spamming
                    if (successCount === 0 && row.id < 50) process.exit(1);
                }

                if (successCount % 50 === 0) {
                    process.stdout.write('.');
                }
            }
            console.log(` Done! (${successCount}/${rows.length})`);

        } catch (e: any) {
            console.log(`\n   ⚠️  Skipping ${tableName} (Local doesn't exist?): ` + e.message);
        }
    }

    await migrateTable("customers");
    await migrateTable("subscriptions");
    await migrateTable("inventory_items");
    await migrateTable("deliveries");
    await migrateTable("warranties");

    console.log("\n✨ MIGRATION COMPLETE!");
    console.log("---------------------------------------------------");
    console.log("You can now verify the data on your Cloud Database.");
}

main().catch(console.error);

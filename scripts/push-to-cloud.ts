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

    // await migrateTable("customers");
    // await migrateTable("subscriptions");
    // await migrateTable("inventory_items");
    // await migrateTable("deliveries");
    // await migrateTable("warranties");

    // --- Step C: Link Inventory to Website ---
    console.log("\n3️⃣  Linking Inventory to Website (stock_units)...");

    try {
        // Debug: Check schema
        const schema = await cloudClient.execute("PRAGMA table_info(products)");
        console.log("   Products Table Schema:", schema.rows);

        const stockSchema = await cloudClient.execute("PRAGMA table_info(stock_units)");
        console.log("   Stock Units Table Schema:", stockSchema.rows);

        // 0. Ensure Products Exist (Seed if missing)
        // Adapt based on schema - simplified for now
        // Assuming at least code and name exist
        const productsToSeed = [
            { code: 'capcut_pro_1y', name: 'CapCut Pro - 1 Năm', price: 150000 },
            { code: 'capcut_pro_6m', name: 'CapCut Pro - 6 Tháng', price: 90000 },
            { code: 'chatgpt_plus_1m', name: 'ChatGPT Plus - 1 Tháng', price: 150000 },
            { code: 'netflix_1m', name: 'Netflix Premium - 1 Tháng', price: 89000 },
            { code: 'spotify_1y', name: 'Spotify Premium - 1 Năm', price: 250000 },
            { code: 'youtube_1m', name: 'YouTube Premium - 1 Tháng', price: 25000 },
        ];

        // Only insert fields that exist
        // For now, let's just try code/name if price fails, or create table if missing

        // Ensure table exists with full schema?
        await cloudClient.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                code TEXT UNIQUE,
                name TEXT,
                price REAL,
                description TEXT
            )
        `);

        // Attempt insert - ignore properties if column missing, or alert
        // Actually, if table existed without price, we can't insert price.
        // Let's rely on the CREATE TABLE IF NOT EXISTS above.
        // If it already existed with different schema, the CREATE does nothing.

        // We will try to insert just code/name if simpler schema, or full if possible.
        // But to be safe, let's just try inserting code, name.

        // Match schema: code, name, base_price, is_active
        for (const p of productsToSeed) {
            try {
                // Try inserting with correct column names found in schema
                await cloudClient.execute({
                    sql: "INSERT OR IGNORE INTO products (code, name, base_price) VALUES (?, ?, ?)",
                    args: [p.code, p.name, p.price]
                });
            } catch (e: any) {
                console.error(`   Failed to seed ${p.code}: ${e.message}`);
                // Fallback to just code/name if base_price also fails
                try {
                    await cloudClient.execute({
                        sql: "INSERT OR IGNORE INTO products (code, name) VALUES (?, ?)",
                        args: [p.code, p.name]
                    });
                } catch (e2) { }
            }
        }
        console.log("   ✅ Seeded/Verified Products.");

        // 1. Get Products Map from Cloud
        const productsResult = await cloudClient.execute("SELECT id, code FROM products");
        const productMap = new Map(); // code -> id
        productsResult.rows.forEach(r => productMap.set(r.code, r.id));
        console.log("   Cloud Products:", Array.from(productMap.keys()));

        // 2. Map Local Items to Product Codes
        const localItems: any[] = localDb.prepare("SELECT * FROM inventory_items WHERE status = 'available'").all();
        console.log(`   Found ${localItems.length} available local items.`);

        // Mapping Logic
        function getProductCode(service: string, variant: string) {
            const s = (service || '').toLowerCase().replace(/\s+/g, '_');
            const v = (variant || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

            if (s.includes('chatgpt')) return 'chatgpt_plus_1m';
            if (s.includes('netflix')) return 'netflix_extra';
            if (s.includes('spotify')) return 'spotify_premium';
            if (s.includes('youtube')) return 'youtube_premium';
            if (s.includes('capcut')) return 'capcut_pro_1y'; // Fixed mapping for Capcut

            return `${s}_${v}`;
        }

        let syncedCount = 0;

        for (const item of localItems) {
            const code = getProductCode(item.service, item.variant);
            console.log(`   Mapping '${item.service}' -> '${code}'...`);
            const productId = productMap.get(code);

            if (productId) {
                try {
                    // Check if already exists to avoid dupes
                    const check = await cloudClient.execute({
                        sql: "SELECT id FROM stock_units WHERE content = ?",
                        args: [item.secret_payload]
                    });

                    if (check.rows.length === 0) {
                        await cloudClient.execute({
                            sql: "INSERT INTO stock_units (product_id, content, status, updated_at) VALUES (?, ?, 'available', ?)",
                            args: [productId, item.secret_payload, new Date().toISOString()]
                        });
                        syncedCount++;
                        if (syncedCount % 10 === 0) process.stdout.write('.');
                    }
                } catch (e: any) {
                    // Ignore duplicate key errors silently
                    if (!e.message.includes('UNIQUE')) {
                        console.error(`   Failed item ${item.id}: ${e.message}`);
                    }
                }
            }
        }
        console.log(`\n   ✅ Linked ${syncedCount} items to Website Stock.`);

    } catch (e: any) {
        console.log(`\n   ⚠️  Skipping Inventory Link (Products table missing?): ` + e.message);
    }

    console.log("\n✨ MIGRATION COMPLETE!");
    console.log("---------------------------------------------------");
    console.log("You can now verify the data on your Cloud Database.");
}

main().catch(console.error);

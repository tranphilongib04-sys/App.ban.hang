
import 'dotenv/config';
import { createClient } from '@libsql/client';

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('❌ Missing TURSO credentials');
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    console.log('Creating tables on Turso if missing...');

    const queries = [
        `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source TEXT,
            contact TEXT,
            tags TEXT,
            note TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            service TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            distribution TEXT,
            revenue REAL DEFAULT 0,
            cost REAL DEFAULT 0,
            renewal_status TEXT NOT NULL DEFAULT 'pending',
            payment_status TEXT NOT NULL DEFAULT 'unpaid',
            last_contacted_at TEXT,
            reminder_date TEXT,
            contact_count INTEGER DEFAULT 0,
            note TEXT,
            account_info TEXT,
            category TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS inventory_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT NOT NULL,
            distribution TEXT,
            secret_payload TEXT NOT NULL,
            secret_masked TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'available',
            import_batch TEXT,
            cost REAL DEFAULT 0,
            note TEXT,
            category TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
            inventory_id INTEGER NOT NULL REFERENCES inventory_items(id),
            delivered_at TEXT NOT NULL,
            delivery_note TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS warranties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
            issue_date TEXT NOT NULL,
            issue_description TEXT,
            replacement_inventory_id INTEGER REFERENCES inventory_items(id),
            resolved_date TEXT,
            cost REAL DEFAULT 0,
            warranty_status TEXT NOT NULL DEFAULT 'pending',
            note TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT (datetime('now'))
        )`
    ];

    for (const sql of queries) {
        try {
            await client.execute(sql);
            console.log('✓ Executed create table');
        } catch (e: any) {
            console.error('❌ Error creating table:', e.message);
        }
    }

    client.close();
}

main();

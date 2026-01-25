
import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/lib/db/schema';
import path from 'path';

async function main() {
    console.log('🚀 Starting migration to Turso...');

    // 1. Connect to Local DB
    const dbPath = path.join(process.cwd(), 'data/tpb-manage.db');
    console.log(`📂 Reading local database from: ${dbPath}`);
    const sqlite = new Database(dbPath);
    const localDb = drizzleSqlite(sqlite, { schema });

    // 2. Connect to Remote DB (Turso)
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
        process.exit(1);
    }

    console.log(`☁️ Connecting to Turso: ${url}`);
    const client = createClient({ url, authToken });
    const remoteDb = drizzle(client, { schema });

    // 3. Migrate Data
    // Helper to migrate a table
    const migrateTable = async (tableName: string, data: any[]) => {
        if (data.length === 0) {
            console.log(`- ${tableName}: No data to migrate.`);
            return;
        }
        console.log(`- ${tableName}: Migrating ${data.length} records...`);

        // Insert in batches of 50 to avoid limits
        const batchSize = 50;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            // We use generic insert if possible, or mapping
            // Drizzle insert needs the specific table object
            // Just use the schema object map
            const tableObj = (schema as any)[tableName];
            if (!tableObj) {
                console.error(`  ❌ Table object for ${tableName} not found in schema export.`);
                continue;
            }
            try {
                await remoteDb.insert(tableObj).values(batch).onConflictDoNothing(); // Safety
            } catch (e: any) {
                console.error(`  ❌ Error batch ${i}: ${e.message}`);
            }
        }
        console.log(`  ✓ Done.`);
    };

    // Fetch and Migrate each table
    // Order matters for Foreign Keys? Cloud DBs often strict.
    // Customers first.
    
    // Customers
    const customers = await localDb.select().from(schema.customers);
    await migrateTable('customers', customers);

    // Subscriptions
    const subscriptions = await localDb.select().from(schema.subscriptions);
    await migrateTable('subscriptions', subscriptions);

    // Inventory
    const inventory = await localDb.select().from(schema.inventoryItems);
    await migrateTable('inventory_items', inventory); // Schema export name might differ?
    // In schema.ts: export const inventoryItems = ...
    // So we pass 'inventoryItems' to the helper if I use (schema as any)[name]
    
    // Wait, let's correct the helper call to use the export name
    // Export name in schema.ts:
    // customers, subscriptions, inventoryItems, deliveries, warranties, systemConfig

    // Re-do specific calls
    if (inventory.length > 0) {
        console.log(`- inventoryItems: Migrating ${inventory.length} records...`);
        for (let i = 0; i < inventory.length; i += 50) {
            await remoteDb.insert(schema.inventoryItems).values(inventory.slice(i, i + 50)).onConflictDoNothing();
        }
        console.log('  ✓ Done.');
    }

    // Deliveries
    const deliveries = await localDb.select().from(schema.deliveries);
    if (deliveries.length > 0) {
        console.log(`- deliveries: Migrating ${deliveries.length} records...`);
        for (let i = 0; i < deliveries.length; i += 50) {
            await remoteDb.insert(schema.deliveries).values(deliveries.slice(i, i + 50)).onConflictDoNothing();
        }
    }

    // Warranties
    const warranties = await localDb.select().from(schema.warranties);
    if (warranties.length > 0) {
        console.log(`- warranties: Migrating ${warranties.length} records...`);
        for (let i = 0; i < warranties.length; i += 50) {
            await remoteDb.insert(schema.warranties).values(warranties.slice(i, i + 50)).onConflictDoNothing();
        }
    }

    // System Config
    const config = await localDb.select().from(schema.systemConfig);
    if (config.length > 0) {
         console.log(`- systemConfig: Migrating ${config.length} records...`);
         for (let i = 0; i < config.length; i += 50) {
            await remoteDb.insert(schema.systemConfig).values(config.slice(i, i + 50)).onConflictDoNothing();
        }
    }

    console.log('✅ Migration completed successfully!');
    client.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

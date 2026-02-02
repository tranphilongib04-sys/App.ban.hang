
import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
const backupPath = path.join(process.cwd(), 'data', `backup_sqlite_${Date.now()}.json`);

console.log(`Reading from DB: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
    console.warn(`WARNING: File ${dbPath} does not exist.`);
}

// Use LibSQL Client with Replica Config (Local Read)
// We provide syncUrl/authToken so it treats it as a replica, but we DO NOT call sync()
const db = createClient({
    url: `file:${dbPath}`,
    syncUrl: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const tables = ['customers', 'subscriptions', 'inventory_items', 'deliveries', 'warranties'];
const backupData: Record<string, any[]> = {};

async function run() {
    console.log("Checking row counts...");
    for (const table of tables) {
        try {
            const rs = await db.execute(`SELECT * FROM ${table}`);
            backupData[table] = rs.rows;
            console.log(`Mapped ${table}: ${rs.rows.length} rows`);
        } catch (e: any) {
            console.warn(`Could not read ${table}: ${e.message}`);
        }
    }

    if (backupData['subscriptions'] && backupData['subscriptions'].length > 0) {
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);
    } else {
        console.error("❌ NO DATA FOUND in Local DB. Backup empty.");
    }
}

run();

/**
 * Add missing columns to discount_codes table
 */
const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envFile.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    let v = t.substring(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[t.substring(0, eq).trim()] = v;
}

const { createClient } = require('@libsql/client/web');
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

async function run() {
    const cols = [
        { name: 'owner_name', type: 'TEXT DEFAULT ""' },
        { name: 'owner_contact', type: 'TEXT DEFAULT ""' },
        { name: 'updated_at', type: 'TEXT' },
    ];

    for (const col of cols) {
        try {
            await db.execute(`ALTER TABLE discount_codes ADD COLUMN ${col.name} ${col.type}`);
            console.log('+ Added: ' + col.name);
        } catch (e) {
            if (e.message && e.message.includes('duplicate column')) {
                console.log('= Exists: ' + col.name);
            } else {
                console.log('? ' + col.name + ': ' + e.message);
            }
        }
    }

    // Verify
    const info = await db.execute("PRAGMA table_info(discount_codes)");
    console.log('\nColumns:');
    for (const r of info.rows) {
        console.log('  ' + r.name + ' (' + r.type + ')');
    }
}
run().catch(e => console.error(e));

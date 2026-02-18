/**
 * Update CapCut prices + CTV01 ctv_price in skus table
 *
 * New prices:
 *   capcut_7d:      7,000  → ctv: 5,000   (giảm 2k)
 *   capcut_14d:    15,000  → ctv: 10,000  (giảm 5k)
 *   capcut_1m:     30,000  → ctv: 20,000  (giảm 10k)
 *   capcut_6m:    160,000  → ctv: 145,000 (giảm 15k)
 *   capcut_pro_1y: 280,000 → ctv: 250,000 (giảm 30k)
 *
 * Run: node scripts/update-capcut-prices.js
 */

const path = require('path');
const fs = require('fs');
// Load .env manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const m = line.match(/^\s*([^#=]+?)\s*=\s*"?(.+?)"?\s*$/);
        if (m) process.env[m[1]] = m[2];
    }
}
const { createClient } = require('@libsql/client/web');

async function main() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    // 1. Ensure ctv_price column exists
    try {
        await db.execute(`ALTER TABLE skus ADD COLUMN ctv_price INTEGER`);
        console.log('Added ctv_price column');
    } catch (e) {
        console.log('ctv_price column already exists');
    }

    // 2. Update prices
    const updates = [
        { sku: 'capcut_7d',      price: 7000,   ctv: 5000   },
        { sku: 'capcut_14d',     price: 15000,  ctv: 10000  },
        { sku: 'capcut_1m',      price: 30000,  ctv: 20000  },
        { sku: 'capcut_6m',      price: 160000, ctv: 145000 },
        { sku: 'capcut_pro_1y',  price: 280000, ctv: 250000 },
    ];

    for (const u of updates) {
        const result = await db.execute({
            sql: `UPDATE skus SET price = ?, ctv_price = ? WHERE sku_code = ?`,
            args: [u.price, u.ctv, u.sku]
        });
        console.log(`${u.sku}: price=${u.price}, ctv_price=${u.ctv} (rows: ${result.rowsAffected})`);
    }

    // 3. Verify
    const check = await db.execute(`SELECT sku_code, name, price, ctv_price FROM skus WHERE sku_code LIKE 'capcut%' ORDER BY price`);
    console.log('\nVerification:');
    console.table(check.rows);
}

main().catch(err => { console.error(err); process.exit(1); });

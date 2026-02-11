/**
 * MIGRATION — Discount Codes for CTV (Collaborator/Affiliate)
 *
 * Adds:
 *   1. discount_codes table
 *   2. discount_code & discount_amount columns to orders table
 *   3. Seed initial CTV codes
 *
 * Run: node -e "require('./netlify/functions/migrate-discount-codes').migrate().then(()=>process.exit(0))"
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not configured');
    return createClient({ url, authToken });
}

async function run(db, sql, label, args = []) {
    try {
        await db.execute({ sql, args });
        console.log(`  ✓ ${label}`);
    } catch (err) {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate column')) {
            console.log(`  = ${label} (already exists)`);
        } else {
            console.error(`  ✗ ${label}: ${err.message}`);
            throw err;
        }
    }
}

async function migrate() {
    const db = getDbClient();
    console.log('migrate-discount-codes: starting...');

    // ──────────────────────────────────────────────
    // 1. discount_codes table
    // ──────────────────────────────────────────────
    await run(db, `
        CREATE TABLE IF NOT EXISTS discount_codes (
            id              TEXT PRIMARY KEY,
            code            TEXT NOT NULL UNIQUE,
            discount_amount INTEGER NOT NULL DEFAULT 10000,
            description     TEXT,
            owner_name      TEXT,
            owner_contact   TEXT,
            is_active       INTEGER DEFAULT 1,
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, 'discount_codes table');

    await run(db, `CREATE INDEX IF NOT EXISTS idx_discount_code ON discount_codes(code)`, 'idx_discount_code');

    // ──────────────────────────────────────────────
    // 2. Add discount columns to orders table
    // ──────────────────────────────────────────────
    await run(db, `ALTER TABLE orders ADD COLUMN discount_code TEXT`, 'orders.discount_code column');
    await run(db, `ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0`, 'orders.discount_amount column');
    await run(db, `ALTER TABLE discount_codes ADD COLUMN owner_name TEXT`, 'discount_codes.owner_name column');
    await run(db, `ALTER TABLE discount_codes ADD COLUMN owner_contact TEXT`, 'discount_codes.owner_contact column');

    // ──────────────────────────────────────────────
    // 3. Seed initial CTV discount codes
    // ──────────────────────────────────────────────
    const crypto = require('crypto');
    const initialCodes = [
        { code: 'CTV01', amount: 10000, description: 'Mã CTV giảm 10k' },
        { code: 'CTV02', amount: 10000, description: 'Mã CTV giảm 10k' },
        { code: 'CTV03', amount: 10000, description: 'Mã CTV giảm 10k' },
        { code: 'CTV04', amount: 10000, description: 'Mã CTV giảm 10k' },
        { code: 'CTV05', amount: 10000, description: 'Mã CTV giảm 10k' },
    ];

    for (const item of initialCodes) {
        const id = crypto.randomUUID();
        try {
            await db.execute({
                sql: `INSERT INTO discount_codes (id, code, discount_amount, description)
                      VALUES (?, ?, ?, ?)
                      ON CONFLICT(code) DO UPDATE SET discount_amount = excluded.discount_amount, description = excluded.description`,
                args: [id, item.code, item.amount, item.description]
            });
            console.log(`  + Seeded discount code: ${item.code} (-${item.amount}₫)`);
        } catch (e) {
            console.error(`  ! Failed to seed ${item.code}: ${e.message}`);
        }
    }

    console.log('migrate-discount-codes: done.');
}

if (require.main === module) {
    migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { migrate };

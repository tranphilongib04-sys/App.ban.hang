/**
 * MIGRATION V3 — Inventory System Re-architecture
 *
 * Adds:
 *   1. skus (Master Data)
 *   2. stock_items (Inventory Items)
 *   3. Seed data for skus
 *
 * Run: node -e "require('./netlify/functions/migrate-schema-v3').migrate().then(()=>process.exit(0))"
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
    console.log('migrate-schema-v3: starting…');

    // ──────────────────────────────────────────────
    // 1. skus (Master Data)
    // ──────────────────────────────────────────────
    await run(db, `
        CREATE TABLE IF NOT EXISTS skus (
            id            TEXT PRIMARY KEY,
            sku_code      TEXT NOT NULL UNIQUE,
            name          TEXT NOT NULL,
            category      TEXT NOT NULL,
            price         REAL DEFAULT 0,
            duration_days INTEGER DEFAULT 30,
            delivery_type TEXT CHECK(delivery_type IN ('auto', 'owner_upgrade')) DEFAULT 'auto',
            is_active     INTEGER DEFAULT 1,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, 'skus table');

    await run(db, `CREATE INDEX IF NOT EXISTS idx_skus_code ON skus(sku_code)`, 'idx_skus_code');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_skus_category ON skus(category)`, 'idx_skus_category');

    // ──────────────────────────────────────────────
    // 2. stock_items (Inventory)
    // ──────────────────────────────────────────────
    await run(db, `
        CREATE TABLE IF NOT EXISTS stock_items (
            id            TEXT PRIMARY KEY,
            sku_id        TEXT NOT NULL,
            account_info  TEXT,
            secret_key    TEXT,
            note          TEXT,
            status        TEXT CHECK(status IN ('available', 'reserved', 'sold')) DEFAULT 'available',
            order_id      INTEGER, -- Link to orders.id (integer autoincrement)
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
            sold_at       DATETIME,
            FOREIGN KEY (sku_id) REFERENCES skus(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    `, 'stock_items table');

    await run(db, `CREATE INDEX IF NOT EXISTS idx_stock_sku_status ON stock_items(sku_id, status)`, 'idx_stock_sku_status');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_stock_order ON stock_items(order_id)`, 'idx_stock_order');

    // ──────────────────────────────────────────────
    // 3. Seed SKUs (delivery_type: auto = instant, owner_upgrade = pre-order)
    // ──────────────────────────────────────────────
    const initialSkus = [
        { code: 'chatgpt_plus_1m', name: 'ChatGPT Plus 1 Tháng', category: 'chatgpt', price: 150000, days: 30, delivery_type: 'auto' },
        // chatgpt_plus_3m: không bán, đã tắt (is_active=0) nếu có trong DB
        { code: 'chatgpt_code_1m_vn', name: 'Code ChatGPT 1 tháng (IP Việt Nam)', category: 'chatgpt', price: 30000, days: 30, delivery_type: 'auto' },
        { code: 'canva_pro_1y', name: 'Canva Pro 1 Năm', category: 'canva', price: 99000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'capcut_pro_1y', name: 'CapCut Pro 1 Năm', category: 'capcut', price: 300000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'capcut_7d', name: 'CapCut 7 ngày', category: 'capcut', price: 7000, days: 7, delivery_type: 'owner_upgrade' },
        { code: 'capcut_14d', name: 'CapCut 14 ngày', category: 'capcut', price: 15000, days: 14, delivery_type: 'auto' },
        { code: 'capcut_1m', name: 'CapCut Pro 1 Tháng', category: 'capcut', price: 35000, days: 30, delivery_type: 'auto' },
        { code: 'capcut_6m', name: 'CapCut Pro 6 Tháng', category: 'capcut', price: 180000, days: 180, delivery_type: 'owner_upgrade' },
        { code: 'spotify_premium_1m', name: 'Spotify Premium 1 Tháng', category: 'spotify', price: 19000, days: 30, delivery_type: 'auto' },
        { code: 'youtube_premium_1m', name: 'YouTube Premium 1 Tháng', category: 'youtube', price: 25000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'netflix_1m', name: 'Netflix 1 Tháng', category: 'netflix', price: 69000, days: 30, delivery_type: 'auto' },
        { code: 'microsoft365_1y', name: 'Microsoft 365 1 Năm', category: 'office', price: 299000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'adobe_1m', name: 'Adobe All Apps 1 Tháng', category: 'adobe', price: 99000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'grok_7d', name: 'Grok 7 Ngày', category: 'grok', price: 15000, days: 7, delivery_type: 'auto' },
    ];

    const crypto = require('crypto');
    for (const sku of initialSkus) {
        const id = crypto.randomUUID();
        const deliveryType = sku.delivery_type || 'auto';
        try {
            await db.execute({
                sql: `
                INSERT INTO skus (id, sku_code, name, category, price, duration_days, delivery_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(sku_code) DO UPDATE SET name = excluded.name, price = excluded.price, delivery_type = excluded.delivery_type
                `,
                args: [id, sku.code, sku.name, sku.category, sku.price, sku.days, deliveryType]
            });
            console.log(`  + Seeded SKU: ${sku.code} (${deliveryType})`);
        } catch (e) {
            console.error(`  ! Failed to seed ${sku.code}: ${e.message}`);
        }
    }

    // Tắt SKU không bán: ChatGPT Plus 3 tháng
    try {
        await db.execute({ sql: `UPDATE skus SET is_active = 0 WHERE sku_code = 'chatgpt_plus_3m'`, args: [] });
        console.log('  ✓ Deactivated SKU: chatgpt_plus_3m (không bán)');
    } catch (e) { console.log('  (skip deactivate chatgpt_plus_3m:', e.message, ')'); }

    console.log('migrate-schema-v3: done.');
}

if (require.main === module) {
    migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { migrate };

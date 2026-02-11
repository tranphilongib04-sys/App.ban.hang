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
            ctv_price     REAL DEFAULT NULL,
            duration_days INTEGER DEFAULT 30,
            delivery_type TEXT CHECK(delivery_type IN ('auto', 'owner_upgrade')) DEFAULT 'auto',
            is_active     INTEGER DEFAULT 1,
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, 'skus table');

    await run(db, `ALTER TABLE skus ADD COLUMN ctv_price REAL`, 'skus.ctv_price column');

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
        // ChatGPT
        { code: 'chatgpt_plus_cap_tk', name: 'ChatGPT Plus - Cấp TK mới', category: 'chatgpt', price: 70000, days: 30, delivery_type: 'auto' },
        { code: 'chatgpt_plus_gia_han', name: 'ChatGPT Plus - Gia hạn TK cũ', category: 'chatgpt', price: 90000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'chatgpt_pro_1m', name: 'ChatGPT Pro', category: 'chatgpt', price: 100000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'chatgpt_go_1y', name: 'ChatGPT Go', category: 'chatgpt', price: 120000, days: 365, delivery_type: 'auto' },
        { code: 'chatgpt_code_1m_vn', name: 'Code ChatGPT 1 tháng (IP Việt Nam)', category: 'chatgpt', price: 30000, days: 30, delivery_type: 'auto' },
        // Legacy code kept for existing orders
        { code: 'chatgpt_plus_1m', name: 'ChatGPT Plus 1 Tháng (legacy)', category: 'chatgpt', price: 150000, days: 30, delivery_type: 'auto' },

        // Netflix
        { code: 'netflix_1m', name: 'Netflix Extra 1 Tháng', category: 'netflix', price: 70000, days: 30, delivery_type: 'auto' },

        // Spotify
        { code: 'spotify_premium_1m', name: 'Spotify Premium 1 Tháng', category: 'spotify', price: 30000, days: 30, delivery_type: 'auto' },
        { code: 'spotify_premium_4m', name: 'Spotify Premium 4 Tháng', category: 'spotify', price: 100000, days: 120, delivery_type: 'auto' },
        { code: 'spotify_premium_1y', name: 'Spotify Premium 1 Năm', category: 'spotify', price: 300000, days: 365, delivery_type: 'auto' },

        // Adobe
        { code: 'adobe_4m_kbh', name: 'Adobe 4 tháng KBH', category: 'adobe', price: 100000, days: 120, delivery_type: 'owner_upgrade' },
        { code: 'adobe_1y_ultraview', name: 'Adobe 1 năm Log Ultraview', category: 'adobe', price: 400000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'adobe_1y_tkmk', name: 'Adobe 1 năm cấp TK/MK', category: 'adobe', price: 500000, days: 365, delivery_type: 'owner_upgrade' },
        // Legacy
        { code: 'adobe_1m', name: 'Adobe All Apps 1 Tháng (legacy)', category: 'adobe', price: 99000, days: 30, delivery_type: 'owner_upgrade' },

        // YouTube
        { code: 'youtube_premium_1m', name: 'YouTube Premium 1 Tháng', category: 'youtube', price: 40000, days: 30, delivery_type: 'owner_upgrade' },

        // Duolingo
        { code: 'duolingo_plus_1y', name: 'Duolingo Plus 1 Năm FBH', category: 'duolingo', price: 210000, days: 365, delivery_type: 'owner_upgrade' },

        // Microsoft 365
        { code: 'ms365_1y', name: 'MS 365 1 Năm FBH', category: 'office', price: 160000, days: 365, delivery_type: 'owner_upgrade' },
        // Legacy
        { code: 'microsoft365_1y', name: 'Microsoft 365 1 Năm (legacy)', category: 'office', price: 299000, days: 365, delivery_type: 'owner_upgrade' },

        // Quizlet
        { code: 'quizlet_plus_1y', name: 'Quizlet Plus 1 Năm', category: 'quizlet', price: 160000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'quizlet_unlimited_1y', name: 'Quizlet Unlimited 1 Năm', category: 'quizlet', price: 220000, days: 365, delivery_type: 'owner_upgrade' },

        // Canva
        { code: 'canva_edu_1y', name: 'Canva Edu 1 Năm FBH', category: 'canva', price: 80000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'canva_pro_1y', name: 'Canva Pro 1 Năm FBH', category: 'canva', price: 130000, days: 365, delivery_type: 'owner_upgrade' },

        // CapCut
        { code: 'capcut_7d', name: 'CapCut 7 ngày', category: 'capcut', price: 7000, days: 7, delivery_type: 'owner_upgrade' },
        { code: 'capcut_14d', name: 'CapCut 14 ngày', category: 'capcut', price: 15000, days: 14, delivery_type: 'auto' },
        { code: 'capcut_1m', name: 'CapCut Pro 1 Tháng', category: 'capcut', price: 35000, days: 30, delivery_type: 'auto' },
        { code: 'capcut_6m', name: 'CapCut Pro 6 Tháng', category: 'capcut', price: 180000, days: 180, delivery_type: 'owner_upgrade' },
        { code: 'capcut_pro_1y', name: 'CapCut Pro 1 Năm', category: 'capcut', price: 300000, days: 365, delivery_type: 'owner_upgrade' },

        // Grok
        { code: 'grok_7d', name: 'Grok 7 Ngày', category: 'grok', price: 15000, days: 7, delivery_type: 'auto' },

        // AutoCAD
        { code: 'autocad_1y', name: 'AutoCAD nâng cấp mail chính chủ 1 năm', category: 'autocad', price: 170000, ctvPrice: 150000, days: 365, delivery_type: 'owner_upgrade' },

        // LinkedIn Business
        { code: 'linkedin_biz_3m', name: 'LinkedIn Business 3 tháng', category: 'linkedin', price: 530000, ctvPrice: 480000, days: 90, delivery_type: 'owner_upgrade' },
        { code: 'linkedin_biz_1y', name: 'LinkedIn Business 1 năm', category: 'linkedin', price: 1750000, ctvPrice: 1700000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'linkedin_career_3m', name: 'LinkedIn Career 3 tháng', category: 'linkedin', price: 500000, ctvPrice: 450000, days: 90, delivery_type: 'owner_upgrade' },

        // Gamma AI
        { code: 'gamma_plus_1m', name: 'Gamma Plus chính chủ 1 tháng', category: 'gamma', price: 150000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'gamma_pro_1m', name: 'Gamma Pro hình chủ 1 tháng', category: 'gamma', price: 220000, days: 30, delivery_type: 'owner_upgrade' },

        // SketchUp EDU
        { code: 'sketchup_edu_1y', name: 'SketchUp EDU cấp sẵn 1 năm', category: 'sketchup', price: 350000, days: 365, delivery_type: 'owner_upgrade' },

        // Figma
        { code: 'figma_pro_1m', name: 'Figma Pro chính chủ 1 tháng', category: 'figma', price: 200000, days: 30, delivery_type: 'owner_upgrade' },
        { code: 'figma_edu_1y', name: 'Figma Edu 1 năm', category: 'figma', price: 280000, days: 365, delivery_type: 'owner_upgrade' },

        // Autodesk Full App
        { code: 'autodesk_1app_1y', name: 'Autodesk lẻ 1 app 1 năm', category: 'autodesk', price: 170000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'autodesk_2app_1y', name: 'Autodesk lẻ 2 app 1 năm', category: 'autodesk', price: 250000, days: 365, delivery_type: 'owner_upgrade' },
        { code: 'autodesk_full_1y', name: 'Autodesk chính chủ full app 1 năm', category: 'autodesk', price: 370000, days: 365, delivery_type: 'owner_upgrade' },

        // Test
        { code: 'test_pay_2k', name: 'Test Payment 2k', category: 'test', price: 2000, days: 1, delivery_type: 'auto' },
    ];

    const crypto = require('crypto');
    for (const sku of initialSkus) {
        const id = crypto.randomUUID();
        const deliveryType = sku.delivery_type || 'auto';
        try {
            await db.execute({
                sql: `
                INSERT INTO skus (id, sku_code, name, category, price, ctv_price, duration_days, delivery_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(sku_code) DO UPDATE SET name = excluded.name, price = excluded.price, ctv_price = excluded.ctv_price, delivery_type = excluded.delivery_type
                `,
                args: [id, sku.code, sku.name, sku.category, sku.price, sku.ctvPrice ?? null, sku.days, deliveryType]
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

/**
 * One-time: Set delivery_type on existing SKUs for two-tier delivery.
 * Pre-order (owner_upgrade): Adobe, Canva, YouTube, Microsoft, Duolingo, Quizlet, CapCut 7d
 * Instant (auto): Giao sau, ChatGPT, CapCut 14d/1m/6m/1y
 *
 * Run from web-store: node -e "require('./scripts/update-delivery-types').run().then(()=>process.exit(0))"
 * Or with env: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/update-delivery-types.js
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not set');
    return createClient({ url, authToken });
}

async function run() {
    const db = getDbClient();
    const updates = [
        // Giao liền (auto) — có stock_items trong kho
        { like: 'chatgpt_plus_1m', type: 'auto' },
        { like: 'chatgpt_plus_kbh%', type: 'auto' },
        { like: 'chatgpt_go%', type: 'auto' },
        { like: 'grok_7d', type: 'auto' },
        { like: 'capcut_6m', type: 'auto' },
        { like: 'capcut_pro_1y', type: 'auto' },
        { like: 'capcut_14d', type: 'auto' },
        { like: 'capcut_1m', type: 'auto' },

        // Giao sau (owner_upgrade) — KHÔNG cần stock, giao tay qua Zalo
        { like: 'netflix%', type: 'owner_upgrade' },
        { like: 'spotify%', type: 'owner_upgrade' },
        { like: 'adobe%', type: 'owner_upgrade' },
        { like: 'canva%', type: 'owner_upgrade' },
        { like: 'youtube%', type: 'owner_upgrade' },
        { like: 'microsoft%', type: 'owner_upgrade' },
        { like: 'duolingo%', type: 'owner_upgrade' },
        { like: 'quizlet%', type: 'owner_upgrade' },
        { like: 'capcut_7d', type: 'owner_upgrade' },
        { like: 'chatgpt_plus_gia_han', type: 'owner_upgrade' },
        { like: 'chatgpt_pro_1m', type: 'owner_upgrade' },
        { like: 'super_grok%', type: 'owner_upgrade' },
        { like: 'gemini_pro%', type: 'owner_upgrade' },
        { like: 'claude_pro%', type: 'owner_upgrade' },
        { like: 'cursor_pro%', type: 'owner_upgrade' },
    ];
    for (const u of updates) {
        const r = await db.execute({
            sql: `UPDATE skus SET delivery_type = ? WHERE sku_code LIKE ?`,
            args: [u.type, u.like]
        });
        console.log(`  ${u.like} -> ${u.type}`);
    }
    console.log('Done.');
}

if (require.main === module) {
    run().catch(e => { console.error(e); process.exit(1); });
}
module.exports = { run };

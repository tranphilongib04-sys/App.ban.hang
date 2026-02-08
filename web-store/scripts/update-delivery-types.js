/**
 * One-time: Set delivery_type on existing SKUs for two-tier delivery.
 * Pre-order (owner_upgrade): Adobe, Canva, YouTube, Microsoft, Duolingo, Quizlet
 * Instant (auto): Netflix, Spotify, ChatGPT, CapCut
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
        { like: 'adobe%', type: 'owner_upgrade' },
        { like: 'canva%', type: 'owner_upgrade' },
        { like: 'youtube%', type: 'owner_upgrade' },
        { like: 'microsoft%', type: 'owner_upgrade' },
        { like: 'duolingo%', type: 'owner_upgrade' },
        { like: 'quizlet%', type: 'owner_upgrade' },
        { like: 'netflix%', type: 'auto' },
        { like: 'spotify%', type: 'auto' },
        { like: 'chatgpt%', type: 'auto' },
        { like: 'grok%', type: 'auto' },
        { like: 'capcut_7d', type: 'owner_upgrade' },
        { like: 'capcut_6m', type: 'owner_upgrade' },
        { like: 'capcut_pro_1y', type: 'owner_upgrade' },
        { like: 'capcut_14d', type: 'auto' },
        { like: 'capcut_1m', type: 'auto' },
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

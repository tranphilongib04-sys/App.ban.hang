/**
 * Sync DB prices with frontend prices
 * Run: node scripts/sync-prices.js
 * 
 * This updates the `skus` table in Turso to match the prices displayed on the frontend.
 */

// Load .env manually (no dotenv dependency)
const fs = require('fs');
const path = require('path');
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
    }
    process.env[key] = val;
}
const { createClient } = require('@libsql/client/web');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

// Prices from app.js frontend (source of truth)
const FRONTEND_PRICES = {
    // ChatGPT
    'chatgpt_acc_cap_san_fbh': 70000,
    'chatgpt_plus_cap_tk': 90000,
    'chatgpt_plus_gia_han': 190000,
    'chatgpt_team_1m': 100000,
    'chatgpt_go_1y': 160000,

    // Netflix
    'netflix_slot_1m': 70000,
    'netflix_extra_1m': 75000,

    // Spotify
    'spotify_premium_1m': 30000,
    'spotify_premium_4m': 115000,
    'spotify_premium_1y': 350000,

    // Adobe
    'adobe_4m_kbh': 100000,
    'adobe_1y_ultraview': 400000,
    'adobe_1y_tkmk': 500000,

    // YouTube
    'youtube_premium_1m': 40000,

    // Duolingo
    'duolingo_plus_1y': 210000,

    // MS 365
    'ms365_1y': 160000,

    // Quizlet
    'quizlet_plus_1y': 160000,
    'quizlet_unlimited_1y': 220000,

    // Canva
    'canva_edu_1y': 80000,
    'canva_pro_1y': 130000,

    // CapCut
    'capcut_7d': 7000,
    'capcut_14d': 15000,
    'capcut_1m': 30000,
    'capcut_6m': 160000,
    'capcut_pro_1y': 280000,

    // Grok
    'grok_7d': 35000,
    'super_grok_cap_san': 190000,
    'super_grok_chinh_chu': 250000,

    // AutoCAD
    'autocad_1y': 170000,

    // LinkedIn
    'linkedin_biz_3m': 530000,
    'linkedin_biz_1y': 1750000,
    'linkedin_career_3m': 500000,

    // Gamma
    'gamma_plus_1m': 150000,
    'gamma_pro_1m': 220000,

    // SketchUp
    'sketchup_edu_1y': 350000,

    // Figma
    'figma_pro_1m': 200000,
    'figma_edu_1y': 280000,

    // Autodesk
    'autodesk_1app_1y': 170000,
    'autodesk_2app_1y': 250000,
    'autodesk_full_1y': 370000,

    // Meitu
    'meitu_vip_1m': 75000,

    // Gemini
    'gemini_pro_1m': 25000,
    'gemini_pro_3m': 70000,
    'gemini_pro_6m': 120000,
    'gemini_pro_1y': 220000,

    // Claude
    'claude_pro_1m': 380000,

    // Cursor
    'cursor_pro_1m': 380000,

    // Sora 2
    'sora2_acc_cap_1m': 70000,

    // Scribd
    'scribd_1m': 60000,

    // Perplexity
    'perplexity_pro_1y': 370000,
};

async function syncPrices() {
    console.log('🔄 Syncing DB prices with frontend...\n');

    // First, check current DB prices
    const result = await db.execute('SELECT sku_code, name, price FROM skus WHERE is_active = 1 ORDER BY sku_code');

    let updated = 0;
    let matched = 0;
    let notInFrontend = 0;
    let notInDb = new Set(Object.keys(FRONTEND_PRICES));

    for (const row of result.rows) {
        const code = row.sku_code;
        notInDb.delete(code);

        if (FRONTEND_PRICES[code] !== undefined) {
            const frontendPrice = FRONTEND_PRICES[code];
            const dbPrice = row.price;

            if (dbPrice !== frontendPrice) {
                console.log(`  ❌ MISMATCH: ${code} (${row.name})`);
                console.log(`     DB: ${dbPrice.toLocaleString()}₫ → Frontend: ${frontendPrice.toLocaleString()}₫`);

                // Update DB
                await db.execute({
                    sql: 'UPDATE skus SET price = ? WHERE sku_code = ?',
                    args: [frontendPrice, code]
                });
                console.log(`     ✅ Updated to ${frontendPrice.toLocaleString()}₫`);
                updated++;
            } else {
                console.log(`  ✅ OK: ${code} = ${dbPrice.toLocaleString()}₫`);
                matched++;
            }
        } else {
            console.log(`  ⚠️  DB-only (not in frontend): ${code} (${row.name}) = ${row.price.toLocaleString()}₫`);
            notInFrontend++;
        }
    }

    // Auto-insert missing SKUs into DB
    const CATEGORY_MAP = {
        chatgpt: 'AI', claude: 'AI', cursor: 'AI', grok: 'AI', gemini: 'AI', super_grok: 'AI', perplexity: 'AI', sora2: 'AI',
        netflix: 'Giải trí', spotify: 'Giải trí', youtube: 'Giải trí',
        adobe: 'Thiết kế', canva: 'Thiết kế', capcut: 'Thiết kế', figma: 'Thiết kế', meitu: 'Thiết kế', gamma: 'Thiết kế', sketchup: 'Thiết kế',
        autocad: 'Kỹ thuật', autodesk: 'Kỹ thuật',
        ms365: 'Công cụ', duolingo: 'Học tập', quizlet: 'Học tập', scribd: 'Học tập',
        linkedin: 'Công cụ',
    };

    function getCategory(skuCode) {
        // Try longest prefix first (e.g. super_grok before grok)
        const prefixes = Object.keys(CATEGORY_MAP).sort((a, b) => b.length - a.length);
        for (const prefix of prefixes) {
            if (skuCode.startsWith(prefix)) return CATEGORY_MAP[prefix];
        }
        return 'Khác';
    }

    let inserted = 0;
    if (notInDb.size > 0) {
        console.log('\n🆕 Inserting missing SKUs into DB:');
        for (const code of notInDb) {
            const price = FRONTEND_PRICES[code];
            const name = code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const category = getCategory(code);
            await db.execute({
                sql: `INSERT INTO skus (sku_code, name, price, category, is_active) VALUES (?, ?, ?, ?, 1)`,
                args: [code, name, price, category]
            });
            console.log(`  ✅ Inserted: ${code} (${category}) = ${price.toLocaleString()}₫`);
            inserted++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Matched: ${matched}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  🆕 Inserted: ${inserted}`);
    console.log(`  ⚠️  DB-only: ${notInFrontend}`);
    console.log('\nDone!');
}

syncPrices().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

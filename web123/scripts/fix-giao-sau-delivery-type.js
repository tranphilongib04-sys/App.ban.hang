#!/usr/bin/env node
/**
 * FIX: Update all "giao sau" SKUs to delivery_type='owner_upgrade'
 * 
 * Bug: Some SKUs that are manually delivered (giao sau) had delivery_type='auto',
 * causing the system to check stock_items (which don't exist for manual delivery)
 * and return INSUFFICIENT_STOCK.
 * 
 * Usage: node scripts/fix-giao-sau-delivery-type.js
 */

const { createClient } = require('@libsql/client/web');
const fs = require('fs');
const path = require('path');

// Manual .env loader (dotenv not installed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = (match[2] || '').replace(/^["']|["']$/g, '');
        }
    });
}

const GIAO_SAU_SKU_CODES = [
    // Gemini Pro
    'gemini_pro_1m', 'gemini_pro_3m', 'gemini_pro_6m', 'gemini_pro_1y',
    // Claude, Cursor
    'claude_pro_1m', 'cursor_pro_1m',
    // ChatGPT preorder variants
    'chatgpt_acc_cap_san_fbh', 'chatgpt_plus_cap_tk', 'chatgpt_plus_gia_han', 'chatgpt_team_1m',
    // Netflix
    'netflix_slot_1m', 'netflix_extra_1m',
    // Spotify
    'spotify_premium_1m', 'spotify_premium_4m', 'spotify_premium_1y',
    // Design tools
    'autocad_1y', 'figma_pro_1m', 'figma_edu_1y',
    'autodesk_1app_1y', 'autodesk_2app_1y', 'autodesk_full_1y',
    'sketchup_edu_1y', 'meitu_vip_1m',
    // LinkedIn
    'linkedin_biz_3m', 'linkedin_biz_1y', 'linkedin_career_3m',
    // Gamma
    'gamma_plus_1m', 'gamma_pro_1m',
    // Grok
    'super_grok_cap_san', 'super_grok_chinh_chu',
];

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('❌ TURSO_DATABASE_URL not set. Add it to .env');
        process.exit(1);
    }

    const db = createClient({ url, authToken });

    console.log('🔍 Checking current delivery_type for giao sau SKUs...\n');

    // 1. Show current state
    const placeholders = GIAO_SAU_SKU_CODES.map(() => '?').join(', ');
    const current = await db.execute({
        sql: `SELECT sku_code, name, delivery_type FROM skus WHERE sku_code IN (${placeholders}) ORDER BY sku_code`,
        args: GIAO_SAU_SKU_CODES
    });

    let needsFix = 0;
    for (const row of current.rows) {
        const status = row.delivery_type === 'owner_upgrade' ? '✅' : '❌ WRONG';
        if (row.delivery_type !== 'owner_upgrade') needsFix++;
        console.log(`  ${status}  ${row.sku_code.padEnd(30)} delivery_type=${row.delivery_type}`);
    }

    if (needsFix === 0) {
        console.log('\n✅ All giao sau SKUs already have correct delivery_type. No fix needed.');
        return;
    }

    console.log(`\n⚠️  Found ${needsFix} SKU(s) with wrong delivery_type. Fixing...\n`);

    // 2. Fix
    const result = await db.execute({
        sql: `UPDATE skus SET delivery_type = 'owner_upgrade' WHERE sku_code IN (${placeholders}) AND delivery_type != 'owner_upgrade'`,
        args: GIAO_SAU_SKU_CODES
    });

    console.log(`✅ Updated ${result.rowsAffected} SKU(s) to delivery_type='owner_upgrade'`);

    // 3. Verify
    console.log('\n📊 Verification:');
    const verify = await db.execute({
        sql: `SELECT sku_code, delivery_type FROM skus WHERE sku_code IN (${placeholders}) ORDER BY sku_code`,
        args: GIAO_SAU_SKU_CODES
    });

    for (const row of verify.rows) {
        const ok = row.delivery_type === 'owner_upgrade' ? '✅' : '❌';
        console.log(`  ${ok}  ${row.sku_code.padEnd(30)} → ${row.delivery_type}`);
    }

    console.log('\n🎉 Fix complete!');
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});

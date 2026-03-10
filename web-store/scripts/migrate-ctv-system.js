/**
 * CTV System Migration Script
 * Run: node scripts/migrate-ctv-system.js
 * 
 * 1. Add discount_percent + code_type to discount_codes
 * 2. Add ctv_excluded to skus
 * 3. Mark YouTube/Netflix as ctv_excluded
 */

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

async function migrate() {
    console.log('🔄 CTV System Migration\n');

    // 1. Add discount_percent to discount_codes
    try {
        await db.execute(`ALTER TABLE discount_codes ADD COLUMN discount_percent INTEGER DEFAULT 15`);
        console.log('  ✅ Added discount_percent to discount_codes');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('  ℹ️  discount_percent already exists');
        } else {
            console.log('  ⚠️  discount_percent:', e.message);
        }
    }

    // 2. Add code_type to discount_codes
    try {
        await db.execute(`ALTER TABLE discount_codes ADD COLUMN code_type TEXT DEFAULT 'ctv'`);
        console.log('  ✅ Added code_type to discount_codes');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('  ℹ️  code_type already exists');
        } else {
            console.log('  ⚠️  code_type:', e.message);
        }
    }

    // 3. Add ctv_excluded to skus
    try {
        await db.execute(`ALTER TABLE skus ADD COLUMN ctv_excluded INTEGER DEFAULT 0`);
        console.log('  ✅ Added ctv_excluded to skus');
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log('  ℹ️  ctv_excluded already exists');
        } else {
            console.log('  ⚠️  ctv_excluded:', e.message);
        }
    }

    // 4. Mark YouTube and Netflix as ctv_excluded
    const excluded = ['youtube_premium_1m', 'netflix_slot_1m', 'netflix_extra_1m'];
    for (const sku of excluded) {
        const res = await db.execute({
            sql: `UPDATE skus SET ctv_excluded = 1 WHERE sku_code = ?`,
            args: [sku]
        });
        console.log(`  🚫 Excluded: ${sku} (${res.rowsAffected} rows)`);
    }

    // 5. Set existing CTV codes to code_type='ctv' and discount_percent=15
    await db.execute(`UPDATE discount_codes SET code_type = 'ctv', discount_percent = 15 WHERE code_type IS NULL OR code_type = 'ctv'`);
    console.log('  ✅ Updated existing discount_codes with code_type=ctv, discount_percent=15');

    // 6. Verify
    console.log('\n📊 Current discount_codes:');
    const codes = await db.execute(`SELECT code, discount_amount, discount_percent, code_type, is_active FROM discount_codes ORDER BY code`);
    for (const row of codes.rows) {
        console.log(`  ${row.is_active ? '✅' : '❌'} ${row.code} | amount=${row.discount_amount} | percent=${row.discount_percent}% | type=${row.code_type}`);
    }

    console.log('\n📊 CTV-excluded SKUs:');
    const excl = await db.execute(`SELECT sku_code, name, price, ctv_excluded FROM skus WHERE ctv_excluded = 1`);
    for (const row of excl.rows) {
        console.log(`  🚫 ${row.sku_code} (${row.name}) = ${Number(row.price).toLocaleString()}₫`);
    }

    console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
    console.error('Migration Error:', err);
    process.exit(1);
});

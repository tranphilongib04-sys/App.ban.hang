/**
 * Create initial CTV codes in the database
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
const crypto = require('crypto');
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

async function run() {
    const codes = [
        { code: 'CTVSTAR7X', percent: 15, desc: 'CTV Thường #1' },
        { code: 'CTVBLUE26', percent: 15, desc: 'CTV Thường #2' },
        { code: 'CTVGOLD88', percent: 20, desc: 'CTV Cao Cấp #1' },
        { code: 'CTVPRO9K', percent: 20, desc: 'CTV Cao Cấp #2' }
    ];

    for (const c of codes) {
        const id = crypto.randomUUID();
        await db.execute({
            sql: `INSERT INTO discount_codes (id, code, discount_amount, discount_percent, code_type, description, is_active)
                   VALUES (?, ?, 0, ?, 'ctv', ?, 1)
                   ON CONFLICT(code) DO UPDATE SET discount_percent = excluded.discount_percent, description = excluded.description, code_type = 'ctv'`,
            args: [id, c.code, c.percent, c.desc]
        });
        console.log('✅ ' + c.code + ' → ' + c.percent + '%');
    }

    console.log('\n📊 Tất cả mã CTV:');
    const all = await db.execute("SELECT code, discount_percent, code_type, is_active FROM discount_codes ORDER BY code");
    for (const r of all.rows) {
        console.log('  ' + (r.is_active ? '✅' : '❌') + ' ' + r.code + ' | ' + r.discount_percent + '% | type=' + r.code_type);
    }
}

run().catch(e => console.error(e));

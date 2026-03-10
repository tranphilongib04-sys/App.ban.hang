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
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });

(async () => {
    for (const code of ['CTV01', 'CTV02', 'CTV03']) {
        await db.execute({ sql: 'UPDATE discount_codes SET is_active = 0 WHERE code = ?', args: [code] });
        console.log('Deactivated: ' + code);
    }
    const all = await db.execute("SELECT code, discount_percent, is_active FROM discount_codes ORDER BY code");
    console.log('\nFinal state:');
    for (const r of all.rows) {
        console.log('  ' + (r.is_active ? 'ACTIVE' : 'OFF') + ' ' + r.code + ' | ' + r.discount_percent + '%');
    }
})().catch(e => console.error(e));

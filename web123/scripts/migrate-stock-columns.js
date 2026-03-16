require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function migrate() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        console.log('🔄 Migrating table stock_units...');
        const colsToAdd = [
            'password_iv TEXT',
            'username TEXT',
            'sold_order_id TEXT',
            'sold_at DATETIME',
            'extra_info TEXT'
        ];

        for (const colDef of colsToAdd) {
            try {
                const colName = colDef.split(' ')[0];
                await db.execute(`ALTER TABLE stock_units ADD COLUMN ${colDef}`);
                console.log(`✅ Added column: ${colName}`);
            } catch (e) {
                if (e.message.includes('duplicate column')) {
                    console.log(`⚠️ Column already exists: ${colDef.split(' ')[0]}`);
                } else {
                    console.error(`❌ Failed to add ${colDef}:`, e.message);
                }
            }
        }
        console.log('🎉 Migration complete');
    } catch (e) {
        console.error("Migration fatal error:", e);
    }
}

migrate();

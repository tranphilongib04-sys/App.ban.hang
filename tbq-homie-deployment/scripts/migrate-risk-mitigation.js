require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    console.log('🔄 Connecting to database for Risk Mitigation Migration...');
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        // 1. PAYMENTS: Add confirmed_at if missing
        try {
            await db.execute("ALTER TABLE payments ADD COLUMN confirmed_at TEXT");
            console.log("✅ Added confirmed_at to payments");
        } catch (e) {
            if (!e.message.includes('duplicate column')) {
                console.log("ℹ️ confirmed_at column likely exists or error:", e.message);
            }
        }

        // 2. PAYMENTS: Add UNIQUE Index
        try {
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_txn ON payments(provider, transaction_id)`);
            console.log('✅ Created UNIQUE Index on payments(provider, transaction_id)');
        } catch (e) {
            console.error('⚠️ Failed to create UNIQUE index (check for duplicates):', e.message);
        }

        // 3. ORDER STATUS HISTORY
        await db.execute(`
            CREATE TABLE IF NOT EXISTS order_status_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                old_status TEXT,
                new_status TEXT NOT NULL,
                actor TEXT DEFAULT 'system',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )
        `);
        console.log('✅ Created order_status_history table');

        // 4. RATE LIMITS (Formalize)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS rate_limits (
                ip TEXT PRIMARY KEY,
                count INTEGER DEFAULT 0,
                reset_at DATETIME
            )
        `);
        console.log('✅ Created rate_limits table');

        // 5. INVOICES (Formalize - Fix missing table)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                invoice_number TEXT UNIQUE NOT NULL,
                issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'issued',
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )
        `);
        // Add UNIQUE constraint on order_id to prevent duplicate invoices for same order
        try {
            await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id)`);
            console.log('✅ Created UNIQUE Index on invoices(order_id)');
        } catch (e) { console.log('ℹ️ Index idx_invoices_order_id check:', e.message); }

        console.log('✅ Checked/Created invoices table');

        console.log('🎉 Risk Mitigation Migration Completed!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    }
}

main();

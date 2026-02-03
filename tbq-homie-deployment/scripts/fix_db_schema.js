require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    console.log('🔄 Connecting to database...');
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        // 1. PRODUCTS
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                description TEXT,
                category TEXT,
                image_url TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Checked/Created products table');

        // 2. STOCK UNITS
        await db.execute(`
            CREATE TABLE IF NOT EXISTS stock_units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                status TEXT DEFAULT 'available',
                reserved_by TEXT,
                reserved_at TEXT,
                reserved_order_id TEXT,
                reservation_expires TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);
        // Add password_encrypted column if missing
        try {
            await db.execute("ALTER TABLE stock_units ADD COLUMN password_encrypted TEXT");
            console.log("   -> Added password_encrypted column to stock_units");
        } catch (e) { }
        console.log('✅ Checked/Created stock_units table');

        // 3. ORDERS
        await db.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_code TEXT UNIQUE NOT NULL,
                customer_email TEXT,
                customer_name TEXT,
                customer_phone TEXT,
                customer_note TEXT,
                status TEXT DEFAULT 'pending_payment',
                amount_total INTEGER DEFAULT 0,
                payment_method TEXT DEFAULT 'sepay',
                reserved_until TEXT,
                delivery_token TEXT,
                delivery_token_expires_at TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Add new columns if missing
        const newCols = ['delivery_token', 'delivery_token_expires_at', 'ip_address', 'user_agent'];
        for (const col of newCols) {
            try {
                await db.execute(`ALTER TABLE orders ADD COLUMN ${col} TEXT`);
                console.log(`   -> Added ${col} column to orders`);
            } catch (e) { }
        }
        await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_delivery_token ON orders(delivery_token)`);
        console.log('✅ Checked/Created orders table');

        // 4. ORDER LINES
        await db.execute(`
            CREATE TABLE IF NOT EXISTS order_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT,
                quantity INTEGER,
                unit_price INTEGER,
                subtotal INTEGER,
                FOREIGN KEY(order_id) REFERENCES orders(id),
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);
        console.log('✅ Checked/Created order_lines table');

        // 5. ORDER ALLOCATIONS
        await db.execute(`
            CREATE TABLE IF NOT EXISTS order_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_line_id INTEGER NOT NULL,
                unit_id INTEGER NOT NULL,
                assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(order_line_id) REFERENCES order_lines(id),
                FOREIGN KEY(unit_id) REFERENCES stock_units(id)
            )
        `);
        console.log('✅ Checked/Created order_allocations table');

        // 6. PAYMENTS (NEW)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                provider TEXT DEFAULT 'Sepay',
                amount INTEGER NOT NULL,
                status TEXT DEFAULT 'INITIATED',
                provider_ref TEXT,
                transaction_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )
        `);
        console.log('✅ Checked/Created payments table');

        // 7. INVENTORY LOGS (NEW)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                unit_id INTEGER,
                order_id INTEGER,
                action TEXT NOT NULL,
                actor TEXT DEFAULT 'system',
                source TEXT DEFAULT 'system',
                previous_status TEXT,
                new_status TEXT,
                payload TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(unit_id) REFERENCES stock_units(id),
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )
        `);
        console.log('✅ Checked/Created inventory_logs table');

        // 8. SYNC EVENTS (NEW)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS sync_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                entity_type TEXT,
                entity_id INTEGER,
                source TEXT DEFAULT 'system',
                actor TEXT,
                payload TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Checked/Created sync_events table');

        // 9. STOCK SUMMARY VIEW (NEW)
        try {
            await db.execute('DROP VIEW IF EXISTS stock_summary');
        } catch (e) { }

        await db.execute(`
            CREATE VIEW IF NOT EXISTS stock_summary AS
            SELECT 
                p.id as product_id,
                p.code,
                p.name,
                COUNT(s.id) as total_units,
                SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_units,
                SUM(CASE WHEN s.status = 'reserved' THEN 1 ELSE 0 END) as reserved_units,
                SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END) as sold_units
            FROM products p
            LEFT JOIN stock_units s ON p.id = s.product_id
            GROUP BY p.id
        `);
        console.log('✅ Checked/Created stock_summary view');

        console.log('🎉 Production Schema Upgrade Successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    }
}

main();

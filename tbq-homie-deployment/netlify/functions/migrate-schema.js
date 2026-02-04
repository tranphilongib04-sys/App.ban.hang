/**
 * MIGRATION SCRIPT - Upgrade to new schema
 * 
 * Run this once to migrate existing data to new schema:
 * - Products table
 * - StockUnit (renamed from inventory_items with new fields)
 * - Order with quantity support
 * - OrderLine
 * - OrderAllocation (chống cấp trùng)
 * - Payment
 * - Invoice
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not configured');
    return createClient({ url, authToken });
}

async function migrate() {
    const db = getDbClient();

    console.log('Starting migration...');

    try {
        // 1. Create Products table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                variant TEXT,
                description TEXT,
                base_price INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Products table created');

        // 2. Migrate inventory_items to stock_units
        await db.execute(`
            CREATE TABLE IF NOT EXISTS stock_units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                username TEXT NOT NULL,
                password_encrypted TEXT NOT NULL,
                password_iv TEXT NOT NULL,
                password_masked TEXT,
                extra_info TEXT,
                status TEXT NOT NULL CHECK(status IN ('available', 'reserved', 'sold', 'warranty_hold', 'disabled')) DEFAULT 'available',
                reserved_until DATETIME,
                reserved_order_id INTEGER,
                sold_order_id INTEGER,
                sold_at DATETIME,
                warranty_note TEXT,
                error_note TEXT,
                import_batch TEXT,
                cost_price INTEGER,
                expires_at DATETIME,
                note TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (reserved_order_id) REFERENCES orders(id),
                FOREIGN KEY (sold_order_id) REFERENCES orders(id)
            )
        `);
        console.log('✓ StockUnits table created');

        // Create unique index for username
        await db.execute(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_units_username 
            ON stock_units (username)
        `);

        // Create index for available stock queries
        await db.execute(`
            CREATE INDEX IF NOT EXISTS idx_stock_units_available
            ON stock_units (product_id, status, reserved_until)
        `);
        console.log('✓ StockUnits indexes created');

        // 3. Create Orders table (upgraded)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_code TEXT NOT NULL UNIQUE,
                customer_email TEXT NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_note TEXT,
                status TEXT NOT NULL CHECK(status IN ('pending_payment', 'paid', 'fulfilled', 'expired', 'cancelled', 'refunded')) DEFAULT 'pending_payment',
                amount_total INTEGER NOT NULL,
                payment_method TEXT DEFAULT 'sepay',
                reserved_until DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Orders table created');

        // 4. Create OrderLines table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS order_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price INTEGER NOT NULL,
                subtotal INTEGER NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);
        console.log('✓ OrderLines table created');

        // 5. Create OrderAllocations table (chống cấp trùng)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS order_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_line_id INTEGER NOT NULL,
                unit_id INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('reserved', 'sold', 'released', 'replaced')) DEFAULT 'reserved',
                reserved_until DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_line_id) REFERENCES order_lines(id),
                FOREIGN KEY (unit_id) REFERENCES stock_units(id),
                UNIQUE(unit_id, order_line_id)
            )
        `);
        console.log('✓ OrderAllocations table created');

        // 6. Create Payments table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                provider TEXT NOT NULL DEFAULT 'sepay',
                amount INTEGER NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('initiated', 'confirmed', 'failed', 'timeout')) DEFAULT 'initiated',
                provider_ref TEXT,
                transaction_id TEXT,
                confirmed_at DATETIME,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        console.log('✓ Payments table created');

        // 7. Create Invoices table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                invoice_number TEXT NOT NULL UNIQUE,
                issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                status TEXT NOT NULL CHECK(status IN ('draft', 'issued', 'void')) DEFAULT 'draft',
                pdf_url TEXT,
                html_content TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        console.log('✓ Invoices table created');

        // 8. Create InventoryLog table (audit)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS inventory_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                actor TEXT,
                unit_id INTEGER,
                order_id INTEGER,
                payload TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (unit_id) REFERENCES stock_units(id),
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        `);
        console.log('✓ InventoryLogs table created');

        // 9. Migrate existing inventory_items to stock_units (if exists)
        try {
            const existingItems = await db.execute(`
                SELECT * FROM inventory_items WHERE status IN ('available', 'reserved', 'sold')
            `);

            if (existingItems.rows.length > 0) {
                console.log(`Migrating ${existingItems.rows.length} existing inventory items...`);

                // First, create products from unique service/variant combinations
                const serviceVariants = new Set();
                for (const item of existingItems.rows) {
                    const key = `${item.service}|${item.variant || 'default'}`;
                    serviceVariants.add(key);
                }

                const productMap = new Map();
                for (const sv of serviceVariants) {
                    const [service, variant] = sv.split('|');
                    const code = `${service}_${variant === 'default' ? 'standard' : variant.replace(/\s+/g, '_').toLowerCase()}`;
                    const name = variant === 'default' ? service : `${service} - ${variant}`;

                    // Insert product
                    const prodResult = await db.execute({
                        sql: `
                            INSERT INTO products (code, name, variant, base_price, is_active)
                            VALUES (?, ?, ?, 0, 1)
                            ON CONFLICT(code) DO UPDATE SET name = excluded.name
                            RETURNING id
                        `,
                        args: [code, name, variant === 'default' ? null : variant]
                    });

                    const productId = prodResult.rows[0]?.id || prodResult.lastInsertRowid;
                    productMap.set(sv, productId);
                }

                // Migrate items
                for (const item of existingItems.rows) {
                    const sv = `${item.service}|${item.variant || 'default'}`;
                    const productId = productMap.get(sv);

                    if (!productId) continue;

                    // Extract username/password from secret_payload (format: "username|password")
                    const parts = (item.secret_payload || '').split('|');
                    const username = parts[0] || '';
                    const password = parts[1] || '';

                    // Simple encryption placeholder (you should use proper encryption)
                    const passwordEncrypted = Buffer.from(password).toString('base64');
                    const passwordIv = Buffer.from('defaultiv123456').toString('base64'); // 12 bytes

                    await db.execute({
                        sql: `
                            INSERT INTO stock_units (
                                product_id, username, password_encrypted, password_iv, password_masked,
                                extra_info, status, reserved_until, reserved_order_id, sold_at,
                                import_batch, cost_price, note, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        args: [
                            productId,
                            username,
                            passwordEncrypted,
                            passwordIv,
                            item.secret_masked || username.replace(/(.{3}).*(@.*)/, '$1***$2'),
                            item.note || null,
                            item.status === 'delivered' ? 'sold' : item.status,
                            item.reservation_expires || null,
                            null, // reserved_order_id - will need to map from public_orders
                            item.sold_at || null,
                            item.import_batch || null,
                            item.cost || 0,
                            item.note || null,
                            item.created_at || new Date().toISOString()
                        ]
                    });
                }

                console.log(`✓ Migrated ${existingItems.rows.length} inventory items`);
            }
        } catch (err) {
            console.log('Note: inventory_items table may not exist, skipping migration');
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    migrate()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { migrate };

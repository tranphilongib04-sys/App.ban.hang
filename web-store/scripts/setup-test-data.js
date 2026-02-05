require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function setup() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        console.log('🔄 Setting up test data...');

        // 1. Ensure a Test Product exists
        const productCode = 'TEST_PROD_01';
        await db.execute({
            sql: `INSERT INTO products (code, name, base_price, is_active) 
                  VALUES (?, ?, ?, 1) 
                  ON CONFLICT(code) DO NOTHING`,
            args: [productCode, 'Test Product for QA', 70000]
        });

        const productRes = await db.execute({
            sql: "SELECT id FROM products WHERE code = ?",
            args: [productCode]
        });
        const productId = productRes.rows[0].id;
        console.log(`✅ Product: ${productCode} (ID: ${productId})`);

        // 2. Ensure Stock exists
        await db.execute({
            sql: `INSERT INTO stock_units (product_id, content, status) VALUES (?, ?, 'available')`,
            args: [productId, 'user:pass|token']
        });
        console.log('✅ Added stock unit');

        // 3. Create Pending Order
        const orderCode = `TBQ${Date.now()}`;
        const amount = 70000;

        await db.execute({
            sql: `INSERT INTO orders (order_code, status, amount_total, payment_method, customer_email) 
                  VALUES (?, 'pending_payment', ?, 'sepay', 'qa@test.com')`,
            args: [orderCode, amount]
        });

        const orderRes = await db.execute({
            sql: "SELECT id FROM orders WHERE order_code = ?",
            args: [orderCode]
        });
        const orderId = orderRes.rows[0].id;

        // 4. Create Order Line (Link order to product)
        await db.execute({
            sql: `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, subtotal)
                  VALUES (?, ?, 'Test Product for QA', 1, ?, ?)`,
            args: [orderId, productId, amount, amount]
        });

        // 5. Reserve Stock (Create Allocation)
        const lineRes = await db.execute({
            sql: "SELECT id FROM order_lines WHERE order_id = ?",
            args: [orderId]
        });
        const lineId = lineRes.rows[0].id;

        const stockRes = await db.execute({
            sql: "SELECT id FROM stock_units WHERE status = 'available' LIMIT 1"
        });

        if (stockRes.rows.length > 0) {
            const unitId = stockRes.rows[0].id;
            await db.execute({
                sql: `INSERT INTO order_allocations (order_line_id, unit_id, status) VALUES (?, ?, 'reserved')`,
                args: [lineId, unitId]
            });
            await db.execute({
                sql: "UPDATE stock_units SET status = 'reserved', reserved_order_id = ? WHERE id = ?",
                args: [orderCode, unitId]
            });
            console.log('✅ Reserved stock unit for order');
        } else {
            console.log('⚠️ No stock available to reserve');
        }

        console.log('\n✨ Test Data Created:');
        console.log(`   Order Code: ${orderCode}`);
        console.log(`   Amount: ${amount}`);
        console.log(`   Command to run webhook test:`);
        console.log(`   node scripts/test-webhook.js ${orderCode} ${amount}`);

    } catch (e) {
        console.error("Setup failed:", e);
    }
}

setup();

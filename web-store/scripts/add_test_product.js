require('dotenv').config();
const { createClient } = require('@libsql/client');

console.log('Adding Test Product to DB...');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        // 1. Insert Product
        await client.execute({
            sql: `INSERT OR IGNORE INTO products (code, name, base_price, is_active) 
                  VALUES ('test_pay_2k', 'Testing Payment', 2000, 1)`,
            args: []
        });
        console.log('✅ Product inserted (or ignored if exists)');

        // Get Product ID
        const res = await client.execute("SELECT id FROM products WHERE code = 'test_pay_2k'");
        if (res.rows.length === 0) throw new Error('Product not found after insert');
        const productId = res.rows[0].id;

        // 2. Add Stock (Insert 100 units)
        for (let i = 0; i < 100; i++) {
            await client.execute({
                sql: `INSERT INTO stock_units (product_id, content, status) 
                      VALUES (?, ?, 'available')`,
                args: [productId, `test_acc_${i}|test_pass_${i}`]
            });
        }
        console.log('✅ Added 100 stock units');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();

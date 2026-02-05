require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function checkOrder() {
    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    const orderCode = 'TBQ1770234373615';

    try {
        console.log(`🔍 Checking order ${orderCode}...`);
        const res = await db.execute({
            sql: "SELECT id, status, amount_total FROM orders WHERE order_code = ?",
            args: [orderCode]
        });

        if (res.rows.length === 0) {
            console.log('❌ Order not found');
        } else {
            const order = res.rows[0];
            console.log('✅ Order Found:');
            console.table(order);
        }

        // Also check stock status
        const stockRes = await db.execute("SELECT id, status, sold_order_id FROM stock_units WHERE sold_order_id LIKE '%22%' OR id=1"); // Check relevant unit
        console.log('\n📦 Stock Units:');
        console.table(stockRes.rows);

        // Check Payments
        const payRes = await db.execute({ sql: "SELECT * FROM payments WHERE order_id = ?", args: [22] }); // ID 22 from previous output
        console.log('\n💸 Payments:');
        console.table(payRes.rows);

        // Check Deliveries
        const delRes = await db.execute({ sql: "SELECT * FROM deliveries WHERE order_id = ?", args: [22] });
        console.log('\n🚚 Deliveries:');
        console.table(delRes.rows);

        // Check Invoices
        const invRes = await db.execute({ sql: "SELECT * FROM invoices WHERE order_id = ?", args: [22] });
        console.log('\n📄 Invoices:');
        console.table(invRes.rows);

    } catch (e) {
        console.error("Check failed:", e);
    }
}

checkOrder();

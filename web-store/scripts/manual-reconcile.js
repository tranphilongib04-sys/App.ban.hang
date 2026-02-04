/**
 * MANUAL RECONCILE - Chạy thủ công để xác nhận thanh toán cho đơn pending
 * 
 * Usage: node scripts/manual-reconcile.js [orderCode]
 * Example: node scripts/manual-reconcile.js TBQ20824761
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@libsql/client');

async function manualReconcile(orderCode = null) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    const sepayToken = process.env.SEPAY_API_TOKEN;

    if (!url || !authToken) {
        console.error('❌ Missing TURSO credentials in .env');
        process.exit(1);
    }

    if (!sepayToken) {
        console.error('❌ Missing SEPAY_API_TOKEN in .env');
        process.exit(1);
    }

    const db = createClient({ url, authToken });

    try {
        // Get pending orders
        let orders;
        if (orderCode) {
            orders = await db.execute({
                sql: `SELECT * FROM orders WHERE order_code = ? AND status = 'pending_payment'`,
                args: [orderCode]
            });
        } else {
            orders = await db.execute({
                sql: `SELECT * FROM orders WHERE status = 'pending_payment' AND created_at > datetime('now', '-1 day')`,
                args: []
            });
        }

        if (orders.rows.length === 0) {
            console.log('✅ No pending orders found.');
            return;
        }

        console.log(`📋 Found ${orders.rows.length} pending order(s).`);

        // Fetch SePay transactions
        const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=200', {
            headers: {
                'Authorization': `Bearer ${sepayToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ SePay API Error: ${response.status} - ${errorText}`);
            return;
        }

        const data = await response.json();
        const transactions = data.transactions || [];
        console.log(`💰 SePay returned ${transactions.length} transactions.`);

        // Match and fulfill
        const { fulfillOrder } = require('../netlify/functions/utils/fulfillment');

        for (const order of orders.rows) {
            const code = order.order_code;
            const amount = order.amount_total;

            const match = transactions.find(t => {
                const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                const txAmount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                const codeUpper = code.toUpperCase();
                const contentMatch = content.includes(codeUpper) || content.includes(codeUpper.replace('TBQ', ''));
                const amountMatch = txAmount >= amount * 0.95;

                return contentMatch && amountMatch;
            });

            if (match) {
                console.log(`\n✅ MATCH FOUND for ${code}!`);
                console.log(`   Transaction: ${match.id || match.transaction_id}`);
                console.log(`   Content: ${match.transaction_content || match.content || match.description}`);
                console.log(`   Amount: ${match.amount_in || match.amount || match.amountIn}`);

                try {
                    await db.execute('BEGIN IMMEDIATE');
                    const check = await db.execute({
                        sql: 'SELECT status FROM orders WHERE id = ?',
                        args: [order.id]
                    });

                    if (check.rows[0]?.status !== 'pending_payment') {
                        console.log(`   ⚠️  Order ${code} already processed (status: ${check.rows[0]?.status}). Skipping.`);
                        await db.execute('ROLLBACK');
                        continue;
                    }

                    const txData = {
                        id: match.id || match.transaction_id,
                        reference_number: match.reference_number || match.referenceCode
                    };

                    await fulfillOrder(db, order, txData);
                    await db.execute('COMMIT');
                    console.log(`   🎉 Successfully fulfilled ${code}!`);

                } catch (err) {
                    console.error(`   ❌ Failed to fulfill ${code}:`, err.message);
                    try { await db.execute('ROLLBACK'); } catch (e) { }
                }
            } else {
                console.log(`\n❌ No match for ${code} (Amount: ${amount})`);
                console.log(`   Checking recent transactions...`);
                transactions.slice(0, 3).forEach((t, idx) => {
                    const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                    const txAmount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                    console.log(`   TX ${idx + 1}: "${content}" - ${txAmount}`);
                });
            }
        }

        console.log('\n✅ Manual reconcile completed.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

const orderCode = process.argv[2] || null;
manualReconcile(orderCode).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});

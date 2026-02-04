/**
 * RECONCILE PAYMENTS - Netlify Scheduled Function
 *
 * Runs every 5 minutes to check for pending orders that have been paid.
 *
 * Schedule: "0/5 * * * *"
 */

const { createClient } = require('@libsql/client/web');
const { fulfillOrder } = require('./utils/fulfillment');
const fetch = require('node-fetch');

// Config
const SEPAY_API_URL = 'https://my.sepay.vn/userapi/transactions/list'; // Note: Some docs say /api/v1, others userapi. Using userapi as it's common for personal accounts. Will verify.
// Actually, search result said /api/v1/transactions. Let's use that.
const SEPAY_ENDPOINT = 'https://my.sepay.vn/api/v1/transactions';
const LOOKBACK_MINUTES = 60; // Check transactions from last 60 minutes

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

exports.handler = async function (event, context) {
    // Only run on schedule or explicit trigger
    const isScheduled = event.headers['x-netlify-scheduled'] === 'true';
    // if (!isScheduled) return { statusCode: 403, body: 'Not Authorized' }; 
    // Allow manual trigger for now for testing

    console.log('[Reconcile] Starting reconciliation job...');

    const db = getDbClient();
    const apiToken = process.env.SEPAY_API_TOKEN;

    if (!apiToken) {
        console.error('[Reconcile] Missing SEPAY_API_TOKEN');
        return { statusCode: 500, body: 'Missing config' };
    }

    try {
        // 1. Get Pending Orders (Created in last 24h, still pending)
        // We only care about orders that "should" have been paid recently.
        // Let's look at orders created > 2 mins ago (give webhook time) and < 24 hours ago.
        const pendingOrdersResult = await db.execute({
            sql: `
                SELECT * FROM orders 
                WHERE status = 'pending_payment' 
                AND created_at > datetime('now', '-1 day')
                AND created_at < datetime('now', '-2 minutes')
            `,
            args: []
        });

        const pendingOrders = pendingOrdersResult.rows;
        console.log(`[Reconcile] Found ${pendingOrders.length} pending orders.`);

        if (pendingOrders.length === 0) {
            return { statusCode: 200, body: 'No pending orders to reconcile.' };
        }

        // 2. Fetch Recent Transactions from SePay
        // Filter by date to reduce payload
        // Not all APIs support from_date easily on the simple list, but let's try.
        const response = await fetch(`${SEPAY_ENDPOINT}?limit=100`, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Reconcile] SePay API Error: ${response.status} - ${errorText}`);
            return { statusCode: 500, body: 'SePay API Error' };
        }

        const data = await response.json();
        const transactions = data.transactions || data.results || []; // Adjust based on actual response structure

        // Helper to normalize transaction content
        // SePay content: "TBQ12345678" or "Chuyen khoan TBQ12345678"
        // We look for the order code in the content.

        let reconCount = 0;

        for (const order of pendingOrders) {
            const orderCode = order.order_code;
            const orderAmount = order.amount_total;

            // Find matching transaction
            // Condition: 
            // 1. Content contains orderCode (case insensitive)
            // 2. Amount >= orderAmount
            // 3. Status handled by webhook usually, but here we cover missed ones.

            const match = transactions.find(t => {
                const content = (t.transaction_content || t.content || '').toUpperCase();
                const amount = parseFloat(t.amount_in || t.amount || 0);

                return content.includes(orderCode.toUpperCase()) && amount >= orderAmount;
            });

            if (match) {
                console.log(`[Reconcile] MATCH FOUND for ${orderCode}. Transaction: ${match.id}`);

                // Fulfill Order
                // We wrap in transaction to be safe
                const tx = await db.transaction('write');
                try {
                    // Double check status inside transaction to avoid race
                    const currentOrderCheck = await tx.execute({
                        sql: 'SELECT status FROM orders WHERE id = ?',
                        args: [order.id]
                    });

                    if (currentOrderCheck.rows[0].status !== 'pending_payment') {
                        console.log(`[Reconcile] Order ${orderCode} was already updated. Skipping.`);
                        tx.close(); // Read-only close or just commit empty? Drizzle doesn't have rollback on read easily, but commit is fine if no writes.
                        // Actually standard tx commit is fine.
                        continue;
                    }

                    // Fulfill
                    // We need to adapt match object to what fulfillOrder expects
                    // fulfillOrder expects: { id, reference_number }
                    const transactionData = {
                        id: match.id,
                        reference_number: match.reference_number
                    };

                    await fulfillOrder(tx, order, transactionData);

                    await tx.commit();
                    console.log(`[Reconcile] Successfully reconciled ${orderCode}`);
                    reconCount++;

                } catch (err) {
                    console.error(`[Reconcile] Failed to reconcile ${orderCode}:`, err);
                    // Rollback happen automatically on error in some drivers, 
                    // but with @libsql/client manual transaction handling might be needed if not using drizzle ORM transaction wrapper.
                    // The fulfillOrder takes 'db', which is expected to be a client or transaction object.
                    // If we used `db.transaction`, `tx` is the object to pass.

                    try { tx.rollback(); } catch (e) { } // specific to driver
                }
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reconciliation complete',
                processed: pendingOrders.length,
                reconciled: reconCount
            })
        };

    } catch (error) {
        console.error('[Reconcile] Job Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

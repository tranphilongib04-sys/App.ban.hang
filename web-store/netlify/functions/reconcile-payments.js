/**
 * RECONCILE PAYMENTS - Netlify Scheduled Function
 *
 * Runs every 5 minutes to check for pending orders that have been paid.
 *
 * Schedule: "0/5 * * * *"
 */

const { createClient } = require('@libsql/client/web');
const { fulfillOrder } = require('./utils/fulfillment');

// Config
// Keep this aligned with `check-payment.js` to avoid mismatched APIs.
const SEPAY_ENDPOINT = 'https://my.sepay.vn/userapi/transactions/list';
const SEPAY_LIST_LIMIT = 200;
const LOOKBACK_MINUTES = 180; // 3 hours lookback (handles delayed webhook / bank posting)
const AMOUNT_TOLERANCE = 0.95;

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
        const response = await fetch(`${SEPAY_ENDPOINT}?limit=${SEPAY_LIST_LIMIT}`, {
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
        const transactions = data.transactions || data.results || [];

        function isTxWithinLookback(txDateRaw) {
            try {
                const txTime = new Date(txDateRaw);
                const diffMins = (Date.now() - txTime.getTime()) / 60000;
                return diffMins >= -10 && diffMins <= LOOKBACK_MINUTES;
            } catch {
                return true; // If parsing fails, don't exclude
            }
        }

        let reconCount = 0;

        for (const order of pendingOrders) {
            const orderCode = order.order_code;
            const orderAmount = order.amount_total;

            // Find matching transaction
            // Condition: 
            // 1. Content contains orderCode (case insensitive)
            // 2. Amount >= orderAmount * tolerance
            // 3. Status handled by webhook usually, but here we cover missed ones.

            const match = transactions.find(t => {
                const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                const amount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                const dateOk = isTxWithinLookback(t.transaction_date || t.transactionDate || t.date || t.created_at);
                const code = orderCode.toUpperCase();
                // Match nhiều format: "IBFT TBQ20824761", "MBVCB.xxx.TBQ20824761", hoặc chỉ số
                const contentMatch = content.includes(code) || content.includes(code.replace('TBQ', ''));
                const amountMatch = amount >= (orderAmount * AMOUNT_TOLERANCE);

                return dateOk && contentMatch && amountMatch;
            });

            if (match) {
                console.log(`[Reconcile] MATCH FOUND for ${orderCode}. Transaction: ${match.id}`);

                // Fulfill Order - wrap per order in BEGIN/COMMIT (same pattern as webhook/check-payment)
                try {
                    await db.execute('BEGIN IMMEDIATE');
                    const currentOrderCheck = await db.execute({
                        sql: 'SELECT status FROM orders WHERE id = ?',
                        args: [order.id]
                    });

                    if (currentOrderCheck.rows[0]?.status !== 'pending_payment') {
                        console.log(`[Reconcile] Order ${orderCode} was already updated. Skipping.`);
                        await db.execute('ROLLBACK');
                        continue;
                    }

                    const transactionData = {
                        id: match.id,
                        reference_number: match.reference_number || match.referenceCode || match.reference_number
                    };

                    await fulfillOrder(db, order, transactionData);
                    await db.execute('COMMIT');
                    console.log(`[Reconcile] Successfully reconciled ${orderCode}`);
                    reconCount++;

                } catch (err) {
                    console.error(`[Reconcile] Failed to reconcile ${orderCode}:`, err);
                    try { await db.execute('ROLLBACK'); } catch (e) { }
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

/**
 * RECONCILE PAYMENTS - Netlify Scheduled Function
 *
 * Runs every 5 minutes to check for pending orders that have been paid.
 *
 * Schedule: "0/5 * * * *"
 */

const { createClient } = require('@libsql/client/web');
const { finalizeOrder, ensurePaymentSchema } = require('./utils/fulfillment');

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

        // ensurePaymentSchema once per job run – DDL cannot run inside BEGIN
        await ensurePaymentSchema(db);

        let reconCount = 0;

        for (const order of pendingOrders) {
            const orderCode = order.order_code;
            const orderAmount = order.amount_total;

            const match = transactions.find(t => {
                const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                const amount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                const dateOk = isTxWithinLookback(t.transaction_date || t.transactionDate || t.date || t.created_at);
                const code = orderCode.toUpperCase();
                const contentMatch = content.includes(code) || content.includes(code.replace('TBQ', ''));
                const amountMatch = amount >= (orderAmount * AMOUNT_TOLERANCE);
                return dateOk && contentMatch && amountMatch;
            });

            if (match) {
                console.log(`[Reconcile] MATCH for ${orderCode} → tx ${match.id}`);
                try {
                    await db.execute('BEGIN IMMEDIATE');

                    const transactionData = {
                        id: match.id || match.transaction_id,
                        reference_number: match.reference_number || match.referenceCode || match.id
                    };

                    const result = await finalizeOrder(db, order, transactionData, 'reconcile');
                    await db.execute('COMMIT');

                    if (result.alreadyFulfilled) {
                        console.log(`[Reconcile] ${orderCode} already fulfilled – skipped`);
                    } else {
                        console.log(`[Reconcile] ${orderCode} reconciled OK`);
                        reconCount++;
                    }
                } catch (err) {
                    console.error(`[Reconcile] Failed ${orderCode}:`, err.message);
                    try { await db.execute('ROLLBACK'); } catch { /* ignore */ }
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

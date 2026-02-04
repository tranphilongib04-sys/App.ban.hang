/**
 * SEPAY WEBHOOK - Netlify Function
 * 
 * POST /webhook-sepay
 * Receives payment notifications from SePay
 */

const { createClient } = require('@libsql/client');
const { fulfillOrder } = require('./utils/fulfillment');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);

        // SePay Payloads vary, but usually contain:
        // { id, transactionDate, amountIn, transactionContent, referenceCode, ... }
        // CRITICAL: Verify API Token if possible, or Order Code match

        // 1. Validate SePay Token
        // SePay sends "Authorization: Bearer <token>"
        const authHeader = event.headers['authorization'] || event.headers['Authorization'];
        const incomingToken = authHeader ? authHeader.replace('Bearer ', '') : body.api_token;

        const expectedToken = process.env.SEPAY_API_TOKEN;

        if (!expectedToken) {
            console.error('[Webhook] SEPAY_API_TOKEN not configured on server');
            // Fail open or closed? Closed is safer, but if config missing, system is broken.
            return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server configuration error' }) };
        }

        if (incomingToken !== expectedToken) {
            console.warn('[Webhook] Invalid Token:', incomingToken);
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
        }

        const transactionContent = body.content || body.transaction_content || '';
        const orderCodeMatch = transactionContent.match(/TBQ\d+/);

        if (!orderCodeMatch) {
            console.log('Webhook ignored: No order code found in content', transactionContent);
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'No order code found' }) };
        }

        const orderCode = orderCodeMatch[0];
        const amountIn = parseFloat(body.amountIn || body.amount_in || 0);

        const db = getDbClient();

        // 2. Find Order
        const orderResult = await db.execute({
            sql: `SELECT * FROM orders WHERE order_code = ? LIMIT 1`,
            args: [orderCode]
        });

        if (orderResult.rows.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Order not found' }) };
        }

        const order = orderResult.rows[0];

        // 3. Check Amount (Tolerance 95%)
        if (amountIn < order.amount_total * 0.95) {
            console.log(`Insufficient amount for ${orderCode}: Received ${amountIn}, Needed ${order.amount_total}`);
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Insufficient amount' }) };
        }

        if (order.status === 'fulfilled') {
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Already fulfilled' }) };
        }

        // 4. Fulfill
        await db.execute('BEGIN IMMEDIATE');
        try {
            // Mock transaction object from Webhook body
            const transaction = {
                id: body.id || body.transaction_id || `SEPAY-${Date.now()}`,
                reference_number: body.referenceCode || body.reference_number
            };

            await fulfillOrder(db, order, transaction);

            await db.execute('COMMIT');
            console.log(`Webhook: Order ${orderCode} fulfilled successfully.`);

            return { statusCode: 200, body: JSON.stringify({ success: true }) };

        } catch (err) {
            await db.execute('ROLLBACK');
            throw err;
        }

    } catch (error) {
        console.error('Webhook Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

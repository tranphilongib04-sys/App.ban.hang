/**
 * SEPAY WEBHOOK - Netlify Function
 * 
 * POST /webhook-sepay
 * Receives payment notifications from SePay
 */

const { createClient } = require('@libsql/client/web');
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

        // Log incoming webhook for debugging
        console.log('[Webhook] Received payload:', JSON.stringify(body, null, 2));
        console.log('[Webhook] Headers:', JSON.stringify(event.headers, null, 2));

        // SePay Payloads vary, but usually contain:
        // { id, transactionDate, amountIn, transactionContent, referenceCode, ... }
        // CRITICAL: Verify API Token if possible, or Order Code match

        // 1. Validate SePay Token
        // SePay sends "Authorization: Apikey <key>" (NOT Bearer!)
        const authHeader = event.headers['authorization'] || event.headers['Authorization'];
        let incomingToken = null;

        if (authHeader) {
            // Support both "Bearer <token>" and "Apikey <key>"
            if (authHeader.startsWith('Bearer ')) {
                incomingToken = authHeader.replace('Bearer ', '');
            } else if (authHeader.startsWith('Apikey ')) {
                incomingToken = authHeader.replace('Apikey ', '');
            } else {
                // Fallback: treat entire header as token
                incomingToken = authHeader;
            }
        } else if (body.api_token) {
            incomingToken = body.api_token;
        }

        const expectedToken = process.env.SEPAY_API_TOKEN;

        console.log('[Webhook] Incoming Token:', incomingToken ? `${incomingToken.substring(0, 10)}...` : 'MISSING');
        console.log('[Webhook] Expected Token:', expectedToken ? 'SET' : 'NOT SET');
        console.log('[Webhook] Token Match:', incomingToken === expectedToken);

        if (!expectedToken) {
            console.error('[Webhook] SEPAY_API_TOKEN not configured on server');
            // Fail open or closed? Closed is safer, but if config missing, system is broken.
            return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server configuration error' }) };
        }

        if (incomingToken !== expectedToken) {
            console.warn('[Webhook] Invalid Token - Authentication Failed');
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
        }

        console.log('[Webhook] Authentication successful ✓');


        const transactionContent = body.content || body.transaction_content || '';
        const orderCodeMatch = transactionContent.match(/TBQ\d+/);

        if (!orderCodeMatch) {
            console.log('[Webhook] Ignored: No order code found in content:', transactionContent);
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'No order code found' }) };
        }

        const orderCode = orderCodeMatch[0];
        const amountIn = parseFloat(body.amountIn || body.amount_in || 0);

        console.log('[Webhook] Processing order:', orderCode, 'Amount:', amountIn);

        const db = getDbClient();

        // 2. Find Order
        const orderResult = await db.execute({
            sql: `SELECT * FROM orders WHERE order_code = ? LIMIT 1`,
            args: [orderCode]
        });

        if (orderResult.rows.length === 0) {
            console.log('[Webhook] Order not found:', orderCode);
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Order not found' }) };
        }

        const order = orderResult.rows[0];
        console.log('[Webhook] Order found - ID:', order.id, 'Status:', order.status, 'Amount:', order.amount_total);

        // 3. Check Amount (Tolerance 95%)
        if (amountIn < order.amount_total * 0.95) {
            console.log(`[Webhook] Insufficient amount for ${orderCode}: Received ${amountIn}, Needed ${order.amount_total}`);
            return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Insufficient amount' }) };
        }

        if (order.status === 'fulfilled') {
            console.log(`[Webhook] Order ${orderCode} already fulfilled. Idempotent return.`);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Already fulfilled' }) };
        }

        // 4. Fulfill Order
        // CRITICAL FIX: Ensure schema BEFORE transaction (DDL cannot run in active transaction)
        const { ensurePaymentSchema } = require('./utils/fulfillment');
        await ensurePaymentSchema(db);

        await db.execute('BEGIN IMMEDIATE');
        try {
            // Mock transaction object from Webhook body
            const transaction = {
                id: body.id || body.transaction_id || `SEPAY-${Date.now()}`,
                reference_number: body.referenceCode || body.reference_number
            };

            // Pass skipSchemaCheck=true since we already called ensurePaymentSchema above
            await fulfillOrder(db, order, transaction, true);

            await db.execute('COMMIT');
            console.log(`✅ [Webhook] Order ${orderCode} fulfilled successfully.`);

            return { statusCode: 200, body: JSON.stringify({ success: true }) };

        } catch (err) {
            console.error(`❌ [Webhook] Fulfillment failed for ${orderCode}:`, err);
            await db.execute('ROLLBACK');
            throw err;
        }

    } catch (error) {
        console.error('❌ [Webhook] CRITICAL ERROR:', {
            orderCode: error.orderCode || 'UNKNOWN',
            message: error.message,
            stack: error.stack
        });
        return {
            statusCode: 500, body: JSON.stringify({
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

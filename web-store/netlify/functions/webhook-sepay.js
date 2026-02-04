/**
 * SEPAY WEBHOOK - Netlify Function
 * 
 * POST /webhook-sepay
 * Receives payment notifications from SePay
 */

const { createClient } = require('@libsql/client/web');
const { finalizeOrder, ensurePaymentSchema } = require('./utils/fulfillment');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

// ---------------------------------------------------------------------------
// Extract order-code (TBQ…) from any field SePay might use.
// Handles: "IBFT TBQ20824761", "MBVCB.xxx.TBQ20824761", plain "TBQ20824761"
// ---------------------------------------------------------------------------
function extractOrderCode(body) {
    const candidates = [
        body.content,
        body.transaction_content,
        body.transactionContent,
        body.description,
        body.Description,
        body.Content,
        body.Transaction_content,
        body.TransactionContent
    ];
    for (const raw of candidates) {
        if (!raw) continue;
        const m = String(raw).match(/TBQ\d+/i);
        if (m) return m[0].toUpperCase();
    }
    return null;
}

// ---------------------------------------------------------------------------
// Extract the canonical transaction-id that SePay sends.
// Falls back to a stable synthetic key so idempotency index still works.
// ---------------------------------------------------------------------------
function extractTransactionId(body) {
    return body.id
        || body.transaction_id
        || body.transactionId
        || body.referenceCode
        || body.reference_number
        || body.referenceNumber
        || null;                       // will be synthesised below if still null
}

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        console.error('[Webhook] Malformed JSON body:', e.message);
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Bad JSON' }) };
    }

    // ------------------------------------------------------------------
    // 1. Log raw header format so you can see exactly what SePay sends.
    //    (sanitised: only first 8 chars of any token value are logged)
    // ------------------------------------------------------------------
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const authScheme = authHeader.split(' ')[0] || 'NONE';   // Bearer | Apikey | raw | NONE
    console.log('[Webhook] Auth header scheme:', authScheme,
        '| raw prefix:', authHeader ? `"${authHeader.substring(0, 20)}…"` : 'MISSING');
    console.log('[Webhook] Payload keys:', Object.keys(body).join(', '));

    // ------------------------------------------------------------------
    // 2. Token verification
    //    - Dedicated SEPAY_WEBHOOK_TOKEN preferred (set this in Netlify env).
    //    - Falls back to SEPAY_API_TOKEN for backwards compatibility.
    //    - If NO token arrives at all  → 200 + log warning, do NOT fulfill
    //      (fail-safe: SePay retries on non-2xx, so 401 would stop retries).
    // ------------------------------------------------------------------
    const expectedToken = process.env.SEPAY_WEBHOOK_TOKEN || process.env.SEPAY_API_TOKEN;

    if (!expectedToken) {
        console.error('[Webhook] Neither SEPAY_WEBHOOK_TOKEN nor SEPAY_API_TOKEN configured');
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server configuration error' }) };
    }

    // Extract token from header (Bearer / Apikey / raw) or body.api_token
    let incomingToken = null;
    if (authHeader) {
        const parts = authHeader.split(' ');
        incomingToken = parts.length >= 2 ? parts.slice(1).join(' ') : parts[0];
    } else if (body.api_token) {
        incomingToken = body.api_token;
    }

    if (!incomingToken) {
        // No token at all – fail-safe: acknowledge but skip fulfillment
        console.warn('[Webhook] WARNING: No token received (header or body). Returning 200 without fulfillment.');
        return { statusCode: 200, body: JSON.stringify({ success: false, message: 'No token provided – skipped' }) };
    }

    console.log('[Webhook] Token match:', incomingToken === expectedToken,
        '| incoming prefix:', incomingToken.substring(0, 8) + '…');

    if (incomingToken !== expectedToken) {
        console.warn('[Webhook] Token mismatch – rejected');
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized' }) };
    }

    console.log('[Webhook] Auth OK');

    // ------------------------------------------------------------------
    // 3. Parse order code from every possible content field
    // ------------------------------------------------------------------
    const orderCode = extractOrderCode(body);
    if (!orderCode) {
        console.log('[Webhook] No TBQ order code found. Payload content fields:',
            JSON.stringify({
                content: body.content,
                transaction_content: body.transaction_content,
                transactionContent: body.transactionContent,
                description: body.description
            }));
        return { statusCode: 200, body: JSON.stringify({ success: false, message: 'No order code found' }) };
    }

    const amountIn = parseFloat(body.amountIn || body.amount_in || body.amount || 0);
    console.log('[Webhook] orderCode:', orderCode, '| amountIn:', amountIn);

    // ------------------------------------------------------------------
    // 4. DB: find order, amount-check, idempotency guard
    // ------------------------------------------------------------------
    const db = getDbClient();

    // ensurePaymentSchema MUST run before any BEGIN (DDL auto-commits)
    await ensurePaymentSchema(db);

    const orderResult = await db.execute({
        sql: `SELECT * FROM orders WHERE order_code = ? LIMIT 1`,
        args: [orderCode]
    });

    if (orderResult.rows.length === 0) {
        console.log('[Webhook] Order not found:', orderCode);
        return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Order not found' }) };
    }

    const order = orderResult.rows[0];
    console.log('[Webhook] Order ID:', order.id, '| status:', order.status, '| amount_total:', order.amount_total);

    if (amountIn < order.amount_total * 0.95) {
        console.log('[Webhook] Insufficient amount –', amountIn, 'vs', order.amount_total);
        return { statusCode: 200, body: JSON.stringify({ success: false, message: 'Insufficient amount' }) };
    }

    if (order.status === 'fulfilled') {
        console.log('[Webhook] Already fulfilled – idempotent 200');
        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Already fulfilled' }) };
    }

    // Stable transaction id for idempotency index (payments.transaction_id UNIQUE)
    const rawTxId = extractTransactionId(body);
    const txId = rawTxId || `SEPAY-${orderCode}-${amountIn}`;   // deterministic fallback
    console.log('[Webhook] txId:', txId, rawTxId ? '(from payload)' : '(synthesised)');

    // Double-check: if this exact txId already recorded → idempotent skip
    const existingPayment = await db.execute({
        sql: `SELECT id FROM payments WHERE provider = 'sepay' AND transaction_id = ? LIMIT 1`,
        args: [txId]
    });
    if (existingPayment.rows.length > 0) {
        console.log('[Webhook] Payment already recorded for txId', txId, '– idempotent 200');
        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Already processed' }) };
    }

    // ------------------------------------------------------------------
    // 5. Fulfill inside IMMEDIATE transaction
    // ------------------------------------------------------------------
    await db.execute('BEGIN IMMEDIATE');
    try {
        const transaction = {
            id: txId,
            reference_number: body.referenceCode || body.reference_number || body.referenceNumber || txId
        };

        await finalizeOrder(db, order, transaction, 'webhook');

        await db.execute('COMMIT');
        console.log('[Webhook] Order', orderCode, 'fulfilled OK');

        return { statusCode: 200, body: JSON.stringify({ success: true }) };

    } catch (err) {
        console.error('[Webhook] Fulfillment error for', orderCode, ':', err.message);
        try { await db.execute('ROLLBACK'); } catch { /* ignore */ }
        throw err;
    }
};

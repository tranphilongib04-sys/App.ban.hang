/**
 * ORDER STATUS – lightweight poll endpoint
 *
 * GET /.netlify/functions/order-status?code=TBQ12345678
 *
 * Returns current order + payment + delivery state.
 * Designed to be polled every 3-5 s by Public Store confirmation page
 * and every 5-10 s by Web Admin dashboard.
 *
 * No mutation – read-only, no auth required (order_code is the secret).
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) return null;
    return createClient({ url, authToken });
}

function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    // Allow browsers to cache for up to 2 s (reduces hammering on rapid polls)
    'Cache-Control': 'max-age=2'
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { code } = event.queryStringParameters || {};
    if (!code) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing ?code=' }) };
    }

    const db = getDbClient();
    if (!db) {
        return { statusCode: 503, headers, body: JSON.stringify({ error: 'DB not configured' }) };
    }

    try {
        // Single query: order + latest payment + invoice (LEFT JOINs – always returns the order row)
        const row = await db.execute({
            sql: `SELECT
                    o.id, o.order_code, o.status, o.amount_total, o.created_at, o.updated_at, o.customer_email,
                    p.status          AS payment_status,
                    p.transaction_id  AS payment_tx_id,
                    p.confirmed_at    AS payment_confirmed_at,
                    i.invoice_number
                  FROM orders o
                  LEFT JOIN payments  p ON o.id = p.order_id
                  LEFT JOIN invoices  i ON o.id = i.order_id
                  WHERE o.order_code = ?
                  LIMIT 1`,
            args: [code]
        });

        if (row.rows.length === 0) {
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Order not found' }) };
        }

        const o = row.rows[0];

        const payload = {
            orderCode:     o.order_code,
            status:        o.status,                  // pending_payment | paid | fulfilled | failed | refunded
            paymentStatus: o.payment_status || null,
            paymentTxId:   o.payment_tx_id  || null,
            paymentAt:     o.payment_confirmed_at || null,
            invoiceNumber: o.invoice_number || null,
            updatedAt:     o.updated_at
        };

        // If fulfilled, attach delivery token so the client can redirect immediately
        if (o.status === 'fulfilled') {
            payload.deliveryToken = generateDeliveryToken(o.id, o.customer_email);
            payload.deliveryUrl   = `/.netlify/functions/delivery?token=${payload.deliveryToken}&order=${o.order_code}`;
        }

        return { statusCode: 200, headers, body: JSON.stringify(payload) };

    } catch (err) {
        console.error('[order-status] DB error:', err.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
    }
};

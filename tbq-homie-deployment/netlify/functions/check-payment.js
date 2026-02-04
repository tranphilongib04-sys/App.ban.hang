/**
 * CHECK PAYMENT & AUTO-DELIVERY - Netlify Function (V2)
 *
 * GET /check-payment?orderCode=TBQ12345678&amount=70000
 *
 * Flow:
 * 1. Check SePay API for matching transaction
 * 2. If paid: Update payment, order, allocations, stock units
 * 3. Auto-deliver: Generate delivery content (credentials)
 * 4. Create invoice
 * 5. Return payment status and delivery info
 */

const { createClient } = require('@libsql/client/web');
const crypto = require('crypto');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) return null; // Demo mode
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
};

// Keep in sync with reconcile-payments.js for better reliability.
const SEPAY_LIST_LIMIT = 200;
const LOOKBACK_MINUTES = 180; // allow delayed posting
const AMOUNT_TOLERANCE = 0.95;

// Decrypt password (simple base64 decode for now - you should use proper AES-GCM)
function decryptPassword(encrypted, iv) {
    try {
        return Buffer.from(encrypted, 'base64').toString('utf8');
    } catch {
        return '[ENCRYPTED]';
    }
}

// Generate delivery token (for secure access) — must match delivery.js verify function
function generateDeliveryToken(orderId, email, nonce) {
    const secret = process.env.DELIVERY_SECRET;
    if (!secret) {
        throw new Error('DELIVERY_SECRET must be configured in environment variables');
    }

    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${nonce}|${day}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 32);
}

// Rate Limiting Config for Check Payment (higher limit)
const RATE_LIMIT_CHECK_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_CHECK_MAX_REQUESTS = 300; // 300 checks per minute per IP

async function checkRateLimit(db, ip) {
    // Ensure table exists (quick check)
    await db.execute(`
        CREATE TABLE IF NOT EXISTS rate_limits (
            ip TEXT PRIMARY KEY,
            count INTEGER DEFAULT 0,
            reset_at DATETIME
        )
    `);

    const now = new Date();
    const result = await db.execute({
        sql: 'SELECT count, reset_at FROM rate_limits WHERE ip = ?',
        args: [ip]
    });

    let count = 0;
    let resetAt = new Date(now.getTime() + RATE_LIMIT_CHECK_WINDOW_MS);

    if (result.rows.length > 0) {
        const row = result.rows[0];
        const rowResetAt = new Date(row.reset_at);

        if (now > rowResetAt) {
            // Expired, reset
            count = 1;
            // resetAt is already set to now + window
        } else {
            // Still in window
            count = row.count + 1;
            resetAt = rowResetAt;
        }
    } else {
        count = 1;
    }

    // Update DB
    await db.execute({
        sql: `INSERT INTO rate_limits (ip, count, reset_at) VALUES (?, ?, ?) 
              ON CONFLICT(ip) DO UPDATE SET count = ?, reset_at = ?`,
        args: [ip, count, resetAt.toISOString(), count, resetAt.toISOString()]
    });

    return count <= RATE_LIMIT_CHECK_MAX_REQUESTS;
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { orderCode, amount } = event.queryStringParameters || {};
    const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

    // Capture IP
    const ipAddress = (event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();


    if (!orderCode) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing orderCode' })
        };
    }

    try {
        const db = getDbClient();

        // Rate Limit Check (only if DB is available)
        if (db) {
            const isAllowed = await checkRateLimit(db, ipAddress);
            if (!isAllowed) {
                return {
                    statusCode: 429,
                    headers,
                    body: JSON.stringify({ success: false, error: 'Too many requests' })
                };
            }
        }

        // Get order with lines and allocations
        let order = null;
        if (db) {
            const orderResult = await db.execute({
                sql: `
                    SELECT o.*, 
                           GROUP_CONCAT(ol.id) as line_ids,
                           GROUP_CONCAT(ol.quantity) as quantities
                    FROM orders o
                    LEFT JOIN order_lines ol ON o.id = ol.order_id
                    WHERE o.order_code = ?
                    GROUP BY o.id
                `,
                args: [orderCode]
            });
            order = orderResult.rows[0];

            // If already fulfilled, return immediately
            if (order && order.status === 'fulfilled') {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        status: 'paid',
                        alreadyProcessed: true,
                        deliveryToken: generateDeliveryToken(order.id, order.customer_email, order.delivery_nonce),
                        message: 'Đơn hàng đã được xử lý. Vui lòng kiểm tra email hoặc liên hệ hỗ trợ.'
                    })
                };
            }
        }

        // Check SePay for payment
        let paidTransaction = null;

        if (SEPAY_API_TOKEN && order) {
            try {
                const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=${SEPAY_LIST_LIMIT}`, {
                    headers: {
                        'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const transactions = data.transactions || [];

                    // Find matching transaction
                    paidTransaction = transactions.find(t => {
                        const content = (t.transaction_content || '').toUpperCase();
                        const code = orderCode.toUpperCase();
                        const isContentMatch = content.includes(code);
                        const txAmount = parseFloat(t.amount_in) || 0;
                        const expectedAmount = parseFloat(amount) || parseFloat(order.amount_total);
                        const isAmountMatch = txAmount >= expectedAmount * AMOUNT_TOLERANCE;

                        let isRecentTx = true;
                        try {
                            const txTime = new Date(t.transaction_date);
                            const diffMins = (Date.now() - txTime.getTime()) / 60000;
                            isRecentTx = diffMins < LOOKBACK_MINUTES && diffMins > -10;
                        } catch (e) { }

                        if (isContentMatch && isAmountMatch) return true;
                        if (isAmountMatch && isRecentTx && txAmount >= expectedAmount * 0.99) return true;
                        return false;
                    });
                }
            } catch (sepayError) {
                console.error('SePay API error:', sepayError);
            }
        }

        // If payment found, process delivery
        if (paidTransaction && db && order && order.status === 'pending_payment') {
            await db.execute('BEGIN IMMEDIATE');

            try {
                // USE SHARED FULFILLMENT LOGIC
                const { fulfillOrder } = require('./utils/fulfillment');
                const result = await fulfillOrder(db, order, paidTransaction);

                await db.execute('COMMIT');

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        status: 'paid',
                        transaction: {
                            id: paidTransaction.id,
                            amount: paidTransaction.amount_in,
                            date: paidTransaction.transaction_date
                        },
                        deliveryToken: result.deliveryToken,
                        invoiceNumber: result.invoiceNumber,
                        message: 'Thanh toán thành công! Đơn hàng đã được giao tự động.',
                        redirectUrl: `/delivery?token=${result.deliveryToken}&order=${orderCode}`
                    })
                };

            } catch (error) {
                await db.execute('ROLLBACK');
                throw error;
            }
        }

        // Not paid yet
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'pending',
                message: 'Chưa nhận được thanh toán. Vui lòng chờ 1-2 phút sau khi chuyển khoản.'
            })
        };

    } catch (error) {
        console.error('Check payment error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

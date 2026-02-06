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

// Generate delivery token (for secure access) — must match delivery.js verifyDeliveryToken (day-based, 7-day window)
function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
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
            try {
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
                    // Check if this order has upgrade_request fulfillment type
                    const lineResult = await db.execute({
                        sql: `SELECT fulfillment_type FROM order_lines WHERE order_id = ? LIMIT 1`,
                        args: [order.id]
                    });
                    const fulfillmentType = lineResult.rows[0]?.fulfillment_type || 'auto';

                    const response = {
                        status: 'paid',
                        alreadyProcessed: true,
                        fulfillmentType: fulfillmentType,
                        message: fulfillmentType === 'upgrade_request'
                            ? 'Đơn hàng đã thanh toán. Vui lòng gửi thông tin tài khoản để được nâng cấp.'
                            : 'Đơn hàng đã được xử lý. Vui lòng kiểm tra email hoặc liên hệ hỗ trợ.'
                    };

                    // Only include deliveryToken for auto fulfillment
                    if (fulfillmentType !== 'upgrade_request') {
                        response.deliveryToken = generateDeliveryToken(order.id, order.customer_email);
                    }

                    return { statusCode: 200, headers, body: JSON.stringify(response) };
                }
            } catch (dbError) {
                console.error('[CheckPayment] Database query error:', dbError);
                // Don't fail completely - continue without order data
                order = null;
            }
        }

        // Check SePay for payment
        let paidTransaction = null;

        if (!SEPAY_API_TOKEN) {
            console.warn(`[CheckPayment] SEPAY_API_TOKEN not configured for order ${orderCode}`);
        }

        if (SEPAY_API_TOKEN && order) {
            try {
                const response = await fetch(`https://my.sepay.vn/userapi/transactions/list?limit=${SEPAY_LIST_LIMIT}`, {
                    headers: {
                        'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[CheckPayment] SePay API error ${response.status}: ${errorText}`);
                }

                if (response.ok) {
                    const data = await response.json();
                    const transactions = data.transactions || [];
                    console.log(`[CheckPayment] SePay returned ${transactions.length} transactions for order ${orderCode}`);

                    // Find matching transaction - STRICT validation required
                    // P0 FIX: MUST match order_code in content AND amount AND recency - all three required
                    paidTransaction = transactions.find(t => {
                        const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                        const code = orderCode.toUpperCase();

                        // STRICT RULE: Content MUST contain the order code
                        // Match formats: "IBFT TBQ20824761", "MBVCB.xxx.TBQ20824761", "TBQ20824761", "20824761"
                        const orderCodeNumber = code.replace('TBQ', '');
                        const isContentMatch = content.includes(code) ||
                                              (orderCodeNumber.length >= 8 && content.includes(orderCodeNumber));

                        // If content doesn't match order code, reject immediately
                        if (!isContentMatch) {
                            return false;
                        }

                        // Amount validation (with tolerance for fees)
                        const txAmount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                        const expectedAmount = parseFloat(amount) || parseFloat(order.amount_total);
                        const isAmountMatch = txAmount >= expectedAmount * AMOUNT_TOLERANCE;

                        // Time validation (must be recent)
                        let isRecentTx = false;
                        try {
                            const txTime = new Date(t.transaction_date || t.transactionDate || t.date || t.created_at);
                            const diffMins = (Date.now() - txTime.getTime()) / 60000;
                            isRecentTx = diffMins < LOOKBACK_MINUTES && diffMins > -10;
                        } catch (e) {
                            isRecentTx = true; // If can't parse date, don't reject
                        }

                        // STRICT: Must have content match AND amount match AND recent
                        const matched = isContentMatch && isAmountMatch && isRecentTx;

                        if (matched) {
                            console.log(`[CheckPayment] STRICT Match: Order ${orderCode}, TX: ${t.id || t.transaction_id}, Content: ${content}, Amount: ${txAmount}, Expected: ${expectedAmount}`);
                        }
                        return matched;
                    });

                    if (!paidTransaction && transactions.length > 0) {
                        console.log(`[CheckPayment] No match found for ${orderCode}. Checking transactions...`);
                        transactions.slice(0, 5).forEach((t, idx) => {
                            const content = (t.transaction_content || t.content || t.description || '').toUpperCase();
                            const txAmount = parseFloat(t.amount_in || t.amount || t.amountIn || 0);
                            console.log(`  TX ${idx + 1}: Content="${content}", Amount=${txAmount}, Expected=${parseFloat(amount) || parseFloat(order.amount_total)}`);
                        });
                    }
                }
            } catch (sepayError) {
                console.error('[CheckPayment] SePay API exception:', sepayError);
            }
        }

        // If payment found, process delivery
        if (paidTransaction && db && order && order.status === 'pending_payment') {
            const { finalizeOrder, ensurePaymentSchema } = require('./utils/fulfillment');
            await ensurePaymentSchema(db);  // DDL must run BEFORE BEGIN (outside transaction)

            // HttpTransaction: implicit transaction; commit() to save, rollback on error
            const tx = await db.transaction('write');
            try {
                const result = await finalizeOrder(tx, order, paidTransaction, 'check-payment');
                await tx.commit();   // explicitly commit

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
                console.error('[CheckPayment] Fulfillment error:', error);
                try { await tx.rollback(); } catch { /* ignore */ }
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

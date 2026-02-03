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

const { createClient } = require('@libsql/client');
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

// Decrypt password (simple base64 decode for now - you should use proper AES-GCM)
function decryptPassword(encrypted, iv) {
    try {
        return Buffer.from(encrypted, 'base64').toString('utf8');
    } catch {
        return '[ENCRYPTED]';
    }
}

// Generate delivery token (for secure access)
function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const data = `${orderId}|${email}|${Date.now()}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

exports.handler = async function(event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { orderCode, amount } = event.queryStringParameters || {};
    const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;

    if (!orderCode) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing orderCode' })
        };
    }

    try {
        const db = getDbClient();

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
                        deliveryToken: generateDeliveryToken(order.id, order.customer_email),
                        message: 'Đơn hàng đã được xử lý. Vui lòng kiểm tra email hoặc liên hệ hỗ trợ.'
                    })
                };
            }
        }

        // Check SePay for payment
        let paidTransaction = null;

        if (SEPAY_API_TOKEN && order) {
            try {
                const response = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=20', {
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
                        const tolerance = 0.95;
                        const txAmount = parseFloat(t.amount_in) || 0;
                        const expectedAmount = parseFloat(amount) || parseFloat(order.amount_total);
                        const isAmountMatch = txAmount >= expectedAmount * tolerance;

                        let isRecentTx = true;
                        try {
                            const txTime = new Date(t.transaction_date);
                            const diffMins = (Date.now() - txTime.getTime()) / 60000;
                            isRecentTx = diffMins < 60 && diffMins > -10;
                        } catch (e) {}

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
            const now = new Date().toISOString();
            
            await db.execute('BEGIN IMMEDIATE');

            try {
                // 1. Create/Update payment record
                await db.execute({
                    sql: `
                        INSERT INTO payments (order_id, provider, amount, status, provider_ref, transaction_id, confirmed_at)
                        VALUES (?, 'sepay', ?, 'confirmed', ?, ?, ?)
                        ON CONFLICT DO NOTHING
                    `,
                    args: [
                        order.id,
                        order.amount_total,
                        paidTransaction.id || paidTransaction.reference_number,
                        paidTransaction.id || paidTransaction.reference_number,
                        now
                    ]
                });

                // 2. Get all allocated units for this order
                const allocationsResult = await db.execute({
                    sql: `
                        SELECT oa.id, oa.unit_id, su.username, su.password_encrypted, su.password_iv, su.extra_info
                        FROM order_allocations oa
                        JOIN stock_units su ON oa.unit_id = su.id
                        JOIN order_lines ol ON oa.order_line_id = ol.id
                        WHERE ol.order_id = ? AND oa.status = 'reserved'
                        ORDER BY oa.id ASC
                    `,
                    args: [order.id]
                });

                const credentials = [];
                for (const alloc of allocationsResult.rows) {
                    const password = decryptPassword(alloc.password_encrypted, alloc.password_iv);
                    credentials.push({
                        username: alloc.username,
                        password: password,
                        extraInfo: alloc.extra_info || ''
                    });
                }

                // 3. Build delivery content
                const deliveryContent = credentials.map((cred, idx) => {
                    const extra = cred.extraInfo ? `\n${cred.extraInfo}` : '';
                    return `Tài khoản ${idx + 1}:\nUsername: ${cred.username}\nPassword: ${cred.password}${extra}`;
                }).join('\n\n---\n\n');

                // 4. Update allocations: reserved -> sold
                await db.execute({
                    sql: `
                        UPDATE order_allocations
                        SET status = 'sold', reserved_until = NULL
                        WHERE order_line_id IN (
                            SELECT id FROM order_lines WHERE order_id = ?
                        ) AND status = 'reserved'
                    `,
                    args: [order.id]
                });

                // 5. Update stock units: reserved -> sold
                await db.execute({
                    sql: `
                        UPDATE stock_units
                        SET status = 'sold',
                            sold_order_id = ?,
                            sold_at = ?,
                            reserved_order_id = NULL,
                            reserved_until = NULL,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id IN (
                            SELECT unit_id FROM order_allocations
                            WHERE order_line_id IN (
                                SELECT id FROM order_lines WHERE order_id = ?
                            ) AND status = 'sold'
                        )
                    `,
                    args: [order.id, now, order.id]
                });

                // 6. Update order: pending_payment -> paid -> fulfilled
                await db.execute({
                    sql: `
                        UPDATE orders
                        SET status = 'fulfilled',
                            reserved_until = NULL,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `,
                    args: [order.id]
                });

                // 7. Create invoice
                const invoiceNumber = `TBQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
                
                await db.execute({
                    sql: `
                        INSERT INTO invoices (order_id, invoice_number, issued_at, status)
                        VALUES (?, ?, ?, 'issued')
                    `,
                    args: [order.id, invoiceNumber, now]
                });

                await db.execute('COMMIT');

                // Generate delivery token
                const deliveryToken = generateDeliveryToken(order.id, order.customer_email);

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
                        deliveryToken,
                        invoiceNumber,
                        message: 'Thanh toán thành công! Đơn hàng đã được giao tự động.',
                        redirectUrl: `/delivery?token=${deliveryToken}&order=${orderCode}`
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

/**
 * CREATE ORDER API - Netlify Function (V2 - Transactional)
 *
 * POST /create-order
 * Body: { customerName, customerEmail, customerPhone, customerNote, productCode, variant, quantity, price }
 */

const { createClient } = require('@libsql/client');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        throw new Error('TURSO_DATABASE_URL not configured');
    }

    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

// Rate Limiting Config
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;

// Generate unique order code
function generateOrderCode() {
    return 'TBQ' + Date.now().toString().slice(-8);
}

async function checkRateLimit(db, ip) {
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
    let resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS);

    if (result.rows.length > 0) {
        const row = result.rows[0];
        const rowResetAt = new Date(row.reset_at);
        console.log(`[RateLimit] IP: ${ip}, Found Row:`, row);


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
        console.log(`[RateLimit] IP: ${ip}, New Record`);
    }

    console.log(`[RateLimit] IP: ${ip}, Count: ${count}, Allowed: ${count <= RATE_LIMIT_MAX_REQUESTS}`);

    // Update DB
    await db.execute({
        sql: `INSERT INTO rate_limits (ip, count, reset_at) VALUES (?, ?, ?) 
              ON CONFLICT(ip) DO UPDATE SET count = ?, reset_at = ?`,
        args: [ip, count, resetAt.toISOString(), count, resetAt.toISOString()]
    });

    return count <= RATE_LIMIT_MAX_REQUESTS;
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    let tx = null;
    const db = getDbClient();

    try {
        const body = JSON.parse(event.body);
        let {
            customerName,
            customerEmail,
            customerPhone,
            customerNote,
            items // New support for multiple items
        } = body;

        // Backyard compatibility for old single-item requests
        if (!items && body.productCode) {
            items = [{
                productCode: body.productCode,
                variant: body.variant, // not really used for logic, just metadata
                quantity: body.quantity || 1,
                price: body.price
            }];
        }

        // Capture metadata
        const ipAddress = (event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
        const userAgent = event.headers['user-agent'] || 'unknown';

        // Rate Limit Check
        const isAllowed = await checkRateLimit(db, ipAddress);
        if (!isAllowed) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' })
            };
        }

        if (!customerName || !customerEmail || !customerPhone || !items || items.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing required fields' })
            };
        }

        // Validate items
        for (const item of items) {
            if (item.quantity < 1 || item.quantity > 100) {
                return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: `Invalid quantity for ${item.productCode}` }) };
            }
        }

        const orderCode = generateOrderCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        const deliveryToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const deliveryTokenExpiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

        // Cleanup first
        await cleanupExpired(db, now.toISOString());

        // --- START TRANSACTION ---
        tx = await db.transaction('write');

        let totalAmount = 0;
        let processedItems = [];

        // 1. Process each item (Check & Reserve)
        for (const item of items) {
            const { productCode, quantity, price } = item;

            // Find product
            const productResult = await tx.execute({
                sql: 'SELECT id, name FROM products WHERE code = ? AND is_active = 1 LIMIT 1',
                args: [productCode]
            });

            if (productResult.rows.length === 0) {
                tx.close();
                return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: `Product not found: ${productCode}` }) };
            }

            const product = productResult.rows[0];
            const productId = product.id;

            // Check Stock
            const stockCheck = await tx.execute({
                sql: `SELECT COUNT(*) as available_count FROM stock_units WHERE product_id = ? AND status = 'available' AND (reserved_until IS NULL OR reserved_until <= ?)`,
                args: [productId, now.toISOString()]
            });
            const availableCount = stockCheck.rows[0]?.available_count || 0;

            if (availableCount < quantity) {
                tx.close();
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ success: false, error: 'INSUFFICIENT_STOCK', product: product.name, available: availableCount, requested: quantity })
                };
            }

            // Reserve Stock
            const reserveResult = await tx.execute({
                sql: `UPDATE stock_units SET status = 'reserved', reserved_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM stock_units WHERE product_id = ? AND status = 'available' AND (reserved_until IS NULL OR reserved_until <= ?) ORDER BY id ASC LIMIT ?) AND status = 'available'`,
                args: [expiresAt.toISOString(), productId, now.toISOString(), quantity]
            });

            const rowsAffected = reserveResult.rowsAffected ?? 0;
            if (rowsAffected < quantity) {
                tx.close();
                return { statusCode: 409, headers, body: JSON.stringify({ success: false, error: 'RESERVE_FAILED', message: `Concurrency error for ${product.name}` }) };
            }

            // Get reserved IDs
            const reservedUnits = await tx.execute({
                sql: `SELECT id FROM stock_units WHERE product_id = ? AND status = 'reserved' AND reserved_until = ? ORDER BY id ASC LIMIT ?`,
                args: [productId, expiresAt.toISOString(), quantity]
            });
            const unitIds = reservedUnits.rows.map(r => r.id);

            processedItems.push({
                productId,
                productName: product.name,
                quantity,
                unitPrice: price,
                subtotal: price * quantity,
                unitIds
            });

            totalAmount += (price * quantity);
        }

        // 2. Create Order
        const orderResult = await tx.execute({
            sql: `INSERT INTO orders (order_code, customer_email, customer_name, customer_phone, customer_note, status, amount_total, payment_method, reserved_until, delivery_token, delivery_token_expires_at, ip_address, user_agent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, 'sepay', ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [orderCode, customerEmail, customerName, customerPhone, customerNote || null, totalAmount, expiresAt.toISOString(), deliveryToken, deliveryTokenExpiresAt.toISOString(), ipAddress, userAgent, now.toISOString(), now.toISOString()]
        });
        const orderId = orderResult.rows[0]?.id || orderResult.lastInsertRowid;

        // 3. Create Order Lines & Allocations & Logs
        for (const pItem of processedItems) {
            // Create Line
            const orderLineResult = await tx.execute({
                sql: `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
                args: [orderId, pItem.productId, pItem.productName, pItem.quantity, pItem.unitPrice, pItem.subtotal]
            });
            const orderLineId = orderLineResult.rows[0]?.id || orderLineResult.lastInsertRowid;

            // Link Stock to Order & Create Allocations
            const unitIds = pItem.unitIds;

            // Batch update stock units reserved_order_id
            await tx.execute({
                sql: `UPDATE stock_units SET reserved_order_id = ? WHERE id IN (${unitIds.map(() => '?').join(',')})`,
                args: [orderId, ...unitIds]
            });

            for (const unitId of unitIds) {
                await tx.execute({
                    sql: `INSERT INTO order_allocations (order_line_id, unit_id, assigned_at) VALUES (?, ?, ?)`,
                    args: [orderLineId, unitId, now.toISOString()]
                });

                // AUDIT LOG: RESERVE
                await tx.execute({
                    sql: `INSERT INTO inventory_logs (unit_id, order_id, action, actor, source, previous_status, new_status, payload) VALUES (?, ?, 'RESERVE', 'system', 'web', 'available', 'reserved', ?)`,
                    args: [unitId, orderId, JSON.stringify({ expiresAt: expiresAt.toISOString() })]
                });
            }
        }

        // 4. Create Payment Record (Pending)
        await tx.execute({
            sql: `INSERT INTO payments (order_id, provider, amount, status, created_at) VALUES (?, 'Sepay', ?, 'INITIATED', ?)`,
            args: [orderId, totalAmount, now.toISOString()]
        });

        // 5. Sync Event: ORDER_CREATED
        await tx.execute({
            sql: `INSERT INTO sync_events (event_type, entity_type, entity_id, source, actor, payload) VALUES ('ORDER_CREATED', 'order', ?, 'web', ?, ?)`,
            args: [orderId, customerEmail, JSON.stringify({ orderCode, totalAmount, itemsCount: items.length })]
        });

        // COMMIT
        await tx.commit();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                orderCode,
                orderId,
                amount: totalAmount,
                expiresAt: expiresAt.toISOString(),
                message: `Đơn hàng đã được tạo. Vui lòng thanh toán trong 30 phút.`,
                paymentInfo: {
                    bankName: 'TP Bank',
                    accountNumber: '00000828511',
                    accountName: 'TRAN PHI LONG',
                    amount: totalAmount,
                    content: orderCode
                }
            })
        };

    } catch (error) {
        console.error('Transaction Error:', error);
        if (tx) {
            try { tx.close(); } catch (e) { }
        }
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: 'Internal server error', message: error.message, stack: error.stack })
        };
    }
};

async function cleanupExpired(db, now) {
    // Release expired reservations
    await db.execute({
        sql: `
            UPDATE stock_units
            SET status = 'available',
            reserved_order_id = NULL,
            reserved_until = NULL,
            updated_at = CURRENT_TIMESTAMP
            WHERE status = 'reserved'
              AND reserved_until < ?
        `,
        args: [now]
    });

    // Expire pending orders
    await db.execute({
        sql: `
            UPDATE orders
            SET status = 'expired', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'pending_payment'
              AND reserved_until < ?
        `,
        args: [now]
    });

    // Release allocations for expired orders (order_allocations.reserved_until may be NULL, so key by order status)
    await db.execute({
        sql: `
                UPDATE order_allocations
                SET status = 'released'
                WHERE status = 'reserved'
                  AND order_line_id IN (
                      SELECT id FROM order_lines WHERE order_id IN (
                          SELECT id FROM orders WHERE status = 'expired'
                      )
                  )
            `,
        args: []
    });
}

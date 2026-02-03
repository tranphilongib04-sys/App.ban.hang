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

// Generate unique order code
function generateOrderCode() {
    return 'TBQ' + Date.now().toString().slice(-8);
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
        const {
            customerName,
            customerEmail,
            customerPhone,
            customerNote,
            productCode,
            variant,
            quantity = 1,
            price
        } = body;

        // Capture metadata
        const ipAddress = (event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
        const userAgent = event.headers['user-agent'] || 'unknown';

        if (!customerName || !customerEmail || !customerPhone || !productCode || !price) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Missing required fields' })
            };
        }

        if (quantity < 1 || quantity > 100) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'Quantity must be between 1 and 100' })
            };
        }

        const orderCode = generateOrderCode();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        const deliveryToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const deliveryTokenExpiresAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

        // Cleanup first (outside transaction call, okay to use parallel db ref)
        await cleanupExpired(db, now.toISOString());

        // Find product
        const productResult = await db.execute({
            sql: 'SELECT id, name FROM products WHERE code = ? AND is_active = 1 LIMIT 1',
            args: [productCode]
        });

        if (productResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ success: false, error: 'Product not found' })
            };
        }

        const product = productResult.rows[0];
        const productId = product.id;

        // --- START TRANSACTION ---
        // Using 'write' implies we intend to write, though libsql client might ignore mode arg depending on version
        tx = await db.transaction('write');

        // 1. Check Stock
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
                body: JSON.stringify({ success: false, error: 'INSUFFICIENT_STOCK', available: availableCount, requested: quantity })
            };
        }

        // 2. Reserve Stock
        const reserveResult = await tx.execute({
            sql: `UPDATE stock_units SET status = 'reserved', reserved_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (SELECT id FROM stock_units WHERE product_id = ? AND status = 'available' AND (reserved_until IS NULL OR reserved_until <= ?) ORDER BY id ASC LIMIT ?) AND status = 'available'`,
            args: [expiresAt.toISOString(), productId, now.toISOString(), quantity]
        });

        const rowsAffected = reserveResult.rowsAffected ?? 0;
        if (rowsAffected < quantity) {
            tx.close();
            return { statusCode: 409, headers, body: JSON.stringify({ success: false, error: 'RESERVE_FAILED', message: 'Concurrency error' }) };
        }

        // Get reserved IDs
        const reservedUnits = await tx.execute({
            sql: `SELECT id FROM stock_units WHERE product_id = ? AND status = 'reserved' AND reserved_until = ? ORDER BY id ASC LIMIT ?`,
            args: [productId, expiresAt.toISOString(), quantity]
        });
        const unitIds = reservedUnits.rows.map(r => r.id);

        // 3. Create Order
        const totalAmount = price * quantity;
        const orderResult = await tx.execute({
            sql: `INSERT INTO orders (order_code, customer_email, customer_name, customer_phone, customer_note, status, amount_total, payment_method, reserved_until, delivery_token, delivery_token_expires_at, ip_address, user_agent, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, 'sepay', ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [orderCode, customerEmail, customerName, customerPhone, customerNote || null, totalAmount, expiresAt.toISOString(), deliveryToken, deliveryTokenExpiresAt.toISOString(), ipAddress, userAgent, now.toISOString(), now.toISOString()]
        });
        const orderId = orderResult.rows[0]?.id || orderResult.lastInsertRowid;

        // 4. Update Stock (Link Order)
        await tx.execute({
            sql: `UPDATE stock_units SET reserved_order_id = ? WHERE id IN (${unitIds.map(() => '?').join(',')})`,
            args: [orderId, ...unitIds]
        });

        // 5. Create Order Lines & Allocations
        const orderLineResult = await tx.execute({
            sql: `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
            args: [orderId, productId, product.name, quantity, price, totalAmount]
        });
        const orderLineId = orderLineResult.rows[0]?.id || orderLineResult.lastInsertRowid;

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

        // 6. Create Payment Record (Pending)
        await tx.execute({
            sql: `INSERT INTO payments (order_id, provider, amount, status, created_at) VALUES (?, 'Sepay', ?, 'INITIATED', ?)`,
            args: [orderId, totalAmount, now.toISOString()]
        });

        // 7. Sync Event: ORDER_CREATED
        await tx.execute({
            sql: `INSERT INTO sync_events (event_type, entity_type, entity_id, source, actor, payload) VALUES ('ORDER_CREATED', 'order', ?, 'web', ?, ?)`,
            args: [orderId, customerEmail, JSON.stringify({ orderCode, productId, quantity, totalAmount })]
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
                quantity,
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

    // Release allocations
    await db.execute({
        sql: `
            UPDATE order_allocations
            SET status = 'released'
            WHERE status = 'reserved'
              AND reserved_until < ?
        `,
        args: [now]
    });
}

const crypto = require('crypto');

// Decrypt password
function decryptPassword(encrypted, iv) {
    try {
        return Buffer.from(encrypted, 'base64').toString('utf8');
    } catch {
        return '[ENCRYPTED]';
    }
}

// Generate delivery token
function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

// PROCESS FULFILLMENT (Shared Logic)
async function fulfillOrder(db, order, transaction) {
    const now = new Date().toISOString();

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
            transaction.id || transaction.reference_number,
            transaction.id || transaction.reference_number,
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

    // 3. Update allocations: reserved -> sold
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

    // 4. Update stock units: reserved -> sold
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

    // 5. Update order: fulfilled
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

    // 5b. Audit Log: Order Status Change
    await db.execute({
        sql: `INSERT INTO order_status_history (order_id, old_status, new_status, actor) VALUES (?, ?, 'fulfilled', 'system')`,
        args: [order.id, order.status]
    });

    // 6. Create invoice
    const invoiceNumber = `TBQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
    await db.execute({
        sql: `
            INSERT INTO invoices (order_id, invoice_number, issued_at, status)
            VALUES (?, ?, ?, 'issued')
        `,
        args: [order.id, invoiceNumber, now]
    });

    // 7. Generate Delivery Token
    const deliveryToken = generateDeliveryToken(order.id, order.customer_email);

    return {
        deliveryToken,
        invoiceNumber,
        credentials
    };
}

module.exports = { fulfillOrder, generateDeliveryToken };

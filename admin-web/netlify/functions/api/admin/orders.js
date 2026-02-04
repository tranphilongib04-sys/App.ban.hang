/**
 * Orders Management API
 *
 * GET    /api/admin/orders              — list with filters + pagination
 * GET    /api/admin/orders/:orderCode   — single order detail (full)
 * POST   /api/admin/orders/:orderCode/cancel — cancel pending order
 *
 * Auth: ADMIN | OPS | ACCOUNTANT (read), ADMIN only (cancel)
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');
const { parseBodySafe } = require('../../utils/parseBody');

exports.handler = requireRole(['ADMIN', 'OPS', 'ACCOUNTANT'], async (event, context, actor) => {
    const db = getDb();
    const { httpMethod, path: reqPath, queryStringParameters: qs } = event;

    // POST .../cancel
    if (httpMethod === 'POST' && reqPath.endsWith('/cancel')) {
        if (actor.role !== 'ADMIN') {
            return { statusCode: 403, body: JSON.stringify({ error: 'Only ADMIN can cancel orders' }) };
        }
        const orderCode = extractOrderCode(reqPath);
        if (!orderCode) return { statusCode: 400, body: JSON.stringify({ error: 'Missing order code' }) };
        return handleCancel(db, event, actor, orderCode);
    }

    // POST .../delete
    if (httpMethod === 'POST' && reqPath.endsWith('/delete')) {
        if (actor.role !== 'ADMIN') {
            return { statusCode: 403, body: JSON.stringify({ error: 'Only ADMIN can delete orders' }) };
        }
        const orderCode = extractOrderCode(reqPath);
        if (!orderCode) return { statusCode: 400, body: JSON.stringify({ error: 'Missing order code' }) };
        return handleDelete(db, event, actor, orderCode);
    }

    // POST /api/admin/orders (create)
    if (httpMethod === 'POST' && !reqPath.includes('/')) {
        if (actor.role !== 'ADMIN') {
            return { statusCode: 403, body: JSON.stringify({ error: 'Only ADMIN can create orders' }) };
        }
        return handleCreate(db, event, actor);
    }

    // PATCH /api/admin/orders/:orderCode (update)
    if (httpMethod === 'PATCH') {
        if (actor.role !== 'ADMIN') {
            return { statusCode: 403, body: JSON.stringify({ error: 'Only ADMIN can update orders' }) };
        }
        const orderCode = extractOrderCode(reqPath);
        if (!orderCode) return { statusCode: 400, body: JSON.stringify({ error: 'Missing order code' }) };
        return handleUpdate(db, event, actor, orderCode);
    }

    if (httpMethod === 'GET') {
        // Check if it's a detail request (path has order code)
        const orderCode = extractOrderCode(reqPath);
        if (orderCode) return handleDetail(db, orderCode);
        return handleList(db, qs);
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
});

// ──────────────────────────────────
// GET /api/admin/orders?status=&search=&page=1&limit=50
// ──────────────────────────────────
async function handleList(db, qs = {}) {
    const { status, search, page = '1', limit = '50' } = qs;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let args = [];

    if (status) { whereClauses.push('o.status = ?'); args.push(status); }
    if (search) {
        whereClauses.push(`(o.order_code LIKE ? OR o.customer_email LIKE ? OR o.customer_name LIKE ?)`);
        const pattern = `%${search}%`;
        args.push(pattern, pattern, pattern);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.execute({
        sql: `SELECT COUNT(*) as total FROM orders o ${whereSQL}`,
        args
    });
    const total = countRow.rows[0]?.total || 0;

    const rows = await db.execute({
        sql: `SELECT o.*,
                     (SELECT invoice_number FROM invoices WHERE order_id = o.id LIMIT 1) as invoice_number,
                     (SELECT COUNT(*) FROM order_lines WHERE order_id = o.id) as line_count
              FROM orders o
              ${whereSQL}
              ORDER BY o.created_at DESC
              LIMIT ? OFFSET ?`,
        args: [...args, limitNum, offset]
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ data: rows.rows, total, page: pageNum, limit: limitNum })
    };
}

// ──────────────────────────────────
// GET /api/admin/orders/:orderCode
// Full detail: order + lines + allocations + payment + invoice
// ──────────────────────────────────
async function handleDetail(db, orderCode) {
    const orderRow = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ?',
        args: [orderCode]
    });

    if (!orderRow.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    const order = orderRow.rows[0];

    // Parallel fetch
    const [linesRes, allocRes, paymentRes, invoiceRes, auditRes] = await Promise.all([
        db.execute({ sql: 'SELECT * FROM order_lines WHERE order_id = ?', args: [order.id] }),
        db.execute({
            sql: `SELECT oa.*, su.username, su.status as unit_status
                  FROM order_allocations oa
                  JOIN stock_units su ON oa.unit_id = su.id
                  WHERE oa.order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)`,
            args: [order.id]
        }),
        db.execute({ sql: 'SELECT * FROM payments WHERE order_id = ?', args: [order.id] }),
        db.execute({ sql: 'SELECT * FROM invoices WHERE order_id = ?', args: [order.id] }),
        db.execute({ sql: 'SELECT * FROM audit_logs WHERE entity_id = ? AND entity_type = ? ORDER BY created_at DESC LIMIT 20', args: [order.id, 'order'] })
    ]);

    return {
        statusCode: 200,
        body: JSON.stringify({
            order,
            lines: linesRes.rows,
            allocations: allocRes.rows,
            payment: paymentRes.rows[0] || null,
            invoice: invoiceRes.rows[0] || null,
            audit: auditRes.rows
        })
    };
}

// ──────────────────────────────────
// POST /api/admin/orders/:orderCode/cancel
// Body: { reason }
// Only cancels pending_payment orders. Releases stock.
// ──────────────────────────────────
async function handleCancel(db, event, actor, orderCode) {
    const body = parseBodySafe(event);
    const { reason } = body;

    const orderRow = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ?',
        args: [orderCode]
    });

    if (!orderRow.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    const order = orderRow.rows[0];

    if (order.status !== 'pending_payment') {
        return { statusCode: 409, body: JSON.stringify({ error: `Cannot cancel order in status: ${order.status}` }) };
    }

    // Atomic cancel + release
    await db.execute('BEGIN IMMEDIATE');
    try {
        // Release allocations
        await db.execute({
            sql: `UPDATE order_allocations SET status = 'released'
                  WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?)
                    AND status = 'reserved'`,
            args: [order.id]
        });

        // Release stock units
        await db.execute({
            sql: `UPDATE stock_units
                  SET status = 'available', reserved_order_id = NULL, reserved_until = NULL, updated_at = CURRENT_TIMESTAMP
                  WHERE reserved_order_id = ? AND status = 'reserved'`,
            args: [order.id]
        });

        // Cancel order
        await db.execute({
            sql: `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            args: [order.id]
        });

        // Audit
        await db.execute({
            sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
            args: ['ORDER_CANCELLED', 'order', order.id, actor.email, 'admin-web',
                   JSON.stringify({ reason: reason || 'no reason', order_code: orderCode })]
        });

        await db.execute('COMMIT');

        return { statusCode: 200, body: JSON.stringify({ status: 'cancelled', order_code: orderCode }) };
    } catch (err) {
        await db.execute('ROLLBACK').catch(() => {});
        throw err;
    }
}

// ──────────────────────────────────
// Helpers
// ──────────────────────────────────
// ──────────────────────────────────
// POST /api/admin/orders
// Create new order
// ──────────────────────────────────
async function handleCreate(db, event, actor) {
    const body = parseBodySafe(event);
    const { customer_name, customer_email, customer_phone, product_id, quantity, amount_total, customer_note } = body;

    if (!customer_name || !customer_email || !product_id || !quantity || !amount_total) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Verify product exists
    const product = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [product_id] });
    if (!product.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Product not found' }) };
    }

    // Generate order code
    const orderCode = 'TBQ' + Date.now().toString().slice(-8);

    await db.execute('BEGIN IMMEDIATE');
    try {
        // Create order
        const orderResult = await db.execute({
            sql: `INSERT INTO orders (order_code, customer_name, customer_email, customer_phone, customer_note, status, amount_total, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, 'pending_payment', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            args: [orderCode, customer_name, customer_email, customer_phone || null, customer_note || null, amount_total]
        });
        const orderId = orderResult.lastInsertRowid;

        // Create order line
        await db.execute({
            sql: `INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, subtotal, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [orderId, product_id, product.rows[0].name, quantity, amount_total / quantity, amount_total]
        });

        // Audit
        await db.execute({
            sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
            args: ['ORDER_CREATED', 'order', orderId, actor.email, 'admin-web',
                   JSON.stringify({ order_code: orderCode, customer_name, product_id })]
        });

        await db.execute('COMMIT');

        return { statusCode: 201, body: JSON.stringify({ order_code: orderCode, id: orderId }) };
    } catch (err) {
        await db.execute('ROLLBACK').catch(() => {});
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
}

// ──────────────────────────────────
// PATCH /api/admin/orders/:orderCode
// Update order
// ──────────────────────────────────
async function handleUpdate(db, event, actor, orderCode) {
    const body = parseBodySafe(event);
    const { customer_name, customer_email, customer_phone, status, amount_total, customer_note } = body;

    const orderRow = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ?',
        args: [orderCode]
    });

    if (!orderRow.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    const order = orderRow.rows[0];
    const updates = [];
    const args = [];

    if (customer_name !== undefined) { updates.push('customer_name = ?'); args.push(customer_name); }
    if (customer_email !== undefined) { updates.push('customer_email = ?'); args.push(customer_email); }
    if (customer_phone !== undefined) { updates.push('customer_phone = ?'); args.push(customer_phone); }
    if (status !== undefined) { updates.push('status = ?'); args.push(status); }
    if (amount_total !== undefined) { updates.push('amount_total = ?'); args.push(amount_total); }
    if (customer_note !== undefined) { updates.push('customer_note = ?'); args.push(customer_note); }

    if (updates.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No fields to update' }) };
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(order.id);

    await db.execute({
        sql: `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        args
    });

    // Audit
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['ORDER_UPDATED', 'order', order.id, actor.email, 'admin-web',
               JSON.stringify({ order_code: orderCode, changes: body })]
    });

    return { statusCode: 200, body: JSON.stringify({ order_code: orderCode, updated: true }) };
}

// ──────────────────────────────────
// POST /api/admin/orders/:orderCode/delete
// Soft delete order (mark as deleted)
// ──────────────────────────────────
async function handleDelete(db, event, actor, orderCode) {
    const orderRow = await db.execute({
        sql: 'SELECT * FROM orders WHERE order_code = ?',
        args: [orderCode]
    });

    if (!orderRow.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Order not found' }) };
    }

    const order = orderRow.rows[0];

    // Soft delete: update status to cancelled and add note
    await db.execute({
        sql: `UPDATE orders SET status = 'cancelled', customer_note = COALESCE(customer_note || '\n', '') || '[DELETED]', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [order.id]
    });

    // Audit
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['ORDER_DELETED', 'order', order.id, actor.email, 'admin-web',
               JSON.stringify({ order_code: orderCode })]
    });

    return { statusCode: 200, body: JSON.stringify({ order_code: orderCode, deleted: true }) };
}

function extractOrderCode(path) {
    // path: /.netlify/functions/api/admin/orders/TBQ12345678
    // or:   /.netlify/functions/api/admin/orders/TBQ12345678/cancel
    const parts = path.split('/');
    for (const p of parts) {
        if (p.startsWith('TBQ') && /^TBQ\d+$/.test(p)) return p;
    }
    return null;
}

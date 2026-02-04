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
    const body = JSON.parse(event.body || '{}');
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
function extractOrderCode(path) {
    // path: /.netlify/functions/api/admin/orders/TBQ12345678
    // or:   /.netlify/functions/api/admin/orders/TBQ12345678/cancel
    const parts = path.split('/');
    for (const p of parts) {
        if (p.startsWith('TBQ') && /^TBQ\d+$/.test(p)) return p;
    }
    return null;
}

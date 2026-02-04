/**
 * Export API
 *
 * GET /api/admin/export/orders?from=2026-01-01&to=2026-02-04&format=csv
 *
 * Auth: ADMIN | ACCOUNTANT
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');

exports.handler = requireRole(['ADMIN', 'ACCOUNTANT'], async (event, context, actor) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const db = getDb();
    const qs = event.queryStringParameters || {};
    const { from, to, format = 'csv' } = qs;

    if (!from || !to) {
        return { statusCode: 400, body: JSON.stringify({ error: 'from and to date required (YYYY-MM-DD)' }) };
    }

    // Fetch orders in range with line details
    const rows = await db.execute({
        sql: `
            SELECT
                o.order_code,
                o.status,
                o.customer_name,
                o.customer_email,
                o.customer_phone,
                o.amount_total,
                o.created_at as order_date,
                ol.product_name,
                ol.quantity,
                ol.unit_price,
                ol.subtotal,
                p.status as payment_status,
                p.transaction_id as payment_txn,
                i.invoice_number
            FROM orders o
            LEFT JOIN order_lines ol   ON ol.order_id = o.id
            LEFT JOIN payments p       ON p.order_id = o.id AND p.status = 'confirmed'
            LEFT JOIN invoices i       ON i.order_id = o.id
            WHERE o.created_at >= ? AND o.created_at <= ?
            ORDER BY o.created_at DESC
        `,
        args: [from, to + 'T23:59:59']
    });

    if (format === 'csv') {
        const header = 'Order Code,Status,Customer Name,Email,Phone,Total (VND),Order Date,Product,Qty,Unit Price,Subtotal,Payment Status,Payment Txn,Invoice';
        const lines = rows.rows.map(r =>
            [
                r.order_code, r.status, csvEsc(r.customer_name), csvEsc(r.customer_email),
                r.customer_phone, r.amount_total, r.order_date,
                csvEsc(r.product_name), r.quantity, r.unit_price, r.subtotal,
                r.payment_status || '', r.payment_txn || '', r.invoice_number || ''
            ].join(',')
        );

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="tbq-orders-${from}-to-${to}.csv"`
            },
            body: [header, ...lines].join('\n')
        };
    }

    // Default: JSON
    return { statusCode: 200, body: JSON.stringify({ data: rows.rows, total: rows.rows.length }) };
});

function csvEsc(val) {
    if (val == null) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

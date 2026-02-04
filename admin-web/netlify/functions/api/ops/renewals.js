/**
 * Ops Renewals — list subscriptions expiring in next N days
 *
 * GET /api/ops/renewals?days=7
 *
 * Auth: OPS | ADMIN
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');

exports.handler = requireRole(['ADMIN', 'OPS'], async (event, context, actor) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const db = getDb();
    const qs = event.queryStringParameters || {};
    const days = Math.min(90, Math.max(1, parseInt(qs.days) || 7));

    // VN timezone today
    const now = new Date();
    const vnOffset = 7 * 60;
    const vnNow = new Date(now.getTime() + (now.getTimezoneOffset() + vnOffset) * 60000);
    const today = formatDate(vnNow);
    const futureDate = formatDate(new Date(vnNow.getTime() + days * 86400000));

    const rows = await db.execute({
        sql: `SELECT s.*,
                     c.name as customer_name,
                     c.contact as customer_contact,
                     c.source as customer_source,
                     julianday(s.end_date) - julianday(?) as days_left
              FROM subscriptions s
              JOIN customers c ON s.customer_id = c.id
              WHERE s.end_date >= ? AND s.end_date <= ?
                AND s.renewal_status = 'pending'
                AND s.payment_status != 'not_paying'
              ORDER BY s.end_date ASC`,
        args: [today, today, futureDate]
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ data: rows.rows, days_window: days, today })
    };
});

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

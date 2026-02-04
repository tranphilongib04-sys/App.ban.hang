/**
 * Ops Message Log — contact history for a customer
 *
 * GET /api/ops/message-log?customer_id=123
 *
 * Returns all subscriptions for that customer with contact metadata.
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
    const { customer_id } = qs;

    if (!customer_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'customer_id required' }) };
    }

    const [customerRes, subsRes] = await Promise.all([
        db.execute({ sql: 'SELECT * FROM customers WHERE id = ?', args: [parseInt(customer_id)] }),
        db.execute({
            sql: `SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY created_at DESC`,
            args: [parseInt(customer_id)]
        })
    ]);

    if (!customerRes.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Customer not found' }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            customer: customerRes.rows[0],
            subscriptions: subsRes.rows.map(s => ({
                id: s.id,
                service: s.service,
                start_date: s.start_date,
                end_date: s.end_date,
                renewal_status: s.renewal_status,
                payment_status: s.payment_status,
                last_contacted_at: s.last_contacted_at,
                contact_count: s.contact_count,
                completed_at: s.completed_at,
                note: s.note
            }))
        })
    };
});

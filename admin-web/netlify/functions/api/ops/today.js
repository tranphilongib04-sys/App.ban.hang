/**
 * Ops Today Dashboard
 *
 * GET /api/ops/today
 *
 * Returns bucketed subscriptions for today's workflow:
 *   needs_reminder  — end_date in 0-3 days, renewal pending
 *   overdue         — end_date < today, renewal pending
 *   awaiting_payment — contacted but unpaid
 *   completed_today — completedAt = today (VN timezone)
 *   stats           — counts + revenue summary
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

    // Vietnam is UTC+7. "Today" boundaries in ISO for Turso (which stores UTC-ish strings).
    // We use date strings directly since subscriptions store YYYY-MM-DD.
    const now = new Date();
    const vnOffset = 7 * 60; // minutes
    const vnNow = new Date(now.getTime() + (now.getTimezoneOffset() + vnOffset) * 60000);

    const today       = formatDate(vnNow);
    const threeDaysLater = formatDate(new Date(vnNow.getTime() + 3 * 86400000));

    // 1. needs_reminder: end_date between today and today+3, pending renewal, not completed
    const needsReminderRes = await db.execute({
        sql: `SELECT s.*, c.name as customer_name, c.contact as customer_contact, c.source as customer_source
              FROM subscriptions s
              JOIN customers c ON s.customer_id = c.id
              WHERE s.end_date >= ? AND s.end_date <= ?
                AND s.renewal_status = 'pending'
                AND s.payment_status != 'not_paying'
                AND s.completed_at IS NULL
              ORDER BY s.end_date ASC`,
        args: [today, threeDaysLater]
    });

    // 2. overdue: end_date < today, pending renewal
    const overdueRes = await db.execute({
        sql: `SELECT s.*, c.name as customer_name, c.contact as customer_contact, c.source as customer_source
              FROM subscriptions s
              JOIN customers c ON s.customer_id = c.id
              WHERE s.end_date < ?
                AND s.renewal_status = 'pending'
                AND s.payment_status != 'not_paying'
                AND s.completed_at IS NULL
              ORDER BY s.end_date ASC`,
        args: [today]
    });

    // 3. awaiting_payment: unpaid but contacted (contact_count > 0)
    const awaitingRes = await db.execute({
        sql: `SELECT s.*, c.name as customer_name, c.contact as customer_contact, c.source as customer_source
              FROM subscriptions s
              JOIN customers c ON s.customer_id = c.id
              WHERE s.payment_status = 'unpaid'
                AND s.contact_count > 0
                AND s.renewal_status != 'not_renewing'
                AND s.completed_at IS NULL
              ORDER BY s.end_date ASC`,
        args: []
    });

    // 4. completed_today: completedAt starts with today's date
    const completedRes = await db.execute({
        sql: `SELECT s.*, c.name as customer_name, c.contact as customer_contact
              FROM subscriptions s
              JOIN customers c ON s.customer_id = c.id
              WHERE s.completed_at LIKE ?
              ORDER BY s.completed_at DESC`,
        args: [today + '%']
    });

    // 5. Stats
    const revenueRow = await db.execute({
        sql: `SELECT COALESCE(SUM(revenue), 0) as total FROM subscriptions WHERE completed_at LIKE ?`,
        args: [today + '%']
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            needs_reminder: needsReminderRes.rows,
            overdue: overdueRes.rows,
            awaiting_payment: awaitingRes.rows,
            completed_today: completedRes.rows,
            stats: {
                needs_reminder_count: needsReminderRes.rows.length,
                overdue_count: overdueRes.rows.length,
                awaiting_count: awaitingRes.rows.length,
                completed_count: completedRes.rows.length,
                revenue_today: revenueRow.rows[0]?.total || 0
            },
            meta: { today, queried_at: now.toISOString() }
        })
    };
});

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

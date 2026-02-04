/**
 * Ops Step — advance subscription workflow state
 *
 * POST /api/ops/step/:subscriptionId
 *
 * Body: {
 *   step: 'contacted' | 'awaiting_payment' | 'paid' | 'completed' | 'closed',
 *   note?: string
 * }
 *
 * State machine:
 *   (initial)           → contacted         : contact_count++, last_contacted_at = now
 *   contacted           → awaiting_payment  : (waiting for money)
 *   awaiting_payment    → paid              : payment_status = paid
 *   paid                → completed         : renewal_status = renewed, completedAt = now
 *   (any non-completed) → closed            : renewal_status = not_renewing, payment_status = not_paying
 *
 * Auth: OPS | ADMIN
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');
const { parseBodySafe } = require('../../utils/parseBody');

exports.handler = requireRole(['ADMIN', 'OPS'], async (event, context, actor) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const db = getDb();
    const id = extractId(event.path);
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing subscription ID in path' }) };

    const body = parseBodySafe(event);
    const { step, note } = body;

    if (!step) return { statusCode: 400, body: JSON.stringify({ error: 'step required' }) };

    // Fetch current subscription
    const subRow = await db.execute({ sql: 'SELECT * FROM subscriptions WHERE id = ?', args: [id] });
    if (!subRow.rows.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Subscription not found' }) };
    }

    const sub = subRow.rows[0];
    const now = new Date().toISOString();
    const updates = { updated_at: now };

    // ── State transitions ──
    switch (step) {
        case 'contacted':
            updates.contact_count = (sub.contact_count || 0) + 1;
            updates.last_contacted_at = now;
            if (note !== undefined) updates.note = note;
            break;

        case 'awaiting_payment':
            // Must have been contacted at least once
            if (!sub.last_contacted_at && (sub.contact_count || 0) === 0) {
                return { statusCode: 409, body: JSON.stringify({ error: 'Must contact customer before awaiting payment' }) };
            }
            if (note !== undefined) updates.note = note;
            break;

        case 'paid':
            updates.payment_status = 'paid';
            if (note !== undefined) updates.note = note;
            break;

        case 'completed':
            updates.renewal_status = 'renewed';
            updates.payment_status = 'paid';
            updates.completed_at = now;
            if (note !== undefined) updates.note = note;
            break;

        case 'closed':
            updates.renewal_status = 'not_renewing';
            updates.payment_status = 'not_paying';
            updates.completed_at = now;
            if (note !== undefined) updates.note = note;
            break;

        default:
            return { statusCode: 400, body: JSON.stringify({ error: `Unknown step: ${step}` }) };
    }

    // Build UPDATE SQL
    const setClauses = Object.keys(updates).map(k => `${snakeCase(k)} = ?`);
    const args = Object.values(updates);
    args.push(id);

    await db.execute({
        sql: `UPDATE subscriptions SET ${setClauses.join(', ')} WHERE id = ?`,
        args
    });

    // Audit
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['OPS_STEP_DONE', 'subscription', id, actor.email, 'ops',
               JSON.stringify({ step, note: note || null, previous: { renewal_status: sub.renewal_status, payment_status: sub.payment_status } })]
    }).catch(() => {});

    // Return updated subscription
    const updated = await db.execute({ sql: 'SELECT * FROM subscriptions WHERE id = ?', args: [id] });

    return { statusCode: 200, body: JSON.stringify({ subscription: updated.rows[0] }) };
});

function extractId(path) {
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    const num = parseInt(last);
    return isNaN(num) ? null : num;
}

// camelCase → snake_case
function snakeCase(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

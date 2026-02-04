/**
 * Audit Logs API
 *
 * GET /api/admin/audit-logs?event_type=&entity_type=&from=&to=&page=1&limit=50
 *
 * Auth: ADMIN only
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');

exports.handler = requireRole(['ADMIN'], async (event, context, actor) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const db = getDb();
    const qs = event.queryStringParameters || {};
    const { event_type, entity_type, entity_id, from, to, page = '1', limit = '100' } = qs;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let args = [];

    if (event_type)  { whereClauses.push('event_type = ?');   args.push(event_type); }
    if (entity_type) { whereClauses.push('entity_type = ?');  args.push(entity_type); }
    if (entity_id)   { whereClauses.push('entity_id = ?');    args.push(parseInt(entity_id)); }
    if (from)        { whereClauses.push('created_at >= ?');  args.push(from); }
    if (to)          { whereClauses.push('created_at <= ?');  args.push(to); }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRes, dataRes] = await Promise.all([
        db.execute({ sql: `SELECT COUNT(*) as total FROM audit_logs ${whereSQL}`, args }),
        db.execute({ sql: `SELECT * FROM audit_logs ${whereSQL} ORDER BY created_at DESC LIMIT ? OFFSET ?`, args: [...args, limitNum, offset] })
    ]);

    return {
        statusCode: 200,
        body: JSON.stringify({
            data: dataRes.rows,
            total: countRes.rows[0]?.total || 0,
            page: pageNum,
            limit: limitNum
        })
    };
});

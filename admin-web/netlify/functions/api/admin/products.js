/**
 * Products API
 * GET /api/admin/products - List all products
 * Auth: ADMIN | OPS | ACCOUNTANT
 */
const { getDb } = require('../../utils/db');
const { requireRole } = require('../../utils/rbac');

exports.handler = requireRole(['ADMIN', 'OPS', 'ACCOUNTANT'], async (event, context, actor) => {
    const db = getDb();
    
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const rows = await db.execute({
        sql: 'SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC'
    });

    return {
        statusCode: 200,
        body: JSON.stringify({ data: rows.rows })
    };
});

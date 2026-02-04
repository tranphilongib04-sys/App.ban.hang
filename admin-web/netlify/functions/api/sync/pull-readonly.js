/**
 * Sync Pull Readonly — Desktop fetches sales-critical tables (read-only cache)
 *
 * GET /api/sync/pull-readonly?entities=orders,stock_units,payments&since=ISO_TIMESTAMP
 *
 * Auth: Bearer DESKTOP_SYNC_TOKEN
 *
 * Returns rows changed since `since` for the requested tables.
 * Desktop applies as INSERT OR REPLACE locally.
 */
const { getDb } = require('../../utils/db');
const { CORS } = require('../../utils/rbac');

const ALLOWED_READONLY_TABLES = {
    orders:            { table: 'orders',            cursor: 'updated_at' },
    stock_units:       { table: 'stock_units',       cursor: 'updated_at' },
    payments:          { table: 'payments',          cursor: 'created_at' },
    order_lines:       { table: 'order_lines',       cursor: 'created_at' },
    order_allocations: { table: 'order_allocations', cursor: 'created_at' },
    deliveries:        { table: 'deliveries',        cursor: 'delivered_at' },
    invoices:          { table: 'invoices',          cursor: 'issued_at' },
    products:          { table: 'products',          cursor: 'updated_at' }
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };

    if (!authDesktopToken(event)) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = getDb();
    const qs = event.queryStringParameters || {};
    const { entities, since } = qs;

    if (!entities || !since) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'entities and since required' }) };
    }

    const requestedTables = entities.split(',').filter(e => ALLOWED_READONLY_TABLES[e]);
    if (!requestedTables.length) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No valid entity names' }) };
    }

    const result = {};

    for (const name of requestedTables) {
        const { table, cursor } = ALLOWED_READONLY_TABLES[name];
        const rows = await db.execute({
            sql: `SELECT * FROM ${table} WHERE ${cursor} > ? ORDER BY ${cursor} ASC LIMIT 500`,
            args: [since]
        });
        result[name] = rows.rows;
    }

    return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify(result)
    };
};

function authDesktopToken(event) {
    const expected = process.env.DESKTOP_SYNC_TOKEN;
    if (!expected) return false;
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    return token === expected;
}

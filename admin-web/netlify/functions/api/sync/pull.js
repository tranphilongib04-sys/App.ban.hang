/**
 * Sync Pull — Desktop fetches changes from Turso
 *
 * GET /api/sync/pull?entity_type=subscription,customer&since=2026-02-03T10:00:00Z
 *
 * Auth: Bearer DESKTOP_SYNC_TOKEN (env var, NOT JWT)
 *
 * Returns sync_events created after `since` for the requested entity types.
 * If entity_type is omitted, returns all syncable types.
 */
const { getDb } = require('../../utils/db');
const { CORS } = require('../../utils/rbac');

const SYNCABLE_ENTITIES = ['subscription', 'customer', 'family', 'family_member', 'warranty', 'inventory'];

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };

    // Auth: static token
    if (!authDesktopToken(event)) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = getDb();
    const qs = event.queryStringParameters || {};
    const { entity_type, since } = qs;

    const entities = entity_type
        ? entity_type.split(',').filter(e => SYNCABLE_ENTITIES.includes(e))
        : SYNCABLE_ENTITIES;

    if (!entities.length) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No valid entity types' }) };
    }

    if (!since) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'since parameter required (ISO timestamp)' }) };
    }

    const placeholders = entities.map(() => '?').join(',');
    const rows = await db.execute({
        sql: `SELECT * FROM sync_events
              WHERE entity_type IN (${placeholders})
                AND created_at > ?
              ORDER BY created_at ASC
              LIMIT 1000`,
        args: [...entities, since]
    });

    return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ events: rows.rows, count: rows.rows.length })
    };
};

function authDesktopToken(event) {
    const expected = process.env.DESKTOP_SYNC_TOKEN;
    if (!expected) return false; // token not configured = deny

    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    return token === expected;
}

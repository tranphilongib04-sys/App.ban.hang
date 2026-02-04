/**
 * Sync Push — Desktop uploads local changes to Turso
 *
 * POST /api/sync/push
 *
 * Auth: Bearer DESKTOP_SYNC_TOKEN
 *
 * Body: [
 *   {
 *     entity_type: 'subscription' | 'customer' | 'family' | 'family_member' | 'warranty',
 *     entity_id: number,
 *     action: 'upsert' | 'delete',
 *     payload: { ...full row },
 *     idempotency_key: string   // SHA256(entity_type + entity_id + updated_at)
 *   }
 * ]
 *
 * Server:
 *   1. For each event, check idempotency_key → skip if already in sync_events
 *   2. Apply upsert/delete to the target table
 *   3. Insert sync_event record
 *
 * Returns: { accepted, skipped }
 */
const { getDb } = require('../../utils/db');
const { CORS } = require('../../utils/rbac');

const ALLOWED_TABLES = {
    subscription:   'subscriptions',
    customer:       'customers',
    family:         'families',
    family_member:  'family_members',
    warranty:       'warranties'
};

// Columns allowed for upsert (whitelist — prevents injection of arbitrary columns)
const ALLOWED_COLUMNS = {
    subscriptions: ['id','customer_id','service','start_date','end_date','distribution','revenue','cost',
                    'renewal_status','payment_status','last_contacted_at','reminder_date','contact_count',
                    'note','account_info','category','created_at','completed_at','updated_at'],
    customers:     ['id','name','source','contact','tags','note','created_at','updated_at'],
    families:      ['id','name','service','owner_account','start_date','end_date','payment_card','payment_day','note','created_at','updated_at'],
    family_members:['id','family_id','slot_number','member_name','member_account','start_date','end_date','note','created_at','updated_at'],
    warranties:    ['id','subscription_id','issue_date','issue_description','replacement_inventory_id','resolved_date','cost','warranty_status','note','created_at','updated_at']
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

    if (!authDesktopToken(event)) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let events;
    try { events = JSON.parse(event.body); } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!Array.isArray(events) || events.length === 0) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Body must be non-empty array' }) };
    }

    if (events.length > 100) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Max 100 events per push' }) };
    }

    const db = getDb();
    let accepted = 0;
    let skipped  = 0;
    const errors = [];

    for (const evt of events) {
        const { entity_type, entity_id, action, payload, idempotency_key } = evt;
        const table = ALLOWED_TABLES[entity_type];

        if (!table || !entity_id || !action || !payload || !idempotency_key) {
            errors.push({ entity_id, error: 'Missing required fields' });
            continue;
        }

        if (!['upsert', 'delete'].includes(action)) {
            errors.push({ entity_id, error: 'action must be upsert|delete' });
            continue;
        }

        try {
            // Idempotency check
            const existing = await db.execute({
                sql: 'SELECT id FROM sync_events WHERE idempotency_key = ?',
                args: [idempotency_key]
            });

            if (existing.rows.length > 0) {
                skipped++;
                continue;
            }

            if (action === 'upsert') {
                const allowedCols = ALLOWED_COLUMNS[table] || [];
                const cols = Object.keys(payload).filter(c => allowedCols.includes(c));
                if (!cols.length) {
                    errors.push({ entity_id, error: 'No valid columns in payload' });
                    continue;
                }

                const placeholders = cols.map(() => '?').join(',');
                const values = cols.map(c => payload[c]);

                await db.execute({
                    sql: `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
                    args: values
                });
            } else if (action === 'delete') {
                await db.execute({
                    sql: `DELETE FROM ${table} WHERE id = ?`,
                    args: [entity_id]
                });
            }

            // Record sync event
            await db.execute({
                sql: `INSERT INTO sync_events (event_type, entity_type, entity_id, source, actor, payload, idempotency_key)
                      VALUES (?, ?, ?, 'desktop', 'desktop', ?, ?)`,
                args: [action === 'upsert' ? 'UPSERT' : 'DELETE', entity_type, entity_id,
                       JSON.stringify(payload), idempotency_key]
            });

            accepted++;

        } catch (err) {
            errors.push({ entity_id, error: err.message });
        }
    }

    return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ accepted, skipped, errors })
    };
};

function authDesktopToken(event) {
    const expected = process.env.DESKTOP_SYNC_TOKEN;
    if (!expected) return false;
    const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    return token === expected;
}

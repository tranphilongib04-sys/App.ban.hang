/**
 * CUSTOMERS API - Netlify Function
 *
 * GET  /customers             - Get merged customer list (orders + manual)
 * POST /customers action=create  - Create customer
 * POST /customers action=update  - Update customer
 * POST /customers action=delete  - Delete customer
 *
 * Auth: Bearer token
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('Database not configured');
    return createClient({ url, authToken });
}

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
};

function checkAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const adminToken = process.env.ADMIN_API_TOKEN;

    if (!adminToken) return false;
    if (!authHeader) return false;

    const token = authHeader.replace('Bearer ', '');
    return token === adminToken;
}

async function ensureCustomersTable(db) {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            email TEXT UNIQUE,
            phone TEXT DEFAULT '',
            note TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

exports.handler = async function (event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (!checkAuth(event)) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const db = getDbClient();
        await ensureCustomersTable(db);

        // ── GET: List customers (merged from orders + manual table) ──
        if (event.httpMethod === 'GET') {
            // Aggregated from orders
            const ordersResult = await db.execute(`
                SELECT
                    customer_email as email,
                    customer_name as name,
                    customer_phone as phone,
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = 'fulfilled' THEN amount_total ELSE 0 END) as total_spent,
                    MAX(created_at) as last_order_date
                FROM orders
                WHERE customer_email IS NOT NULL AND customer_email != ''
                GROUP BY customer_email
                ORDER BY total_spent DESC, total_orders DESC
            `);

            // Manual customers
            const manualResult = await db.execute(`SELECT * FROM customers ORDER BY created_at DESC`);

            // Merge: manual customers override aggregated ones by email
            const merged = {};
            for (const row of ordersResult.rows) {
                merged[row.email] = { ...row, source: 'orders' };
            }
            for (const row of manualResult.rows) {
                if (merged[row.email]) {
                    merged[row.email] = { ...merged[row.email], ...row, source: 'both' };
                } else {
                    merged[row.email || ('manual_' + row.id)] = { ...row, total_orders: 0, total_spent: 0, last_order_date: null, source: 'manual' };
                }
            }

            return {
                statusCode: 200, headers,
                body: JSON.stringify({ success: true, customers: Object.values(merged) })
            };
        }

        // ── POST: Create / Update / Delete ──
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body);
            const { action } = body;

            if (action === 'create') {
                const { name, email, phone, note } = body;
                if (!name) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Thiếu tên khách hàng' }) };

                await db.execute({
                    sql: `INSERT INTO customers (name, email, phone, note) VALUES (?, ?, ?, ?)
                          ON CONFLICT(email) DO UPDATE SET name = excluded.name, phone = excluded.phone, note = excluded.note, updated_at = CURRENT_TIMESTAMP`,
                    args: [name, email || null, phone || '', note || '']
                });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã tạo khách hàng' }) };
            }

            if (action === 'update') {
                const { id, name, email, phone, note } = body;
                if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing customer id' }) };

                const sets = [];
                const args = [];
                if (name !== undefined) { sets.push('name = ?'); args.push(name); }
                if (email !== undefined) { sets.push('email = ?'); args.push(email); }
                if (phone !== undefined) { sets.push('phone = ?'); args.push(phone); }
                if (note !== undefined) { sets.push('note = ?'); args.push(note); }
                sets.push('updated_at = CURRENT_TIMESTAMP');
                args.push(id);

                if (sets.length <= 1) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) };

                await db.execute({ sql: `UPDATE customers SET ${sets.join(', ')} WHERE id = ?`, args });
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã cập nhật' }) };
            }

            if (action === 'delete') {
                const { id, email } = body;
                if (id) {
                    await db.execute({ sql: `DELETE FROM customers WHERE id = ?`, args: [id] });
                } else if (email) {
                    await db.execute({ sql: `DELETE FROM customers WHERE email = ?`, args: [email] });
                } else {
                    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id or email' }) };
                }
                return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Đã xoá khách hàng' }) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Customers API error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};


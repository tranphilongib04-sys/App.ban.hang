const crypto = require('crypto');

// Decrypt password
function decryptPassword(encrypted, iv) {
    try {
        return Buffer.from(encrypted, 'base64').toString('utf8');
    } catch {
        return '[ENCRYPTED]';
    }
}

async function ensurePaymentSchema(db) {
    // Safety net: create tables that migrate-schema-v2 should have already created.
    // Each is IF NOT EXISTS so this is a no-op on a healthy DB.

    await db.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            invoice_number TEXT UNIQUE NOT NULL,
            issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'issued',
            FOREIGN KEY(order_id) REFERENCES orders(id)
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type  TEXT    NOT NULL,
            entity_type TEXT    NOT NULL,
            entity_id   INTEGER,
            actor       TEXT    NOT NULL DEFAULT 'system',
            source      TEXT    NOT NULL DEFAULT 'system',
            payload     TEXT,
            created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS deliveries (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id        INTEGER NOT NULL,
            unit_id         INTEGER NOT NULL,
            delivery_token  TEXT    NOT NULL,
            delivered_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivery_note   TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (unit_id)  REFERENCES stock_units(id)
        )
    `);

    // Idempotency indexes — ignore if already present
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_txn ON payments(provider, transaction_id)`); } catch { /* ok */ }
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id)`); } catch { /* ok */ }
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_order_unit ON deliveries(order_id, unit_id)`); } catch { /* ok */ }
}

// Generate delivery token
function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

// PROCESS FULFILLMENT (Shared Logic)
async function fulfillOrder(db, order, transaction, skipSchemaCheck = false) {
    const now = new Date().toISOString();

    // Only ensure schema if not already done by caller
    if (!skipSchemaCheck) {
        await ensurePaymentSchema(db);
    }

    // 1. Create/Update payment record
    await db.execute({
        sql: `
            INSERT INTO payments (order_id, provider, amount, status, provider_ref, transaction_id, confirmed_at)
            VALUES (?, 'sepay', ?, 'confirmed', ?, ?, ?)
            ON CONFLICT(provider, transaction_id) DO NOTHING
        `,
        args: [
            order.id,
            order.amount_total,
            transaction.id || transaction.reference_number,
            transaction.id || transaction.reference_number,
            now
        ]
    });

    // 2. Get all allocated units for this order
    const allocationsResult = await db.execute({
        sql: `
            SELECT oa.id, oa.unit_id, su.username, su.password_encrypted, su.password_iv, su.extra_info
            FROM order_allocations oa
            JOIN stock_units su ON oa.unit_id = su.id
            JOIN order_lines ol ON oa.order_line_id = ol.id
            WHERE ol.order_id = ? AND oa.status = 'reserved'
            ORDER BY oa.id ASC
        `,
        args: [order.id]
    });

    const credentials = [];
    for (const alloc of allocationsResult.rows) {
        const password = decryptPassword(alloc.password_encrypted, alloc.password_iv);
        credentials.push({
            username: alloc.username,
            password: password,
            extraInfo: alloc.extra_info || ''
        });
    }

    // 3. Update allocations: reserved -> sold
    await db.execute({
        sql: `
            UPDATE order_allocations
            SET status = 'sold', reserved_until = NULL
            WHERE order_line_id IN (
                SELECT id FROM order_lines WHERE order_id = ?
            ) AND status = 'reserved'
        `,
        args: [order.id]
    });

    // 4. Update stock units: reserved -> sold
    await db.execute({
        sql: `
            UPDATE stock_units
            SET status = 'sold',
                sold_order_id = ?,
                sold_at = ?,
                reserved_order_id = NULL,
                reserved_until = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (
                SELECT unit_id FROM order_allocations
                WHERE order_line_id IN (
                    SELECT id FROM order_lines WHERE order_id = ?
                ) AND status = 'sold'
            )
        `,
        args: [order.id, now, order.id]
    });

    // 5. Update order: fulfilled (CAS on status — safe against concurrent race)
    await db.execute({
        sql: `
            UPDATE orders
            SET status = 'fulfilled',
                reserved_until = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'pending_payment'
        `,
        args: [order.id]
    });

    // 6. Generate Delivery Token (before logging, so we can store it)
    const deliveryToken = generateDeliveryToken(order.id, order.customer_email);

    // 7. Per-unit delivery log (idempotent via UNIQUE on order_id, unit_id)
    for (const alloc of allocationsResult.rows) {
        await db.execute({
            sql: `
                INSERT INTO deliveries (order_id, unit_id, delivery_token, delivered_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(order_id, unit_id) DO NOTHING
            `,
            args: [order.id, alloc.unit_id, deliveryToken, now]
        });
    }

    // 8. Invoice (idempotent: ON CONFLICT on order_id does nothing)
    const invoiceNumber = `TBQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now() % 100000).padStart(5, '0')}`;
    await db.execute({
        sql: `
            INSERT INTO invoices (order_id, invoice_number, issued_at, status)
            VALUES (?, ?, ?, 'issued')
            ON CONFLICT(order_id) DO NOTHING
        `,
        args: [order.id, invoiceNumber, now]
    });
    // Read back the actual invoice number (in case a previous run already inserted one)
    const invoiceRow = await db.execute({
        sql: `SELECT invoice_number FROM invoices WHERE order_id = ?`,
        args: [order.id]
    });
    const finalInvoiceNumber = invoiceRow.rows[0]?.invoice_number || invoiceNumber;

    // 9. Audit logs (replaces order_status_history)
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            'PAYMENT_CONFIRMED',
            'payment',
            order.id,
            'system',
            'fulfillment',
            JSON.stringify({ transaction_id: transaction.id || transaction.reference_number, amount: order.amount_total })
        ]
    });
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            'ORDER_FULFILLED',
            'order',
            order.id,
            'system',
            'fulfillment',
            JSON.stringify({
                invoice_number: finalInvoiceNumber,
                units_delivered: allocationsResult.rows.map(a => a.unit_id),
                delivery_token: deliveryToken
            })
        ]
    });

    return {
        deliveryToken,
        invoiceNumber: finalInvoiceNumber,
        credentials
    };
}

module.exports = { fulfillOrder, ensurePaymentSchema, generateDeliveryToken };

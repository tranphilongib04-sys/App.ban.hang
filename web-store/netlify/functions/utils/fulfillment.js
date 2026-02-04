const crypto = require('crypto');

// ---------------------------------------------------------------------------
// State-machine constants
//   pending_payment  →  paid  →  fulfilled
//   pending_payment  →  failed | refunded   (terminal)
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS = {
    pending_payment: ['paid', 'failed', 'refunded'],
    paid:            ['fulfilled', 'refunded'],
    fulfilled:       [],          // terminal – idempotent return only
    failed:          [],
    refunded:        []
};

function decryptPassword(encrypted, iv) {
    try {
        return Buffer.from(encrypted, 'base64').toString('utf8');
    } catch {
        return '[ENCRYPTED]';
    }
}

// ---------------------------------------------------------------------------
// ensurePaymentSchema  – idempotent DDL safety-net.
// MUST be called OUTSIDE any BEGIN … COMMIT block (DDL auto-commits in SQLite).
// ---------------------------------------------------------------------------
async function ensurePaymentSchema(db) {
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

    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_txn ON payments(provider, transaction_id)`); } catch { /* ok */ }
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id)`); } catch { /* ok */ }
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_order_unit ON deliveries(order_id, unit_id)`); } catch { /* ok */ }
}

function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET || 'default-secret-change-me';
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(secret + data).digest('hex').substring(0, 32);
}

// ---------------------------------------------------------------------------
// finalizeOrder(db, order, transaction, source)
//
// THE single entry-point for "payment confirmed → deliver".
// Used by: webhook-sepay, check-payment, reconcile-payments.
//
// Contract:
//   • Caller MUST have already called ensurePaymentSchema(db) BEFORE BEGIN.
//   • Caller wraps this in BEGIN IMMEDIATE … COMMIT/ROLLBACK.
//   • This function is fully idempotent: calling it twice with the same
//     transaction.id on an already-fulfilled order returns the cached result
//     without writing anything.
//
// Returns: { alreadyFulfilled, deliveryToken, invoiceNumber, credentials }
// ---------------------------------------------------------------------------
async function finalizeOrder(db, order, transaction, source = 'unknown') {
    const now = new Date().toISOString();
    const txId = transaction.id || transaction.reference_number;

    // ── 1. Re-read order inside the transaction (CAS guard) ──────────
    const freshRow = await db.execute({
        sql: 'SELECT * FROM orders WHERE id = ? LIMIT 1',
        args: [order.id]
    });
    const fresh = freshRow.rows[0];
    if (!fresh) throw new Error(`Order ${order.id} disappeared`);

    // Already terminal → idempotent return
    if (fresh.status === 'fulfilled') {
        const token = generateDeliveryToken(fresh.id, fresh.customer_email);
        const inv = await db.execute({ sql: 'SELECT invoice_number FROM invoices WHERE order_id = ?', args: [fresh.id] });
        console.log(`[finalizeOrder] order ${fresh.id} already fulfilled – idempotent`);
        return { alreadyFulfilled: true, deliveryToken: token, invoiceNumber: inv.rows[0]?.invoice_number || null, credentials: [] };
    }

    // Validate transition from current status → fulfilled
    const allowed = VALID_TRANSITIONS[fresh.status];
    if (!allowed || !allowed.includes('paid')) {
        console.warn(`[finalizeOrder] order ${fresh.id} in status "${fresh.status}" – cannot transition to paid`);
        return { alreadyFulfilled: true, deliveryToken: null, invoiceNumber: null, credentials: [] };
    }

    // ── 2. Record payment (idempotent ON CONFLICT) ───────────────────
    await db.execute({
        sql: `INSERT INTO payments (order_id, provider, amount, status, provider_ref, transaction_id, confirmed_at)
              VALUES (?, 'sepay', ?, 'confirmed', ?, ?, ?)
              ON CONFLICT(provider, transaction_id) DO NOTHING`,
        args: [fresh.id, fresh.amount_total, txId, txId, now]
    });

    // ── 3. Transition: pending_payment → paid ────────────────────────
    await db.execute({
        sql: `UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ? AND status = 'pending_payment'`,
        args: [now, fresh.id]
    });

    // ── 4. Collect allocated credentials ──────────────────────────────
    const allocationsResult = await db.execute({
        sql: `SELECT oa.id, oa.unit_id, su.content, su.password_encrypted, su.password_iv
              FROM order_allocations oa
              JOIN stock_units su ON oa.unit_id = su.id
              JOIN order_lines ol ON oa.order_line_id = ol.id
              WHERE ol.order_id = ? AND oa.status = 'reserved'
              ORDER BY oa.id ASC`,
        args: [fresh.id]
    });

    const credentials = [];
    for (const alloc of allocationsResult.rows) {
        const password = decryptPassword(alloc.password_encrypted, alloc.password_iv);
        let username = '', extraInfo = '';
        try {
            const obj = JSON.parse(alloc.content || '{}');
            username = obj.username || obj.email || alloc.content;
            extraInfo = obj.note || '';
        } catch { username = alloc.content || ''; }
        credentials.push({ username, password, extraInfo });
    }

    // ── 5. Allocations reserved → sold ───────────────────────────────
    await db.execute({
        sql: `UPDATE order_allocations SET status = 'sold', reserved_until = NULL
              WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?) AND status = 'reserved'`,
        args: [fresh.id]
    });

    // ── 6. Stock-units reserved → sold ───────────────────────────────
    await db.execute({
        sql: `UPDATE stock_units
              SET status = 'sold', sold_order_id = ?, sold_at = ?,
                  reserved_order_id = NULL, reserved_until = NULL, updated_at = CURRENT_TIMESTAMP
              WHERE id IN (
                  SELECT unit_id FROM order_allocations
                  WHERE order_line_id IN (SELECT id FROM order_lines WHERE order_id = ?) AND status = 'sold'
              )`,
        args: [fresh.id, now, fresh.id]
    });

    // ── 7. Transition: paid → fulfilled (CAS on 'paid') ──────────────
    await db.execute({
        sql: `UPDATE orders SET status = 'fulfilled', reserved_until = NULL, updated_at = ?
              WHERE id = ? AND status = 'paid'`,
        args: [now, fresh.id]
    });

    // ── 8. Delivery token + per-unit delivery log ────────────────────
    const deliveryToken = generateDeliveryToken(fresh.id, fresh.customer_email);
    for (const alloc of allocationsResult.rows) {
        await db.execute({
            sql: `INSERT INTO deliveries (order_id, unit_id, delivery_token, delivered_at)
                  VALUES (?, ?, ?, ?) ON CONFLICT(order_id, unit_id) DO NOTHING`,
            args: [fresh.id, alloc.unit_id, deliveryToken, now]
        });
    }

    // ── 9. Invoice (idempotent) ───────────────────────────────────────
    const invoiceNumber = `TBQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now() % 100000).padStart(5, '0')}`;
    await db.execute({
        sql: `INSERT INTO invoices (order_id, invoice_number, issued_at, status)
              VALUES (?, ?, ?, 'issued') ON CONFLICT(order_id) DO NOTHING`,
        args: [fresh.id, invoiceNumber, now]
    });
    const invRow = await db.execute({ sql: 'SELECT invoice_number FROM invoices WHERE order_id = ?', args: [fresh.id] });
    const finalInvoiceNumber = invRow.rows[0]?.invoice_number || invoiceNumber;

    // ── 10. Audit trail ───────────────────────────────────────────────
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['PAYMENT_CONFIRMED', 'payment', fresh.id, 'system', source,
            JSON.stringify({ transaction_id: txId, amount: fresh.amount_total })]
    });
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['ORDER_FULFILLED', 'order', fresh.id, 'system', source,
            JSON.stringify({ invoice_number: finalInvoiceNumber, units_delivered: allocationsResult.rows.map(a => a.unit_id), delivery_token: deliveryToken })]
    });

    console.log(`[finalizeOrder] order ${fresh.id} fulfilled via ${source}`);
    return { alreadyFulfilled: false, deliveryToken, invoiceNumber: finalInvoiceNumber, credentials };
}

// ---------------------------------------------------------------------------
// fulfillOrder – thin wrapper kept for backward compat.
// Delegates entirely to finalizeOrder.
// ---------------------------------------------------------------------------
async function fulfillOrder(db, order, transaction, skipSchemaCheck = false) {
    if (!skipSchemaCheck) await ensurePaymentSchema(db);
    return finalizeOrder(db, order, transaction, 'fulfillOrder-compat');
}

module.exports = { finalizeOrder, fulfillOrder, ensurePaymentSchema, generateDeliveryToken };

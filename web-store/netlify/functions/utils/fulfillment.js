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

    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_txn ON payments(provider, transaction_id)`); } catch { /* ok */ }
    try { await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id)`); } catch { /* ok */ }
}

function generateDeliveryToken(orderId, email) {
    const secret = process.env.DELIVERY_SECRET;
    if (!secret) throw new Error('DELIVERY_SECRET not configured');
    const key = secret;
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const data = `${orderId}|${email}|${day}`;
    return crypto.createHash('sha256').update(key + data).digest('hex').substring(0, 32);
}

// ---------------------------------------------------------------------------
// finalizeOrder(db, order, transaction, source)
//
// THE single entry-point for "payment confirmed → deliver".
// Used by: webhook-sepay, check-payment, reconcile-payments.
//
// V3 UNIFIED: Reads from `stock_items` table directly (linked via stock_items.order_id).
//             No longer depends on order_allocations or stock_units.
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

    // Validate transition from current status → paid
    const allowed = VALID_TRANSITIONS[fresh.status];
    if (!allowed || !allowed.includes('paid')) {
        console.warn(`[finalizeOrder] order ${fresh.id} in status "${fresh.status}" – cannot transition to paid`);
        return { alreadyFulfilled: true, deliveryToken: null, invoiceNumber: null, credentials: [] };
    }

    // ── 2. Record payment (idempotent) ────────────────────────────────
    const existingConfirmed = await db.execute({
        sql: `SELECT id FROM payments WHERE order_id = ? AND status = 'confirmed' LIMIT 1`,
        args: [fresh.id]
    });
    if (!existingConfirmed.rows[0]) {
        await db.execute({
            sql: `INSERT INTO payments (order_id, provider, amount, status, provider_ref, transaction_id, confirmed_at)
                  VALUES (?, 'sepay', ?, 'confirmed', ?, ?, ?)
                  ON CONFLICT(provider, transaction_id) DO NOTHING`,
            args: [fresh.id, fresh.amount_total, txId, txId, now]
        });
    }

    // ── 3. Transition: pending_payment → paid ────────────────────────
    await db.execute({
        sql: `UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ? AND status = 'pending_payment'`,
        args: [now, fresh.id]
    });

    // ── 4. Collect reserved stock_items (V3 unified) ─────────────────
    //    Giao liền (auto) mới có reserved items. Giao sau 5-10' (owner_upgrade) không có → rows rỗng.
    const stockResult = await db.execute({
        sql: `SELECT si.id, si.account_info, si.secret_key, si.note
              FROM stock_items si
              WHERE si.order_id = ? AND si.status = 'reserved'
              ORDER BY si.id ASC`,
        args: [fresh.id]
    });

    const credentials = [];
    for (const item of stockResult.rows) {
        credentials.push({
            username: item.account_info || '',
            password: item.secret_key || '',
            extraInfo: item.note || ''
        });
    }

    // ── 5. Stock items: reserved → sold ───────────────────────────────
    if (stockResult.rows.length > 0) {
        const placeholders = stockResult.rows.map(() => '?').join(',');
        const stockIds = stockResult.rows.map(r => r.id);
        await db.execute({
            sql: `UPDATE stock_items
                  SET status = 'sold', sold_at = ?
                  WHERE id IN (${placeholders}) AND status = 'reserved'`,
            args: [now, ...stockIds]
        });
    }

    // ── 6. Transition: paid → fulfilled (CAS on 'paid') ──────────────
    await db.execute({
        sql: `UPDATE orders SET status = 'fulfilled', reserved_until = NULL, updated_at = ?
              WHERE id = ? AND status = 'paid'`,
        args: [now, fresh.id]
    });

    // ── 7. Delivery token ──────────────────────────────────────────────
    const deliveryToken = generateDeliveryToken(fresh.id, fresh.customer_email);

    // ── 8. Invoice (idempotent) ───────────────────────────────────────
    const invoiceNumber = `TBQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now() % 100000).padStart(5, '0')}`;
    await db.execute({
        sql: `INSERT INTO invoices (order_id, invoice_number, issued_at, status)
              VALUES (?, ?, ?, 'issued') ON CONFLICT(order_id) DO NOTHING`,
        args: [fresh.id, invoiceNumber, now]
    });
    const invRow = await db.execute({ sql: 'SELECT invoice_number FROM invoices WHERE order_id = ?', args: [fresh.id] });
    const finalInvoiceNumber = invRow.rows[0]?.invoice_number || invoiceNumber;

    // ── 9. Audit trail ───────────────────────────────────────────────
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['PAYMENT_CONFIRMED', 'payment', fresh.id, 'system', source,
            JSON.stringify({ transaction_id: txId, amount: fresh.amount_total })]
    });
    await db.execute({
        sql: `INSERT INTO audit_logs (event_type, entity_type, entity_id, actor, source, payload) VALUES (?,?,?,?,?,?)`,
        args: ['ORDER_FULFILLED', 'order', fresh.id, 'system', source,
            JSON.stringify({
                invoice_number: finalInvoiceNumber,
                stock_items_delivered: stockResult.rows.map(a => a.id),
                delivery_token: deliveryToken
            })]
    });

    console.log(`[finalizeOrder] order ${fresh.id} fulfilled via ${source} | ${stockResult.rows.length} items delivered`);
    return { alreadyFulfilled: false, deliveryToken, invoiceNumber: finalInvoiceNumber, credentials };
}

// ---------------------------------------------------------------------------
// fulfillOrder – thin wrapper kept for backward compat.
// ---------------------------------------------------------------------------
async function fulfillOrder(db, order, transaction, skipSchemaCheck = false) {
    if (!skipSchemaCheck) await ensurePaymentSchema(db);
    return finalizeOrder(db, order, transaction, 'fulfillOrder-compat');
}

module.exports = { finalizeOrder, fulfillOrder, ensurePaymentSchema, generateDeliveryToken };

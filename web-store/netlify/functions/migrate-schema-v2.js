/**
 * MIGRATION V2 — Schema Hardening
 *
 * Idempotent: safe to run multiple times.
 * All statements are CREATE … IF NOT EXISTS or CREATE INDEX IF NOT EXISTS.
 * No data is moved or deleted.
 *
 * What this adds / fixes vs migrate-schema.js (v1):
 *   1. audit_logs   — replaces the ad-hoc order_status_history + inventory_logs
 *   2. users        — RBAC root table
 *   3. deliveries   — per-unit delivery log (was missing from v1)
 *   4. sync_events  — idempotency_key column for desktop push dedup
 *   5. Missing indexes on orders, payments, allocations
 *   6. updated_at on subscriptions / customers / families / family_members / warranties
 *      (needed as sync cursor; added via ALTER if column missing)
 *
 * Run: npx netlify functions:invoke migrate-schema-v2
 *   OR: node -e "require('./netlify/functions/migrate-schema-v2').migrate().then(()=>process.exit(0))"
 */

const { createClient } = require('@libsql/client/web');

function getDbClient() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not configured');
    return createClient({ url, authToken });
}

async function run(db, sql, label) {
    try {
        await db.execute(sql);
        console.log(`  ✓ ${label}`);
    } catch (err) {
        // "already exists" / "duplicate column" are expected on re-runs
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate column')) {
            console.log(`  = ${label} (already exists)`);
        } else {
            console.error(`  ✗ ${label}: ${err.message}`);
            throw err;
        }
    }
}

async function migrate() {
    const db = getDbClient();
    console.log('migrate-schema-v2: starting…');

    // ──────────────────────────────────────────────
    // 1. audit_logs  (replaces order_status_history + inventory_logs for new writes)
    // ──────────────────────────────────────────────
    await run(db, `
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
    `, 'audit_logs table');

    await run(db, `CREATE INDEX IF NOT EXISTS idx_audit_event_type  ON audit_logs(event_type)`,           'idx_audit_event_type');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_audit_entity      ON audit_logs(entity_type, entity_id)`, 'idx_audit_entity');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_audit_created     ON audit_logs(created_at)`,            'idx_audit_created');

    // ──────────────────────────────────────────────
    // 2. users  (RBAC)
    // ──────────────────────────────────────────────
    await run(db, `
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'OPS'
                          CHECK(role IN ('ADMIN','OPS','ACCOUNTANT')),
            is_active     INTEGER NOT NULL DEFAULT 1,
            created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `, 'users table');

    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`, 'idx_users_email');

    // ──────────────────────────────────────────────
    // 3. deliveries  (per-unit delivery log)
    // ──────────────────────────────────────────────
    await run(db, `
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
    `, 'deliveries table');

    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_order_unit ON deliveries(order_id, unit_id)`, 'idx_deliveries_order_unit');

    // ──────────────────────────────────────────────
    // 4. sync_events — add idempotency_key column (if missing)
    // ──────────────────────────────────────────────
    await run(db, `
        CREATE TABLE IF NOT EXISTS sync_events (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type       TEXT    NOT NULL,
            entity_type      TEXT    NOT NULL,
            entity_id        INTEGER,
            source           TEXT    NOT NULL DEFAULT 'system',
            actor            TEXT,
            payload          TEXT,
            idempotency_key  TEXT,
            created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `, 'sync_events table (full)');

    // If table existed from v1 without idempotency_key, add column
    await run(db, `ALTER TABLE sync_events ADD COLUMN idempotency_key TEXT`, 'sync_events.idempotency_key column');

    await run(db, `CREATE INDEX IF NOT EXISTS idx_sync_created       ON sync_events(created_at)`,            'idx_sync_created');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_sync_entity        ON sync_events(entity_type, entity_id)`, 'idx_sync_entity');
    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_idempotency ON sync_events(idempotency_key) WHERE idempotency_key IS NOT NULL`, 'idx_sync_idempotency');

    // ──────────────────────────────────────────────
    // 5. Missing indexes on existing tables
    // ──────────────────────────────────────────────

    // payments — idempotency (may already exist from fulfillment ensurePaymentSchema)
    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotent ON payments(provider, transaction_id)`, 'idx_payments_idempotent');
    // payments — 1 confirmed per order (partial index)
    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_order_confirmed ON payments(order_id) WHERE status = 'confirmed'`, 'idx_payments_order_confirmed');

    // invoices — 1 per order
    await run(db, `CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id)`, 'idx_invoices_order');

    // orders — status + email lookups
    await run(db, `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,            'idx_orders_status');
    await run(db, `CREATE INDEX IF NOT EXISTS idx_orders_email  ON orders(customer_email)`,    'idx_orders_email');

    // order_allocations — unit lookup (for "is this unit allocated anywhere?")
    await run(db, `CREATE INDEX IF NOT EXISTS idx_alloc_unit ON order_allocations(unit_id)`,   'idx_alloc_unit');

    // ──────────────────────────────────────────────
    // 6. Add updated_at to sync-target tables (ALTER if missing)
    //    These columns are the cursor for 2-way desktop sync.
    // ──────────────────────────────────────────────
    const syncTables = ['subscriptions', 'customers', 'families', 'family_members', 'warranties'];
    for (const tbl of syncTables) {
        await run(db, `ALTER TABLE ${tbl} ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`, `${tbl}.updated_at column`);
        await run(db, `CREATE INDEX IF NOT EXISTS idx_${tbl}_updated ON ${tbl}(updated_at)`, `idx_${tbl}_updated`);
    }

    // ──────────────────────────────────────────────
    // 7. Backfill: set updated_at = created_at where NULL (one-time)
    // ──────────────────────────────────────────────
    for (const tbl of syncTables) {
        await run(db, `UPDATE ${tbl} SET updated_at = created_at WHERE updated_at IS NULL`, `backfill ${tbl}.updated_at`);
    }

    console.log('migrate-schema-v2: done.');
}

// Netlify function entrypoint (manual trigger)
exports.handler = async function (event) {
    try {
        await migrate();
        return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Migration v2 complete' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};

// Direct node invocation
if (require.main === module) {
    migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { migrate };

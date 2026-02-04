/**
 * Sync Loop Orchestrator
 *
 * - On startup: run once immediately
 * - Then every SYNC_INTERVAL_MS (default 30s)
 * - Sequence: pull 2-way → pull readonly → push pending
 *
 * Exposes:
 *   startSyncLoop()   — call once from app init
 *   stopSyncLoop()    — for cleanup / tests
 *   triggerSync()     — manual one-shot (e.g. after a local write)
 */
import { client } from '../db';
import { pull2Way, pullReadonly } from './pull';
import { pushPending } from './push';
import type { SyncEntityType, ReadonlyEntity } from './types';

const SYNC_INTERVAL_MS = 30_000; // 30 seconds

const TWO_WAY_ENTITIES: SyncEntityType[] = ['subscription', 'customer', 'family', 'family_member', 'warranty'];
const READONLY_ENTITIES: ReadonlyEntity[] = ['orders', 'stock_units', 'payments', 'order_lines', 'order_allocations', 'deliveries', 'invoices', 'products'];

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

// ─── INIT: create local tables if missing ─────────────────────────
export async function initSyncTables(): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS local_sync_state (
      entity_type     TEXT PRIMARY KEY,
      last_pulled_at  TEXT,
      last_pushed_at  TEXT,
      last_sync_event_id INTEGER
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS local_pending_sync (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type      TEXT NOT NULL,
      entity_id        INTEGER NOT NULL,
      action           TEXT NOT NULL CHECK(action IN ('upsert','delete')),
      payload          TEXT NOT NULL,
      idempotency_key  TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ─── PUBLIC API ────────────────────────────────────────────────────
export function startSyncLoop(): void {
  if (intervalId) return; // already running

  // Immediate first run
  triggerSync();

  intervalId = setInterval(() => {
    triggerSync();
  }, SYNC_INTERVAL_MS);

  console.log(`[SyncLoop] Started. Interval: ${SYNC_INTERVAL_MS / 1000}s`);
}

export function stopSyncLoop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SyncLoop] Stopped.');
  }
}

export async function triggerSync(): Promise<{ pulled2Way: number; pulledReadonly: number; pushed: number }> {
  if (running) return { pulled2Way: 0, pulledReadonly: 0, pushed: 0 }; // skip if previous cycle still running
  running = true;

  let pulled2Way = 0, pulledReadonly = 0, pushed = 0;

  try {
    // ── 1. Pull 2-way ──
    const since2Way = await getCursor('subscription'); // use subscription as representative cursor
    pulled2Way = await pull2Way(TWO_WAY_ENTITIES, since2Way);

    // ── 2. Pull readonly ──
    const sinceReadonly = await getCursor('__readonly__');
    pulledReadonly = await pullReadonly(READONLY_ENTITIES, sinceReadonly);

    // ── 3. Push pending ──
    const pushResult = await pushPending();
    pushed = pushResult.pushed;

    if (pulled2Way || pulledReadonly || pushed) {
      console.log(`[SyncLoop] pulled2Way=${pulled2Way} pulledReadonly=${pulledReadonly} pushed=${pushed}`);
    }

  } catch (err: any) {
    console.error('[SyncLoop] Error:', err.message);
  } finally {
    running = false;
  }

  return { pulled2Way, pulledReadonly, pushed };
}

// ─── helpers ───────────────────────────────────────────────────────
async function getCursor(entityType: string): Promise<string> {
  const row = await client.execute({
    sql: 'SELECT last_pulled_at FROM local_sync_state WHERE entity_type = ?',
    args: [entityType]
  });
  return (row.rows[0] as any)?.last_pulled_at || '1970-01-01T00:00:00Z';
}

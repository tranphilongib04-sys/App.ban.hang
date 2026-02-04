/**
 * Pull logic: fetch changes from Turso → apply locally.
 *
 * Two modes:
 *   1. 2-way entities (subscription/customer/family/…) via /api/sync/pull
 *   2. Read-only entities (orders/stock_units/…) via /api/sync/pull-readonly
 */
import { client } from '../db';
import type { SyncEntityType, ReadonlyEntity, ReadonlyPullResponse } from './types';

const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL || 'https://tbq-admin.netlify.app';
const SYNC_TOKEN    = process.env.DESKTOP_SYNC_TOKEN || '';

// ─── 2-WAY PULL ────────────────────────────────────────────────────
export async function pull2Way(entityTypes: SyncEntityType[], since: string): Promise<number> {
  if (!SYNC_TOKEN) {
    console.warn('[Sync] DESKTOP_SYNC_TOKEN not set — pull skipped');
    return 0;
  }

  const res = await fetch(
    `${ADMIN_WEB_URL}/.netlify/functions/api/sync/pull?entity_type=${entityTypes.join(',')}&since=${encodeURIComponent(since)}`,
    { headers: { Authorization: `Bearer ${SYNC_TOKEN}` } }
  );

  if (!res.ok) {
    console.error('[Sync/pull] HTTP', res.status, await res.text());
    return 0;
  }

  const data = await res.json() as { events: Array<{ entity_type: string; event_type: string; entity_id: number; payload: Record<string,unknown>; created_at: string }> };
  const events = data.events || [];

  // Map entity_type → table name (local schema uses plural)
  const TABLE_MAP: Record<string, string> = {
    subscription:   'subscriptions',
    customer:       'customers',
    family:         'families',
    family_member:  'family_members',
    warranty:       'warranties'
  };

  let applied = 0;

  for (const evt of events) {
    const table = TABLE_MAP[evt.entity_type];
    if (!table) continue;

    if (evt.event_type === 'UPSERT') {
      const cols = Object.keys(evt.payload);
      const vals = Object.values(evt.payload);
      const placeholders = cols.map(() => '?').join(',');

      await client.execute({
        sql: `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
        args: vals as any[]
      });
      applied++;
    } else if (evt.event_type === 'DELETE') {
      await client.execute({
        sql: `DELETE FROM ${table} WHERE id = ?`,
        args: [evt.entity_id]
      });
      applied++;
    }
  }

  // Update cursor
  if (events.length > 0) {
    for (const et of entityTypes) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO local_sync_state (entity_type, last_pulled_at) VALUES (?, ?)`,
        args: [et, new Date().toISOString()]
      });
    }
  }

  return applied;
}

// ─── READ-ONLY PULL ────────────────────────────────────────────────
export async function pullReadonly(entities: ReadonlyEntity[], since: string): Promise<number> {
  if (!SYNC_TOKEN) return 0;

  const res = await fetch(
    `${ADMIN_WEB_URL}/.netlify/functions/api/sync/pull-readonly?entities=${entities.join(',')}&since=${encodeURIComponent(since)}`,
    { headers: { Authorization: `Bearer ${SYNC_TOKEN}` } }
  );

  if (!res.ok) {
    console.error('[Sync/pull-readonly] HTTP', res.status);
    return 0;
  }

  const data = await res.json() as ReadonlyPullResponse;
  let applied = 0;

  for (const [table, rows] of Object.entries(data)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const cols = Object.keys(row);
      const vals = Object.values(row);
      const placeholders = cols.map(() => '?').join(',');

      await client.execute({
        sql: `INSERT OR REPLACE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
        args: vals as any[]
      });
      applied++;
    }
  }

  // Update cursor for readonly
  if (applied > 0) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO local_sync_state (entity_type, last_pulled_at) VALUES (?, ?)`,
      args: ['__readonly__', new Date().toISOString()]
    });
  }

  return applied;
}

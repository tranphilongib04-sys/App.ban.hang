/**
 * Push logic: read local pending_sync queue → POST to /api/sync/push → clear queue on success.
 *
 * Retry: exponential backoff 5s / 15s / 60s. After 3 failures: leave in queue, log warning.
 */
import { client } from '../db';

const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL || 'https://tbq-admin.netlify.app';
const SYNC_TOKEN    = process.env.DESKTOP_SYNC_TOKEN || '';

const MAX_RETRIES = 3;
const BACKOFFS_MS = [5000, 15000, 60000]; // 5s, 15s, 60s

export async function pushPending(): Promise<{ pushed: number; failed: number }> {
  if (!SYNC_TOKEN) {
    console.warn('[Sync] DESKTOP_SYNC_TOKEN not set — push skipped');
    return { pushed: 0, failed: 0 };
  }

  // Read pending items from local queue
  const pendingRes = await client.execute(
    'SELECT * FROM local_pending_sync ORDER BY created_at ASC LIMIT 100'
  );

  const pending = pendingRes.rows;
  if (!pending.length) return { pushed: 0, failed: 0 };

  // Build payload for server
  const payload = pending.map((p: any) => ({
    entity_type:     p.entity_type,
    entity_id:       p.entity_id,
    action:          p.action,
    payload:         JSON.parse(p.payload || '{}'),
    idempotency_key: p.idempotency_key
  }));

  // POST with retry
  let lastError: string | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `${ADMIN_WEB_URL}/.netlify/functions/api/sync/push`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SYNC_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const result = await res.json() as { accepted: number; skipped: number; errors: any[] };

        // Remove successfully pushed items from local queue
        const pushedIds = pending.map((p: any) => p.id);
        if (pushedIds.length > 0) {
          const placeholders = pushedIds.map(() => '?').join(',');
          await client.execute({
            sql: `DELETE FROM local_pending_sync WHERE id IN (${placeholders})`,
            args: pushedIds
          });
        }

        // Update cursor
        await client.execute({
          sql: `INSERT OR REPLACE INTO local_sync_state (entity_type, last_pushed_at) VALUES (?, ?)`,
          args: ['__push__', new Date().toISOString()]
        });

        return { pushed: result.accepted + result.skipped, failed: result.errors?.length || 0 };
      }

      lastError = `HTTP ${res.status}`;
      console.warn(`[Sync/push] Attempt ${attempt + 1} failed: ${lastError}`);

    } catch (err: any) {
      lastError = err.message;
      console.warn(`[Sync/push] Attempt ${attempt + 1} error: ${lastError}`);
    }

    // Backoff before next attempt (except last)
    if (attempt < MAX_RETRIES - 1) {
      await sleep(BACKOFFS_MS[attempt]);
    }
  }

  // All retries exhausted — items stay in queue for next cycle
  console.error(`[Sync/push] All ${MAX_RETRIES} retries failed. Last error: ${lastError}. Items remain in queue.`);
  return { pushed: 0, failed: pending.length };
}

/**
 * Enqueue a local change for push.
 * Call this every time the app writes to a syncable table.
 */
export async function enqueuePush(
  entityType: string,
  entityId: number,
  action: 'upsert' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  const updatedAt = payload.updated_at || new Date().toISOString();
  // idempotency_key: deterministic from entity + updated_at
  const raw = `${entityType}:${entityId}:${updatedAt}`;
  const idempotencyKey = simpleHash(raw);

  await client.execute({
    sql: `INSERT INTO local_pending_sync (entity_type, entity_id, action, payload, idempotency_key, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [entityType, entityId, action, JSON.stringify(payload), idempotencyKey, new Date().toISOString()]
  });
}

// ─── utils ─────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Simple deterministic hash (no crypto dependency for renderer process)
function simpleHash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return s.length.toString(16) + Math.abs(hash).toString(16);
}

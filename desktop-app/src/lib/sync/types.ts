// Sync event shape — matches what push.js / pull.js exchange
export type SyncEntityType =
  | 'subscription'
  | 'customer'
  | 'family'
  | 'family_member'
  | 'warranty'
  | 'inventory';

export type SyncAction = 'upsert' | 'delete';

export interface SyncEvent {
  id?: number;
  event_type: 'UPSERT' | 'DELETE';
  entity_type: SyncEntityType;
  entity_id: number;
  source: string;
  actor?: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  created_at?: string;
}

// What the desktop queues locally before pushing
export interface PendingPush {
  id: number; // local rowid
  entity_type: SyncEntityType;
  entity_id: number;
  action: SyncAction;
  payload: Record<string, unknown>;
  idempotency_key: string;
  created_at: string;
}

// Sync state per entity type
export interface SyncCursor {
  entity_type: string;
  last_pulled_at: string | null;
  last_pushed_at: string | null;
  last_sync_event_id: number | null;
}

// Read-only pull response shape
export type ReadonlyEntity =
  | 'orders'
  | 'stock_units'
  | 'payments'
  | 'order_lines'
  | 'order_allocations'
  | 'deliveries'
  | 'invoices'
  | 'products';

export type ReadonlyPullResponse = Partial<Record<ReadonlyEntity, Record<string, unknown>[]>>;

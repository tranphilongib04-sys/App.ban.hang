import * as schema from './schema';
import path from 'path';
import { existsSync, mkdirSync, renameSync } from 'fs';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';

// Check if running in Cloud mode (Vercel/Turso)
const isCloudMode = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let db: any;
let sqlite: any;

if (isCloudMode) {
  // Cloud Mode: Connect to Turso
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  db = drizzle(client, { schema });
} else {
  // Local Mode: Connect to local file
  function getDbPath() {
    // Check if running in Electron
    if (process.env.ELECTRON_USER_DATA) {
      const userDataPath = process.env.ELECTRON_USER_DATA;
      const dataDir = path.join(userDataPath, 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      const newPath = path.join(dataDir, 'tpb-manage.db');
      return newPath;
    }

    // Development mode
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'tpb-manage.db');
  }

  const dbPath = getDbPath();
  sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  db = drizzleSqlite(sqlite, { schema });

  // Initialize tables if they don't exist
  initializeDatabase();
}

export { db };

// Initialize database tables (Only for Local Mode)
// For Cloud mode, we should use migrations, but for simplicity we can run raw SQL if client allows,
// OR just rely on the migration script to set it up.
export function initializeDatabase() {
  if (isCloudMode) {
    // In cloud mode, we skip local init.
    // The user should run the migration/push script to set up the cloud DB.
    return;
  }

  console.log('Initializing database tables...');

  const runSafe = (sql: string, description: string) => {
    try {
      sqlite.exec(sql);
      console.log(`\u2713 ${description} checked/created.`);
    } catch (error: any) {
      console.error(`\u2717 Failed to init ${description}:`, error.message);
    }
  };

  runSafe(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      source TEXT,
      contact TEXT,
      tags TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'customers');

  runSafe(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      service TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      distribution TEXT,
      revenue REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      renewal_status TEXT NOT NULL DEFAULT 'pending' CHECK(renewal_status IN ('pending', 'renewed', 'not_renewing')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'paid', 'not_paying')),
      last_contacted_at TEXT,
      reminder_date TEXT,
      contact_count INTEGER DEFAULT 0,
      note TEXT,
      account_info TEXT,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'subscriptions');

  runSafe(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      distribution TEXT,
      secret_payload TEXT NOT NULL,
      secret_masked TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'delivered', 'invalid')),
      import_batch TEXT,
      cost REAL DEFAULT 0,
      note TEXT,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'inventory_items');

  runSafe(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
      inventory_id INTEGER NOT NULL REFERENCES inventory_items(id),
      delivered_at TEXT NOT NULL,
      delivery_note TEXT
    );
  `, 'deliveries');

  runSafe(`
    CREATE TABLE IF NOT EXISTS warranties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
      issue_date TEXT NOT NULL,
      issue_description TEXT,
      replacement_inventory_id INTEGER REFERENCES inventory_items(id),
      resolved_date TEXT,
      cost REAL DEFAULT 0,
      warranty_status TEXT NOT NULL DEFAULT 'pending' CHECK(warranty_status IN ('pending', 'resolved', 'rejected')),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'warranties');

  runSafe(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `, 'system_config');

  runSafe(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
    CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
    CREATE INDEX IF NOT EXISTS idx_inventory_service ON inventory_items(service);
    CREATE INDEX IF NOT EXISTS idx_deliveries_subscription ON deliveries(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_warranties_subscription ON warranties(subscription_id);
  `, 'indices');
}

import * as schema from './schema';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient, Client } from '@libsql/client';

// Get local database path
function getLocalDbPath() {
  // Check if running in Electron
  if (process.env.ELECTRON_USER_DATA) {
    const userDataPath = process.env.ELECTRON_USER_DATA;
    const dataDir = path.join(userDataPath, 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'tpb-manage.db');
  }

  // Skip local file operations on Vercel (read-only filesystem)
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  if (isVercel) {
    return ''; // Will not be used in cloud-only mode
  }

  // Development mode
  const dataDir = path.join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'tpb-manage.db');
}

// Check configuration
const hasTursoCredentials = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
// Vercel: always cloud-only (read-only filesystem). Local: when Turso is set, use embedded replicas (sync) by default so local + Vercel share the same DB.
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const syncEnabled = !isVercel && !!hasTursoCredentials && (process.env.TURSO_SYNC_ENABLED !== 'false');

let client: Client;
let db: ReturnType<typeof drizzle>;
let syncInitialized = false;

if (hasTursoCredentials && syncEnabled) {
  // EMBEDDED REPLICAS MODE: Local SQLite + Cloud Sync
  console.log('🔄 Database: Embedded Replicas Mode (Local + Cloud Sync)');

  const localPath = getLocalDbPath();
  console.log(`   Local replica: ${localPath}`);
  console.log(`   Cloud sync: ${process.env.TURSO_DATABASE_URL}`);

  client = createClient({
    url: `file:${localPath}`,
    syncUrl: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  db = drizzle(client, { schema });

  // Initial sync will be done lazily on first database access or manually
  // This avoids top-level await which can cause issues with Next.js bundling

} else if (hasTursoCredentials) {
  // CLOUD ONLY MODE: Direct connection to Turso
  console.log('☁️  Database: Cloud Only Mode (Turso)');

  client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  db = drizzle(client, { schema });

} else {
  // LOCAL ONLY MODE: Just local SQLite
  console.log('💾 Database: Local Only Mode');

  const localPath = getLocalDbPath();
  console.log(`   Database: ${localPath}`);

  client = createClient({
    url: `file:${localPath}`,
  });

  db = drizzle(client, { schema });
}

// Export database instance
export { db, client };

// Initialize sync for embedded replicas mode (call this once after app starts)
export async function initializeSync(): Promise<void> {
  if (syncInitialized || !syncEnabled) return;

  try {
    await client.sync();
    console.log('✓ Database synced with cloud');
    syncInitialized = true;

    // Start periodic sync
    const SYNC_INTERVAL_MS = 5000;
    setInterval(() => {
      syncDatabase({ logSuccess: false }).catch(() => { });
    }, SYNC_INTERVAL_MS);
  } catch (error: any) {
    console.warn('⚠️  Initial sync failed:', error.message);
    // Don't throw - allow app to work with local data
  }
}

// Sync function for embedded replicas (local → Turso). Pass logSuccess=true to log on success (e.g. initial sync).
export async function syncDatabase(options?: { logSuccess?: boolean }) {
  if (!hasTursoCredentials || !syncEnabled) {
    return { success: true, message: 'Sync not enabled' };
  }

  try {
    await client.sync();
    if (options?.logSuccess) {
      console.log('✓ Database synced with cloud');
    }
    return { success: true, message: 'Synced successfully' };
  } catch (error: any) {
    console.error('✗ Sync failed:', error.message);
    return { success: false, message: error.message };
  }
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('Initializing database tables...');

  const runSafe = async (sql: string, description: string) => {
    try {
      await client.execute(sql);
      console.log(`✓ ${description} checked/created.`);
    } catch (error: any) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        console.error(`✗ Failed to init ${description}:`, error.message);
      }
    }
  };

  await runSafe(`
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

  await runSafe(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      service TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      distribution TEXT,
      revenue REAL DEFAULT 0,
      cost REAL DEFAULT 0,
      renewal_status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      last_contacted_at TEXT,
      reminder_date TEXT,
      contact_count INTEGER DEFAULT 0,
      note TEXT,
      account_info TEXT,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'subscriptions');

  await runSafe(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      distribution TEXT,
      secret_payload TEXT NOT NULL,
      secret_masked TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      import_batch TEXT,
      cost REAL DEFAULT 0,
      note TEXT,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'inventory_items');

  await runSafe(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
      inventory_id INTEGER NOT NULL REFERENCES inventory_items(id),
      delivered_at TEXT NOT NULL,
      delivery_note TEXT
    );
  `, 'deliveries');

  await runSafe(`
    CREATE TABLE IF NOT EXISTS warranties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
      issue_date TEXT NOT NULL,
      issue_description TEXT,
      replacement_inventory_id INTEGER REFERENCES inventory_items(id),
      resolved_date TEXT,
      cost REAL DEFAULT 0,
      warranty_status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `, 'warranties');

  await runSafe(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `, 'system_config');

  // Create indexes
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);`, 'idx_subscriptions_customer');
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);`, 'idx_subscriptions_end_date');
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);`, 'idx_inventory_status');
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_inventory_service ON inventory_items(service);`, 'idx_inventory_service');
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_deliveries_subscription ON deliveries(subscription_id);`, 'idx_deliveries_subscription');
  await runSafe(`CREATE INDEX IF NOT EXISTS idx_warranties_subscription ON warranties(subscription_id);`, 'idx_warranties_subscription');

  // Initialize sync after database setup
  if (hasTursoCredentials && syncEnabled) {
    await initializeSync();
  }
}

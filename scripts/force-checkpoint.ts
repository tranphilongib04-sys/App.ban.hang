
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
console.log(`Opening DB: ${dbPath}`);

try {
    const db = new Database(dbPath);
    console.log('Checkpointing...');
    const result = db.pragma('wal_checkpoint(RESTART)');
    console.log('Checkpoint Result:', result);

    const count = db.prepare('SELECT COUNT(*) as c FROM subscriptions').get();
    console.log('Row Count after checkpoint:', count);
} catch (e: any) {
    console.error('Error:', e.message);
}

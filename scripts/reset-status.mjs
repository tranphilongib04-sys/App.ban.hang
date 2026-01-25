import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync, renameSync } from 'fs';

// Duplicate the logic from db/index.ts to find the DB
function getDbPath() {
    // We are running this script from root via node, so use process.cwd()
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }
    const newPath = path.join(dataDir, 'tpb-manage.db');
    // Logic for old path check (optional here but good for consistency)
    const oldPath = path.join(dataDir, 'subtrack.db');
    if (!existsSync(newPath) && existsSync(oldPath)) {
        try { renameSync(oldPath, newPath); } catch { }
    }
    return newPath;
}

const dbPath = getDbPath();
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

try {
    const stmt = db.prepare("UPDATE subscriptions SET renewal_status = 'pending', payment_status = 'unpaid'");
    const info = stmt.run();
    console.log(`Successfully updated ${info.changes} subscriptions to 'pending' and 'unpaid'.`);
} catch (err) {
    console.error("Error updating database:", err);
} finally {
    db.close();
}

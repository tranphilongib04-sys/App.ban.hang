const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
const db = new Database(dbPath, { readonly: true });

try {
    const columns = db.prepare("PRAGMA table_info('inventory_items')").all();
    console.log("Columns in inventory_items:");
    console.table(columns);
} catch (error) {
    console.error("Error inspecting database:", error);
}

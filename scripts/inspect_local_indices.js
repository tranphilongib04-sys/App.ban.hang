const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
const db = new Database(dbPath, { readonly: true });

try {
    const indices = db.prepare("PRAGMA index_list('inventory_items')").all();
    console.log("Indices on inventory_items:");
    console.log(indices);

    for (const idx of indices) {
        const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
        console.log(`\nIndex: ${idx.name} (Unique: ${idx.unique})`);
        console.log(info);
    }
} catch (error) {
    console.error("Error inspecting database:", error);
}

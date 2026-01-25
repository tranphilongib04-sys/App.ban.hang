const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath);

console.log("--- Recent Customers ---");
try {
    const customers = db.prepare("SELECT id, name, source, created_at FROM customers ORDER BY id DESC LIMIT 20").all();
    console.table(customers);
} catch (e) { console.error(e); }

console.log("--- Recent Subscriptions ---");
try {
    const subs = db.prepare("SELECT id, service, created_at FROM subscriptions ORDER BY id DESC LIMIT 20").all();
    console.table(subs);
} catch (e) { console.error(e); }

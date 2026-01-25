const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
const db = new Database(dbPath);

// Cutoff time: 2026-01-23T14:38:00.000Z (UTC) - corresponds to 21:38 local time start of import
const cutoff = '2026-01-23T14:38:00.000Z';

console.log(`Checking for data created after ${cutoff}...`);

const subs = db.prepare("SELECT count(*) as count FROM subscriptions WHERE created_at > ?").get(cutoff);
const custs = db.prepare("SELECT count(*) as count FROM customers WHERE created_at > ?").get(cutoff);

console.log(`Found ${subs.count} subscriptions and ${custs.count} customers.`);

if (subs.count > 0 || custs.count > 0) {
    try {
        // Delete deliveries if any (just in case, though import likely didn't create them)
        // Need to find subscription IDs first to be safe or just cascade? 
        // SQLite usually enforces FK if enabled.
        // Let's manually delete child records.

        const subIds = db.prepare("SELECT id FROM subscriptions WHERE created_at > ?").all(cutoff).map(s => s.id);

        if (subIds.length > 0) {
            const placeholders = subIds.map(() => '?').join(',');

            // Deliveries
            const delDeliveries = db.prepare(`DELETE FROM deliveries WHERE subscription_id IN (${placeholders})`).run(...subIds);
            console.log(`Deleted ${delDeliveries.changes} deliveries.`);

            // Warranties
            const delWarranties = db.prepare(`DELETE FROM warranties WHERE subscription_id IN (${placeholders})`).run(...subIds);
            console.log(`Deleted ${delWarranties.changes} warranties.`);
        }

        // Delete subscriptions
        const delSubs = db.prepare("DELETE FROM subscriptions WHERE created_at > ?").run(cutoff);
        console.log(`Deleted ${delSubs.changes} subscriptions.`);

        // Delete customers
        const delCusts = db.prepare("DELETE FROM customers WHERE created_at > ?").run(cutoff);
        console.log(`Deleted ${delCusts.changes} customers.`);

    } catch (e) {
        console.error("Error deleting data:", e);
    }
} else {
    console.log("No data found to delete.");
}

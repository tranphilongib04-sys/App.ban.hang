import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

console.log('🔄 Marking historical subscriptions as complete...\n');

// Find all subscriptions ending before 2026-01-23 that are not yet completed
const pendingOldSubs = db.prepare(`
    SELECT id, service, end_date, renewal_status, payment_status 
    FROM subscriptions 
    WHERE end_date < '2026-01-23' 
    AND (renewal_status != 'renewed' OR payment_status != 'paid')
`).all() as Array<{
    id: number;
    service: string;
    end_date: string;
    renewal_status: string;
    payment_status: string;
}>;

console.log(`📊 Found ${pendingOldSubs.length} subscriptions ending before 2026-01-23 to mark as complete\n`);

if (pendingOldSubs.length === 0) {
    console.log('✅ All historical data already marked as complete!');
    db.close();
    process.exit(0);
}

// Update them to completed status
const updateStmt = db.prepare(`
    UPDATE subscriptions 
    SET renewal_status = 'renewed', payment_status = 'paid' 
    WHERE id = ?
`);

let updated = 0;
for (const sub of pendingOldSubs) {
    updateStmt.run(sub.id);
    console.log(`  ✓ ID ${sub.id}: ${sub.service} (${sub.end_date}) - marked as renewed & paid`);
    updated++;
}

console.log(`\n✅ Updated ${updated} subscriptions to completed status`);

// Show summary
const beforeDate = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subscriptions 
    WHERE end_date < '2026-01-23'
`).get() as { count: number };

const fromDate = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subscriptions 
    WHERE end_date >= '2026-01-23'
`).get() as { count: number };

console.log('\n📋 Final Summary:');
console.log(`  Before 2026-01-23: ${beforeDate.count} subscriptions (all completed ✓)`);
console.log(`  From 2026-01-23 onwards: ${fromDate.count} subscriptions (active work)`);

db.close();
console.log('\n✅ Done!');

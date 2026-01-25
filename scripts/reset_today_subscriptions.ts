import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

const targetDate = '2026-01-23';

console.log(`🔄 Resetting subscriptions ending on ${targetDate} to pending status...\n`);

// Count how many will be affected
const countStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subscriptions 
    WHERE end_date = ?
`);
const { count } = countStmt.get(targetDate) as { count: number };

console.log(`📊 Found ${count} subscriptions ending on ${targetDate}\n`);

if (count === 0) {
    console.log('✅ No subscriptions to reset!');
    db.close();
    process.exit(0);
}

// Reset to pending/unpaid
const updateStmt = db.prepare(`
    UPDATE subscriptions 
    SET renewal_status = 'pending', payment_status = 'unpaid' 
    WHERE end_date = ?
`);

const result = updateStmt.run(targetDate);

console.log(`✅ Updated ${result.changes} subscriptions to pending/unpaid status\n`);

// Show affected subscriptions
const affected = db.prepare(`
    SELECT 
        s.id,
        c.name as customer_name,
        s.service,
        s.end_date,
        s.renewal_status,
        s.payment_status
    FROM subscriptions s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.end_date = ?
    LIMIT 10
`).all(targetDate) as Array<{
    id: number;
    customer_name: string;
    service: string;
    end_date: string;
    renewal_status: string;
    payment_status: string;
}>;

console.log('📋 Sample of reset subscriptions:');
for (const sub of affected) {
    console.log(`  - ID ${sub.id}: ${sub.customer_name} - ${sub.service} (${sub.renewal_status}/${sub.payment_status})`);
}

if (count > 10) {
    console.log(`  ... and ${count - 10} more`);
}

console.log('\n✅ Done! These subscriptions should now appear in the Today page.');

db.close();

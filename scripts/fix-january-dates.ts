// Script to fix subscription dates for January 2026
// Problem: Subscriptions have startDate=2025-12-01 and endDate=2026-01-01
// Should be: startDate=2026-01-01 and endDate=2026-02-01
import Database from 'better-sqlite3';
import path from 'path';
import { addMonths, format, differenceInMonths, parseISO } from 'date-fns';

const dbPath = path.join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔍 Finding subscriptions to fix...\n');

// Find ALL subscriptions where:
// - startDate is 2025-12-01 AND endDate is 2026-01-01 
// These need to be shifted to startDate=2026-01-01 and endDate=2026-02-01
const subscriptionsToFix = db.prepare(`
  SELECT 
    s.id,
    s.customer_id,
    s.service,
    s.start_date,
    s.end_date,
    s.renewal_status,
    s.payment_status,
    s.account_info,
    c.name as customer_name
  FROM subscriptions s
  JOIN customers c ON s.customer_id = c.id
  WHERE s.start_date = '2025-12-01' AND s.end_date = '2026-01-01'
  ORDER BY c.name
`).all() as any[];

console.log(`📋 Found ${subscriptionsToFix.length} subscriptions to fix\n`);

if (subscriptionsToFix.length === 0) {
    console.log('✅ No subscriptions need fixing!');
    db.close();
    process.exit(0);
}

// Preview changes
console.log('Preview of changes (first 10):');
console.log('─'.repeat(80));

for (const sub of subscriptionsToFix.slice(0, 10)) {
    console.log(`${sub.customer_name} (${sub.service}):`);
    console.log(`  Old: ${sub.start_date} → ${sub.end_date}`);
    console.log(`  New: 2026-01-01 → 2026-02-01`);
    console.log(`  Status: ${sub.renewal_status}/${sub.payment_status}`);
    console.log('');
}

if (subscriptionsToFix.length > 10) {
    console.log(`... and ${subscriptionsToFix.length - 10} more\n`);
}

// Apply changes directly (no confirmation needed as user requested)
console.log('🔧 Applying changes...\n');

const updateStmt = db.prepare(`
  UPDATE subscriptions 
  SET start_date = '2026-01-01', end_date = '2026-02-01'
  WHERE id = ?
`);

let updated = 0;

for (const sub of subscriptionsToFix) {
    updateStmt.run(sub.id);
    updated++;
}

console.log(`✅ Updated ${updated} subscriptions!`);
console.log('   All subscriptions now have correct January 2026 dates:');
console.log('   - startDate: 2026-01-01');
console.log('   - endDate: 2026-02-01');

db.close();

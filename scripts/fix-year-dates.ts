// Script to fix subscriptions with incorrect dates (2025 should be 2026)
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

console.log('🔍 Finding subscriptions with incorrect dates...\n');

// Find subscriptions where:
// - endDate is in 2025 and appears to be wrong (purchased in Dec 2025 but expired same day or before)
// - These need year correction to 2026
const subscriptionsToFix = db.prepare(`
  SELECT 
    s.id,
    s.customer_id,
    s.service,
    s.start_date,
    s.end_date,
    c.name as customer_name
  FROM subscriptions s
  JOIN customers c ON s.customer_id = c.id
  WHERE s.end_date LIKE '2025-%'
    AND s.start_date >= '2025-12-01'
  ORDER BY s.end_date
`).all() as any[];

console.log(`📋 Found ${subscriptionsToFix.length} subscriptions with potentially incorrect dates\n`);

if (subscriptionsToFix.length === 0) {
    console.log('✅ No subscriptions need fixing!');
    db.close();
    process.exit(0);
}

// Preview changes
console.log('Preview of changes:');
console.log('─'.repeat(80));

for (const sub of subscriptionsToFix.slice(0, 15)) {
    const oldEndDate = sub.end_date;
    // Change 2025 to 2026 in end_date
    const newEndDate = oldEndDate.replace('2025-', '2026-');

    console.log(`${sub.customer_name} (${sub.service}):`);
    console.log(`  Old endDate: ${oldEndDate}`);
    console.log(`  New endDate: ${newEndDate}`);
    console.log('');
}

if (subscriptionsToFix.length > 15) {
    console.log(`... and ${subscriptionsToFix.length - 15} more\n`);
}

// Apply changes
console.log('🔧 Applying changes...\n');

const updateStmt = db.prepare(`
  UPDATE subscriptions 
  SET end_date = replace(end_date, '2025-', '2026-')
  WHERE id = ?
`);

let updated = 0;

for (const sub of subscriptionsToFix) {
    updateStmt.run(sub.id);
    updated++;
}

console.log(`✅ Updated ${updated} subscriptions!`);
console.log('   Year in endDate corrected from 2025 to 2026');

db.close();

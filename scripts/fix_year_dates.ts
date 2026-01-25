import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

console.log('🔄 Fixing year in date fields (2025 months 01-05 → 2026)...\n');

// Months to fix: January through May
const monthsToFix = ['01', '02', '03', '04', '05'];

// Count affected records before fix
console.log('📊 Analyzing affected records:\n');
let totalAffected = 0;

for (const month of monthsToFix) {
    const pattern = `2025-${month}-%`;
    const count = db.prepare(`
        SELECT COUNT(*) as count 
        FROM subscriptions 
        WHERE start_date LIKE ? OR end_date LIKE ?
    `).get(pattern, pattern) as { count: number };

    if (count.count > 0) {
        console.log(`  2025-${month}-*: ${count.count} subscriptions`);
        totalAffected += count.count;
    }
}

console.log(`\n  Total affected: ${totalAffected} subscriptions\n`);

if (totalAffected === 0) {
    console.log('✅ No dates to fix!');
    db.close();
    process.exit(0);
}

// Fix start_date
console.log('🔧 Updating start_date fields...\n');
let startUpdated = 0;

for (const month of monthsToFix) {
    const result = db.prepare(`
        UPDATE subscriptions 
        SET start_date = REPLACE(start_date, '2025-${month}', '2026-${month}')
        WHERE start_date LIKE '2025-${month}-%'
    `).run();

    if (result.changes > 0) {
        console.log(`  ✓ 2025-${month} → 2026-${month}: ${result.changes} records`);
        startUpdated += result.changes;
    }
}

console.log(`\n  Total start_date updated: ${startUpdated}\n`);

// Fix end_date
console.log('🔧 Updating end_date fields...\n');
let endUpdated = 0;

for (const month of monthsToFix) {
    const result = db.prepare(`
        UPDATE subscriptions 
        SET end_date = REPLACE(end_date, '2025-${month}', '2026-${month}')
        WHERE end_date LIKE '2025-${month}-%'
    `).run();

    if (result.changes > 0) {
        console.log(`  ✓ 2025-${month} → 2026-${month}: ${result.changes} records`);
        endUpdated += result.changes;
    }
}

console.log(`\n  Total end_date updated: ${endUpdated}\n`);

// Show final date range
const dateRange = db.prepare(`
    SELECT 
        MIN(start_date) as earliest_start,
        MAX(start_date) as latest_start,
        MIN(end_date) as earliest_end,
        MAX(end_date) as latest_end
    FROM subscriptions
`).get() as {
    earliest_start: string;
    latest_start: string;
    earliest_end: string;
    latest_end: string;
};

console.log('📅 Final date ranges in database:');
console.log(`  Start dates: ${dateRange.earliest_start} → ${dateRange.latest_start}`);
console.log(`  End dates:   ${dateRange.earliest_end} → ${dateRange.latest_end}\n`);

// Verify no more 2025-01 through 2025-05 dates exist
const remaining = db.prepare(`
    SELECT COUNT(*) as count 
    FROM subscriptions 
    WHERE start_date LIKE '2025-01-%' 
       OR start_date LIKE '2025-02-%'
       OR start_date LIKE '2025-03-%'
       OR start_date LIKE '2025-04-%'
       OR start_date LIKE '2025-05-%'
       OR end_date LIKE '2025-01-%'
       OR end_date LIKE '2025-02-%'
       OR end_date LIKE '2025-03-%'
       OR end_date LIKE '2025-04-%'
       OR end_date LIKE '2025-05-%'
`).get() as { count: number };

if (remaining.count === 0) {
    console.log('✅ Verification passed: No 2025-01 through 2025-05 dates remaining!');
} else {
    console.log(`⚠️  Warning: ${remaining.count} dates still in 2025-01 through 2025-05`);
}

db.close();
console.log('\n✅ Done!');

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data/tpb-manage.db');
const db = new Database(dbPath);

console.log('🔍 Searching for records with 2027 dates...\n');

// Find all subscriptions with dates in 2027
const subscriptionsIn2027 = db.prepare(`
  SELECT 
    s.id,
    c.name as customer_name,
    s.service,
    s.start_date,
    s.end_date,
    s.revenue,
    s.cost
  FROM subscriptions s
  LEFT JOIN customers c ON s.customer_id = c.id
  WHERE s.start_date LIKE '2027%' OR s.end_date LIKE '2027%'
  ORDER BY s.end_date DESC
`).all();

if (subscriptionsIn2027.length === 0) {
  console.log('✅ No records found with 2027 dates.');
  db.close();
  process.exit(0);
}

console.log(`Found ${subscriptionsIn2027.length} subscription(s) with 2027 dates:\n`);
subscriptionsIn2027.forEach((sub: any) => {
  console.log(`  ID: ${sub.id}`);
  console.log(`  Customer: ${sub.customer_name}`);
  console.log(`  Service: ${sub.service}`);
  console.log(`  Start Date: ${sub.start_date}`);
  console.log(`  End Date: ${sub.end_date}`);
  console.log(`  Revenue: ${sub.revenue}, Cost: ${sub.cost}`);
  console.log('  ---');
});

console.log('\n🗑️  Deleting records...\n');

// Delete related deliveries first (foreign key constraint)
const deleteDeliveries = db.prepare(`
  DELETE FROM deliveries 
  WHERE subscription_id IN (
    SELECT id FROM subscriptions 
    WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
  )
`);

// Delete related warranties
const deleteWarranties = db.prepare(`
  DELETE FROM warranties 
  WHERE subscription_id IN (
    SELECT id FROM subscriptions 
    WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
  )
`);

// Delete subscriptions
const deleteSubscriptions = db.prepare(`
  DELETE FROM subscriptions 
  WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
`);

// Execute deletions in a transaction
const deleteAll = db.transaction(() => {
  const deliveriesResult = deleteDeliveries.run();
  const warrantiesResult = deleteWarranties.run();
  const subscriptionsResult = deleteSubscriptions.run();

  return {
    deliveries: deliveriesResult.changes,
    warranties: warrantiesResult.changes,
    subscriptions: subscriptionsResult.changes
  };
});

const result = deleteAll();

console.log('✅ Deletion complete!');
console.log(`   - Deleted ${result.subscriptions} subscription(s)`);
console.log(`   - Deleted ${result.deliveries} delivery record(s)`);
console.log(`   - Deleted ${result.warranties} warranty record(s)`);

db.close();

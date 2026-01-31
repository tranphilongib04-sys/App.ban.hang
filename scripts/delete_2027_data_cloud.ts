import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
    console.error('❌ Missing Turso credentials. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env');
    process.exit(1);
}

const client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
});

async function deleteCloudData() {
    console.log('🔍 Searching for records with 2027 dates on cloud database...\n');

    // Find all subscriptions with dates in 2027
    const result = await client.execute({
        sql: `
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
    `,
        args: []
    });

    if (result.rows.length === 0) {
        console.log('✅ No records found with 2027 dates on cloud.');
        return;
    }

    console.log(`Found ${result.rows.length} subscription(s) with 2027 dates:\n`);
    result.rows.forEach((row: any) => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Customer: ${row.customer_name}`);
        console.log(`  Service: ${row.service}`);
        console.log(`  Start Date: ${row.start_date}`);
        console.log(`  End Date: ${row.end_date}`);
        console.log(`  Revenue: ${row.revenue}, Cost: ${row.cost}`);
        console.log('  ---');
    });

    console.log('\n🗑️  Deleting records from cloud...\n');

    // Delete related deliveries first (foreign key constraint)
    const deliveriesResult = await client.execute({
        sql: `
      DELETE FROM deliveries 
      WHERE subscription_id IN (
        SELECT id FROM subscriptions 
        WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
      )
    `,
        args: []
    });

    // Delete related warranties
    const warrantiesResult = await client.execute({
        sql: `
      DELETE FROM warranties 
      WHERE subscription_id IN (
        SELECT id FROM subscriptions 
        WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
      )
    `,
        args: []
    });

    // Delete subscriptions
    const subscriptionsResult = await client.execute({
        sql: `
      DELETE FROM subscriptions 
      WHERE start_date LIKE '2027%' OR end_date LIKE '2027%'
    `,
        args: []
    });

    console.log('✅ Deletion complete on cloud!');
    console.log(`   - Deleted ${subscriptionsResult.rowsAffected} subscription(s)`);
    console.log(`   - Deleted ${deliveriesResult.rowsAffected} delivery record(s)`);
    console.log(`   - Deleted ${warrantiesResult.rowsAffected} warranty record(s)`);
}

deleteCloudData()
    .then(() => {
        console.log('\n✅ Cloud cleanup finished successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

import 'dotenv/config';
import { db } from '../src/lib/db';
import { subscriptions, customers } from '../src/lib/db/schema';
import { eq, like, and } from 'drizzle-orm';

async function run() {
    console.log('--- VERIFYING CLOUD DATA ---');
    if (!process.env.TURSO_DATABASE_URL) {
        console.error('No cloud credentials found.');
        process.exit(1);
    }

    // Check Lương Hiền specifically
    const results = await db.select({
        id: subscriptions.id,
        name: customers.name,
        service: subscriptions.service,
        endDate: subscriptions.endDate
    })
        .from(subscriptions)
        .leftJoin(customers, eq(subscriptions.customerId, customers.id))
        .where(like(customers.name, '%Lương Hiền%'))
        .execute();

    console.log('Cloud Records for Lương Hiền:');
    console.log(JSON.stringify(results, null, 2));

    // Check if new date is present
    const hasNewDate = results.some(r => r.endDate === '2026-01-29');
    if (hasNewDate) {
        console.log('✅ SUCCESS: Verified 29/1/2026 date exists in Cloud.');
    } else {
        console.log('❌ FAILURE: New date not found.');
    }
}
run();

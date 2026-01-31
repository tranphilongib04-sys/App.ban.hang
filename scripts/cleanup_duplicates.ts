
import { db } from '@/lib/db';
import { subscriptions, customers, deliveries, warranties } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

async function run() {
    console.log('Starting duplicate cleanup (v2 - with FK constraints)...');

    // 1. Fetch all subscriptions
    const allSubs = await db.select({
        sub: subscriptions,
        customerName: customers.name
    })
        .from(subscriptions)
        .leftJoin(customers, eq(subscriptions.customerId, customers.id))
        .orderBy(desc(subscriptions.id));

    const groups = new Map<string, number[]>();
    const toDelete: number[] = [];

    // 2. Iterate to find duplicates
    for (const { sub, customerName } of allSubs) {
        // Strict Key: Name + Account + Service + Start + End
        const name = (customerName || '').trim().toLowerCase();
        const info = (sub.accountInfo || '').trim().toLowerCase();
        const service = (sub.service || '').trim().toLowerCase();
        const start = (sub.startDate || '').trim();
        const end = (sub.endDate || '').trim();

        const key = `${name}|${info}|${service}|${start}|${end}`;

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(sub.id);
    }

    // 3. Identify duplicates to remove (keep only the latest ID)
    groups.forEach((ids, key) => {
        if (ids.length > 1) {
            // ids[0] is the newest because of orderBy desc(id)
            // Delete the rest (older ones)
            for (let i = 1; i < ids.length; i++) {
                toDelete.push(ids[i]);
            }
        }
    });

    console.log(`Found ${toDelete.length} duplicate subscriptions.`);

    // 4. Batch delete with Foreign Key handling
    if (toDelete.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < toDelete.length; i += batchSize) {
            const batch = toDelete.slice(i, i + batchSize);

            console.log(`Processing batch of ${batch.length}...`);

            // A. Delete related Deliveries
            await db.delete(deliveries).where(inArray(deliveries.subscriptionId, batch));

            // B. Delete related Warranties
            await db.delete(warranties).where(inArray(warranties.subscriptionId, batch));

            // C. Delete the Subscriptions
            await db.delete(subscriptions).where(inArray(subscriptions.id, batch));

            console.log(`  -> Deleted dependencies and subscriptions for batch.`);
        }
    }

    console.log('Cleanup complete.');
    process.exit(0);
}

run();

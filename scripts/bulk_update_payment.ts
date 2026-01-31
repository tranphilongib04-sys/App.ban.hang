
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { and, gte, lte } from 'drizzle-orm';

async function run() {
    console.log('Starting bulk payment update...');

    // Range: 2026-01-29 to 2026-01-31
    const start = '2026-01-29';
    const end = '2026-01-31';

    try {
        const result = await db.update(subscriptions)
            .set({ paymentStatus: 'unpaid' })
            .where(
                and(
                    gte(subscriptions.endDate, start),
                    lte(subscriptions.endDate, end)
                )
            )
            .returning();

        console.log(`Updated ${result.length} subscriptions to 'unpaid'.`);
    } catch (error) {
        console.error('Error updating subscriptions:', error);
    }

    process.exit(0);
}

run();

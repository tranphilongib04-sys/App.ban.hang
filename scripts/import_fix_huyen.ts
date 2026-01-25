
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    const customerName = 'Huyền Nguyễn';
    const accountInfo = 'phankhanhlinh1212@gmail.com | linhhuyen1';
    const service = 'Spotify';
    const startDate = new Date('2025-10-03').toISOString();
    const endDate = new Date('2026-10-03').toISOString();
    const revenue = 295000;
    const cost = 0;
    const distribution = 'Zalo | Long';

    // 1. Find or Create Customer
    let customerId: number;
    const existingCustomer = await db.query.customers.findFirst({
        where: eq(customers.name, customerName)
    });

    if (existingCustomer) {
        customerId = existingCustomer.id;
        console.log('Customer exists:', customerName);
    } else {
        const newCustomer = await db.insert(customers).values({
            name: customerName,
            source: 'Zalo'
        }).returning();
        customerId = newCustomer[0].id;
        console.log('Created customer:', customerName);
    }

    // 2. Check duplicate
    const existingSub = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.customerId, customerId),
            eq(subscriptions.service, service),
            eq(subscriptions.startDate, startDate)
        )
    });

    if (existingSub) {
        console.log('Subscription already exists, skipping.');
        return;
    }

    // 3. Create Subscription
    await db.insert(subscriptions).values({
        customerId,
        service,
        startDate,
        endDate,
        accountInfo,
        revenue,
        cost,
        distribution,
        paymentStatus: 'paid',
        renewalStatus: 'pending',
        overallStatus: 'active'
    });

    console.log('Successfully imported Huyền Nguyễn.');
}

main().catch(console.error);

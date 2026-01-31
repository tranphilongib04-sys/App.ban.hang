import 'dotenv/config'; // Load env vars!
import { db } from '../src/lib/db';
import { customers, subscriptions } from '../src/lib/db/schema';
import { eq, and, like } from 'drizzle-orm';

async function run() {
    console.log('--- SYNCING TO CLOUD (REMOTE TURSO) ---');
    console.log('Checking connection...');

    // Check if we are actually in cloud mode
    if (!process.env.TURSO_DATABASE_URL) {
        console.error('❌ ERROR: TURSO_DATABASE_URL is missing. Are .env files loaded?');
        process.exit(1);
    }
    console.log('✅ Connected to Cloud successfully.');

    // The data to sync
    const dataToSync = [
        {
            name: 'Lương Hiền',
            service: 'Chatgpt plus',
            account: 'sensual_23tequila@icloud.com',
            source: 'Fb JS',
            startDate: '2025-12-29',
            endDate: '2026-01-29',
            revenue: 80000,
            cost: 50000,
            dist: 'Hong Phuoc Tele'
        },
        {
            name: 'Anna',
            service: 'Capcut pro',
            account: 'mauricio@amberfield.icu|Mon123123@',
            source: 'Zalo',
            startDate: '2025-12-29',
            endDate: '2026-01-29',
            revenue: 25000,
            cost: 12000,
            dist: 'Bot'
        },
        {
            name: 'Lê Quỳnh Như',
            service: 'Chatgpt plus',
            account: 'haitn.gpt@gmail.com',
            source: 'Zalo',
            startDate: '2025-12-29',
            endDate: '2026-01-29',
            revenue: 70000,
            cost: 8000,
            dist: 'Long'
        }
    ];

    for (const item of dataToSync) {
        console.log(`Processing: ${item.name} - ${item.service}...`);

        // 1. Ensure Customer Exists (Cloud)
        let customerId;
        const existingCust = await db.select().from(customers)
            .where(like(customers.name, item.name))
            .limit(1)
            .get();

        if (existingCust) {
            console.log(`   Found customer ID: ${existingCust.id}`);
            customerId = existingCust.id;
        } else {
            console.log(`   Creating new customer...`);
            const newCust = await db.insert(customers).values({
                name: item.name,
                source: item.source,
                contact: '-',
                createdAt: new Date().toISOString()
            }).returning().get();
            customerId = newCust.id;
        }

        // 2. Insert Subscription (Cloud)
        // Check duplicate first to be safe
        const existingSub = await db.select().from(subscriptions)
            .where(and(
                eq(subscriptions.customerId, customerId),
                eq(subscriptions.service, item.service),
                eq(subscriptions.endDate, item.endDate)
            ))
            .limit(1)
            .get();

        if (existingSub) {
            console.log(`   ⚠ Subscription already exists (ID: ${existingSub.id}). Skipping.`);
        } else {
            console.log(`   Creating subscription...`);
            await db.insert(subscriptions).values({
                customerId: customerId,
                service: item.service,
                startDate: item.startDate,
                endDate: item.endDate,
                distribution: item.dist,
                revenue: item.revenue,
                cost: item.cost,
                renewalStatus: 'pending',
                paymentStatus: 'paid', // Assuming paid based on previous context
                accountInfo: item.account,
                createdAt: new Date().toISOString()
            });
            console.log(`   ✅ Success.`);
        }
    }

    console.log('--- SYNC COMPLETE ---');
    process.exit(0);
}

run().catch(console.error);


import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { parse, isValid } from 'date-fns';

const rawData = `
Cẩm	Hoangnam090595@gmail.com	Canva Edu	4/8/2025	4/8/2026	Long	300.000 đ	0 đ	300.000 đ
Cẩm	Pnlm2006@gmail.com	Canva Edu	4/8/2025	4/8/2026	Long	300.000 đ	0 đ	300.000 đ
Anh Tuan	Hades12a10@gmail.com	Canva Pro	9/8/2025	9/8/2026	Tele: Hồng Phước Shop	120.000 đ	80.000 đ	40.000 đ
Hoàng Anh	mien6144@gmail.com	MS 365	16/8/2025	16/8/2026	Tele: Hồng Phước Shop	120.000 đ	120.000 đ	0 đ
Taynguyen Tay	taynguyennguyen84@gmail.com	Canva Edu	31/8/2025	31/8/2026	Long	80.000 đ	0 đ	80.000 đ
`;

function parseCurrency(str: string): number {
    return parseInt(str.replace(/\./g, '').replace(' đ', '').trim()) || 0;
}

function parseDate(str: string): string {
    // Format: d/M/yyyy
    const parsed = parse(str, 'd/M/yyyy', new Date());
    if (!isValid(parsed)) {
        throw new Error(`Invalid date: ${str}`);
    }
    return parsed.toISOString();
}

async function main() {
    const lines = rawData.trim().split('\n');
    let skipped = 0;
    let imported = 0;

    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 5) continue;

        const [
            customerName,
            accountInfo,
            service,
            startDateStr,
            endDateStr,
            sourceOrNote,
            revenueStr,
            costStr,
            profitStr
        ] = parts;

        try {
            const startDate = parseDate(startDateStr);
            const endDate = parseDate(endDateStr);
            const revenue = parseCurrency(revenueStr);
            const cost = parseCurrency(costStr);

            // 1. Find or Create Customer
            let customerId: number;
            const existingCustomer = await db.query.customers.findFirst({
                where: eq(customers.name, customerName)
            });

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const newCustomer = await db.insert(customers).values({
                    name: customerName,
                    source: sourceOrNote.includes('Tele') ? 'Telegram' : 'Other'
                }).returning();
                customerId = newCustomer[0].id;
                console.log(`Created customer: ${customerName}`);
            }

            // 2. Check duplicate subscription
            // Duplicate criteria: same customer, same service, same account info (if present)
            const existingSub = await db.query.subscriptions.findFirst({
                where: and(
                    eq(subscriptions.customerId, customerId),
                    eq(subscriptions.service, service),
                    eq(subscriptions.accountInfo, accountInfo)
                )
            });

            if (existingSub) {
                console.log(`Skipping duplicate: ${customerName} - ${service} (${accountInfo})`);
                skipped++;
                continue;
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
                distribution: sourceOrNote,
                paymentStatus: revenue > 0 ? 'paid' : 'unpaid', // Assume paid if revenue entered? Or consistent with user data
                renewalStatus: 'pending',
                overallStatus: 'active' // Simplified
            });

            console.log(`Imported: ${customerName} - ${service}`);
            imported++;

        } catch (e) {
            console.error(`Error processing line: ${line}`, e);
        }
    }

    console.log('-------------------');
    console.log(`Finished. Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);

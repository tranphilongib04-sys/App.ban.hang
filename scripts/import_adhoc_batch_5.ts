
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { parse, isValid } from 'date-fns';

const rawData = `
Fb fayson	Vo Le Quan	volequan12@gmail.com	Ytb pre	9/11/2025	9/2/2026	Long	120.000 đ	0 đ	120.000 đ
Fb fayson	Vo Le Quan	volequan12@gmail.com	MS365	1/11/2025	1/11/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
Fb jayson	Ray Nguyen	username: rosenhjs@gmail.com	Spotify	2/11/2025	2/11/2026	Long	270.000 đ	0 đ	270.000 đ
zalo	Cẩm	ushers_maths_9s@icloud.com	Chatgpt go	5/11/2025	5/11/2026	Long	375.000 đ	0 đ	375.000 đ
Zalo	ANh Phương	spice.weirs9e@icloud.com	Adobe	11/11/2025	10/3/2026	Long	230.000 đ	0 đ	230.000 đ
Zalo	Cẩm	ulmercrockery8hp@hotmail.com	Chatgpt go	11/11/2025	11/11/2026	Long	350.000 đ	25.000 đ	325.000 đ
Zalo	Nguyễn Thuỳ ANh	tuilahanhne@gmail.com	Spotify	14/11/2025	14/11/2026	Long	270.000 đ	0 đ	270.000 đ
Zalo	Thuỳ Trâm	23012989@st.phenikaa-uni.edu.vn	Spotify	18/11/2025	18/3/2026	Long	90.000 đ	0 đ	90.000 đ
Zalo	Quỳnh Trương	bothaalexandrina174@outlook.com   slot 5  - 8531	Netflix 	22/11/2025	22/1/2026	Hong Phuoc tele	210.000 đ	165.000 đ	45.000 đ
Zalo	Cẩm	carafes.85.bombast@icloud.com	Chatgpt go	28/11/2025	28/11/2026	Le pham	180.000 đ	15.000 đ	165.000 đ
Zalo	Cẩm	viral_horned.39@icloud.com	Chatgpt go	28/11/2025	28/11/2026	Sen Nguyen Thanh @Clonzenbot	180.000 đ	15.000 đ	165.000 đ
`;

function parseCurrency(str: string): number {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, '').replace(' đ', '').trim()) || 0;
}

function parseDate(str: string): string {
    if (!str) throw new Error('Empty date');
    const parsed = parse(str.trim(), 'd/M/yyyy', new Date());
    if (!isValid(parsed)) {
        throw new Error(`Invalid date: ${str}`);
    }
    return parsed.toISOString();
}

function cleanString(str: string): string {
    if (!str) return '';
    let cleaned = str.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    return cleaned.replace(/\s+/g, ' ').trim();
}

async function main() {
    const lines = rawData.trim().split('\n');
    let skipped = 0;
    let imported = 0;

    const rows: string[] = [];
    let currentBuffer = "";

    for (const line of lines) {
        if (!line.trim()) continue;

        const quoteCount = (currentBuffer.match(/"/g) || []).length;
        const isInsideQuote = quoteCount % 2 === 1;

        if (isInsideQuote) {
            currentBuffer += "\\n" + line;
        } else {
            const tabCount = (line.match(/\t/g) || []).length;
            // Valid row has ~9 tabs (cols 0-9 usually)
            // Let's use 5 as safe threshold like before
            if (tabCount >= 5) {
                if (currentBuffer) rows.push(currentBuffer);
                currentBuffer = line;
            } else {
                currentBuffer += " " + line;
            }
        }
    }
    if (currentBuffer) rows.push(currentBuffer);

    for (const row of rows) {
        const parts = row.split('\t');

        // Expected columns (Batch 5 - NO ID - same as Batch 4):
        // 0: Source/Prefix
        // 1: Name
        // 2: Account Info
        // 3: Service
        // 4: Start Date
        // 5: End Date
        // 6: Note/Distribution
        // 7: Revenue
        // 8: Cost
        // 9: Profit

        if (parts.length < 7) {
            console.log('Skipping invalid row:', row.substring(0, 50) + '...');
            continue;
        }

        const sourcePrefix = cleanString(parts[0]);
        const customerName = cleanString(parts[1]);
        const accountInfo = cleanString(parts[2]);
        const service = cleanString(parts[3]);
        const startDateStr = cleanString(parts[4]);
        const endDateStr = cleanString(parts[5]);
        const note = cleanString(parts[6]);
        const revenueStr = parts[7] || '0';
        const costStr = parts[8] || '0';

        const distribution = `${sourcePrefix} | ${note}`;

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
                    source: sourcePrefix.includes('Fb') ? 'Facebook' : (sourcePrefix.includes('Zalo') ? 'Zalo' : 'Other')
                }).returning();
                customerId = newCustomer[0].id;
                console.log(`Created customer: ${customerName}`);
            }

            // 2. Check duplicate subscription
            const existingSub = await db.query.subscriptions.findFirst({
                where: and(
                    eq(subscriptions.customerId, customerId),
                    eq(subscriptions.service, service),
                    eq(subscriptions.startDate, startDate)
                )
            });

            if (existingSub) {
                console.log(`Skipping duplicate: ${customerName} - ${service}`);
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
                distribution,
                paymentStatus: revenue > 0 ? 'paid' : 'unpaid',
                renewalStatus: 'pending',
                overallStatus: 'active'
            });

            console.log(`Imported: ${customerName} - ${service}`);
            imported++;

        } catch (e: any) {
            console.error(`Error processing row starting with ${parts[0]}: ${e.message}`);
        }
    }

    console.log('-------------------');
    console.log(`Finished Batch 5. Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);

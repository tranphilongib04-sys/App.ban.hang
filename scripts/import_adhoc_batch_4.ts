
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { parse, isValid } from 'date-fns';

const rawData = `
fb jayson	Nguyễn Văn Hòa	nguyenvanhoa9@hotmail.com	MS 365	1/10/2025	1/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
Zalo	Huyền Nguyễn	"phankhanhlinh1212@gmail.com
linhhuyen1"	Spotify	3/10/2025	3/10/2026	Long	295.000 đ	0 đ	295.000 đ
Fb jayson	Đoan Trang Phạm	info.seemee@gmail.com	Canva pro	4/10/2025	4/10/2026	Hong Phuoc tele	130.000 đ	90.000 đ	40.000 đ
Zalo	Nguyễn Pham Việt Trà	nguyenphanviettra99@gmail.com	Ytb pre	6/10/2025	6/10/2026	Long	420.000 đ	0 đ	420.000 đ
Zalo	Khánh Huyền	Shinshinximuoi@gmail.com	Ytb pre	6/10/2025	6/4/2026	Long	210.000 đ	0 đ	210.000 đ
Fb TPL	Nguyên Lofi	nguyendinh3022@gmail.com	Canva Edu	7/10/2025	7/10/2026	Long	80.000 đ	0 đ	80.000 đ
Zalo	Devon	minhthu7700@gmail.com	Canva pro	7/10/2025	7/10/2026	Hong Phuoc tele	130.000 đ	90.000 đ	40.000 đ
Zalo	Phạm Thị Hoài Thương	hoaithw1998	Quizlet	9/10/2025	9/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
ins TBQ	On print	onprint0925@gmail.com	Canva pro	9/10/2025	9/10/2026	Hong Phuoc tele	130.000 đ	90.000 đ	40.000 đ
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
            currentBuffer += "\\n" + line; // Use \n literal if needed, or space. Let's use space to match prev logic or keep multiline if table allows.
        } else {
            const tabCount = (line.match(/\t/g) || []).length;
            // Valid row has ~9 tabs.
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

        if (parts.length < 7) {
            console.log('Skipping invalid row:', row.substring(0, 50) + '...');
            continue;
        }

        const sourcePrefix = cleanString(parts[0]);
        const customerName = cleanString(parts[1]);
        const accountInfo = cleanString(parts[2]); // This will now include the full multiline content
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
    console.log(`Finished Batch 4. Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);

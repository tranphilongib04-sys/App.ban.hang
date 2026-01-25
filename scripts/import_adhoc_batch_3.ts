
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { parse, isValid } from 'date-fns';

const rawData = `
87	Fb jayson	Truong Thanh Tai	mrtruongthanhtai05@gmail.com	GG1 2TB	13/10/2025	13/10/2026	Long	40.000 đ	0 đ	40.000 đ
91	Zalo	Phan Ca Bảo Ngọc	ngocbaophanca@gmail.com	Ytb pre	14/10/2025	13/4/2026	Long	222.000 đ	0 đ	222.000 đ
92	Zalo	Quỳnh Trang	nhatanhcb2@gmail.com	Canva edu	14/10/2025	14/10/2026	Long	80.000 đ	0 đ	80.000 đ
94	ins tbq	Minh Nguyen	nvminh.work@gmail.com	MS 365	14/10/2025	14/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
99	fb jayson	Thuy Tien	dongocthuytien21041977@gmail.com	Canva Edu	15/10/2025	15/10/2026	Long	80.000 đ	0 đ	80.000 đ
100	Zalo	Khánh Viiii	khanhvi02062003@gmail.com	Canva Edu	15/10/2025	15/10/2026	Long	80.000 đ	0 đ	80.000 đ
101	Zalo	Mai Nguyen	mainp17@gmail.com	Canva pro	15/10/2025	15/10/2026	Hong Phuoc tele	130.000 đ	90.000 đ	40.000 đ
114	Zalo	Cẩm	minhhieuvudang@gmail.com	Canva pro	21/10/2025	21/10/2026	Hong Phuoc tele	300.000 đ	90.000 đ	210.000 đ
117	Zalo	Ngọc Mẫn	and-hauls-6b@icloud.com	Spotify	20/10/2025	20/2/2026	Long	100.000 đ	0 đ	100.000 đ
122	Fb Jayson	Quang Anh Nguyễn	anhnguyen09092000@gmail.com	MS365	21/10/2025	21/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
124	Zalo	Phạm Lĩnh	Linh6886@outlook.com	Ms 365	22/10/2025	22/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
125	Zalo	Lê Gia Bảo	nathanielebao.works@gmail.com	Ms 365	23/10/2025	23/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
127	Zalo	Linh Trần	tranmailinh2k6@gmail.com	Ms 365	24/10/2025	24/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
131	Fb jayson	Đặng Ngọc Yến Vy	tinker_59_welders@icloud.com	MS 365	27/10/2025	27/10/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
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

    // Use same accumulating logic just in case, though this batch looks clean
    const rows: string[] = [];
    let currentBuffer = "";

    for (const line of lines) {
        if (!line.trim()) continue;
        if (/^\d+\t/.test(line)) {
            if (currentBuffer) rows.push(currentBuffer);
            currentBuffer = line;
        } else {
            currentBuffer += " " + line;
        }
    }
    if (currentBuffer) rows.push(currentBuffer);

    for (const row of rows) {
        const parts = row.split('\t');

        if (parts.length < 8) {
            console.log('Skipping invalid row:', row);
            continue;
        }

        const customerName = cleanString(parts[2]);
        const accountInfo = cleanString(parts[3]);
        const service = cleanString(parts[4]);
        const startDateStr = cleanString(parts[5]);
        const endDateStr = cleanString(parts[6]);
        const note = cleanString(parts[7]);
        const revenueStr = parts[8] || '0';
        const costStr = parts[9] || '0';

        const sourcePrefix = cleanString(parts[1]);
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
    console.log(`Finished Batch 3. Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);

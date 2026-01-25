
import { db } from '@/lib/db';
import { customers, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { parse, isValid } from 'date-fns';

const rawData = `
1	Ins TBQ	Sicil.07	"thuithui4466@gmail.com 
HongPhuoc123@"	NordVPN	1/9/2025	1/9/2026	Hong Phuoc tele	300.000 đ	220.000 đ	80.000 đ
4	Ins TBQ	coemm.e	tinatran200017@gmail.com	MS 365	2/9/2025	2/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
21	Fb Jayson	Yến Vy		Duolingo	5/9/2025	5/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
33	Ins TPL	huynedieepz	huyendiep.bp.2004@gmail.com	Canva Edu	12/9/2025	12/9/2026	Long	80.000 đ	0 đ	80.000 đ
35	Zalo	Bảo	bungles.riches.0w@icloud.com	Spotify pre	12/9/2025	12/2/2026	Long	150.000 đ	0 đ	150.000 đ
52	Zalo	Siu Phai	siuphai134@gmail.com	Canva pro	19/9/2025	19/9/2026	Hong Phuoc tele	120.000 đ	90.000 đ	30.000 đ
53	Zalo	Hoang Vu Quynh Anh	anniequynhanh2605@gmail.com	MS 365	19/9/2025	19/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
54	Zalo	Bảo	thanglq.hp@gmail.com	Canva Edu	19/9/2025	19/9/2026	Long	80.000 đ	0 đ	80.000 đ
58	Zalo	Nguyễn Huyền	s187057@nagoya-ku.ac.jp	MS 365	20/9/2025	20/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
59	Zalo	Thảo	thaoduong4598@gmail.com	MS 365	21/9/2025	21/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
60	Zalo	Hòa Tiêm Chủng Gold	agencyads83vn@gmail.com	Canva pro	21/9/2025	21/9/2026	Hong Phuoc tele	120.000 đ	90.000 đ	30.000 đ
87	Ins TPL	Nathanielebao	lvgiabo14	Duolingo 	25/9/2025	25/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
92	Zalo 	Lê Võ Gia Bảo	"BaOlvGia 
1910legiabao2004."	Quizlet	26/9/2025	26/9/2026	Hong Phuoc tele	160.000 đ	120.000 đ	40.000 đ
102	Fb jayson	Ngô Phanh	13.onshore.willers@icloud.com	Spotify 	27/9/2025	27/3/2026	Long	150.000 đ	0 đ	150.000 đ
103	Fb jayson	Đăng Dương Nguyễn	victory_motet_1w@icloud.com	Spotify	28/9/2025	27/3/2026	Long	160.000 đ	0 đ	160.000 đ
108	ins tbq	nnk07	nnk001811@gmail.com	MS 365	29/9/2025	29/9/2026	Long	160.000 đ	120.000 đ	40.000 đ
112	Zalo	Phạm Mai Ngân	gases-circuit-1z@icloud.com	Canva team	30/9/2025	30/9/2026	Long	300.000 đ	0 đ	300.000 đ
`;

function parseCurrency(str: string): number {
    if (!str) return 0;
    return parseInt(str.replace(/\./g, '').replace(' đ', '').trim()) || 0;
}

function parseDate(str: string): string {
    if (!str) throw new Error('Empty date');
    // Format: d/M/yyyy
    const parsed = parse(str.trim(), 'd/M/yyyy', new Date());
    if (!isValid(parsed)) {
        throw new Error(`Invalid date: ${str}`);
    }
    return parsed.toISOString();
}

function cleanString(str: string): string {
    if (!str) return '';
    // Remove enclosing quotes if present
    let cleaned = str.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    // Replace newlines with space or pipe? Space for now
    return cleaned.replace(/\s+/g, ' ').trim();
    // Actually, keep newlines if it's account info?
    // User data shows newlines in quotes. We can keep just the first email/part or concatenate.
    // Let's replace newlines with | for compactness
    // return cleaned.replace(/[\r\n]+/g, ' | ');
}

async function main() {
    const lines = rawData.trim().split('\n');
    let skipped = 0;
    let imported = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle potential multiline rows (if rawData parsing from string template literal keeps newlines)
        // With current copy-paste, newlines inside "..." might be actual newlines in string

        // But since I pasted it as one block, let's process carefully.
        // Actually, the simple split('\n') might break the quoted multiline content.
        // However, the input string provided in Task/Prompt seems to have newlines *inside* quotes.
        // `1\tIns TBQ\tSicil.07\t"thuithui4466@gmail.com \nHongPhuoc123@"\t...`
        // In the `rawData` variable above, I pasted it exactly as user provided.
        // JS template literal preserves newlines.
        // So `split('\n')` WILL split the quoted content.

        // Quick workaround: Fix the raw data merging lines that don't start with a number/tab pattern?
        // Or just handle it: if line doesn't start with number+tab, append to previous line.

        if (!line.trim()) continue;
    }

    // Better parsing: Regex or just simple accumulation
    const rows: string[] = [];
    let currentBuffer = "";

    for (const line of lines) {
        // Heuristic: New row starts with a number followed by tab?
        // User data: `1\t...`, `4\t...`
        if (/^\d+\t/.test(line)) {
            if (currentBuffer) rows.push(currentBuffer);
            currentBuffer = line;
        } else {
            // Continuation of previous line
            currentBuffer += " " + line; // Join with space or just append
        }
    }
    if (currentBuffer) rows.push(currentBuffer);

    for (const row of rows) {
        const parts = row.split('\t');
        // Expected columns:
        // 0: ID
        // 1: Source Prefix
        // 2: Name
        // 3: Account Info
        // 4: Service
        // 5: Start Date
        // 6: End Date
        // 7: Note/Distribution
        // 8: Revenue
        // 9: Cost
        // 10: Profit

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

        // Source prefix (parts[1]) + Note (parts[7]) can be combined for Distribution/Source?
        // parts[1]: "Ins TBQ", "Fb Jayson", etc.
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
                    eq(subscriptions.startDate, startDate) // stricter check
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
                renewalStatus: 'pending'
            });

            console.log(`Imported: ${customerName} - ${service}`);
            imported++;

        } catch (e) {
            console.error(`Error processing row starting with ${parts[0]}: ${(e as any).message}`);
        }
    }

    console.log('-------------------');
    console.log(`Finished Batch 2. Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);

// Script to import January 2026 data
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// January 2026 data
const rawData = `
1	Zalo	Anna	alycia36@tinybizhub.xyz|Mon123123@	Capcut Pro	1/1/2026	1/2/2026	Bot	25.000 đ	12.000 đ	13.000 đ	
2	Zalo	Quang Khuê	tadbalis@frostlynx.website	Capcut Pro	1/1/2026	1/2/2026	Bot	25.000 đ	12.000 đ	13.000 đ	
3	Zalo	Quang Khuê	nitrous_runoff.6x@icloud.com	Chatgpt Plus	1/1/2026	1/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
4	Zalo	Lê Huỳnh Quý	lehuynhquy2004@gmail.com	Chatgpt Pro	1/1/2026	1/2/2026	Bot	120.000 đ	60.000 đ	60.000 đ	
5	Zalo	Tuấn	tuan0824080729@gmail.com	Chatgpt Pro	1/1/2026	1/2/2026	HP Tele	100.000 đ	0 đ	100.000 đ	
6	Fb TPL	Nguyễn Thu Hằng	hangbeo0506@gmail.com	Chatgpt Pro	1/1/2026	1/2/2026	HP Tele	120.000 đ	120.000 đ	0 đ	
7	Zalo	Tú Anh	arlodoyl@happyzoomer.xyz	Capcut Pro	2/1/2026	2/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
8	Zalo	Ngọc Mẫn	durum_rhinos.96@icloud.com	Chatgpt Plus	2/1/2026	2/2/2026	HP Tele	70.000 đ	50.000 đ	20.000 đ	
9	Zalo	Lin Lin	adolfwiz@techhub.lol	Capcut Pro	2/1/2026	2/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
10	Fb TPL	Thuu Lee	kimberly@chatgenius.cyou	Capcut Pro	2/1/2026	2/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
11	Zalo	Linh Tiêu	godsend.lift_9f@icloud.com	Chatgpt Plus	3/1/2026	3/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
12	Zalo	Nghi Anh Nguyen	maverick@trendyaff.fashion	Capcut Pro	3/1/2026	3/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
13	Ins TPL	Phan Thị Mai	pmai25779@gmail.com	Chatgpt Plus	3/1/2026	3/2/2026	Long	80.000 đ	50.000 đ	30.000 đ	
14	Zalo	Minh Huyen	fastmalw+saundra@gmail.com phimhay99223@@	Netflix	4/1/2026	4/2/2026	Vỹ Zalo	75.000 đ	60.000 đ	15.000 đ	
15	Zalo	Hoàng Uyên	ID   80843956	Adobe 	4/1/2026	4/1/2027	HP Tele	400.000 đ	350.000 đ	50.000 đ	
16	Fb J	Ng Tnhan	trongnhann197@gmail.com	Spoitfy	4/1/2026	4/3/2026	Long	60.000 đ	0 đ	60.000 đ	
17	Zalo	Ngọc Diễm	kurtis32@solarpetals.space|Mon123123@	Capcut Pro	5/1/2026	5/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
18	Zalo	Nguyễn Nhật Vinh	tiling_perfume_8r@icloud.com	Spoitfy	5/1/2026	5/4/2026	Long	90.000 đ	0 đ	90.000 đ	
19	Zalo	Xuân	Nguyenlinh17121997@gmail.com	Ytb pre	5/1/2026	5/4/2026	Long	105.000 đ	0 đ	105.000 đ	
20	Zalo	Thanh Khiet	315fvu47mcej7izzpnri5ovptucm	Spoitfy	5/1/2026	5/7/2026	Long	160.000 đ	0 đ	160.000 đ	
21	Zalo	Phương Nguyễn	douglasj@fastlearnhub.site|Mon123123@	Capcut Pro	5/1/2026	5/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
22	Zalo	Trung Nhân	samaragu@radiantforge.bond|Mon123123@	Capcut Pro	5/1/2026	5/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
23	Zalo	Hoang	profile42@cheatestot.store|Q7Rk2Z9FAxPm	Veo 3	5/1/2026	5/2/2026	MMO Bot	70.000 đ	30.000 đ	40.000 đ	
24	Zalo	Dane	jn07@gheal.shop phimhay6666@@ slot 1	Netflix	5/1/2026	5/2/2026	Vỹ Zalo	70.000 đ	55.000 đ	15.000 đ	
25	Zalo	Xuân Phú Nexus	pnguyen12606@gmail.com	Youtube Pre	5/1/2026	5/2/2026	Long	40.000 đ	0 đ	40.000 đ	
26	Zalo	Đặng Yến Nhi	enmity.cocoon-2q@icloud.com	Chatgpt Plus	6/1/2026	6/2/2026	HP Tele	90.000 đ	50.000 đ	40.000 đ	
27	Zalo	Nguyễn Trâm Minh ANh	phyllisk@radiantforge.bond	Capcut Pro	6/1/2026	6/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
28	Zalo	Ngọc Quỳnh	ngocquynh11022005@gmail.com	Youtube Pre	6/1/2026	13/2/2026	Long	37.000 đ	0 đ	37.000 đ	
29	Zalo	Hoai Trang	silica.aroma6r@icloud.com	Chatgpt Plus	6/1/2026	6/2/2026	Long	270.000 đ	0 đ	270.000 đ	
30	Zalo	Lực Nguyễn	tanlucnguyen16@gmail.com	Youtube Pre	6/1/2026	1/3/2026	Long	74.000 đ	0 đ	74.000 đ	
31	Zalo	Lê Thuỵ Ngân Quỳnh	vines-steels-8u@icloud.com	Canva Pro	6/1/2026	6/2/2026	Long	25.000 đ	0 đ	25.000 đ	
32	Zalo	Anh Phương	lvu102600@gmail.com	Chatgpt Plus	6/1/2026	6/2/2026	Long	90.000 đ	0 đ	90.000 đ	
33	Zalo	Ngoc Anh	anhnguyenphuong690@gmail.com	Youtube Pre	6/1/2026	29/1/2026	Long	37.000 đ	0 đ	37.000 đ	
34	Zalo	Đỗ Khanh	dyer-primes.3s@icloud.com	Chatgpt Go	7/1/2026	7/4/2026	Long	100.000 đ	0 đ	100.000 đ	
35	Zalo	Đinh Quý Vy	emaajohnson015+mi12@gmail.com phim9998 slot 5	Netflix	7/1/2026	7/2/2026	Long	70.000 đ	55.000 đ	15.000 đ	
36	Zalo	Đinh Quý Vy	islet.crying.5w@icloud.com	Chatgpt Plus	7/1/2026	7/2/2026	Long	70.000 đ	0 đ	70.000 đ	
37	Fb J	Nhựt Lê	Lenhut1511@gmail.com	Youtube Pre	7/1/2026	7/1/2027	Long	450.000 đ	0 đ	450.000 đ	
38	Zalo	Hoà Tiêm Chủng Gold	tiemchunggoldnb@gmail.com	Canva Pro	7/1/2026	7/1/2027	HP Tele	120.000 đ	90.000 đ	30.000 đ	
39	Fb TPl	Linh Linh	orpha52@stellartrail.space|Mon123123@	Capcut Pro	7/1/2026	7/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
40	Zalo 	Dane Prinsloo	jn07@gheal.shop	Netflix	7/1/2026	7/4/2026	Vỹ Zalo	210.000 đ	165.000 đ	45.000 đ	
41	Zalo	Hải Quyên	tanya9@radiantforge.bond|Mon123123@	Capcut Pro	7/1/2026	7/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
42	Fb TPL	Kiều Kiều	xuankieu110203@gmail.com	Chatgpt Plus	8/1/2026	8/2/2026	Long	90.000 đ	0 đ	90.000 đ	
43	Fb TPL	Cao Minh Quân	trail-ibexes2a@icloud.com	Chatgpt Plus	8/1/2026	8/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
44	Fb TPL	Nguyễn Hải Quân	treats_mink_04@icloud.com	Chatgpt Plus	8/1/2026	8/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
45	Zalo	Xuan Phuc	tannerte@quietwave.cfd	Capcut Pro	8/1/2026	8/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
46	Zalo	Ngọc	profile45@asd.nvtl6.io.vn|QkAx9ZRF72Pm	Veo 3	8/1/2026	8/2/2026	Bot MMO	70.000 đ	30.000 đ	40.000 đ	
47	Zalo	Ngân Thảo Phan	thaongank26@gmail.com	GG 2TB	8/1/2026	8/3/2026	Long	45.000 đ	0 đ	45.000 đ	
48	Zalo	Phương Thảo	twangy_pans_0s@icloud.com	Chatgpt Plus	8/1/2026	8/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
49	Zalo	Vũ Minh Anh	chelsea6@chatgenius.cyou|Mon123123@	Capcut Pro	8/1/2026	8/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
51	Zalo	Nguyễn Minh Phương	daisies_jambs_6k@icloud.com	Spotify	10/1/2026	10/2/2026	Long	30.000 đ	0 đ	30.000 đ	
52	Zalo	Lê Võ Quang Kỳ	torrance@amberfield.icu|Mon123123@	Capcut Pro	10/1/2026	10/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
53	Fb TPL	Nguyễn Hoàng		Veo 3	10/1/2026	10/2/2026	Bot MMO	70.000 đ	30.000 đ	40.000 đ	
54	Ins TBQ	Trần Minh Châu	Tk:chauminhtran595@gmail.com	Chatgpt Plus	11/1/2026	11/2/2026	Long	90.000 đ	0 đ	90.000 đ	
55	Zalo	Ngoc Anh	anhnguyenphuong690@gmail.com	Spotify	12/1/2026	12/2/2026	Long	30.000 đ	0 đ	30.000 đ	
56	Zalo	Thu Huyền	laxness_fourth5h@icloud.com	Chatgpt Plus	12/1/2026	12/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
57	Zalo	Lê Thu Thuỷ	heleneha@radiantforge.bond|Mon123123@	Capcut Pro	12/1/2026	12/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
58	Zalo	Bảo Trân	herbal.lids0w@icloud.com	Chatgpt Plus	12/1/2026	12/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
59	Zalo	Phương Thi	snail-sizes5d@icloud.com	Chatgpt Plus	12/1/2026	12/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
60	Zalo	Vy Tũn	vytunsocial@gmail.com	Chatgpt Pro	12/1/2026	12/2/2026	Long	120.000 đ	0 đ	120.000 đ	
61	Ins TPL	dyutann	vydieu15@gmail.com	Chatgpt Plus	12/1/2026	12/2/2026	Long	90.000 đ	0 đ	90.000 đ	
62	Ins TPL	linhling0802	greysonk@chatgenius.cyou|Mon123123@	Capcut Pro	12/1/2026	12/2/2026	Bot	35.000 đ	12.000 đ	23.000 đ	
63	Zalo	Vân Anh	vtepteptep777@gmail.com	Chatgpt Plus	13/1/2026	13/2/2026	Long	90.000 đ	0 đ	90.000 đ	
64	Zalo	Quỳnh Nhi	1ash4y18oi@hunght1890.com:123123	Capcut Pro	13/1/2026	20/1/2026	Bot	7.000 đ	2.000 đ	5.000 đ	
65	Zalo	Thành Đạt	lusher-lacuna-2x@icloud.com	Chatgpt Plus	13/1/2026	13/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
66	Zalo	Vy Tũn	f2lnvn1lt@hotmail.com	Netflix	14/1/2026	14/2/2026	Đức Nguyễn Tele	75.000 đ	55.000 đ	20.000 đ	
67	Zalo	Huy	qc4o666l9@hotmail.com	Netflix	14/1/2026	14/2/2026	Đức Nguyễn Tele	75.000 đ	55.000 đ	20.000 đ	
68	Zalo	Lê Quỳnh Như	nuhh1.68@gmail.com	Chatgpt Plus	14/1/2026	14/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
69	Ins TBQ	Minh Nguyen	minhlearn441@gmail.com	Coursera	14/1/2026	14/2/2026	HP Tele	200.000 đ	170.000 đ	30.000 đ	
70	Zalo	Phương Thảo	silver.9.knolls@icloud.com	Chatgpt Plus	15/1/2026	15/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
	Fb TPL	Diễm My	diemmy2004abc@gmail.com	Chatgpt Plus	15/1/2026	15/3/2026	Long	160.000 đ	60.000 đ	100.000 đ	
71	Zalo	Tường Vy	vytuong3005@gmail.com	Youtube Pre	15/1/2026	1/3/2026	Long	40.000 đ	0 đ	40.000 đ	
72	Zalo	Cẩm Nhung	topcud@emailsll.net|Mon123123@	Capcut Pro	16/1/2026	16/2/2026	Bot	70.000 đ	0 đ	70.000 đ	
73	Zalo	Anna	tumtiw@sellallmail.net|Mon123123@	Capcut Pro	16/1/2026	16/2/2026	Bot	25.000 đ	10.000 đ	15.000 đ	
74	Zalo	Huyền Quách	panvoj@mailmmo.net|Mon123123@	Capcut Pro	16/1/2026	16/2/2026	Bot	25.000 đ	10.000 đ	15.000 đ	
75	Zalo	Trần Đình Trinh	running_caution.4@icloud.com	Chatgpt Plus	16/1/2026	16/2/2026	Long	60.000 đ	10.000 đ	50.000 đ	
76	Zalo	Nguyentaynguyen	hydrant_micros_5t@icloud.com	Spotify	16/1/2026	16/3/2026	Long	60.000 đ	0 đ	60.000 đ	
77	Zalo	Kha	zaadis@emailsll.net|Mon123123@	Capcut Pro	17/1/2026	17/2/2026	Bot	35.000 đ	10.000 đ	25.000 đ	
78	Zalo	Hoang	ya1@afy.ranput.xyz | masuk123	Capcut Pro	17/1/2026	17/2/2026	Bot	30.000 đ	10.000 đ	20.000 đ	
79	Zalo	Phạm Hải Yến	ad1@hps.raivi.xyz | masuk123	Capcut Pro	17/1/2026	17/2/2026	Bot	35.000 đ	10.000 đ	25.000 đ	
80	Zalo	Truong Bao Nhi	16taco.dossier@icloud.com	Chatgpt Plus	17/1/2026	17/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
81	Zalo	Phương Trang	halogen.84-mutters@icloud.com	Chatgpt Plus	18/1/2026	18/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
82	Zalo	Bam	ngubsmejis@hotmail.com	Netflix	18/1/2026	18/2/2026	Bot Laybo	75.000 đ	55.000 đ	20.000 đ	
83	Zalo	Tu Anh	have.fillips-3k@icloud.com	Chatgpt Plus	18/1/2026	18/2/2026	HP Tele	90.000 đ	50.000 đ	40.000 đ	
84	Zalo	Nguyễn Hương Giang	sticker_petter.1i@icloud.com	Chatgpt Plus	18/1/2026	18/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
85	Zalo	Nguyễn Đăng Dũng	sting.whines.66@icloud.com	Spotify	18/1/2026	18/2/2026	Long	30.000 đ	0 đ	30.000 đ	
86	Zalo	Trọng Nghĩa	sm5162704@renrokimmo22.io.vn  | Veo3ultra@	Veo 3	18/1/2026	18/2/2026	Bot Cron191	60.000 đ	32.000 đ	28.000 đ	
87	Zalo	Phú Bùi	1recvng6xr@hunght1890.com:123123	Capcut Pro	18/1/2026	26/1/2026	Bot	7.000 đ	2.000 đ	5.000 đ	
88	Zalo	Trọng Nghĩa	Veopre10394@afg.redsowid.io.vn  | Accveo3@	Veo 3	19/1/2026	18/2/2026	Bot Cron191	60.000 đ	32.000 đ	28.000 đ	
89	Zalo	Trọng Nghĩa	Veopre22837@tocachiwa.io.vn  | Accveo3@	Veo 3	19/1/2026	18/2/2026	Bot Cron191	60.000 đ	32.000 đ	28.000 đ	
90	Zalo	Ly Vaniiiii	mtzuist5tj@hunght1890.com:123123	Capcut Pro	19/1/2026	26/1/2026	Bot	7.000 đ	2.000 đ	5.000 đ	
91	Zalo	Trọng Nghĩa	Veopre47361@lote.konggette.io.vn | Accveo3@	Veo 3	21/1/2026	21/2/2026	Bot Cron191	55.000 đ	30.000 đ	25.000 đ	
92	Zalo	Trọng Nghĩa	Veopre88271@ganggredtio.io.vn | Accveo3@	Veo 3	22/1/2026	22/2/2026	Bot Cron191	55.000 đ	30.000 đ	25.000 đ	
93	Zalo	Ý Nhi	mobiles-inset1g@icloud.com	Chatgpt Plus	22/1/2026	22/2/2026	Long	70.000 đ	10.000 đ	60.000 đ	
94	Zalo	Toản		Chatgpt Plus	22/1/2026	22/2/2026	Long	65.000 đ	10.000 đ	55.000 đ	
95	Zalo	Trọng Nghĩa	Veopre12938@koda.chuhamadao.io.vn | Accveo3@	Veo 3	22/1/2026	22/2/2026	Bot Cron191	55.000 đ	35.000 đ	20.000 đ	
`;

// Helper to parse currency
function parseCurrency(str: string): number {
    if (!str) return 0;
    return parseFloat(str.replace(/[^\d]/g, '')) || 0;
}

// Helper to parse date D/M/YYYY to YYYY-MM-DD
function parseDate(str: string): string {
    if (!str || str.trim() === '') return '';
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const lines = rawData.trim().split('\n');
const data = lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 5) return null;
    return {
        source: parts[1],
        customer: parts[2],
        account: parts[3],
        service: parts[4],
        startDate: parseDate(parts[5]),
        endDate: parseDate(parts[6]),
        distribution: parts[7],
        revenue: parseCurrency(parts[8]),
        cost: parseCurrency(parts[9]),
        note: parts[11] || ''
    };
}).filter(x => x !== null);

const customerMap = new Map<string, number>();

const insertCustomer = db.prepare(`
  INSERT INTO customers (name, source, contact, tags, note, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now'))
`);

const findCustomer = db.prepare(`SELECT id FROM customers WHERE name = ?`);

const insertSubscription = db.prepare(`
  INSERT INTO subscriptions (customer_id, service, start_date, end_date, distribution, revenue, cost, renewal_status, payment_status, contact_count, note, account_info, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'renewed', 'paid', 0, ?, ?, datetime('now'))
`);

let customersAdded = 0;
let subscriptionsAdded = 0;

// Truncate existing subscriptions to avoid duplicates when re-running
db.prepare("DELETE FROM subscriptions WHERE start_date >= '2026-01-01'").run();

for (const row of data as any[]) {
    if (!row.customer || row.customer.trim() === '') continue;

    let customerId = customerMap.get(row.customer);
    if (!customerId) {
        const existing = findCustomer.get(row.customer) as { id: number } | undefined;
        if (existing) {
            customerId = existing.id;
        } else {
            const result = insertCustomer.run(row.customer, row.source, '', '', '');
            customerId = Number(result.lastInsertRowid);
            customersAdded++;
        }
        customerMap.set(row.customer, customerId);
    }

    insertSubscription.run(
        customerId,
        row.service,
        row.startDate,
        row.endDate,
        row.distribution,
        row.revenue,
        row.cost,
        row.note,
        row.account
    );
    subscriptionsAdded++;
}

console.log(`✅ Import January completed!`);
console.log(`   Customers added/found: ${customerMap.size}`);
console.log(`   Subscriptions added: ${subscriptionsAdded}`);

db.close();

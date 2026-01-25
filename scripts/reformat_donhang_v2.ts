
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');

// Helper to generate MatchKey
function generateMatchKey(customer: string, service: string, account: string, endDate: string): string {
    const normalize = (s: string) => String(s || '').trim().toLowerCase();
    // Use date part only for endDate
    const datePart = String(endDate || '').split('T')[0].trim();
    return `${normalize(customer)}|${normalize(service)}|${normalize(account)}|${datePart}`;
}

async function run() {
    console.log(`Reading file: ${ORDERS_FILE}`);
    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading file:', error);
        return;
    }

    const donHangSheet = workbook.getWorksheet('DonHang');
    const statusSheet = workbook.getWorksheet('TrangThai');

    if (!donHangSheet || !statusSheet) {
        console.error('Missing sheets!');
        return;
    }

    // 1. Read existing Data into Memory
    const data: any[] = [];
    donHangSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        // Old Mapping (based on recent code)
        // 1:ID, 2:Name, 3:Contact, 4:Source, 5:Service, 6:Account, 7:Start, 8:End, 9:Rev, 10:Cost
        const id = row.getCell(1).value;
        const name = row.getCell(2).value;
        const contact = row.getCell(3).value;
        const source = row.getCell(4).value;
        const service = row.getCell(5).value;
        const account = row.getCell(6).value;
        const start = row.getCell(7).value;
        const end = row.getCell(8).value;
        const revenue = row.getCell(9).value;
        const cost = row.getCell(10).value;
        const category = row.getCell(13).value; // Mapping category as Distribution for now if needed?

        // MatchKey components
        const matchKey = generateMatchKey(String(name), String(service), String(account), String(end));

        data.push({
            id, name, contact, source, service, account, start, end, revenue, cost, category, matchKey
        });
    });

    // 2. Update TrangThai with MatchKeys
    // We iterate distinct ID map
    const idToMatchKey = new Map<number, string>();
    data.forEach(d => {
        if (d.id) idToMatchKey.set(Number(d.id), d.matchKey);
    });

    // Add MatchKey column to TrangThai if not exists
    // Headers: OrderID, RenewalStatus, PaymentStatus, ContactCount, LastUpdated
    // New Header: MatchKey (Col 6)
    statusSheet.getRow(1).getCell(6).value = 'MatchKey';

    statusSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = Number(row.getCell(1).value);
        if (idToMatchKey.has(id)) {
            row.getCell(6).value = idToMatchKey.get(id);
        }
    });

    // 3. Reformat DonHang Sheet
    // Remove all rows
    donHangSheet.spliceRows(1, donHangSheet.rowCount);

    // Set New Headers
    // Nguồn, Customer, Tên tài khoản, Dịch vụ, Ngày bắt đầu, Ngày kết thúc, Distribution, Doanh thu, Cost, Lợi nhuận
    donHangSheet.getRow(1).values = [
        'Nguồn',
        'Customer',
        'Tên tài khoản',
        'Dịch vụ',
        'Ngày bắt đầu',
        'Ngày kết thúc',
        'Distribution',
        'Doanh thu',
        'Cost',
        'Lợi nhuận',
        'Contact', // Hidden/Extra? User didn't ask, but we might need it? 
        // User's format: "Customer" might be Name. "Tên tài khoản" is Account.
        // Where is generic "Contact" (Email/Phone)? 
        // Maybe "Customer" column contains it or user doesn't track it in this main view?
        // Let's Append 'Contact' and 'ID' at the end for safety, but user won't see/care.
        'ID'       // Keep ID at Col 12 for reference if possible, but we'll try to rely on MatchKey.
    ];

    // Write Data in New Order
    data.forEach(d => {
        const row = donHangSheet.addRow([]);

        // 1. Nguồn
        row.getCell(1).value = d.source;
        // 2. Customer
        row.getCell(2).value = d.name;
        // 3. Tên tài khoản (Account)
        row.getCell(3).value = d.account;
        // 4. Dịch vụ
        row.getCell(4).value = d.service;
        // 5. Start
        row.getCell(5).value = d.start;
        // 6. End
        row.getCell(6).value = d.end;
        // 7. Distribution (Map from Category? or empty?)
        row.getCell(7).value = d.category || '';
        // 8. Doanh thu
        row.getCell(8).value = d.revenue;
        // 9. Cost
        row.getCell(9).value = d.cost;
        // 10. Lợi nhuận (Profit) - Formula or Value
        const rev = Number(d.revenue) || 0;
        const cst = Number(d.cost) || 0;
        row.getCell(10).value = rev - cst;

        // Hidden/Extras
        // 11. Contact (Preserve data)
        row.getCell(11).value = d.contact;
        // 12. ID (Preserve data just in case)
        row.getCell(12).value = d.id;
    });

    console.log('Saving reformatted workbook...');
    await workbook.xlsx.writeFile(ORDERS_FILE);
    console.log('Reformat Reformat Complete.');
}

run();

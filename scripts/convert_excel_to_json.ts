
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');
const BACKUP_FILE = path.join(DATA_FOLDER, 'full_orders_backup.json');

async function convert() {
    console.log(`Reading Excel: ${ORDERS_FILE}`);
    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading file. Make sure "DonHang.xlsx" is in "Desktop/Dữ lIệu lớn-TBQ".', error);
        return;
    }

    const sheet = workbook.getWorksheet('DonHang');
    if (!sheet) {
        console.error('Missing worksheet "DonHang". Please rename your sheet to "DonHang".');
        return;
    }

    const orders: any[] = [];
    let processingRow = 0;

    sheet.eachRow((row, rowNumber) => {
        // Skip Header
        if (rowNumber === 1) return;
        processingRow = rowNumber;

        // Map Columns (1-based index)
        // 1: Source
        // 2: Customer Name
        // 3: Account Info
        // 4: Service Name
        // 5: Start Date
        // 6: End Date
        // 7: Distribution/Note
        // 8: Revenue
        // 9: Cost
        // 10: Profit (Ignored, calc dynamically usually)
        // 11: Contact (Phone/Email)

        const getVal = (idx: number) => {
            const val = row.getCell(idx).value;
            if (typeof val === 'object' && val !== null) {
                return (val as any).text || (val as any).result || String(val);
            }
            return val;
        };

        const parseMoney = (val: any) => {
            if (!val) return 0;
            // Handle number type directly
            if (typeof val === 'number') return val;
            // Handle string: '300.000 đ' -> '300000'
            const str = String(val).replace(/\D/g, '');
            return Number(str) || 0;
        };

        const rev = parseMoney(getVal(8));
        const cost = parseMoney(getVal(9));
        // Simple profit calc (optional, but good for JSON review)
        const profit = rev - cost;

        const orderData = {
            id: rowNumber,
            source: getVal(1),
            customer: getVal(2),
            account: getVal(3),
            service: getVal(4),
            start: getVal(5),
            end: getVal(6),
            dist: getVal(7),
            rev: rev,
            cost: cost,
            profit: profit,
            contact: getVal(11),
            status: {
                renewalStatus: 'pending',
                paymentStatus: 'paid', // Default to paid as per observed data
                contactCount: 0,
                lastUpdated: new Date().toISOString(),
                matchKey: ''
            }
        };

        // Basic validation: Must have Customer and Service
        if (orderData.customer && orderData.service) {
            orders.push(orderData);
        }
    });

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(orders, null, 2));
    console.log(`✅ Converted ${orders.length} rows to JSON backup.`);
    console.log(`Created: ${BACKUP_FILE}`);
}

convert();

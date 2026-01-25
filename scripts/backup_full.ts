
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');
const BACKUP_FILE = path.join(DATA_FOLDER, 'full_orders_backup.json');

async function backup() {
    console.log(`Reading file: ${ORDERS_FILE}`);
    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading file:', error);
        return;
    }

    const sheet = workbook.getWorksheet('DonHang');
    const statusSheet = workbook.getWorksheet('TrangThai');

    if (!sheet || !statusSheet) {
        console.error('Missing sheets!');
        return;
    }

    // 1. Load Status Data
    const statusMap = new Map<number, any>();
    statusSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = Number(row.getCell(1).value);
        const status = {
            renewalStatus: row.getCell(2).value,
            paymentStatus: row.getCell(3).value,
            contactCount: row.getCell(4).value,
            lastUpdated: row.getCell(5).value,
            matchKey: row.getCell(6).value
        };
        statusMap.set(id, status);
    });

    // 2. Backup All Orders
    const backedUpOrders: any[] = [];

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        // Current Mapping:
        // 1:Src, 2:Name, 3:Acc, 4:Svc, 5:Start, 6:End, 7:Dist, 8:Rev, 9:Cost, 10:Profit, 11:Contact, 12:ID
        const id = Number(row.getCell(12).value);

        const orderData = {
            source: row.getCell(1).value,
            customer: row.getCell(2).value,
            account: row.getCell(3).value,
            service: row.getCell(4).value,
            start: row.getCell(5).value,
            end: row.getCell(6).value,
            dist: row.getCell(7).value,
            rev: row.getCell(8).value,
            cost: row.getCell(9).value,
            profit: row.getCell(10).value,
            contact: row.getCell(11).value,
            id: id,
            status: statusMap.get(id)
        };

        backedUpOrders.push(orderData);
    });

    // 3. Save to File
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(backedUpOrders, null, 2));
    console.log(`Full Backup complete. Saved ${backedUpOrders.length} orders to ${BACKUP_FILE}`);
}

backup();


import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');
const BACKUP_FILE = path.join(DATA_FOLDER, 'recent_orders_backup_jan23_24.json');

// Helper
function generateMatchKey(customer: string, service: string, account: string, endDate: string): string {
    const normalize = (s: string) => String(s || '').trim().toLowerCase();
    const datePart = String(endDate || '').split('T')[0].trim();
    return `${normalize(customer)}|${normalize(service)}|${normalize(account)}|${datePart}`;
}

async function restore() {
    if (!fs.existsSync(BACKUP_FILE)) {
        console.error('Backup file not found!');
        return;
    }

    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    console.log(`Restoring ${backupData.length} orders...`);

    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading orders file:', error);
        return;
    }

    const sheet = workbook.getWorksheet('DonHang');
    let statusSheet = workbook.getWorksheet('TrangThai');

    if (!sheet) {
        console.error('Sheet DonHang not found');
        return;
    }
    if (!statusSheet) {
        statusSheet = workbook.addWorksheet('TrangThai');
        statusSheet.getRow(1).values = ['OrderID', 'RenewalStatus', 'PaymentStatus', 'ContactCount', 'LastUpdated', 'MatchKey'];
    }

    // Get Max ID to continue sequence safely if needed? 
    // Actually, we should probably append these with NEW IDs or preserve old ones if they don't clash?
    // User wiped data, so old IDs might be gone or re-used if they pasted new content.
    // Safest strategy: Treat them as NEW inserts to avoid ID collision with user's new content.
    // BUT we must keep their status.

    // Scan current max ID
    let maxId = 0;
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = Number(row.getCell(12).value);
        if (!isNaN(id) && id > maxId) maxId = id;
    });

    backupData.forEach((order: any) => {
        maxId++;
        const newId = maxId; // Assign new unique ID

        // Add to DonHang
        // 1:Src, 2:Name, 3:Acc, 4:Svc, 5:Start, 6:End, 7:Dist, 8:Rev, 9:Cost, 10:Profit, 11:Contact, 12:ID
        const row = sheet.addRow([]);
        row.getCell(1).value = order.source;
        row.getCell(2).value = order.customer;
        row.getCell(3).value = order.account;
        row.getCell(4).value = order.service;
        row.getCell(5).value = order.start;
        row.getCell(6).value = order.end;
        row.getCell(7).value = order.dist;
        row.getCell(8).value = order.rev;
        row.getCell(9).value = order.cost;
        row.getCell(10).value = order.profit;
        row.getCell(11).value = order.contact;
        row.getCell(12).value = newId;

        // Add to TrangThai
        const status = order.status || {};
        const matchKey = generateMatchKey(order.customer, order.service, order.account, order.end);

        statusSheet!.addRow([
            newId,
            status.renewalStatus || 'pending',
            status.paymentStatus || 'unpaid',
            status.contactCount || 0,
            new Date().toISOString(),
            matchKey
        ]);
    });

    await workbook.xlsx.writeFile(ORDERS_FILE);
    console.log('Restore complete.');
}

restore();

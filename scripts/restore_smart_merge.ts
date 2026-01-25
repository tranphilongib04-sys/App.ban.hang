
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');
const BACKUP_FILE = path.join(DATA_FOLDER, 'full_orders_backup.json');

// Recent Dates to Auto-Append (YYYY-MM-DD)
const RECENT_DATES = ['2026-01-23', '2026-01-24'];

// Helper to normalized MatchKey
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

    const backupList = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    console.log(`Loaded Backup: ${backupList.length} orders.`);

    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading orders file:', error);
        return;
    }

    const sheet = workbook.getWorksheet('DonHang');
    let statusSheet = workbook.getWorksheet('TrangThai');

    // Init Status Sheet if missing (Unlikely if file replaced correctly, but possible)
    if (!statusSheet) {
        statusSheet = workbook.addWorksheet('TrangThai');
        statusSheet.getRow(1).values = ['OrderID', 'RenewalStatus', 'PaymentStatus', 'ContactCount', 'LastUpdated', 'MatchKey'];
    }

    // 1. Index Backup Data
    const backupMap = new Map<string, any>(); // Key -> Status Object
    const recentOrdersInBackup: any[] = [];

    backupList.forEach((item: any) => {
        // Generate MatchKey from BACKUP Item
        const key = generateMatchKey(item.customer, item.service, item.account, item.end);

        // Store Status
        if (item.status) {
            backupMap.set(key, item.status);
        }

        // Check if Recent
        let dateStr = '';
        if (item.start) dateStr = String(item.start).split('T')[0];

        if (RECENT_DATES.includes(dateStr)) {
            recentOrdersInBackup.push({ ...item, _key: key });
        }
    });

    console.log(`Found ${recentOrdersInBackup.length} recent orders (Jan 23-24) in backup.`);

    // 2. Scan User's New File (DonHang)
    // We aim to:
    // NO CHANGEenerate ID if missing (or re-number)
    // b) Recover Status for each row
    // c) Build set of keys present in User File

    const userKeys = new Set<string>();
    let maxId = 0;

    // Clear TrangThai because we are rebuilding it based on New Data
    // (Assuming User's file doesn't have TrangThai, or it's empty/wrong)
    // Actually, we should clear TrangThai and rebuild it to match DonHang 1:1.
    // Clear TrangThai because we are rebuilding it based on New Data
    statusSheet!.spliceRows(2, statusSheet!.rowCount - 1);

    sheet!.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        // Read Data columns (Classic 1-11)
        const customer = String(row.getCell(2).value || '');
        const service = String(row.getCell(4).value || '');
        const account = String(row.getCell(3).value || '');
        const end = String(row.getCell(6).value || '');

        const key = generateMatchKey(customer, service, account, end);
        userKeys.add(key);

        // Assign/Fix ID (Col 12)
        const newId = rowNumber - 1;
        row.getCell(12).value = newId;
        maxId = newId;

        // Recover Status
        const oldStatus = backupMap.get(key);

        // Write to TrangThai
        statusSheet!.addRow([
            newId,
            oldStatus?.renewalStatus || 'pending',
            oldStatus?.paymentStatus || 'unpaid',
            oldStatus?.contactCount || 0,
            new Date().toISOString(),
            key
        ]);
    });

    // 3. Append Missing Recent Orders
    let appendedCount = 0;
    recentOrdersInBackup.forEach(order => {
        if (!userKeys.has(order._key)) {
            // Missing! Append it.
            maxId++;
            const newId = maxId;

            // Add to DonHang
            const row = sheet!.addRow([]);
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
            statusSheet!.addRow([
                newId,
                status.renewalStatus || 'pending',
                status.paymentStatus || 'unpaid',
                status.contactCount || 0,
                new Date().toISOString(),
                order._key
            ]);
            appendedCount++;
        }
    });

    console.log(`Smart Merge Complete.`);
    console.log(`- Refreshed Status for ${userKeys.size} user rows.`);
    console.log(`- Appended ${appendedCount} missing recent orders.`);

    await workbook.xlsx.writeFile(ORDERS_FILE);
}

restore();

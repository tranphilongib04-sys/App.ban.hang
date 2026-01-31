/**
 * Script để xóa tất cả dữ liệu và tạo file Excel mới với headers
 * Chạy: npx tsx scripts/reset-all-data.ts
 */

import ExcelJS from 'exceljs';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');

const FILES = {
    INVENTORY: path.join(DATA_FOLDER, 'Kho.xlsx'),
    ORDERS: path.join(DATA_FOLDER, 'DonHang.xlsx'),
    WARRANTY: path.join(DATA_FOLDER, 'BaoHanh.xlsx'),
};

async function resetInventory() {
    console.log('Creating new Kho.xlsx...');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kho');
    
    // Headers for inventory
    sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'SecretPayload', key: 'secretPayload', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'CreatedAt', key: 'createdAt', width: 20 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Distribution', key: 'distribution', width: 20 },
        { header: 'Note', key: 'note', width: 30 },
    ];
    
    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    await workbook.xlsx.writeFile(FILES.INVENTORY);
    console.log('✅ Kho.xlsx created');
}

async function resetOrders() {
    console.log('Creating new DonHang.xlsx...');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('DonHang');
    
    // Headers for orders (matches the column mapping in queries/index.ts)
    // 1:ID, 2:Name, 3:Contact, 4:Source, 5:Service, 6:Account, 7:Start, 8:End, 
    // 9:Rev, 10:Cost, 11:Status, 12:Payment, 13:Category, 14:Note, 15:CustID, 16:Tags
    sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'CustomerName', key: 'customerName', width: 25 },
        { header: 'Contact', key: 'contact', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'AccountInfo', key: 'accountInfo', width: 40 },
        { header: 'StartDate', key: 'startDate', width: 15 },
        { header: 'EndDate', key: 'endDate', width: 15 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'RenewalStatus', key: 'renewalStatus', width: 15 },
        { header: 'PaymentStatus', key: 'paymentStatus', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
        { header: 'CustomerID', key: 'customerId', width: 10 },
        { header: 'CustomerTags', key: 'customerTags', width: 20 },
    ];
    
    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    await workbook.xlsx.writeFile(FILES.ORDERS);
    console.log('✅ DonHang.xlsx created');
}

async function resetWarranty() {
    console.log('Creating new BaoHanh.xlsx...');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('BaoHanh');
    
    // Headers for warranty
    // 1:ID, 2:OrderID, 3:Name, 4:Service, 5:IssueDate, 6:Desc, 7:Status, 8:Resolved, 9:Cost, 10:Note
    sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'SubscriptionID', key: 'subscriptionId', width: 15 },
        { header: 'CustomerName', key: 'customerName', width: 25 },
        { header: 'Service', key: 'service', width: 20 },
        { header: 'IssueDate', key: 'issueDate', width: 15 },
        { header: 'IssueDescription', key: 'issueDescription', width: 40 },
        { header: 'WarrantyStatus', key: 'warrantyStatus', width: 15 },
        { header: 'ResolvedDate', key: 'resolvedDate', width: 15 },
        { header: 'Cost', key: 'cost', width: 15 },
        { header: 'Note', key: 'note', width: 30 },
    ];
    
    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    await workbook.xlsx.writeFile(FILES.WARRANTY);
    console.log('✅ BaoHanh.xlsx created');
}

async function resetSQLiteDB() {
    const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
    
    if (fs.existsSync(dbPath)) {
        console.log('Deleting tpb-manage.db...');
        fs.unlinkSync(dbPath);
        console.log('✅ tpb-manage.db deleted');
    }
    
    const oldDbPath = path.join(process.cwd(), 'data', 'subtrack.db');
    if (fs.existsSync(oldDbPath)) {
        console.log('Deleting subtrack.db...');
        fs.unlinkSync(oldDbPath);
        console.log('✅ subtrack.db deleted');
    }
}

async function main() {
    console.log('');
    console.log('🗑️  RESET ALL DATA');
    console.log('==================');
    console.log('');
    
    // Ensure data folder exists
    if (!fs.existsSync(DATA_FOLDER)) {
        console.log(`Creating folder: ${DATA_FOLDER}`);
        fs.mkdirSync(DATA_FOLDER, { recursive: true });
    }
    
    // Reset Excel files
    await resetOrders();
    await resetInventory();
    await resetWarranty();
    
    // Reset SQLite DB
    await resetSQLiteDB();
    
    console.log('');
    console.log('✅ All data has been reset!');
    console.log('');
    console.log('Files created:');
    console.log(`  - ${FILES.ORDERS}`);
    console.log(`  - ${FILES.INVENTORY}`);
    console.log(`  - ${FILES.WARRANTY}`);
    console.log('');
    console.log('You can now manually input data.');
    console.log('');
}

main().catch(console.error);

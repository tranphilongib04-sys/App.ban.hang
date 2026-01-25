
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');

async function migrate() {
    console.log(`Reading file: ${ORDERS_FILE}`);
    const workbook = new exceljs.Workbook();
    try {
        await workbook.xlsx.readFile(ORDERS_FILE);
    } catch (error) {
        console.error('Error reading file:', error);
        return;
    }

    const donHangSheet = workbook.getWorksheet('DonHang');
    if (!donHangSheet) {
        console.error('Sheet DonHang not found!');
        return;
    }

    // Check if TrangThai sheet already exists
    let statusSheet = workbook.getWorksheet('TrangThai');
    if (statusSheet) {
        console.log('Sheet TrangThai already exists. Skipping migration or merging?');
        // We will overwrite/update
    } else {
        console.log('Creating new sheet: TrangThai');
        statusSheet = workbook.addWorksheet('TrangThai');
    }

    // Setup headers for TrangThai
    statusSheet.getRow(1).values = ['OrderID', 'RenewalStatus', 'PaymentStatus', 'ContactCount', 'LastUpdated'];

    // Copy data
    donHangSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const id = row.getCell(1).value;
        const renewalStatus = row.getCell(11).value || 'pending';
        const paymentStatus = row.getCell(12).value || 'unpaid';
        const contactCount = row.getCell(17).value || 0;

        // Add to Status Sheet
        statusSheet?.addRow([id, renewalStatus, paymentStatus, contactCount, new Date().toISOString()]);

        // Optional: Clear columns 11, 12, 17 in DonHang?
        // Better to leave them for now to avoid data loss if something goes wrong, 
        // but arguably we should clear them to avoid confusion.
        // Let's KEEP them for now as backup.
    });

    console.log('Migration prepared. Saving...');
    await workbook.xlsx.writeFile(ORDERS_FILE);
    console.log('Migration completed successfully!');
}

migrate();

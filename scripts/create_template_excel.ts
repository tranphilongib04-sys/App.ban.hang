
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const FILE_NAME = 'DonHang_Template.xlsx';
const OUTPUT_FILE = path.join(DATA_FOLDER, FILE_NAME);

async function createTemplate() {
    // Ensure folder exists
    if (!fs.existsSync(DATA_FOLDER)) {
        fs.mkdirSync(DATA_FOLDER, { recursive: true });
        console.log(`Created folder: ${DATA_FOLDER}`);
    }

    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet('DonHang');

    // Define Headers
    sheet.getRow(1).values = [
        'Nguồn',           // 1
        'Tên Khách Hàng',  // 2
        'Tài Khoản',       // 3
        'Dịch Vụ',         // 4
        'Ngày Bắt Đầu',    // 5
        'Ngày Kết Thúc',   // 6
        'Phân Phối/Ghi Chú', // 7
        'Doanh Thu',       // 8
        'Chi Phí',         // 9
        'Lợi Nhuận',       // 10
        'Liên Hệ (SĐT)'    // 11
    ];

    // Style Header: Bold, Center
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    // Add Example Row
    sheet.addRow([
        'Facebook',             // 1
        'Nguyễn Văn A',         // 2
        'user@example.com',     // 3
        'Netflix Premium',      // 4
        '2024-01-01',           // 5
        '2025-01-01',           // 6
        'Lô 1',                 // 7
        100000,                 // 8
        50000,                  // 9
        50000,                  // 10
        '0901234567'            // 11
    ]);

    await workbook.xlsx.writeFile(OUTPUT_FILE);
    console.log(`✅ Template created at: ${OUTPUT_FILE}`);
}

createTemplate();

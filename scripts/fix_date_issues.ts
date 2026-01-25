
import exceljs from 'exceljs';
import path from 'path';
import os from 'os';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');

// Constants
const TODAY = new Date('2026-01-24');
const LIMIT_DATE = new Date('2026-12-01');

function parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

function formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

async function fix() {
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
        console.error('Sheet DonHang or TrangThai not found!');
        return;
    }

    // Load Status Map ref so we can update it
    const statusRows = new Map<number, exceljs.Row>();
    statusSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = Number(row.getCell(1).value);
        statusRows.set(id, row);
    });

    let fixCount = 0;

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const id = Number(row.getCell(12).value);
        const startVal = row.getCell(5).value; // Col 5 is Start
        const endVal = row.getCell(6).value;   // Col 6 is End

        let startDate = parseDate(startVal);
        let endDate = parseDate(endVal);

        if (!startDate || !endDate) return;

        let hasChange = false;

        // Rule 1: Start Date > Today
        if (startDate > TODAY) {
            startDate = new Date(startDate);
            startDate.setFullYear(startDate.getFullYear() - 1);

            endDate = new Date(endDate);
            endDate.setFullYear(endDate.getFullYear() - 1);

            hasChange = true;
        }
        // Rule 2: End Date >= Dec 2026
        else if (endDate >= LIMIT_DATE) {
            startDate = new Date(startDate);
            startDate.setFullYear(startDate.getFullYear() - 1);

            endDate = new Date(endDate);
            endDate.setFullYear(endDate.getFullYear() - 1);
            hasChange = true;
        }

        if (hasChange) {
            row.getCell(5).value = formatDate(startDate);
            row.getCell(6).value = formatDate(endDate);

            // Should verify status update?
            const statusRow = statusRows.get(id);
            if (statusRow) {
                const currentStatus = String(statusRow.getCell(2).value);
                // Rule 3: If 'not_renewing' but new End Date > Today -> Change to 'pending'
                if (currentStatus === 'not_renewing' && endDate > TODAY) {
                    statusRow.getCell(2).value = 'pending';
                }
            }
            fixCount++;
        }
    });

    console.log(`Applied fixes to ${fixCount} orders.`);
    await workbook.xlsx.writeFile(ORDERS_FILE);
}

fix();


import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');
const ORDERS_FILE = path.join(DATA_FOLDER, 'DonHang.xlsx');
const PREVIEW_FILE = path.join(os.homedir(), '.gemini/antigravity/brain/2a076448-003c-4857-89be-98745841481d/correction_preview.md');

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

async function analyze() {
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

    if (!sheet) {
        console.error('Sheet DonHang not found!');
        return;
    }

    // Load Status Map
    const statusMap = new Map<number, { renewalStatus: string; paymentStatus: string }>();
    if (statusSheet) {
        statusSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const id = Number(row.getCell(1).value);
            const renewalStatus = String(row.getCell(2).value || 'pending');
            const paymentStatus = String(row.getCell(3).value || 'unpaid');
            statusMap.set(id, { renewalStatus, paymentStatus });
        });
    }

    let issues: any[] = [];
    let processedCount = 0;

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const id = Number(row.getCell(1).value);
        const customerName = String(row.getCell(2).value || '');
        const service = String(row.getCell(5).value || '');
        const startVal = row.getCell(7).value;
        const endVal = row.getCell(8).value;

        const startDate = parseDate(startVal);
        const endDate = parseDate(endVal);

        const status = statusMap.get(id) || { renewalStatus: 'pending', paymentStatus: 'unpaid' };

        let issueType = '';
        let proposedStart = startDate ? new Date(startDate) : null;
        let proposedEnd = endDate ? new Date(endDate) : null;
        let proposedStatus = status.renewalStatus;
        let hasDateChange = false;
        let hasStatusChange = false;

        // --- Date Rules ---
        if (startDate && endDate) {
            // Rule 1: Start Date > Today
            if (startDate > TODAY) {
                issueType += '[Future Start] ';
                proposedStart!.setFullYear(startDate.getFullYear() - 1);
                proposedEnd!.setFullYear(endDate.getFullYear() - 1);
                hasDateChange = true;
            }
            // Rule 2: End Date >= Dec 2026 (if not caught by Rule 1)
            else if (endDate >= LIMIT_DATE) {
                issueType += '[End Date too far] ';
                proposedStart!.setFullYear(startDate.getFullYear() - 1);
                proposedEnd!.setFullYear(endDate.getFullYear() - 1);
                hasDateChange = true;
            }
        }

        // --- Status Rule ---
        // Rule 3: If 'not_renewing' but End Date (proposed or current) > Today -> Change to 'pending'
        const effectiveEnd = hasDateChange ? proposedEnd : endDate;
        if (status.renewalStatus === 'not_renewing' && effectiveEnd && effectiveEnd > TODAY) {
            issueType += '[Incorrect Status] ';
            proposedStatus = 'pending';
            hasStatusChange = true;
        }

        if (hasDateChange || hasStatusChange) {
            issues.push({
                row: rowNumber,
                id: id,
                customer: customerName,
                service: service,
                currentStart: startDate ? formatDate(startDate) : 'N/A',
                currentEnd: endDate ? formatDate(endDate) : 'N/A',
                currentStatus: status.renewalStatus,
                issue: issueType.trim(),
                proposedStart: proposedStart ? formatDate(proposedStart) : 'N/A',
                proposedEnd: proposedEnd ? formatDate(proposedEnd) : 'N/A',
                proposedStatus: proposedStatus
            });
        }
        processedCount++;
    });

    // Generate Markdown Report
    let md = '# Data Correction Preview\n\n';
    md += `**Total Rows Scanned:** ${processedCount}\n`;
    md += `**Issues Found:** ${issues.length}\n\n`;
    md += `> **Rules Applied:**\n`;
    md += `> 1. Start Date > ${formatDate(TODAY)} -> Subtract 1 year\n`;
    md += `> 2. End Date >= ${formatDate(LIMIT_DATE)} -> Subtract 1 year\n`;
    md += `> 3. Status 'not_renewing' & Active -> Change to 'pending'\n\n`;

    if (issues.length > 0) {
        md += '| Row | Customer | Service | Current Dates | Current Status | Issue | Proposed Dates | Proposed Status |\n';
        md += '|---|---|---|---|---|---|---|---|\n';
        issues.forEach(i => {
            const dateStr = `${i.currentStart} -> ${i.currentEnd}`;
            const newDateStr = `${i.proposedStart} -> ${i.proposedEnd}`;
            const statusChange = i.currentStatus !== i.proposedStatus ? `**${i.proposedStatus}**` : i.proposedStatus;

            md += `| ${i.row} | ${i.customer} | ${i.service} | ${dateStr} | ${i.currentStatus} | ${i.issue} | ${newDateStr} | ${statusChange} |\n`;
        });
    } else {
        md += 'No issues found matching the criteria.\n';
    }

    fs.writeFileSync(PREVIEW_FILE, md);
    console.log(`Analysis complete. Report saved to ${PREVIEW_FILE}`);
}

analyze();

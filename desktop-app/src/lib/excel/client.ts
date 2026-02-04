import exceljs from 'exceljs';
import path from 'path';
import os from 'os';
import * as fs from 'fs';

const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_FOLDER = path.join(DESKTOP_PATH, 'Dữ lIệu lớn-TBQ');

export const FILES = {
    INVENTORY: path.join(DATA_FOLDER, 'Kho.xlsx'),
    ORDERS: path.join(DATA_FOLDER, 'DonHang.xlsx'),
    WARRANTY: path.join(DATA_FOLDER, 'BaoHanh.xlsx'),
};

// Cache to store loaded workbooks and their last modified time
const workbookCache = new Map<string, { workbook: exceljs.Workbook, mtimeMs: number }>();

export async function getWorkbook(filePath: string): Promise<exceljs.Workbook> {
    try {
        // Check if file exists and get stats
        if (!fs.existsSync(filePath)) {
            // If file doesn't exist, return empty workbook (don't cache)
            console.warn(`File not found: ${filePath}`);
            return new exceljs.Workbook();
        }

        const stats = fs.statSync(filePath);
        const mtimeMs = stats.mtimeMs;

        // Check cache
        if (workbookCache.has(filePath)) {
            const cached = workbookCache.get(filePath)!;
            if (cached.mtimeMs === mtimeMs) {
                // Cache hit: return cached workbook
                console.log(`[CACHE] Hit for ${path.basename(filePath)}`);
                return cached.workbook;
            } else {
                console.log(`[CACHE] Stale (mtime changed) for ${path.basename(filePath)}`);
            }
        } else {
            console.log(`[CACHE] Miss for ${path.basename(filePath)}`);
        }

        // Cache miss or stale: read from disk
        const start = Date.now();
        console.log(`[DISK] Reading ${path.basename(filePath)}...`);
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Update cache
        workbookCache.set(filePath, { workbook, mtimeMs });
        return workbook;

    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return new exceljs.Workbook();
    }
}

export async function saveWorkbook(workbook: exceljs.Workbook, filePath: string) {
    try {
        await workbook.xlsx.writeFile(filePath);

        // Update cache with new stats to prevent immediate invalidation on next read
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            workbookCache.set(filePath, { workbook, mtimeMs: stats.mtimeMs });
        }
    } catch (error) {
        console.error(`Error saving file ${filePath}:`, error);
        throw error;
    }
}

// Helper to map row to object based on columns
export function rowToObject(row: exceljs.Row, columns: string[]): any {
    const obj: any = {};
    columns.forEach((col, index) => {
        // Excel index is 1-based, array is 0-based. But actual data starts at specific column.
        // Assuming columns are in order of 1, 2, 3...
        // row.getCell(index + 1).value
        const val = row.getCell(index + 1).value;
        // Hyperlink handling (if any, though we mostly use text)
        if (val && typeof val === 'object' && 'text' in val) {
            obj[col] = (val as any).text;
        } else {
            obj[col] = val;
        }
    });
    return obj;
}

// Interfaces to match DB types logically
export interface ExcelInventoryItem {
    id: number;
    service: string;
    secretPayload: string;
    status: string;
    createdAt: string;
    cost: number;
    category: string;
    distribution: string;
    note: string;
}

export interface ExcelOrder {
    id: number;
    customerName: string;
    contact: string;
    source: string;
    service: string;
    accountInfo: string;
    startDate: string;
    endDate: string;
    revenue: number;
    cost: number;
    renewalStatus: string;
    paymentStatus: string;
    category: string;
    note: string;
    customerId: number;
    customerTags: string;
    contactCount: number;
}

export interface ExcelWarranty {
    id: number;
    subscriptionId: number;
    customerName: string;
    service: string;
    issueDate: string;
    issueDescription: string;
    warrantyStatus: string;
    resolvedDate: string;
    cost: number;
    note: string;
}

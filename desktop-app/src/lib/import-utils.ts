import * as XLSX from 'xlsx';

export function generateTemplate(): Buffer {
    const headers = [
        'Customer Name',
        'Account Info',
        'Source',
        'Service',
        'Start Date (YYYY-MM-DD)',
        'End Date (YYYY-MM-DD)',
        'Distribution',
        'Revenue',
        'Cost',
        'Note',
        'Contact',
        'Category'
    ];

    const exampleRow = [
        'Nguyen Van A',
        'email@example.com|password',
        'Facebook',
        'Giao sau',
        '2024-01-01',
        '2024-02-01',
        'Zalo',
        '100000',
        '50000',
        'Ghi chu o day',
        '0901234567',
        'Entertainment'
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, // Customer Name
        { wch: 30 }, // Account Info
        { wch: 15 }, // Source
        { wch: 20 }, // Service
        { wch: 15 }, // Start Date
        { wch: 15 }, // End Date
        { wch: 15 }, // Distribution
        { wch: 10 }, // Revenue
        { wch: 10 }, // Cost
        { wch: 30 }, // Note
        { wch: 15 }, // Contact
        { wch: 15 }, // Category
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function parseExcel(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: false, // Use formatted strings
        dateNF: 'yyyy-mm-dd' // Force date format
    });
    // Remove header row
    if (data.length > 0) data.shift();

    return data.filter((row: any) => row.length > 0);
}

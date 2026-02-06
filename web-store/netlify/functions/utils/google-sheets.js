/**
 * GOOGLE SHEETS UTILITY - Fetch data from public Google Sheets
 * 
 * Schema: sku, account, password, 2fa_code, purchase_date, status
 */

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1y_MD9okFwz6zIdkhDXLOnEM4VKVjxfEJVr-Oq0L3CoA';

/**
 * Fetch inventory data from Google Sheets
 * @returns {Promise<Array>} Array of inventory items
 */
async function fetchInventoryFromSheets() {
    // CSV export URL format for public sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

    try {
        const response = await fetch(csvUrl, {
            redirect: 'follow' // Follow redirects automatically
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.status}`);
        }

        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('[GoogleSheets] Error fetching inventory:', error);
        return [];
    }
}

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV content
 * @returns {Array} Array of objects with headers as keys
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
        });
        data.push(row);
    }

    return data;
}

/**
 * Parse a single CSV line (handles quoted values with commas)
 * @param {string} line - Single CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current); // Last value

    return result;
}

/**
 * Get available stock count for a SKU
 * @param {string} sku - SKU to filter (e.g., ChatGPT_1m)
 * @returns {Promise<number>} Count of available items
 */
async function getAvailableStock(sku = null) {
    const inventory = await fetchInventoryFromSheets();

    let available = inventory.filter(item => item.status === 'available');

    if (sku) {
        available = available.filter(item =>
            item.sku === sku ||
            item.sku?.toLowerCase().includes(sku.toLowerCase())
        );
    }

    return available.length;
}

/**
 * Get inventory summary grouped by SKU
 * @returns {Promise<Array>} Array of {sku, available, total}
 */
async function getInventorySummary() {
    const inventory = await fetchInventoryFromSheets();

    const summary = {};
    for (const item of inventory) {
        if (!item.sku) continue;

        if (!summary[item.sku]) {
            summary[item.sku] = { total: 0, available: 0 };
        }

        summary[item.sku].total++;
        if (item.status === 'available') {
            summary[item.sku].available++;
        }
    }

    return Object.entries(summary).map(([sku, counts]) => ({
        sku: sku,
        product_code: sku, // For backward compatibility
        available: counts.available,
        total: counts.total
    }));
}

/**
 * Get a single available item for a SKU (for order fulfillment)
 * Returns full credential details
 * @param {string} sku - SKU to get (e.g., ChatGPT_1m)
 * @returns {Promise<Object|null>} Available item with credentials or null
 */
async function getAvailableItem(sku) {
    const inventory = await fetchInventoryFromSheets();

    const item = inventory.find(item =>
        item.sku === sku &&
        item.status === 'available'
    );

    if (!item) return null;

    // Return structured credential object
    return {
        sku: item.sku,
        account: item.account,
        password: item.password,
        twofa_code: item['2fa_code'] || '',
        purchase_date: item.purchase_date,
        status: item.status
    };
}

/**
 * Get all items for a specific SKU
 * @param {string} sku - SKU to filter
 * @returns {Promise<Array>} All items matching SKU
 */
async function getItemsBySku(sku) {
    const inventory = await fetchInventoryFromSheets();

    return inventory.filter(item =>
        item.sku === sku ||
        item.sku?.toLowerCase().includes(sku.toLowerCase())
    );
}

module.exports = {
    fetchInventoryFromSheets,
    getAvailableStock,
    getInventorySummary,
    getAvailableItem,
    getItemsBySku,
    SHEET_ID
};

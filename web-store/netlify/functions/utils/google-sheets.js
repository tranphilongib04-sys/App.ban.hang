/**
 * GOOGLE SHEETS UTILITY - Fetch data from public Google Sheets
 * 
 * Uses the published CSV export URL (no API key required)
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
        const response = await fetch(csvUrl);
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
 * Get available stock count for a product
 * @param {string} productCode - Product code to filter
 * @returns {Promise<number>} Count of available items
 */
async function getAvailableStock(productCode = null) {
    const inventory = await fetchInventoryFromSheets();

    let available = inventory.filter(item => item.status === 'available');

    if (productCode) {
        available = available.filter(item =>
            item.product_code === productCode ||
            item.product_code?.includes(productCode)
        );
    }

    return available.length;
}

/**
 * Get inventory summary grouped by product
 * @returns {Promise<Array>} Array of {product_code, available}
 */
async function getInventorySummary() {
    const inventory = await fetchInventoryFromSheets();

    const summary = {};
    for (const item of inventory) {
        if (!item.product_code) continue;

        if (!summary[item.product_code]) {
            summary[item.product_code] = { total: 0, available: 0 };
        }

        summary[item.product_code].total++;
        if (item.status === 'available') {
            summary[item.product_code].available++;
        }
    }

    return Object.entries(summary).map(([code, counts]) => ({
        product_code: code,
        available: counts.available,
        total: counts.total
    }));
}

/**
 * Get a single available item for a product (for order fulfillment)
 * @param {string} productCode - Product code to get
 * @returns {Promise<Object|null>} Available item or null
 */
async function getAvailableItem(productCode) {
    const inventory = await fetchInventoryFromSheets();

    return inventory.find(item =>
        item.product_code === productCode &&
        item.status === 'available'
    ) || null;
}

module.exports = {
    fetchInventoryFromSheets,
    getAvailableStock,
    getInventorySummary,
    getAvailableItem,
    SHEET_ID
};

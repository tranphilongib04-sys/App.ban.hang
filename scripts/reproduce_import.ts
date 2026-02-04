
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') }); // Override with local

import { db } from '../src/lib/db';
import { inventoryItems } from '../src/lib/db/schema';
import { createInventoryItem } from '../src/lib/db/queries';

async function main() {
    console.log("Starting import reproduction...");

    const testItems = [
        {
            service: 'Code ChatGPT 1 tháng',
            secretPayload: 'chatgpt.com/p/TEST_LINK_1',
            cost: 8000,
            expiresAt: '2026-03-03',
            distribution: 'Bot',
            note: 'Test Import Script'
        },
        {
            service: 'Code ChatGPT 1 tháng',
            secretPayload: 'chatgpt.com/p/TEST_LINK_2',
            cost: 8000,
            expiresAt: '2026-03-03',
            distribution: 'Bot',
            note: 'Test Import Script'
        }
    ];

    try {
        console.log("Importing items...");
        for (const item of testItems) {
            await createInventoryItem(item);
        }
        console.log("✅ Import successful!");
    } catch (error: any) {
        console.error("❌ Import failed!");
        console.error(error);
    }
}

main();

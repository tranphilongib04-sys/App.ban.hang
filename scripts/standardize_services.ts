import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'subtrack.db');
const db = new Database(dbPath);

// Service name standardization mapping
const serviceMapping: Record<string, { standardName: string; category: string }> = {
    // AI Services
    'Chatgpt': { standardName: 'ChatGPT Plus', category: 'AI' },
    'chatgpt': { standardName: 'ChatGPT Plus', category: 'AI' },
    'Chatgpt plus': { standardName: 'ChatGPT Plus', category: 'AI' },
    'Chatgpt plú': { standardName: 'ChatGPT Plus', category: 'AI' },
    'Chatgpt Plus': { standardName: 'ChatGPT Plus', category: 'AI' },
    'Chatgpt Pro': { standardName: 'ChatGPT Pro', category: 'AI' },
    'Chatgpt pro': { standardName: 'ChatGPT Pro', category: 'AI' },
    'chatgpt pro': { standardName: 'ChatGPT Pro', category: 'AI' },
    'Chatgpt team': { standardName: 'ChatGPT Pro', category: 'AI' },
    'Chatgpt Go': { standardName: 'ChatGPT Go', category: 'AI' },
    'ChatGPT Go': { standardName: 'ChatGPT Go', category: 'AI' },

    // Video/Design Services
    'Capcut': { standardName: 'CapCut Pro', category: 'Video/Design' },
    'Capcut Pro': { standardName: 'CapCut Pro', category: 'Video/Design' },
    'Capcut pro': { standardName: 'CapCut Pro', category: 'Video/Design' },
    'Canva pro': { standardName: 'Canva Pro', category: 'Video/Design' },
    'Canva Edu': { standardName: 'Canva Pro', category: 'Video/Design' },
    'Canva EDU': { standardName: 'Canva Pro', category: 'Video/Design' },
    'Canva Pro': { standardName: 'Canva Pro', category: 'Video/Design' },
    'Adobe': { standardName: 'Adobe', category: 'Video/Design' },
    'Adobe ': { standardName: 'Adobe', category: 'Video/Design' },

    // Entertainment Services
    'ytb': { standardName: 'YouTube Premium', category: 'Entertainment' },
    'ytb pre': { standardName: 'YouTube Premium', category: 'Entertainment' },
    'Ytb pre': { standardName: 'YouTube Premium', category: 'Entertainment' },
    'Youtube Pre': { standardName: 'YouTube Premium', category: 'Entertainment' },
    'Ytb': { standardName: 'YouTube Premium', category: 'Entertainment' },
    'Spoitfy': { standardName: 'Spotify', category: 'Entertainment' },
    'Spotìy': { standardName: 'Spotify', category: 'Entertainment' },
    'Sportify': { standardName: 'Spotify', category: 'Entertainment' },
    'Spotify': { standardName: 'Spotify', category: 'Entertainment' },
    'Netflix extra': { standardName: 'Netflix', category: 'Entertainment' },
    'Netflix': { standardName: 'Netflix', category: 'Entertainment' },
    'Veo3': { standardName: 'Veo 3', category: 'Entertainment' },
    'Veo 3': { standardName: 'Veo 3', category: 'Entertainment' },
    'SOra': { standardName: 'Sora', category: 'Entertainment' },
    'Sora 2': { standardName: 'Sora', category: 'Entertainment' },
    'Sora': { standardName: 'Sora', category: 'Entertainment' },

    // Other Services
    'GG 2TB': { standardName: 'Google One 2TB', category: 'Other' },
    'ver gg1': { standardName: 'Google One 2TB', category: 'Other' },
    'Coursera': { standardName: 'Coursera', category: 'Other' },
    'Cousera': { standardName: 'Coursera', category: 'Other' },
    'MS365': { standardName: 'Microsoft 365', category: 'Other' },
    'Gamma': { standardName: 'Gamma', category: 'Other' },
};

console.log('🚀 Starting service name standardization...\n');

// Step 1: Add category column if it doesn't exist
try {
    db.exec('ALTER TABLE subscriptions ADD COLUMN category TEXT');
    console.log('✅ Added category column to subscriptions table');
} catch (error: any) {
    if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Category column already exists in subscriptions table');
    } else {
        throw error;
    }
}

try {
    db.exec('ALTER TABLE inventory_items ADD COLUMN category TEXT');
    console.log('✅ Added category column to inventory_items table');
} catch (error: any) {
    if (error.message.includes('duplicate column name')) {
        console.log('ℹ️  Category column already exists in inventory_items table');
    } else {
        throw error;
    }
}

console.log('\n📊 Standardizing service names in subscriptions table...');

// Step 2: Update subscriptions table
const updateSubscription = db.prepare(
    'UPDATE subscriptions SET service = ?, category = ? WHERE id = ?'
);

const allSubscriptions = db.prepare('SELECT id, service FROM subscriptions').all() as Array<{
    id: number;
    service: string;
}>;

let subscriptionsUpdated = 0;
let subscriptionsSkipped = 0;

for (const sub of allSubscriptions) {
    const mapping = serviceMapping[sub.service];
    if (mapping) {
        updateSubscription.run(mapping.standardName, mapping.category, sub.id);
        subscriptionsUpdated++;
        console.log(`  ✓ ${sub.service} → ${mapping.standardName} (${mapping.category})`);
    } else {
        subscriptionsSkipped++;
        console.log(`  ⚠️  Skipped: ${sub.service} (no mapping found)`);
    }
}

console.log(`\n📈 Subscriptions updated: ${subscriptionsUpdated}`);
console.log(`⏭️  Subscriptions skipped: ${subscriptionsSkipped}`);

console.log('\n📊 Standardizing service names in inventory_items table...');

// Step 3: Update inventory_items table
const updateInventory = db.prepare(
    'UPDATE inventory_items SET service = ?, category = ? WHERE id = ?'
);

const allInventory = db.prepare('SELECT id, service FROM inventory_items').all() as Array<{
    id: number;
    service: string;
}>;

let inventoryUpdated = 0;
let inventorySkipped = 0;

for (const item of allInventory) {
    const mapping = serviceMapping[item.service];
    if (mapping) {
        updateInventory.run(mapping.standardName, mapping.category, item.id);
        inventoryUpdated++;
        console.log(`  ✓ ${item.service} → ${mapping.standardName} (${mapping.category})`);
    } else {
        inventorySkipped++;
        console.log(`  ⚠️  Skipped: ${item.service} (no mapping found)`);
    }
}

console.log(`\n📈 Inventory items updated: ${inventoryUpdated}`);
console.log(`⏭️  Inventory items skipped: ${inventorySkipped}`);

// Step 4: Display summary
console.log('\n📋 Summary of standardized services:');
const distinctServices = db
    .prepare('SELECT DISTINCT service, category FROM subscriptions ORDER BY category, service')
    .all() as Array<{ service: string; category: string | null }>;

const byCategory: Record<string, string[]> = {};
for (const item of distinctServices) {
    const cat = item.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item.service);
}

for (const [category, services] of Object.entries(byCategory)) {
    console.log(`\n  ${category}:`);
    for (const service of services) {
        console.log(`    - ${service}`);
    }
}

console.log('\n✅ Migration complete!');

db.close();

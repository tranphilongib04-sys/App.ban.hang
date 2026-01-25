import { db } from '../src/lib/db';
import { subscriptions, inventoryItems } from '../src/lib/db/schema';
import { eq, like, or } from 'drizzle-orm';

async function main() {
    console.log('Starting service name fix...');

    const targetName = 'CapCut Pro';
    const variations = [
        'Capcup Pro',
        'Capcut Pro',
        'capcut pro',
        'capcup pro',
        'Capcup',
        'Capcut'
    ];

    let subCount = 0;
    let invCount = 0;

    for (const variation of variations) {
        // Fix Subscriptions
        const subsToFix = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.service, variation));

        if (subsToFix.length > 0) {
            console.log(`Found ${subsToFix.length} subscriptions with service "${variation}"`);
            await db
                .update(subscriptions)
                .set({ service: targetName })
                .where(eq(subscriptions.service, variation));
            subCount += subsToFix.length;
        }

        // Fix Inventory Items
        const itemsToFix = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.service, variation));

        if (itemsToFix.length > 0) {
            console.log(`Found ${itemsToFix.length} inventory items with service "${variation}"`);
            await db
                .update(inventoryItems)
                .set({ service: targetName })
                .where(eq(inventoryItems.service, variation));
            invCount += itemsToFix.length;
        }
    }

    // Also fix "CapCut" (without Pro) if desired? 
    // The user image showed "Capcup Pro", "Capcut Pro".
    // Let's stick to the list above which covers the main typos seen.

    console.log('-----------------------------------');
    console.log(`Fixed ${subCount} subscriptions.`);
    console.log(`Fixed ${invCount} inventory items.`);
    console.log('Done.');
}

main().catch(console.error);

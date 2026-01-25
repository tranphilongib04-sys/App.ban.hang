
import { db } from '../src/lib/db';
import { subscriptions } from '../src/lib/db/schema';
import { eq, like, or } from 'drizzle-orm';
import { not } from 'drizzle-orm';
import * as fs from 'fs';

// Helper to parse "M/d/yy" or "d/M/yy" to "yyyy-MM-dd"
// Assuming input is like 12/1/25 (Dec 1, 2025)
function parseDate(str: string) {
    if (!str || !str.includes('/')) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;

    let [p1, p2, p3] = parts;
    // p3 is year, likely 2-digit
    let year = parseInt(p3);
    if (year < 100) year += 2000;

    let m = parseInt(p1);
    let d = parseInt(p2);

    // Heuristics: if m > 12, it must be d/m/y
    if (m > 12) {
        // swap
        const temp = m;
        m = d;
        d = temp;
    }

    // Now format
    const yStr = year.toString();
    const mStr = m.toString().padStart(2, '0');
    const dStr = d.toString().padStart(2, '0');

    return `${yStr}-${mStr}-${dStr}`;
}

async function main() {
    console.log('Fetching subscriptions with slash dates...');
    const slashDates = await db.select().from(subscriptions).where(
        or(like(subscriptions.startDate, '%/%'), like(subscriptions.endDate, '%/%'))
    );

    console.log(`Found ${slashDates.length} records to fix.`);
    let fixed = 0;

    for (const sub of slashDates) {
        let updates: any = {};
        let changed = false;

        const newStart = parseDate(sub.startDate);
        if (newStart && newStart !== sub.startDate) {
            updates.startDate = newStart;
            changed = true;
        }

        const newEnd = parseDate(sub.endDate);
        if (newEnd && newEnd !== sub.endDate) {
            updates.endDate = newEnd;
            changed = true;
        }

        if (changed) {
            await db.update(subscriptions).set(updates).where(eq(subscriptions.id, sub.id));
            fixed++;
        }
    }

    console.log(`Fixed ${fixed} records.`);
}

main().catch(console.error);

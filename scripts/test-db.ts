
import { db } from '../src/lib/db';
import { customers } from '../src/lib/db/schema';

async function test() {
    console.log('Testing DB Access...');
    const result = await db.select().from(customers).limit(5);
    console.log('Customers found:', result.length);
    if (result.length > 0) {
        console.log('Sample:', result[0]);
    } else {
        console.error('No customers found! Migration might have failed.');
    }
}

test().catch(console.error);

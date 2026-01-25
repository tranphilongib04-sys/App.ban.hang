import { createClient } from '@libsql/client';
import 'dotenv/config';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("❌ Missing TURSO credentials.");
    process.exit(1);
}

const client = createClient({
    url,
    authToken,
});

async function main() {
    console.log("🛠️ Fixing Schema on Cloud DB...");

    try {
        await client.execute(`ALTER TABLE subscriptions ADD COLUMN reminder_date TEXT;`);
        console.log("✅ Added column: reminder_date");
    } catch (e: any) {
        if (e.message.includes("duplicate column")) {
            console.log("ℹ️ Column reminder_date already exists.");
        } else {
            console.error("⚠️ Error adding column:", e.message);
        }
    }

    console.log("✨ Schema fix complete.");
}

main().catch(console.error);

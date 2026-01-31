
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function update() {
    console.log("Fetching existing templates...");
    const result = await client.execute("SELECT * FROM templates WHERE service IN ('Netflix', 'Quizlet')");

    for (const row of result.rows) {
        let content = row.content as string;

        // Check if has newline
        if (content.includes('\n')) {
            console.log(`Updating template ${row.title}: Merging lines...`);

            // Replace newline with space
            let newContent = content.replace(/\n/g, ' ');

            // Fix double spaces or weird punctuation
            newContent = newContent.replace(/\s+/g, ' ').trim();

            // Ensure space after period if missing
            newContent = newContent.replace(/\.([^\s])/g, '. $1');

            await client.execute({
                sql: 'UPDATE templates SET content = ? WHERE id = ?',
                args: [newContent, row.id]
            });
        }
    }

    console.log('Merge complete!');
}

update().catch(console.error);


import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const WARRANTY_NOTE = "Tất cả đơn hàng đều full bảo hành trong thời hạn.";

async function update() {
    console.log("Standardizing warranty notes...");
    const result = await client.execute("SELECT * FROM templates");

    for (const row of result.rows) {
        let content = row.content as string;
        let isModified = false;

        // 1. Check if it already has the EXACT note at the end
        if (content.endsWith(WARRANTY_NOTE)) {
            console.log(`Skipping (already has note): ${row.title}`);
            continue;
        }

        // 2. Remove inline "full bảo hành" to avoid duplication/clutter
        // Patterns: ", full bảo hành trong thời hạn" or "full bảo hành trong thời hạn,"
        const oldWarrantyPatterns = [
            /,? ?full bảo hành trong thời hạn, ?/yi,
            /,? ?full bảo hành trong thời hạn\.?/yi,
            /full bảo hành trong thời hạn/yi
        ];

        for (const pattern of oldWarrantyPatterns) {
            if (pattern.test(content)) {
                console.log(`Removing inline warranty from: ${row.title}`);
                content = content.replace(pattern, '');
                // Clean up double spaces or trailing punctuation often left behind
                content = content.replace(/ ,/g, ',');
                content = content.replace(/ \./g, '.');
                content = content.replace(/  +/g, ' ');
                isModified = true;
            }
        }

        // 3. Append the standard note
        // Add newline if needed
        content = content.trim();
        if (!content.endsWith('.')) content += '.'; // Ensure sentence end
        content += `\n${WARRANTY_NOTE}`;
        isModified = true;

        if (isModified) {
            console.log(`Updating ${row.title}...`);
            await client.execute({
                sql: 'UPDATE templates SET content = ? WHERE id = ?',
                args: [content, row.id]
            });
        }
    }

    console.log('Standardization complete!');
}

update().catch(console.error);

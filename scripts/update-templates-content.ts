
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function update() {
    console.log("Fetching existing templates...");
    const result = await client.execute('SELECT * FROM templates');

    // 1. Clean existing templates
    for (const row of result.rows) {
        let content = row.content as string;

        // Remove **
        if (content.includes('**')) {
            content = content.replace(/\*\*/g, '');
            console.log(`Updating template ${row.id}: Removing **`);
            await client.execute({
                sql: 'UPDATE templates SET content = ? WHERE id = ?',
                args: [content, row.id]
            });
        }
    }

    // 2. Add New Templates
    const newTemplates = [
        {
            service: 'Netflix',
            title: 'Báo giá Netflix Slot',
            category: 'sale',
            content: `Netflix slot: 70k/tháng, hàng này cần mã đăng nhập.\nTất cả đơn hàng đều full bảo hành trong thời hạn.`
        },
        {
            service: 'Netflix',
            title: 'Báo giá Netflix Extra',
            category: 'sale',
            content: `Netflix Extra: 75k/tháng, hàng này log là xài, tiện hơn.\nTất cả đơn hàng đều full bảo hành trong thời hạn.`
        },
        {
            service: 'Quizlet',
            title: 'Báo giá Quizlet',
            category: 'sale',
            content: `Quizlet Plus: 160k/năm\nQuizlet Unlimited: 200k/năm\nKhách cung cấp tk, mk acc để bên mình nâng.\nTất cả đơn hàng đều full bảo hành trong thời hạn.`
        }
    ];

    console.log("Adding new templates...");
    for (const t of newTemplates) {
        // Check if exists to avoid duplicates (implied by title)
        const check = await client.execute({
            sql: 'SELECT id FROM templates WHERE title = ?',
            args: [t.title]
        });

        if (check.rows.length === 0) {
            await client.execute({
                sql: 'INSERT INTO templates (service, title, category, content) VALUES (?, ?, ?, ?)',
                args: [t.service, t.title, t.category, t.content]
            });
            console.log(`Added: ${t.title}`);
        } else {
            console.log(`Skipped (already exists): ${t.title}`);
        }
    }

    console.log('Update complete!');
}

update().catch(console.error);

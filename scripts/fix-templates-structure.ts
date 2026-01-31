
import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function update() {
    console.log("Fixing templates...");

    // 1. Merge Netflix
    // Delete old ones
    await client.execute("DELETE FROM templates WHERE title IN ('Báo giá Netflix Slot', 'Báo giá Netflix Extra')");

    // Create new combined one
    // Check if exists first
    const nfCheck = await client.execute("SELECT id FROM templates WHERE title = 'Báo giá Netflix'");
    if (nfCheck.rows.length === 0) {
        console.log("Creating combined Netflix template...");
        await client.execute({
            sql: 'INSERT INTO templates (service, title, category, content) VALUES (?, ?, ?, ?)',
            args: [
                'Netflix',
                'Báo giá Netflix',
                'sale',
                `Netflix slot: 70k/tháng, hàng này cần mã đăng nhập.\nNetflix Extra: 75k/tháng, hàng này log là xài, tiện hơn.\nTất cả đơn hàng đều full bảo hành trong thời hạn.`
            ]
        });
    }

    // 2. Fix Quizlet (Restore line breaks / Tách dòng)
    console.log("Restoring Quizlet formatting...");
    const quizContent = `Quizlet Plus: 160k/năm\nQuizlet Unlimited: 200k/năm\nKhách cung cấp tk, mk acc để bên mình nâng.\nTất cả đơn hàng đều full bảo hành trong thời hạn.`;

    await client.execute({
        sql: 'UPDATE templates SET content = ? WHERE title = ?',
        args: [quizContent, 'Báo giá Quizlet']
    });

    console.log('Fix complete!');
}

update().catch(console.error);

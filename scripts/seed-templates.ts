
import { createClient } from '@libsql/client'; // Use direct client for simplicity in script
import * as dotenv from 'dotenv';
dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const DEFAULT_TEMPLATES = [
    {
        service: 'Capcut',
        title: 'Báo giá CapCut Pro',
        category: 'sale',
        content: `Capcut pro mình đang bán **35k/tháng**, full bảo hành trong thời hạn, thanh toán khi log in thành công ạ.`
    },
    {
        service: 'Spotify',
        title: 'Báo giá Spotify',
        category: 'sale',
        content: `Spotify mình đang bán **30k/tháng**, full bảo hành trong thời hạn, thanh toán khi log in thành công.`
    },
    {
        service: 'ChatGPT',
        title: 'Báo giá ChatGPT Plus',
        category: 'sale',
        content: `Chatgpt mình đang bán **70k/tháng**\nHàng acc cấp, ko dùng chung, có thể share được 3-4 thiết bị, thanh toán khi log in thành công ạ`
    },
    {
        service: 'ChatGPT',
        title: 'Gia hạn ChatGPT',
        category: 'renewal',
        content: `ChatGPT mình đang có 2 options:\nOption 1: Gia hạn tk cũ: **90k/tháng**\nOption 2: Cấp tk mới: **70k/tháng**`
    },
    {
        service: 'General',
        title: 'Nhắc gia hạn (Mẫu chung)',
        category: 'renewal',
        content: `Chào {ten_khach}, gói {dich_vu} của bạn sắp hết hạn vào ngày {ngay_het_han}. Bạn có muốn gia hạn tiếp không ạ?`
    }
];

async function seed() {
    console.log('Checking templates...');
    const result = await client.execute('SELECT COUNT(*) as count FROM templates');
    const count = result.rows[0].count as number;

    if (count > 0) {
        console.log(`Table templates already has ${count} rows. Skipping seed.`);
        return;
    }

    console.log('Seeding templates...');
    for (const t of DEFAULT_TEMPLATES) {
        await client.execute({
            sql: 'INSERT INTO templates (service, title, category, content) VALUES (?, ?, ?, ?)',
            args: [t.service, t.title, t.category, t.content]
        });
    }
    console.log('Done!');
}

seed().catch(console.error);

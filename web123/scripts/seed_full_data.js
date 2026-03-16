require('dotenv').config({ path: '../.env' });
const { createClient } = require('@libsql/client');

async function main() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
        console.error('Missing TURSO credentials in .env');
        process.exit(1);
    }

    const db = createClient({ url, authToken });
    console.log('🔌 Connecting to Turso DB...');

    try {
        const products = [
            { code: 'netflix_1m', name: 'Giao sau 1 Month', price: 70000 },
            { code: 'spotify_1m', name: 'Giao sau 1 Month', price: 30000 },
            { code: 'spotify_4m', name: 'Giao sau 4 Months', price: 115000 },
            { code: 'spotify_1y', name: 'Giao sau 1 Year', price: 350000 },
            { code: 'youtube_1m', name: 'YouTube Premium 1 Month', price: 40000 },
            { code: 'canva_edu_1y', name: 'Canva Edu 1 Year', price: 80000 },
            { code: 'canva_pro_1y', name: 'Canva Pro 1 Year', price: 130000 }
        ];

        console.log('📦 Seeding Products...');
        for (const p of products) {
            await db.execute({
                sql: `INSERT OR IGNORE INTO products (code, name, base_price, is_active) VALUES (?, ?, ?, 1)`,
                args: [p.code, p.name, p.price]
            });
        }
        console.log('✅ Products Seeded.');

        console.log('📦 Seeding Stock Units...');
        // Find IDs and insert stock
        for (const p of products) {
            const res = await db.execute({ sql: "SELECT id FROM products WHERE code = ?", args: [p.code] });
            if (res.rows.length > 0) {
                const pid = res.rows[0].id;
                // Insert 5 stock units for each
                for (let i = 1; i <= 5; i++) {
                    const content = `${p.code.toUpperCase()}-CODE-${i}`;
                    await db.execute({
                        sql: `INSERT INTO stock_units (product_id, content, status) 
                               SELECT ?, ?, 'available' 
                               WHERE NOT EXISTS (SELECT 1 FROM stock_units WHERE content = ?)`,
                        args: [pid, content, content]
                    });
                }
            }
        }
        console.log('✅ Stock Units Seeded (5 units per product).');
        console.log('🎉 Full Data Seeding Completed!');

    } catch (err) {
        console.error('❌ Seeding failed:', err);
    }
}

main();

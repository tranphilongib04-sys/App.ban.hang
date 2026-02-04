
import Database from 'better-sqlite3';
import path from 'path';

function main() {
    console.log('Starting manual import for CapCut (Direct SQLite)...');

    const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
    console.log(`Database path: ${dbPath}`);

    const db = new Database(dbPath);

    const items = [
        'harubap@bivo.renoar.web.id|masuk123',
        'gudeyar@apud.renoar.web.id|masuk123',
        'lenupiy@qide.renoar.web.id|masuk123'
    ];

    const service = 'CapCut';
    const batchName = `Manual Import ${new Date().toISOString()}`;
    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
        INSERT INTO inventory_items (
            service, 
            secret_payload, 
            secret_masked, 
            status, 
            import_batch, 
            cost, 
            created_at,
            distribution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Using a transaction for safety
    const importTransaction = db.transaction((itemList) => {
        for (const secret of itemList) {
            // Mask secret
            const parts = secret.split('|');
            const masked = parts.length > 0
                ? parts[0].substring(0, 3) + '***' + (parts.length > 1 ? '|***' : '')
                : '***';

            console.log(`Importing: ${masked}`);

            insertStmt.run(
                service,
                secret,
                masked,
                'available',
                batchName,
                0, // cost
                createdAt,
                'Manual Input' // distribution
            );
        }
    });

    try {
        importTransaction(items);
        console.log(`Successfully imported ${items.length} items for ${service}`);
    } catch (err) {
        console.error('Transaction failed:', err);
        process.exit(1);
    }
}

main();

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'tpb-manage.db');
console.log('Migrating database at:', dbPath);

const db = new Database(dbPath);

try {
    console.log('Adding cost column to warranties table...');
    db.exec('ALTER TABLE warranties ADD COLUMN cost REAL DEFAULT 0');
    console.log('Migration successful!');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column cost already exists. Skipping.');
    } else {
        console.error('Migration failed:', error);
    }
}

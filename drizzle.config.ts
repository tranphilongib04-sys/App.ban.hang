import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.TURSO_DATABASE_URL || './data/tpb-manage.db',
        token: process.env.TURSO_AUTH_TOKEN,
    },
});

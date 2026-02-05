import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Test 1: Check environment
        const env = {
            hasUrl: !!process.env.TURSO_DATABASE_URL,
            hasToken: !!process.env.TURSO_AUTH_TOKEN,
            isVercel: process.env.VERCEL === '1' || !!process.env.VERCEL_ENV,
            nodeEnv: process.env.NODE_ENV,
        };

        // Test 2: Try a simple query
        let queryResult = null;
        let queryError = null;
        try {
            const result = await db.select().from(customers).limit(1);
            queryResult = { success: true, count: result.length };
        } catch (e: any) {
            queryError = {
                message: e.message,
                name: e.name,
                stack: e.stack?.split('\n').slice(0, 5).join('\n')
            };
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            env,
            queryResult,
            queryError,
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 10).join('\n'),
        }, { status: 500 });
    }
}

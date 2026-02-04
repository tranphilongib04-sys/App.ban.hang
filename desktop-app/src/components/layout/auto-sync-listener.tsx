'use client';

import { useEffect, useRef } from 'react';
import { syncFromLocalFileAction } from '@/app/actions';
import { toast } from 'sonner';

export function AutoSyncListener() {
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const runSync = async () => {
            const result = await syncFromLocalFileAction();
            if (result.success && 'customersAdded' in result) {
                // Only toast if meaningful updates happened? 
                // Or maybe just silently update to avoid spamming user every time?
                // User said "tự cập nhật khi anh mở lại app", implying they want it fresh.
                // Let's show a small toast if new data added, or silent if nothing new.
                // The current import return doesn't say "new" vs "existing", it counts imports.
                // If counts > 0, it means it processed them. 
                // Ideally we shouldn't spam success if nothing changed.
                // But for now, let's just log or show a subtle toast.
                console.log('Auto-sync success', result);
                if ((result.customersAdded || 0) > 0 || (result.subscriptionsAdded || 0) > 0) {
                    toast.success(`Đã tự động cập nhật: +${result.subscriptionsAdded} đơn`);
                }
            } else if (!result.success && result.error && result.error !== 'Chưa cấu hình đường dẫn file Excel') {
                // Ignore if not configured, show error otherwise
                console.error('Auto-sync error', result.error);
                toast.error(`Lỗi tự động cập nhật: ${result.error}`);
            }
        };

        runSync();
    }, []);

    return null; // Invisible component
}

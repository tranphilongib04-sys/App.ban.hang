'use client';

import { Badge } from '@/components/ui/badge';
import { statusConfig } from '@/lib/business';
import { OverallStatus, RenewalStatus, PaymentStatus, InventoryStatus, WarrantyStatus } from '@/types';
import { cn } from '@/lib/utils';

type StatusType = 'overall' | 'renewal' | 'payment' | 'inventory' | 'warranty';

interface StatusBadgeProps {
    type: StatusType;
    status: OverallStatus | RenewalStatus | PaymentStatus | InventoryStatus | WarrantyStatus;
    className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
    const config = (statusConfig as any)[type][status];

    if (!config) return null;

    return (
        <Badge
            variant="secondary"
            className={cn(
                'font-medium text-xs px-2.5 py-0.5 rounded-full',
                config.color,
                className
            )}
        >
            {config.label}
        </Badge>
    );
}

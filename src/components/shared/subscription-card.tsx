'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { SubscriptionWithCustomer } from '@/types';
import { formatCurrency, calculateProfit } from '@/lib/business';
import { messages, copyToClipboard } from '@/lib/messages';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import {
    Copy,
    Check,
    RefreshCw,
    CreditCard,
    X,
    MessageCircle,
    RotateCcw,
    Clock,
    Trash2,
} from 'lucide-react';
import {
    updateSubscriptionAction,
    quickRenewAction, // Kept for history renew if needed, or remove if unused
    deleteSubscriptionAction,
} from '@/app/actions';
import { RenewDialog } from '@/components/orders/renew-dialog';
import { RemindLaterDialog } from '@/components/orders/remind-later-dialog';

interface SubscriptionCardProps {
    subscription: SubscriptionWithCustomer;
    onUpdate?: () => void;
    showActions?: boolean;
    index?: number;
}

export function SubscriptionCard({ subscription, onUpdate, showActions = true, index }: SubscriptionCardProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleCopyMessage = async () => {
        const message = messages.reminder(
            subscription.customerName,
            subscription.service,
            subscription.endDate,
            subscription.accountInfo || undefined
        );
        const success = await copyToClipboard(message);
        if (success) {
            toast.success('Đã copy tin nhắn');
        } else {
            toast.error('Không thể copy');
        }
    };

    const handleMarkRenewed = async () => {
        setLoading('renewed');
        try {
            await updateSubscriptionAction(subscription.id, { renewalStatus: 'renewed' });
            toast.success('Đã đánh dấu gia hạn');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    const handleMarkPaid = async () => {
        setLoading('paid');
        try {
            await updateSubscriptionAction(subscription.id, { paymentStatus: 'paid' });
            toast.success('Đã đánh dấu thanh toán');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    const handleNotRenewing = async () => {
        setLoading('not_renewing');
        try {
            await updateSubscriptionAction(subscription.id, { renewalStatus: 'not_renewing' });
            toast.success('Đã đánh dấu không gia hạn');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    const handleQuickRenew = async () => {
        setLoading('quick_renew');
        try {
            await quickRenewAction(subscription.id);
            toast.success('Đã tạo subscription mới');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    const handleMarkContacted = async () => {
        setLoading('contacted');
        try {
            await updateSubscriptionAction(subscription.id, {
                lastContactedAt: new Date().toISOString(),
                contactCount: (subscription.contactCount || 0) + 1,
            });
            toast.success('Đã ghi nhận liên hệ');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xoá đơn hàng này? Hành động này không thể hoàn tác.')) {
            return;
        }
        setLoading('delete');
        try {
            await deleteSubscriptionAction(subscription.id);
            toast.success('Đã xoá đơn hàng');
            onUpdate?.();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading(null);
    };

    return (
        <Card className="liquid-card border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden bg-white/40">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
            <div className="relative z-10">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {index !== undefined && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 border border-gray-200 shrink-0">
                                        {index + 1}
                                    </span>
                                )}
                                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                                    {subscription.customerName}
                                </CardTitle>
                                {(subscription.contactCount ?? 0) > 0 && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors shrink-0"
                                        onClick={handleMarkContacted}
                                        title="Click để thêm lượt liên hệ"
                                    >
                                        <MessageCircle className="h-3 w-3" />
                                        {subscription.contactCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <StatusBadge type="overall" status={subscription.overallStatus} />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{subscription.service}</p>
                            {subscription.accountInfo && (
                                <p className="text-xs font-mono text-gray-400 mt-1 truncate" title={subscription.accountInfo}>
                                    {subscription.accountInfo}
                                </p>
                            )}
                            {subscription.distribution && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Nguồn: {subscription.distribution}
                                </p>
                            )}
                            {subscription.customerSource && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Kênh: {subscription.customerSource}
                                </p>
                            )}
                            {subscription.reminderDate && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium" suppressHydrationWarning>
                                    <Clock className="h-3 w-3" />
                                    Nhắc lại: {format(new Date(subscription.reminderDate), 'dd/MM/yyyy')}
                                </p>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            disabled={loading === 'delete'}
                            className="h-8 w-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 border-2 border-red-300 hover:border-red-400 rounded-lg transition-all shadow-sm hover:shadow-md shrink-0"
                            title="Xoá đơn hàng"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                            <span className="text-gray-500">Hết hạn:</span>
                            <span className="ml-2 font-medium text-gray-900" suppressHydrationWarning>
                                {subscription.endDate && !isNaN(new Date(subscription.endDate).getTime())
                                    ? format(new Date(subscription.endDate), 'dd/MM/yyyy', { locale: vi })
                                    : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Còn:</span>
                            <span className={`ml-2 font-medium ${isNaN(subscription.daysUntilEnd) ? 'text-gray-400' : subscription.daysUntilEnd < 0 ? 'text-red-600' : subscription.daysUntilEnd <= 3 ? 'text-orange-600' : 'text-gray-900'}`} suppressHydrationWarning>
                                {isNaN(subscription.daysUntilEnd)
                                    ? '-'
                                    : subscription.daysUntilEnd < 0
                                        ? `${Math.abs(subscription.daysUntilEnd)} ngày trước`
                                        : `${subscription.daysUntilEnd} ngày`
                                }
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Doanh thu:</span>
                            <span className="ml-2 font-medium text-gray-900">
                                {formatCurrency(subscription.revenue)}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Lợi nhuận:</span>
                            <span className="ml-2 font-medium text-emerald-600">
                                {formatCurrency(calculateProfit(subscription.revenue, subscription.cost))}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <StatusBadge type="renewal" status={subscription.renewalStatus} />
                        <StatusBadge type="payment" status={subscription.paymentStatus} />
                    </div>

                    {showActions && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                            {/* Stage 1: Needs Reminder (Not contacted yet) */}
                            {subscription.overallStatus === 'needs_reminder' && (subscription.contactCount === 0 || subscription.contactCount === null) && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            await handleCopyMessage();
                                            await handleMarkContacted();
                                        }}
                                        disabled={loading === 'contacted'}
                                        className="text-sm min-h-[44px] text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-colors w-full active:scale-[0.98]"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-1.5" />
                                        Nhắn tin
                                    </Button>
                                </>
                            )}

                            {/* Stage 2: Contacted (Needs Reminder + Contacted) */}
                            {subscription.overallStatus === 'needs_reminder' && (subscription.contactCount || 0) > 0 && (
                                <>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCopyMessage}
                                            className="min-h-[44px] px-3 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 active:scale-[0.98]"
                                            title="Copy tin nhắn"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <RenewDialog subscription={subscription} onSuccess={onUpdate}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-sm min-h-[44px] text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 hover:border-green-300 active:scale-[0.98]"
                                            >
                                                <Check className="h-4 w-4 mr-1.5" />
                                                Gia hạn
                                            </Button>
                                        </RenewDialog>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNotRenewing}
                                            disabled={loading === 'not_renewing'}
                                            className="flex-1 text-sm min-h-[44px] text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700 active:scale-[0.98]"
                                        >
                                            <X className="h-4 w-4 mr-1.5" />
                                            Không gia hạn
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Stage 3: Awaiting Payment */}
                            {subscription.overallStatus === 'awaiting_payment' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleMarkPaid}
                                        disabled={loading === 'paid'}
                                        className="flex-1 text-sm min-h-[44px] text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 w-full mb-2 active:scale-[0.98]"
                                    >
                                        <CreditCard className="h-4 w-4 mr-1.5" />
                                        Đã thanh toán
                                    </Button>

                                    <div className="flex gap-2 w-full">
                                        <RemindLaterDialog subscription={subscription} onSuccess={onUpdate}>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 text-xs text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300"
                                            >
                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                Hẹn ngày thanh toán
                                            </Button>
                                        </RemindLaterDialog>
                                    </div>
                                </>
                            )}

                            {/* Stage 4: Overdue (Similar to Contacted but urgent) */}
                            {subscription.overallStatus === 'overdue' && (
                                <>
                                    <RenewDialog subscription={subscription} onSuccess={onUpdate}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-green-600 hover:text-green-700"
                                        >
                                            <Check className="h-3.5 w-3.5 mr-1" />
                                            Gia hạn
                                        </Button>
                                    </RenewDialog>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleNotRenewing}
                                        disabled={loading === 'not_renewing'}
                                        className="text-xs text-red-500 hover:text-red-600"
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Không gia hạn
                                    </Button>
                                </>
                            )}

                            {/* Stage 5: Closed (Allow Restore) */}
                            {subscription.overallStatus === 'closed' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        setLoading('restore');
                                        try {
                                            await updateSubscriptionAction(subscription.id, {
                                                renewalStatus: 'pending',
                                                paymentStatus: subscription.paymentStatus === 'not_paying' ? 'unpaid' : subscription.paymentStatus
                                            });
                                            toast.success('Đã khôi phục trạng thái');
                                            onUpdate?.();
                                        } catch {
                                            toast.error('Có lỗi xảy ra');
                                        }
                                        setLoading(null);
                                    }}
                                    disabled={loading === 'restore'}
                                    className="text-xs text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 w-full"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                    Khôi phục
                                </Button>
                            )}

                            {/* Stage 6: Active/Completed - No Quick Renew button (reminder feature handles this) */}
                        </div>
                    )}
                </CardContent>
            </div>
        </Card >
    );
}

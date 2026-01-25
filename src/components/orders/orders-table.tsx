import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from '@/components/shared/status-badge';
import { SubscriptionWithCustomer } from '@/types';
import { formatCurrency, calculateProfit } from '@/lib/business';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Copy, Check, RefreshCw, CreditCard, X, Truck, RotateCcw, Pencil, ShieldAlert, Key } from 'lucide-react';
import { toast } from 'sonner';
import {
    updateSubscriptionAction,
    quickRenewAction,
} from '@/app/actions';
import { EditOrderDialog } from './edit-order-dialog';

interface OrdersTableProps {
    subscriptions: SubscriptionWithCustomer[];
    loading: Record<number, string>;
    onAction: (id: number, action: string, fn: () => Promise<void>) => Promise<void>;
    onDeliver: (sub: SubscriptionWithCustomer) => Promise<void>;
    onCopyMessage: (sub: SubscriptionWithCustomer) => Promise<void>;
    onRenewWithInventory: (sub: SubscriptionWithCustomer) => void;
    showReminderDate?: boolean;
}

export function OrdersTable({
    subscriptions,
    loading,
    onAction,
    onDeliver,
    onCopyMessage,
    onRenewWithInventory,
    showReminderDate = false,
}: OrdersTableProps) {

    // Helper to format date safely
    const formatDate = (dateString: string) => {
        if (!dateString) return <span className="text-gray-400 italic">--</span>;
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Return original string if parse fails, might be just text?
                return <span className="text-red-500 text-xs">{dateString}</span>;
            }
            return format(date, 'dd/MM/yyyy', { locale: vi });
        } catch {
            return <span className="text-red-600 font-bold">Lỗi</span>;
        }
    };

    return (
        <>
            {/* Desktop View - Table */}
            <div className="hidden md:block liquid-card rounded-3xl overflow-hidden border-white/40 bg-white/40">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="bg-indigo-50/40 hover:bg-indigo-50/50 text-xs text-gray-700 border-b border-indigo-100/50">
                            <TableHead className="w-[3%] font-bold text-center">#</TableHead>
                            <TableHead className="w-[13%]">Khách hàng</TableHead>
                            <TableHead className="w-[10%]">Dịch vụ</TableHead>
                            {showReminderDate ? (
                                <TableHead className="w-[10%] whitespace-nowrap text-purple-600">Ngày hẹn</TableHead>
                            ) : (
                                <TableHead className="w-[10%] whitespace-nowrap">Ngày bắt đầu</TableHead>
                            )}
                            <TableHead className="w-[10%] whitespace-nowrap">Ngày kết thúc</TableHead>
                            <TableHead className="w-[10%] text-center">Gia hạn</TableHead>
                            <TableHead className="w-[11%] text-center">Thanh toán</TableHead>
                            <TableHead className="w-[10%] text-right font-semibold text-emerald-600">Lợi nhuận</TableHead>
                            <TableHead className="w-[13%]">Tài khoản</TableHead>
                            <TableHead className="w-[10%] text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                    Không có đơn hàng nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscriptions.map((sub) => (
                                <TableRow key={sub.id} className="hover:bg-indigo-50/30 transition-colors text-xs border-b border-gray-100/50">
                                    <TableCell className="text-center font-medium text-gray-500">
                                        {subscriptions.indexOf(sub) + 1}
                                    </TableCell>
                                    <TableCell className="font-medium align-top py-3 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/customers/${sub.customerId}`}
                                                className="truncate w-full hover:text-indigo-600 hover:underline transition-colors block"
                                                title={sub.customerName}
                                            >
                                                {sub.customerName}
                                            </Link>
                                            {sub.hasWarranty && (
                                                <div
                                                    className="relative group cursor-pointer shrink-0"
                                                    onClick={() => window.location.href = `/warranty?search=${encodeURIComponent(sub.customerName)}`}
                                                >
                                                    <ShieldAlert className="h-4 w-4 text-amber-500 hover:text-amber-600 transition-colors" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-3 overflow-hidden">
                                        <span className="truncate w-full block" title={sub.service}>{sub.service}</span>
                                    </TableCell>
                                    <TableCell className="align-top py-3 truncate">
                                        {showReminderDate ? (
                                            <span className="font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100" suppressHydrationWarning>
                                                {formatDate(sub.reminderDate || '')}
                                            </span>
                                        ) : (
                                            <span suppressHydrationWarning>
                                                {formatDate(sub.startDate)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top py-3 truncate">
                                        <span
                                            className={`font-medium ${sub.daysUntilEnd < 0
                                                ? 'text-red-600'
                                                : sub.daysUntilEnd <= 3
                                                    ? 'text-orange-600'
                                                    : 'text-gray-900'
                                                }`}
                                            suppressHydrationWarning
                                        >
                                            {formatDate(sub.endDate)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="focus:outline-none cursor-pointer hover:opacity-80 transition-opacity w-full whitespace-nowrap">
                                                {sub.renewalStatus === 'pending' && sub.daysUntilEnd > 3 ? (
                                                    <span className="text-gray-300 block text-center font-mono">--</span>
                                                ) : (
                                                    <StatusBadge type="renewal" status={sub.renewalStatus} />
                                                )}
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuLabel>Tùy chọn gia hạn</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                {sub.renewalStatus === 'pending' && (
                                                    <>
                                                        <DropdownMenuItem onClick={() =>
                                                            onAction(sub.id, 'renewed', () =>
                                                                updateSubscriptionAction(sub.id, { renewalStatus: 'renewed' }).then(() => { toast.success('Đã gia hạn'); })
                                                            )
                                                        }>
                                                            <Check className="mr-2 h-4 w-4 text-green-600" />
                                                            <span>Đánh dấu đã gia hạn</span>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem onClick={() => onRenewWithInventory(sub)}>
                                                            <Truck className="mr-2 h-4 w-4 text-indigo-600" />
                                                            <span>Gia hạn bằng kho (Auto)</span>
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem onClick={() =>
                                                            onAction(sub.id, 'not_renewing', () =>
                                                                updateSubscriptionAction(sub.id, { renewalStatus: 'not_renewing' }).then(() => { toast.success('Đã đánh dấu không gia hạn'); })
                                                            )
                                                        }>
                                                            <X className="mr-2 h-4 w-4 text-gray-500" />
                                                            <span>Khách không gia hạn</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}

                                                {sub.renewalStatus === 'renewed' && (
                                                    <DropdownMenuItem onClick={() =>
                                                        onAction(sub.id, 'undo_renew', () =>
                                                            updateSubscriptionAction(sub.id, { renewalStatus: 'pending' }).then(() => { toast.success('Đã hoàn tác'); })
                                                        )
                                                    }>
                                                        <RotateCcw className="mr-2 h-4 w-4 text-orange-500" />
                                                        <span>Hoàn tác (Chưa gia hạn)</span>
                                                    </DropdownMenuItem>
                                                )}

                                                {/* Allow renew action for completed items too */}
                                                {(sub.overallStatus === 'completed' || sub.overallStatus === 'overdue') && (
                                                    <>
                                                        <DropdownMenuItem onClick={() =>
                                                            onAction(sub.id, 'quick_renew', () =>
                                                                quickRenewAction(sub.id).then(() => { toast.success('Đã tạo đơn hàng mới'); })
                                                            )
                                                        }>
                                                            <RefreshCw className="mr-2 h-4 w-4 text-purple-600" />
                                                            <span>Gia hạn tiếp (Tạo đơn mới)</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onRenewWithInventory(sub)}>
                                                            <Truck className="mr-2 h-4 w-4 text-indigo-600" />
                                                            <span>Gia hạn bằng kho (Auto)</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="focus:outline-none cursor-pointer hover:opacity-80 transition-opacity w-full whitespace-nowrap flex justify-center">
                                                <StatusBadge type="payment" status={sub.paymentStatus} />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                <DropdownMenuLabel>Thanh toán</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                {sub.paymentStatus === 'unpaid' ? (
                                                    <DropdownMenuItem onClick={() =>
                                                        onAction(sub.id, 'paid', () =>
                                                            updateSubscriptionAction(sub.id, { paymentStatus: 'paid' }).then(() => { toast.success('Đã thanh toán'); })
                                                        )
                                                    }>
                                                        <CreditCard className="mr-2 h-4 w-4 text-blue-600" />
                                                        <span>Đánh dấu đã trả tiền</span>
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() =>
                                                        onAction(sub.id, 'unpaid', () =>
                                                            updateSubscriptionAction(sub.id, { paymentStatus: 'unpaid' }).then(() => { toast.success('Đã đánh dấu chưa trả'); })
                                                        )
                                                    }>
                                                        <RotateCcw className="mr-2 h-4 w-4 text-orange-500" />
                                                        <span>Hoàn tác (Chưa trả)</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="text-emerald-600 font-medium text-right">
                                        {formatCurrency(calculateProfit(sub.revenue, sub.cost))}
                                    </TableCell>
                                    <TableCell>
                                        {sub.accountInfo ? (
                                            <div
                                                className="flex items-center gap-2 w-full cursor-pointer hover:bg-amber-50 hover:border-amber-200 transition-colors rounded px-1 -ml-1 border border-transparent"
                                                title="Click to copy"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(sub.accountInfo || '');
                                                    toast.success('Đã copy tài khoản');
                                                }}
                                            >
                                                <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                <span className="text-xs text-gray-600 truncate font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:bg-white w-full">
                                                    {sub.accountInfo}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            <EditOrderDialog
                                                subscription={sub}
                                                trigger={
                                                    <Button variant="ghost" size="sm" title="Chỉnh sửa">
                                                        <Pencil className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                }
                                            />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onCopyMessage(sub)}
                                                title="Copy tin nhắn"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeliver(sub)}
                                                disabled={loading[sub.id] === 'deliver'}
                                                title="Giao hàng"
                                            >
                                                <Truck className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 rounded-xl border border-white/40 text-gray-500">
                        Không có đơn hàng nào
                    </div>
                ) : (
                    subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                            {/* Header: Service + Price */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{sub.service}</h3>
                                    <Link
                                        href={`/customers/${sub.customerId}`}
                                        className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        {sub.customerName}
                                        {sub.hasWarranty && <ShieldAlert className="h-3 w-3 text-amber-500" />}
                                    </Link>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-emerald-600">
                                        {formatCurrency(sub.revenue)}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Lãi: {formatCurrency(calculateProfit(sub.revenue, sub.cost))}
                                    </div>
                                </div>
                            </div>

                            {/* Info Blocks */}
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Hết hạn</span>
                                    <span className={`font-medium ${sub.daysUntilEnd < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {formatDate(sub.endDate)}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">Trạng thái</span>
                                    <StatusBadge type="payment" status={sub.paymentStatus} />
                                </div>
                            </div>

                            {/* Account Info */}
                            {sub.accountInfo && (
                                <div
                                    className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-100 cursor-pointer"
                                    onClick={() => {
                                        navigator.clipboard.writeText(sub.accountInfo || '');
                                        toast.success('Đã copy tài khoản');
                                    }}
                                >
                                    <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <code className="text-xs text-gray-700 font-mono flex-1 hover:underline truncate">
                                        {sub.accountInfo}
                                    </code>
                                    <Copy className="h-3 w-3 text-amber-400" />
                                </div>
                            )}

                            {/* Actions Bar */}
                            <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => onCopyMessage(sub)}
                                >
                                    <Copy className="h-4 w-4 mr-1.5 text-gray-500" /> Copy
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => onDeliver(sub)}
                                    disabled={loading[sub.id] === 'deliver'}
                                >
                                    <Truck className="h-4 w-4 mr-1.5 text-indigo-600" /> Giao
                                </Button>
                                {/* We can add more specific mobile actions here if needed */}
                                <EditOrderDialog
                                    subscription={sub}
                                    trigger={
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

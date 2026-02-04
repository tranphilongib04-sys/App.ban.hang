'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/status-badge';
import { WarrantyWithDetails, SubscriptionWithCustomer } from '@/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Plus,
    Shield,
    Check,
    X,
    Search,
    ChevronsUpDown,
    DollarSign,
    Coins,
} from 'lucide-react';
import { toast } from 'sonner';
import { messages, copyToClipboard } from '@/lib/messages';
import {
    createWarrantyAction,
    resolveWarrantyAction,
    rejectWarrantyAction,
    resolveAllPendingWarrantiesAction,
} from '@/app/actions';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/business';
import { Eye, Zap } from 'lucide-react';

interface WarrantyClientProps {
    warranties: WarrantyWithDetails[];
    subscriptions: SubscriptionWithCustomer[];
}

export function WarrantyClient({ warranties, subscriptions }: WarrantyClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [loading, setLoading] = useState<Record<number, string>>({});

    // Combobox state
    const [openCombobox, setOpenCombobox] = useState(false)
    const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("")

    const [subscriptionSearch, setSubscriptionSearch] = useState("")

    // Resolve Dialog state
    const [resolveDialogWarranty, setResolveDialogWarranty] = useState<WarrantyWithDetails | null>(null);
    const [resolveMethod, setResolveMethod] = useState<'auto' | 'manual'>('manual');
    const [manualAccountInfo, setManualAccountInfo] = useState('');
    const [manualCost, setManualCost] = useState(0);

    // View Dialog state
    const [viewWarranty, setViewWarranty] = useState<WarrantyWithDetails | null>(null);

    const filteredWarranties = warranties.filter((w) => {
        const matchesSearch =
            w.customerName.toLowerCase().includes(search.toLowerCase()) ||
            w.service.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || w.warrantyStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        total: warranties.length,
        pending: warranties.filter((w) => w.warrantyStatus === 'pending').length,
        resolved: warranties.filter((w) => w.warrantyStatus === 'resolved').length,
        rejected: warranties.filter((w) => w.warrantyStatus === 'rejected').length,
        totalCost: warranties.reduce((sum, w) => sum + (w.cost || 0), 0),
    };

    const handleAddWarranty = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        // Manually append subscriptionId from state because Combobox doesn't use native select
        formData.set('subscriptionId', selectedSubscriptionId);

        if (!selectedSubscriptionId) {
            toast.error('Vui lòng chọn subscription');
            return;
        }

        try {
            await createWarrantyAction(formData);
            toast.success('Đã tạo yêu cầu bảo hành');
            setIsAddOpen(false);
            setSelectedSubscriptionId(""); // Reset
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleResolveClick = (warranty: WarrantyWithDetails) => {
        setResolveDialogWarranty(warranty);
        setResolveMethod('manual'); // Default to manual as requested
        setManualAccountInfo('');
        setManualCost(0);
    };

    const handleConfirmResolve = async () => {
        if (!resolveDialogWarranty) return;

        const warranty = resolveDialogWarranty;
        setLoading((prev) => ({ ...prev, [warranty.id]: 'resolve' }));

        let result;
        if (resolveMethod === 'auto') {
            result = await resolveWarrantyAction(warranty.id, warranty.service);
        } else {
            result = await resolveWarrantyAction(warranty.id, warranty.service, manualAccountInfo, manualCost);
        }

        if (result.success) {
            const accInfo = resolveMethod === 'auto' ? (result as any).item?.secretPayload : manualAccountInfo;
            const message = messages.warranty(
                warranty.customerName,
                warranty.service,
                accInfo || ''
            );
            await copyToClipboard(message);
            toast.success('Đã xử lý bảo hành & copy tin nhắn!');
            setResolveDialogWarranty(null);
            router.refresh();
        } else {
            toast.error((result as any).error || 'Không thể xử lý bảo hành');
        }
        setLoading((prev) => ({ ...prev, [warranty.id]: '' }));
    };

    const handleAutoApproveAll = async () => {
        if (!confirm('Bạn có chắc muốn tự động duyệt tất cả yêu cầu đang chờ? Hệ thống sẽ lấy tài khoản từ kho để cấp phát.')) {
            return;
        }

        setLoading((prev) => ({ ...prev, [-1]: 'approve-all' })); // Use -1 for global loading
        try {
            const result = await resolveAllPendingWarrantiesAction();
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading((prev) => ({ ...prev, [-1]: '' }));
    };

    const handleReject = async (id: number) => {
        setLoading((prev) => ({ ...prev, [id]: 'reject' }));
        try {
            await rejectWarrantyAction(id);
            toast.success('Đã từ chối bảo hành');
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
        setLoading((prev) => ({ ...prev, [id]: '' }));
    };

    // Active subscriptions for adding warranty
    const activeSubscriptions = subscriptions.filter(
        (s) => s.overallStatus !== 'closed' && s.renewalStatus !== 'not_renewing'
    );

    const filteredSubscriptions = activeSubscriptions.filter(s => {
        const query = subscriptionSearch.toLowerCase();
        const combined = `${s.customerName} - ${s.service}`.toLowerCase();
        return (
            s.customerName.toLowerCase().includes(query) ||
            s.service.toLowerCase().includes(query) ||
            (s.accountInfo && s.accountInfo.toLowerCase().includes(query)) ||
            combined.includes(query)
        );
    }).slice(0, 10); // Limit results

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">Tổng cộng</span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="text-sm text-yellow-700">Chờ xử lý</div>
                    <p className="text-2xl font-semibold text-yellow-900 mt-1">{stats.pending}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="text-sm text-green-700">Đã xử lý</div>
                    <p className="text-2xl font-semibold text-green-900 mt-1">{stats.resolved}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-700">Từ chối</div>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.rejected}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <Coins className="h-4 w-4" />
                        <span className="text-sm">Chi phí BH</span>
                    </div>
                    <p className="text-2xl font-semibold text-red-900 mt-1">{formatCurrency(stats.totalCost)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="resolved">Đã xử lý</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                    </SelectContent>
                </Select>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={handleAutoApproveAll}
                            disabled={loading[-1] === 'approve-all' || stats.pending === 0}
                        >
                            <Zap className="h-4 w-4 mr-2" />
                            {loading[-1] === 'approve-all' ? 'Đang xử lý...' : 'Tự động duyệt tất cả'}
                        </Button>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo bảo hành
                            </Button>
                        </DialogTrigger>
                    </div>
                    <DialogContent className="overflow-visible">
                        <DialogHeader>
                            <DialogTitle>Tạo yêu cầu bảo hành</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddWarranty} className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="subscriptionSearch">Subscription (Tìm kiếm)</Label>
                                <Input
                                    id="subscriptionSearch"
                                    placeholder="Nhập tên khách hàng hoặc dịch vụ..."
                                    value={subscriptionSearch}
                                    onChange={(e) => {
                                        setSubscriptionSearch(e.target.value);
                                        setOpenCombobox(true);
                                        setSelectedSubscriptionId(""); // Reset ID when typing
                                    }}
                                    onFocus={() => setOpenCombobox(true)}
                                    // Delay hiding to allow click event on suggestion
                                    onBlur={() => setTimeout(() => setOpenCombobox(false), 200)}
                                    autoComplete="off"
                                    className="mt-1"
                                />
                                {openCombobox && filteredSubscriptions.length > 0 && (
                                    <div className="absolute z-[200] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredSubscriptions.map((s) => (
                                            <div
                                                key={s.id}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => {
                                                    setSelectedSubscriptionId(s.id.toString());
                                                    const displayText = `${s.customerName} - ${s.service}${s.accountInfo ? ` - ${s.accountInfo}` : ''}`;
                                                    setSubscriptionSearch(displayText);
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <div className="font-medium">
                                                    {s.customerName} <span className="text-gray-500 font-normal">- {s.service}</span>
                                                </div>
                                                {s.accountInfo && (
                                                    <div className="text-[10px] text-gray-400 truncate font-mono mt-0.5">
                                                        {s.accountInfo}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {openCombobox && subscriptionSearch && filteredSubscriptions.length === 0 && (
                                    <div className="absolute z-[200] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
                                        Không tìm thấy subscription nào phù hợp
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="issueDate">Ngày báo lỗi</Label>
                                <Input
                                    name="issueDate"
                                    type="date"
                                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="issueDescription">Mô tả lỗi</Label>
                                <Textarea
                                    name="issueDescription"
                                    placeholder="Khách báo tài khoản không đăng nhập được..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="note">Ghi chú</Label>
                                <Textarea name="note" placeholder="Ghi chú thêm..." />
                            </div>
                            <Button type="submit" className="w-full">
                                Tạo bảo hành
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!resolveDialogWarranty} onOpenChange={(open) => !open && setResolveDialogWarranty(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xử lý bảo hành</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Old Account Display */}
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                                <Label className="text-red-800 mb-1 block">Tài khoản lỗi (Cũ)</Label>
                                <div className="flex items-center gap-2">
                                    <div className="bg-white px-3 py-2 rounded border font-mono text-sm flex-1 truncate">
                                        {resolveDialogWarranty?.accountInfo || 'Không có thông tin'}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        onClick={() => {
                                            if (resolveDialogWarranty?.accountInfo) {
                                                copyToClipboard(resolveDialogWarranty.accountInfo);
                                                toast.success('Đã copy tài khoản cũ');
                                            }
                                        }}
                                        title="Copy thông tin cũ"
                                    >
                                        <div className="h-4 w-4">📋</div>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Phương thức xử lý (Cấp mới)</Label>
                                <Select
                                    value={resolveMethod}
                                    onValueChange={(v: 'auto' | 'manual') => setResolveMethod(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Tự động (Lấy từ kho)</SelectItem>
                                        <SelectItem value="manual">Nhập thủ công (Có sẵn tài khoản)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {resolveMethod === 'manual' && (
                                <>
                                    <div className="flex flex-col gap-2">
                                        <Label>Thông tin tài khoản mới</Label>
                                        <Textarea
                                            value={manualAccountInfo}
                                            onChange={(e) => setManualAccountInfo(e.target.value)}
                                            placeholder="User: ... Pass: ..."
                                            className="h-24"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Chi phí phát sinh (nếu có)</Label>
                                        <Input
                                            type="number"
                                            value={manualCost}
                                            onChange={(e) => setManualCost(parseFloat(e.target.value))}
                                            placeholder="0"
                                        />
                                    </div>
                                </>
                            )}

                            <Button onClick={handleConfirmResolve} className="w-full" disabled={resolveMethod === 'manual' && !manualAccountInfo}>
                                Xác nhận xử lý
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!viewWarranty} onOpenChange={(open) => !open && setViewWarranty(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Chi tiết bảo hành</DialogTitle>
                        </DialogHeader>
                        {viewWarranty && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-500">Khách hàng</Label>
                                        <div className="font-medium">{viewWarranty.customerName}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500">Dịch vụ</Label>
                                        <div className="font-medium">{viewWarranty.service}</div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Thông tin tài khoản (Hiện tại)</Label>
                                    <div className="mt-1 bg-gray-50 p-2 rounded border border-gray-200 font-mono text-sm break-all relative group">
                                        {viewWarranty.accountInfo || 'Không có thông tin'}
                                        {viewWarranty.accountInfo && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => {
                                                    copyToClipboard(viewWarranty.accountInfo!);
                                                    toast.success('Đã copy');
                                                }}
                                            >
                                                <div className="text-xs">📋</div>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-gray-500">Ngày báo lỗi</Label>
                                        <div>{format(new Date(viewWarranty.issueDate), 'dd/MM/yyyy', { locale: vi })}</div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-500">Trạng thái</Label>
                                        <div className="mt-1">
                                            <StatusBadge type="warranty" status={viewWarranty.warrantyStatus} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Mô tả lỗi</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                                        {viewWarranty.issueDescription || 'Không có mô tả'}
                                    </div>
                                </div>

                                {viewWarranty.warrantyStatus !== 'pending' && (
                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                        <div>
                                            <Label className="text-gray-500">Ngày xử lý</Label>
                                            <div>
                                                {viewWarranty.resolvedDate
                                                    ? format(new Date(viewWarranty.resolvedDate), 'dd/MM/yyyy', { locale: vi })
                                                    : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-gray-500">Chi phí</Label>
                                            <div className="font-medium text-red-600">
                                                {viewWarranty.cost ? formatCurrency(viewWarranty.cost) : '0đ'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewWarranty.note && (
                                    <div>
                                        <Label className="text-gray-500">Ghi chú xử lý</Label>
                                        <div className="mt-1 text-sm text-gray-600">{viewWarranty.note}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px] font-bold text-center">#</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Dịch vụ</TableHead>
                            <TableHead>Ngày báo lỗi</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Chi phí</TableHead>
                            <TableHead>Ngày xử lý</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredWarranties.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                    Không có bảo hành nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWarranties.map((warranty) => (
                                <TableRow key={warranty.id} className="hover:bg-gray-50">
                                    <TableCell className="text-center font-medium text-gray-500">
                                        {filteredWarranties.indexOf(warranty) + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{warranty.customerName}</TableCell>
                                    <TableCell>{warranty.service}</TableCell>
                                    <TableCell>
                                        {format(new Date(warranty.issueDate), 'dd/MM/yyyy', { locale: vi })}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-gray-500">
                                        {warranty.issueDescription || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge type="warranty" status={warranty.warrantyStatus} />
                                    </TableCell>
                                    <TableCell className="text-red-600 font-medium text-sm">
                                        {warranty.cost ? formatCurrency(warranty.cost) : '-'}
                                    </TableCell>
                                    <TableCell className="text-gray-500">
                                        {warranty.resolvedDate
                                            ? format(new Date(warranty.resolvedDate), 'dd/MM/yyyy', { locale: vi })
                                            : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            {warranty.warrantyStatus === 'pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleResolveClick(warranty)}
                                                        disabled={loading[warranty.id] === 'resolve'}
                                                        className="text-green-600"
                                                        title="Xử lý & gửi TK mới"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleReject(warranty.id)}
                                                        disabled={loading[warranty.id] === 'reject'}
                                                        className="text-gray-500"
                                                        title="Từ chối"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewWarranty(warranty)}
                                                className="text-blue-600"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

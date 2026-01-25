'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { CustomerWithStats, CustomerSegment } from '@/types';
import { Customer } from '@/lib/db/schema';
import { Plus, Search, User, Phone, Tag, MessageSquare, Edit, Trash2, Key, Trophy, Star, Medal, Circle, Users, UserPlus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createCustomerAction, deleteCustomerAction, updateCustomerAction, importCustomersExcelAction, downloadTemplateAction } from '@/app/actions';
import { Upload, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/business';

interface CustomersClientProps {
    customers: CustomerWithStats[];
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
    switch (segment) {
        case 'vip':
            return (
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-yellow-200 w-fit">
                    <Trophy className="h-3 w-3" />
                    VIP
                </div>
            );
        case 'priority':
            return (
                <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold border border-purple-200 w-fit">
                    <Star className="h-3 w-3" />
                    Priority
                </div>
            );
        case 'regular':
            return (
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-100 w-fit">
                    <Medal className="h-3 w-3" />
                    Regular
                </div>
            );
        default:
            return (
                <div className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 w-fit">
                    <Circle className="h-3 w-3" />
                    New
                </div>
            );
    }
}

function SourceBadge({ source }: { source: string }) {
    const s = source.toLowerCase();
    if (s.includes('zalo')) {
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 w-fit">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {source}
            </div>
        );
    }
    if (s.includes('fb') || s.includes('facebook') || s.includes('mess')) {
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 w-fit">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {source}
            </div>
        );
    }
    if (s.includes('tele')) {
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 w-fit">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                {source}
            </div>
        );
    }
    if (s.includes('excel') || s.includes('manual')) {
        return (
            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 w-fit">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {source}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 w-fit">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            {source}
        </div>
    );
}

export function CustomersClient({ customers }: CustomersClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [segmentFilter, setSegmentFilter] = useState<string>('all');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; customersAdded?: number; subscriptionsAdded?: number; errors?: string[] } | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const filteredCustomers = customers.filter(
        (c) => {
            const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.contact?.toLowerCase().includes(search.toLowerCase()) ||
                c.source?.toLowerCase().includes(search.toLowerCase());

            const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;

            return matchesSearch && matchesSegment;
        }
    );

    const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await createCustomerAction(formData);
            toast.success('Đã thêm khách hàng mới');
            setIsAddOpen(false);
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleEditCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCustomer) return;
        const formData = new FormData(e.currentTarget);
        try {
            await updateCustomerAction(editingCustomer.id, formData);
            toast.success('Đã cập nhật khách hàng');
            setEditingCustomer(null);
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleDeleteCustomer = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa khách hàng này?\n\n⚠️ Cảnh báo: Tất cả subscriptions, deliveries và warranties liên quan cũng sẽ bị xóa!')) return;
        try {
            await deleteCustomerAction(id);
            toast.success('Đã xóa khách hàng và tất cả dữ liệu liên quan');
            router.refresh();
        } catch (error: any) {
            toast.error(`Không thể xóa: ${error.message || 'Có lỗi xảy ra'}`);
            console.error('Delete customer error:', error);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const base64 = await downloadTemplateAction();
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
            link.download = 'customer_import_template.xlsx';
            link.click();
        } catch (error) {
            toast.error('Không thể tải mẫu file');
        }
    };

    const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsImporting(true);
        setImportResult(null);

        const formData = new FormData(e.currentTarget);
        try {
            const result = await importCustomersExcelAction(formData);
            if (result.success && 'customersAdded' in result) {
                toast.success(`Đã import thành công! Thêm ${result.customersAdded} khách hàng, ${result.subscriptionsAdded} dịch vụ.`);
                setImportResult(result);
                router.refresh();
            } else if (!result.success) {
                toast.error(`Lỗi import: ${result.error}`);
                setImportResult({ success: false, errors: [result.error || 'Unknown error'] });
            }
        } catch (error: any) {
            toast.error('Có lỗi xảy ra khi import');
            setImportResult({ success: false, errors: [error.message] });
        } finally {
            setIsImporting(false);
        }
    };

    const CustomerForm = ({
        onSubmit,
        defaultValues,
        submitLabel,
    }: {
        onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
        defaultValues?: Customer;
        submitLabel: string;
    }) => (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Tên khách hàng *</Label>
                <Input name="name" defaultValue={defaultValues?.name} placeholder="Nguyễn Văn A" required />
            </div>
            <div>
                <Label htmlFor="source">Nguồn</Label>
                <Input name="source" defaultValue={defaultValues?.source || ''} placeholder="Zalo, Telegram, Facebook..." />
            </div>
            <div>
                <Label htmlFor="contact">Liên hệ</Label>
                <Input name="contact" defaultValue={defaultValues?.contact || ''} placeholder="SĐT hoặc username" />
            </div>
            <div>
                <Label htmlFor="tags">Tags</Label>
                <Input name="tags" defaultValue={defaultValues?.tags || ''} placeholder="VIP, Regular..." />
            </div>
            <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea name="note" defaultValue={defaultValues?.note || ''} placeholder="Ghi chú về khách hàng..." />
            </div>
            <Button type="submit" className="w-full">
                {submitLabel}
            </Button>
        </form>
    );

    // Stats
    const stats = {
        total: customers.length,
        new: customers.filter(c => c.segment === 'new').length,
        vip: customers.filter(c => c.segment === 'vip').length,
        totalRevenue: customers.reduce((sum, c) => sum + (c.totalRevenue || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Tổng khách hàng</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <UserPlus className="h-4 w-4" />
                        <span className="text-sm font-medium">Khách mới</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stats.new}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-yellow-700 mb-1">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-medium">VIP</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">{stats.vip}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">Tổng doanh thu</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm khách hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm khách hàng
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thêm khách hàng mới</DialogTitle>
                        </DialogHeader>
                        <CustomerForm onSubmit={handleAddCustomer} submitLabel="Thêm khách hàng" />
                    </DialogContent>
                </Dialog>

                <Dialog open={isImportOpen} onOpenChange={(open) => { setIsImportOpen(open); if (!open) setImportResult(null); }}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import Excel
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Import Khách hàng từ Excel</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 space-y-2">
                                <p className="font-medium text-slate-900">Hướng dẫn:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Tải file mẫu về và điền thông tin khách hàng.</li>
                                    <li>Mỗi dòng là một khách hàng/dịch vụ.</li>
                                    <li>Tên khách hàng là bắt buộc.</li>
                                    <li>Nếu khách hàng đã tồn tại (trùng tên), sẽ thêm dịch vụ mới.</li>
                                </ul>
                                <Button variant="link" size="sm" className="px-0 h-auto text-blue-600" onClick={handleDownloadTemplate}>
                                    <Download className="h-3 w-3 mr-1" />
                                    Tải file mẫu (.xlsx)
                                </Button>
                            </div>

                            {!importResult?.success ? (
                                <form onSubmit={handleImport} className="space-y-4">
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="file">Chọn file Excel</Label>
                                        <Input id="file" name="file" type="file" accept=".xlsx, .xls" required />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isImporting}>
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Bắt đầu Import
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                                        <p className="font-medium">Import thành công!</p>
                                        <ul className="mt-2 text-sm list-disc list-inside">
                                            <li>Khách hàng mới: <b>{importResult.customersAdded}</b></li>
                                            <li>Dịch vụ đã thêm: <b>{importResult.subscriptionsAdded}</b></li>
                                        </ul>
                                    </div>
                                    <Button onClick={() => setIsImportOpen(false)} className="w-full">Đóng</Button>
                                </div>
                            )}

                            {importResult?.errors && importResult.errors.length > 0 && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg max-h-40 overflow-y-auto text-xs">
                                    <p className="font-medium mb-1">Cảnh báo / Lỗi:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {importResult.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Segment Filter Tabs */}
            <Tabs defaultValue="all" onValueChange={setSegmentFilter}>
                <TabsList className="grid grid-cols-5 h-11 w-full max-w-[600px] bg-slate-100/80 p-1 rounded-xl">
                    <TabsTrigger value="all" className="data-[state=active]:bg-white rounded-lg transition-all text-xs sm:text-sm">
                        All ({customers.length})
                    </TabsTrigger>
                    <TabsTrigger value="vip" className="data-[state=active]:bg-white data-[state=active]:text-yellow-700 rounded-lg transition-all text-xs sm:text-sm">
                        VIP ({customers.filter(c => c.segment === 'vip').length})
                    </TabsTrigger>
                    <TabsTrigger value="priority" className="data-[state=active]:bg-white data-[state=active]:text-purple-700 rounded-lg transition-all text-xs sm:text-sm">
                        Priority ({customers.filter(c => c.segment === 'priority').length})
                    </TabsTrigger>
                    <TabsTrigger value="regular" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm">
                        Regular ({customers.filter(c => c.segment === 'regular').length})
                    </TabsTrigger>
                    <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:text-gray-600 rounded-lg transition-all text-xs sm:text-sm">
                        New ({customers.filter(c => c.segment === 'new').length})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Customers Table (Desktop) */}
            <div className="hidden md:block liquid-card rounded-3xl border border-white/40 overflow-hidden shadow-sm bg-white/40">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-[50px] font-bold text-center">#</TableHead>
                            <TableHead className="w-[250px]">Khách hàng</TableHead>
                            <TableHead>Phân hạng</TableHead>
                            <TableHead>Liên hệ / Nguồn</TableHead>
                            <TableHead className="text-right">Tổng đơn</TableHead>
                            <TableHead className="text-right">Tổng chi tiêu</TableHead>
                            <TableHead>Ghi chú</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                                    <div className="flex flex-col items-center justify-center p-4">
                                        <User className="h-10 w-10 text-gray-300 mb-2" />
                                        <p>Không tìm thấy khách hàng</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="text-center font-medium text-gray-500">
                                        {filteredCustomers.indexOf(customer) + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm border border-slate-200">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{customer.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5 flex gap-1 items-center">
                                                    {customer.tags && customer.tags.split(',').map((tag, i) => (
                                                        <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600 border border-gray-200">
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <SegmentBadge segment={customer.segment} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {customer.contact && (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                    {customer.contact}
                                                </div>
                                            )}
                                            {customer.source && (
                                                <SourceBadge source={customer.source} />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {customer.totalOrders}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-emerald-600">
                                        {formatCurrency(customer.totalRevenue)}
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        {customer.note ? (
                                            <div className="flex items-start gap-2" title={customer.note}>
                                                <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                                <span className="text-xs text-gray-600 truncate">
                                                    {customer.note}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">--</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingCustomer(customer)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteCustomer(customer.id)}
                                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Customers Cards (Mobile) */}
            <div className="md:hidden space-y-4">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 rounded-xl border border-white/40 text-gray-500">
                        <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p>Không tìm thấy khách hàng</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-sm border border-slate-200">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{customer.name}</div>
                                        <div className="flex gap-1 mt-1">
                                            <SegmentBadge segment={customer.segment} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingCustomer(customer)}
                                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteCustomer(customer.id)}
                                        className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 border-t border-gray-50 pt-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-xs">Doanh thu</span>
                                    <span className="font-medium text-emerald-600 text-lg">{formatCurrency(customer.totalRevenue)}</span>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-gray-400 text-xs">Tổng đơn</span>
                                    <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                                {customer.contact && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        <Phone className="h-3 w-3 text-gray-400" />
                                        {customer.contact}
                                    </div>
                                )}
                                {customer.source && (
                                    <SourceBadge source={customer.source} />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sửa thông tin khách hàng</DialogTitle>
                    </DialogHeader>
                    {editingCustomer && (
                        <CustomerForm
                            onSubmit={handleEditCustomer}
                            defaultValues={editingCustomer}
                            submitLabel="Cập nhật"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

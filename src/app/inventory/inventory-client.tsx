'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { StatusBadge } from '@/components/shared/status-badge';
import { InventoryItem, Customer } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/business';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, Upload, Package, Search, Copy, XCircle, CheckCircle, Truck, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '@/lib/messages';
import {
    createInventoryItemAction,
    importInventoryAction,
    updateInventoryStatusAction,
    sellInventoryItemAction,
} from '@/app/actions';
import { SalesDialog } from '@/components/inventory/sales-dialog';

interface InventoryClientProps {
    items: InventoryItem[];
    services: string[];
    customers: Customer[];
}

export function InventoryClient({ items, services, customers }: InventoryClientProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    // REMOVED: statusFilter state

    // Sell Dialog State
    const [isSellOpen, setIsSellOpen] = useState(false);
    const [sellItem, setSellItem] = useState<InventoryItem | null>(null);
    const [sellCustomer, setSellCustomer] = useState('');
    const [sellContact, setSellContact] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [sellDuration, setSellDuration] = useState('1');
    const [sellNote, setSellNote] = useState('');
    const [sellPaymentStatus, setSellPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');

    // Sold Success State
    const [soldSecret, setSoldSecret] = useState<string | null>(null);

    // Customer Search State
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.contact && c.contact.toLowerCase().includes(customerSearch.toLowerCase()))
    ).slice(0, 5); // Limit to 5 suggestions

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importService, setImportService] = useState('');
    const [importCost, setImportCost] = useState('');

    // Pre-calculate filtered items based on Search & Service ONLY
    const baseFilteredItems = items.filter((item) => {
        const matchesSearch =
            item.secretMasked.toLowerCase().includes(search.toLowerCase()) ||
            item.service.toLowerCase().includes(search.toLowerCase());
        const matchesService = serviceFilter === 'all' || item.service === serviceFilter;
        return matchesSearch && matchesService;
    });

    // Split into tabs
    const availableItems = baseFilteredItems.filter(i => i.status === 'available');
    const deliveredItems = baseFilteredItems.filter(i => i.status === 'delivered');
    const invalidItems = baseFilteredItems.filter(i => i.status === 'invalid');

    // Stats (still global count based on *all* items passing search/service filter? Or absolute total? 
    // Usually stats are absolute totals or based on current search. Let's keep absolute for the top cards as per original design)
    const stats = {
        total: items.length,
        available: items.filter((i) => i.status === 'available').length,
        delivered: items.filter((i) => i.status === 'delivered').length,
        invalid: items.filter((i) => i.status === 'invalid').length,
    };

    const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await createInventoryItemAction(formData);
            toast.success('Đã thêm item mới');
            setIsAddOpen(false);
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const handleImport = async () => {
        if (!importService || !importText.trim()) {
            toast.error('Vui lòng nhập dịch vụ và danh sách TK/MK');
            return;
        }

        const lines = importText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

        if (lines.length === 0) {
            toast.error('Không có dữ liệu để import');
            return;
        }

        const itemsToImport = lines.map((line) => ({
            service: importService,
            secretPayload: line,
            cost: parseFloat(importCost) || 0,
        }));

        try {
            const result = await importInventoryAction(itemsToImport);
            toast.success(`Đã import ${result.count} items`);
            setIsImportOpen(false);
            setImportText('');
            setImportService('');
            setImportCost('');
            router.refresh();
        } catch {
            toast.error('Có lỗi khi import');
        }
    };

    const handleCopy = async (secret: string) => {
        const success = await copyToClipboard(secret);
        if (success) toast.success('Đã copy');
    };

    const handleMarkInvalid = async (id: number) => {
        try {
            await updateInventoryStatusAction(id, 'invalid');
            toast.success('Đã đánh dấu lỗi');
            router.refresh();
        } catch {
            toast.error('Có lỗi xảy ra');
        }
    };

    const openSellDialog = (item: InventoryItem) => {
        setSellItem(item);
        setSellCustomer('');
        setCustomerSearch(''); // Reset search
        setSellContact('');
        setSellPrice(item.cost?.toString() || '0');
        setSellDuration('1');
        setSellNote('');
        setSellPaymentStatus('unpaid');
        setSoldSecret(null); // Reset sold secret
        setIsSellOpen(true);
    };

    const handleSelectCustomer = (customer: Customer) => {
        setSellCustomer(customer.name);
        setCustomerSearch(customer.name);
        setSellContact(customer.contact || '');
        setShowCustomerSuggestions(false);
    };

    const handleSellItem = async (e: React.FormEvent) => {
        e.preventDefault();
        // Use customerSearch as the name if sellCustomer matches it, 
        // or effectively just use customerSearch because that's what's in the input
        const finalCustomerName = customerSearch;

        if (!sellItem || !finalCustomerName) {
            toast.error('Vui lòng nhập tên khách hàng');
            return;
        }

        const formData = new FormData();
        formData.append('inventoryId', sellItem.id.toString());
        formData.append('customerName', finalCustomerName);
        formData.append('contact', sellContact);
        formData.append('salePrice', sellPrice);
        formData.append('durationMonths', sellDuration);
        formData.append('note', sellNote);
        formData.append('paymentStatus', sellPaymentStatus);

        try {
            const result = await sellInventoryItemAction(formData);
            if (result.success && result.secretPayload) {
                toast.success('Đã bán hàng thành công!');
                setSoldSecret(result.secretPayload);
                // Don't close dialog, show secret
                router.refresh();
            } else if (result.success) {
                // Fallback if no secret returned (shouldn't happen with updated action)
                toast.success('Đã bán hàng thành công!');
                setIsSellOpen(false);
                router.refresh();
            } else {
                toast.error('Lỗi: ' + result.error);
            }
        } catch {
            toast.error('Có lỗi xảy ra khi bán hàng');
        }
    };

    const renderTable = (data: InventoryItem[], showActions: boolean = true) => (
        <>
            {/* Desktop View - Table */}
            <div className="hidden md:block liquid-card rounded-3xl overflow-hidden border-white/40 bg-white/40">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50">
                            <TableHead className="w-[50px] font-bold text-center">#</TableHead>
                            <TableHead>Dịch vụ</TableHead>
                            <TableHead>TK/MK (masked)</TableHead>
                            <TableHead>Chi phí</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Ngày thêm</TableHead>
                            <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    Không có item nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-gray-50">
                                    <TableCell className="text-center font-medium text-gray-500">
                                        {data.indexOf(item) + 1}
                                    </TableCell>
                                    <TableCell className="font-medium">{item.service}</TableCell>
                                    <TableCell className="font-mono text-sm">{item.secretMasked}</TableCell>
                                    <TableCell>{formatCurrency(item.cost)}</TableCell>
                                    <TableCell>
                                        <StatusBadge type="inventory" status={item.status as any} />
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-sm">
                                        {format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 justify-end">
                                            {showActions && item.status === 'available' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => openSellDialog(item)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    title="Bán ngay"
                                                >
                                                    <ShoppingCart className="h-4 w-4 mr-1" /> Sell
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(item.secretPayload)}
                                                title="Copy"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            {showActions && item.status === 'available' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleMarkInvalid(item.id)}
                                                    className="text-red-500"
                                                    title="Đánh dấu lỗi"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            )}
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
                {data.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 rounded-xl border border-white/40 text-gray-500">
                        Không có item nào
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-gray-900 text-lg">{item.service}</div>
                                    <div className="text-sm text-gray-500 font-mono mt-1 break-all bg-gray-50 p-1.5 rounded border border-gray-100">
                                        {item.secretMasked}
                                    </div>
                                </div>
                                <StatusBadge type="inventory" status={item.status as any} />
                            </div>

                            <div className="flex justify-between items-center text-sm text-gray-600 border-t border-gray-50 pt-2">
                                <span>Giá nhập: <span className="font-medium text-gray-900">{formatCurrency(item.cost)}</span></span>
                                <span>{format(new Date(item.createdAt), 'dd/MM/yyyy', { locale: vi })}</span>
                            </div>

                            <div className="flex gap-2 pt-1">
                                {showActions && item.status === 'available' && (
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                        onClick={() => openSellDialog(item)}
                                    >
                                        <ShoppingCart className="h-4 w-4 mr-2" /> Bán ngay
                                    </Button>
                                )}
                                <Button variant="outline" className="flex-1" onClick={() => handleCopy(item.secretPayload)}>
                                    <Copy className="h-4 w-4 mr-2" /> Copy
                                </Button>
                                {showActions && item.status === 'available' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleMarkInvalid(item.id)}
                                        className="text-red-500 bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Package className="h-4 w-4" />
                        <span className="text-xs md:text-sm">Tổng cộng</span>
                    </div>
                    <p className="text-xl md:text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4">
                    <div className="text-xs md:text-sm text-green-700">Còn hàng</div>
                    <p className="text-xl md:text-2xl font-semibold text-green-900 mt-1">{stats.available}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4">
                    <div className="text-xs md:text-sm text-blue-700">Đã giao</div>
                    <p className="text-xl md:text-2xl font-semibold text-blue-900 mt-1">{stats.delivered}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4">
                    <div className="text-xs md:text-sm text-red-700">Lỗi</div>
                    <p className="text-xl md:text-2xl font-semibold text-red-900 mt-1">{stats.invalid}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Lọc theo dịch vụ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả dịch vụ</SelectItem>
                        {services.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm 1 item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thêm item mới</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            {/* ... same form content ... */}
                            <div>
                                <Label htmlFor="service">Dịch vụ</Label>
                                <Input name="service" placeholder="VD: ChatGPT Plus" required />
                            </div>
                            <div>
                                <Label htmlFor="secretPayload">TK/MK hoặc Key</Label>
                                <Input name="secretPayload" placeholder="email@example.com|password123" required />
                            </div>
                            <div>
                                <Label htmlFor="cost">Chi phí (VNĐ)</Label>
                                <Input name="cost" type="number" placeholder="0" />
                            </div>
                            <div>
                                <Label htmlFor="distribution">Kênh phân phối</Label>
                                <Input name="distribution" placeholder="Nguồn hàng" />
                            </div>
                            <Button type="submit" className="w-full">
                                Thêm item
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Upload className="h-4 w-4 mr-2" />
                            Import nhiều
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Import TK/MK từ file</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Dịch vụ</Label>
                                <Input
                                    value={importService}
                                    onChange={(e) => setImportService(e.target.value)}
                                    placeholder="VD: ChatGPT Plus"
                                />
                            </div>
                            <div>
                                <Label>Chi phí / item (VNĐ)</Label>
                                <Input
                                    type="number"
                                    value={importCost}
                                    onChange={(e) => setImportCost(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Label>Danh sách (mỗi dòng 1 TK/MK)</Label>
                                <Textarea
                                    value={importText}
                                    onChange={(e) => setImportText(e.target.value)}
                                    placeholder="email1@example.com|pass1&#10;email2@example.com|pass2&#10;..."
                                    rows={8}
                                />
                            </div>
                            <Button onClick={handleImport} className="w-full">
                                Import {importText.split('\n').filter((l) => l.trim()).length} items
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <SalesDialog
                    open={isSellOpen}
                    onOpenChange={setIsSellOpen}
                    item={sellItem}
                    customers={customers}
                    initialCustomerName={sellCustomer} // Use state initialized locally or just pass logic?
                // Actually, let's keep local state for opening logic:
                // openSellDialog sets sellItem and resets other details. 
                // SalesDialog handles its own form state based on initial props on Open.
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="available" className="w-full">
                <TabsList className="flex w-full max-w-[600px] h-11 bg-gray-100/80 p-1 rounded-xl">
                    <TabsTrigger
                        value="available"
                        className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Còn hàng ({availableItems.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="delivered"
                        className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        Đã giao ({deliveredItems.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="invalid"
                        className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all text-sm font-medium"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Lỗi ({invalidItems.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="mt-6">
                    {renderTable(availableItems, true)}
                </TabsContent>

                <TabsContent value="delivered" className="mt-6">
                    {renderTable(deliveredItems, false)}
                </TabsContent>

                <TabsContent value="invalid" className="mt-6">
                    {renderTable(invalidItems, false)}
                </TabsContent>
            </Tabs>
        </div >
    );
}
